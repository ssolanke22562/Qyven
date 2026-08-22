/**
 * src/lib/tracing/diagnose.ts
 *
 * Automated root-cause diagnosis engine.
 * Reads a completed TraceFile, scans span errors/attributes,
 * identifies the root cause and downstream impact, and produces
 * a machine-readable DiagnosisReport saved to eval/diagnoses/<traceId>.json
 */

import * as fs from "fs";
import * as path from "path";
import { TraceFile, TraceSpan, DiagnosisReport } from "../../../eval/types";

// ─────────────────────────────────────────────────────────────
// Pattern-matching rules (ordered by priority)
// ─────────────────────────────────────────────────────────────
interface DiagnosisRule {
  name: string;
  matches: (span: TraceSpan) => boolean;
  severity: DiagnosisReport["severityLevel"];
  rootCause: (span: TraceSpan) => string;
  suggestedFix: string;
  autoFixApplied: string | null;
}

const RULES: DiagnosisRule[] = [
  {
    name: "news_tool_503",
    matches: (s) =>
      s.status === "error" &&
      (s.attributes.toolName === "searchNews" ||
        s.name.includes("NEWS_AGENT") ||
        (s.attributes.errorMessage ?? "").toLowerCase().includes("503") ||
        (s.attributes.errorMessage ?? "").toLowerCase().includes("news api") ||
        (s.attributes.errorMessage ?? "").toLowerCase().includes("service unavailable")),
    severity: "HIGH",
    rootCause: (s) =>
      `News API tool call failed with "${s.attributes.errorMessage ?? "503 Service Unavailable"}". ` +
      `Span: ${s.name} (${s.spanId}). The News Agent was unable to retrieve live market signals, ` +
      `causing Synthesis Agent to proceed with zero news sources.`,
    suggestedFix:
      "Add retry-with-exponential-backoff (2 retries, 500ms base delay) to news.ts before returning []. " +
      "Also ensure the Replanner routes through cached KB context when news retrieval fails entirely. " +
      "FIX APPLIED: news.ts now retries twice before returning empty array.",
    autoFixApplied:
      "src/lib/tools/news.ts: Added retryFetch() with 2 retries and 500ms/1000ms backoff. " +
      "stateGraph.ts replanner already provides KB fallback when NEWS_AGENT fails.",
  },
  {
    name: "patent_tool_timeout",
    matches: (s) =>
      s.status === "error" &&
      (s.attributes.toolName === "searchPatents" ||
        s.name.includes("PATENT_AGENT") ||
        (s.attributes.errorMessage ?? "").toLowerCase().includes("timeout") ||
        (s.attributes.errorMessage ?? "").toLowerCase().includes("patent")),
    severity: "MEDIUM",
    rootCause: (s) =>
      `Patent API tool call timed out: "${s.attributes.errorMessage ?? "Timeout"}". ` +
      `Span: ${s.name} (${s.spanId}). Patent signal data will be missing from the synthesis dossier.`,
    suggestedFix:
      "Add a 5-second AbortController timeout to patent.ts fetch calls. " +
      "Implement a mock patent dataset fallback for the most common technology domains.",
    autoFixApplied: null,
  },
  {
    name: "llm_all_models_failed",
    matches: (s) =>
      s.status === "error" &&
      s.name.startsWith("llm.call") &&
      (s.attributes.errorMessage ?? "").toLowerCase().includes("all model"),
    severity: "CRITICAL",
    rootCause: (s) =>
      `All LLM models failed for agent call: "${s.attributes.errorMessage ?? "Unknown"}". ` +
      `This indicates both Groq and Gemini API endpoints were unavailable. ` +
      `Synthesis will fall back to heuristic summarization with low confidence.`,
    suggestedFix:
      "Add a third fallback tier: a local template-based summarizer that constructs a report " +
      "directly from retrieved sources without LLM synthesis. " +
      "Also add a circuit breaker to cache model failure states for 60 seconds.",
    autoFixApplied: null,
  },
  {
    name: "sec_unavailable",
    matches: (s) =>
      s.status === "error" &&
      (s.attributes.toolName === "searchSecFilings" ||
        s.name.includes("SEC_AGENT") ||
        (s.attributes.errorMessage ?? "").toLowerCase().includes("sec")),
    severity: "LOW",
    rootCause: (s) =>
      `SEC EDGAR filing retrieval failed: "${s.attributes.errorMessage ?? "Unavailable"}". ` +
      `SEC signal data will be missing. Impact is low as SEC data is supplementary.`,
    suggestedFix:
      "Add a 3-second cache TTL to SEC filings and serve cached data on failure. " +
      "SEC filings change infrequently so stale data is acceptable.",
    autoFixApplied: null,
  },
  {
    name: "low_evidence_synthesis",
    matches: (s) =>
      s.name.includes("SYNTHESIS") &&
      s.status === "ok" &&
      (s.attributes.sourcesRetrieved ?? 99) === 0,
    severity: "HIGH",
    rootCause: (_s) =>
      `Synthesis Agent executed with ZERO external sources. ` +
      `This occurred because all upstream tool calls (News, ArXiv, Patent) either failed or returned empty results. ` +
      `The resulting report is based entirely on internal KB nodes and is at high risk of being ungrounded.`,
    suggestedFix:
      "Add an 'insufficient evidence guard': if sourcesRetrieved === 0 before synthesis, " +
      "the Orchestrator should return an explicit 'INSUFFICIENT_EVIDENCE' status rather than synthesizing " +
      "a potentially hallucinated report.",
    autoFixApplied: null,
  },
  {
    name: "replanning_loop",
    matches: (s) =>
      s.name.includes("DEADLOCK") ||
      (s.attributes.decision ?? "").includes("LOOP"),
    severity: "MEDIUM",
    rootCause: (_s) =>
      `Execution loop detected: the state graph repeated the same state signature 3+ times. ` +
      `This typically indicates a replan that creates tasks identical to the failed ones, ` +
      `causing an infinite recovery loop.`,
    suggestedFix:
      "In the replanner, hash failed task agents and exclude them from new plan variants. " +
      "If a task has failed twice, mark it SKIPPED permanently rather than re-queuing it.",
    autoFixApplied: null,
  },
];

// ─────────────────────────────────────────────────────────────
// Core diagnosis function
// ─────────────────────────────────────────────────────────────

export function diagnoseTrace(traceFile: TraceFile): DiagnosisReport {
  const errorSpans = traceFile.spans.filter((s) => s.status === "error");
  const allSpans = traceFile.spans;

  // Try each rule in priority order
  for (const rule of RULES) {
    const matchingSpan = [...errorSpans, ...allSpans].find(rule.matches);
    if (matchingSpan) {
      // Identify downstream impacts
      const downstreamImpact = identifyDownstreamImpact(traceFile, matchingSpan);

      return {
        traceId: traceFile.traceId,
        diagnosedAt: new Date().toISOString(),
        severityLevel: rule.severity,
        rootCause: rule.rootCause(matchingSpan),
        failedSpan: errorSpans.includes(matchingSpan)
          ? {
              spanId: matchingSpan.spanId,
              name: matchingSpan.name,
              agentRole: matchingSpan.agentRole,
              errorMessage: matchingSpan.attributes.errorMessage ?? "Unknown error",
            }
          : null,
        downstreamImpact,
        suggestedFix: rule.suggestedFix,
        autoFixApplied: rule.autoFixApplied,
      };
    }
  }

  // No specific rule matched — generic diagnosis
  if (errorSpans.length > 0) {
    const firstError = errorSpans[0];
    return {
      traceId: traceFile.traceId,
      diagnosedAt: new Date().toISOString(),
      severityLevel: "MEDIUM",
      rootCause: `Unexpected error in span "${firstError.name}" (${firstError.spanId}): ${firstError.attributes.errorMessage ?? "Unknown error"}.`,
      failedSpan: {
        spanId: firstError.spanId,
        name: firstError.name,
        agentRole: firstError.agentRole,
        errorMessage: firstError.attributes.errorMessage ?? "Unknown error",
      },
      downstreamImpact: identifyDownstreamImpact(traceFile, firstError),
      suggestedFix: "Review the error span attributes and add targeted error handling for this failure mode.",
      autoFixApplied: null,
    };
  }

  // No errors found — healthy trace
  return {
    traceId: traceFile.traceId,
    diagnosedAt: new Date().toISOString(),
    severityLevel: "LOW",
    rootCause: "No failures detected. Pipeline completed successfully.",
    failedSpan: null,
    downstreamImpact: [],
    suggestedFix: "No action required. Consider improving latency if total duration exceeds 10s.",
    autoFixApplied: null,
  };
}

function identifyDownstreamImpact(traceFile: TraceFile, failedSpan: TraceSpan): string[] {
  const impacts: string[] = [];
  const startedAfter = failedSpan.endTimeMs;

  const downstreamSpans = traceFile.spans.filter(
    (s) => s.spanId !== failedSpan.spanId && s.startTimeMs >= startedAfter
  );

  // Check for synthesis with no sources
  const synthesisSpan = traceFile.spans.find((s) => s.name.includes("SYNTHESIS"));
  if (synthesisSpan && (synthesisSpan.attributes.sourcesRetrieved ?? 99) === 0) {
    impacts.push("Synthesis Agent proceeded with 0 external sources → hallucination risk elevated.");
  }

  // Check for fallback usage
  const isFallback = traceFile.spans.some((s) => s.attributes.isFallback === true);
  if (isFallback) {
    impacts.push("Pipeline entered fallback mode → response generated from KB cache, not live intelligence.");
  }

  // Check for replanning triggered downstream
  const replanSpan = downstreamSpans.find((s) => s.name.includes("REPLANNER") || s.name.includes("decision [REPLAN"));
  if (replanSpan) {
    impacts.push("Autonomous Replanner triggered → additional latency and LLM call budget consumed.");
  }

  // Check confidence score drop
  const lastConfSpan = [...traceFile.spans].reverse().find((s) => s.attributes.confidenceScore !== undefined);
  if (lastConfSpan && (lastConfSpan.attributes.confidenceScore ?? 100) < 60) {
    impacts.push(`Confidence score dropped to ${lastConfSpan.attributes.confidenceScore}% — below acceptable threshold of 60%.`);
  }

  // Check for any downstream error cascades
  const downstreamErrors = downstreamSpans.filter((s) => s.status === "error").length;
  if (downstreamErrors > 0) {
    impacts.push(`${downstreamErrors} additional downstream span(s) failed after root cause.`);
  }

  if (impacts.length === 0) {
    impacts.push("Pipeline continued normally after the failure via autonomous recovery.");
  }

  return impacts;
}

// ─────────────────────────────────────────────────────────────
// Diagnosis file writer
// ─────────────────────────────────────────────────────────────

export function writeDiagnosis(report: DiagnosisReport): string | null {
  if (typeof window !== "undefined") return null;
  try {
    const dir = path.join(process.cwd(), "eval", "diagnoses");
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${report.traceId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
    // Write latest.json
    fs.writeFileSync(path.join(dir, "latest.json"), JSON.stringify(report, null, 2));
    return filePath;
  } catch (err) {
    console.warn("[Diagnose] Failed to write diagnosis:", err);
    return null;
  }
}

export function readTraceFile(traceId: string): TraceFile | null {
  try {
    const filePath = traceId === "latest"
      ? path.join(process.cwd(), "eval", "traces", "latest.json")
      : path.join(process.cwd(), "eval", "traces", `${traceId}.json`);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as TraceFile;
  } catch {
    return null;
  }
}
