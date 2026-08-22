#!/usr/bin/env node
import * as fs from "fs";
import * as path from "path";
import { loadEnvFiles } from "./loadEnv";

loadEnvFiles();
import { createInitialQyvenState, DemoOptions } from "@/lib/agents/qyvenState";
import { qyvenEngine } from "@/lib/agents/stateGraph";
import { runBaselineLlm } from "./baselineLlm";
import {
  EvalCase,
  EvalCaseResult,
  EvalRunManifest,
  PipelineRunRecord,
} from "./types";
import { extractTelemetryFromHttpPayload, extractTelemetryFromState } from "./telemetry";

const REPEAT_COUNT = 3;
const DEFAULT_BASE_URL = process.env.EVAL_BASE_URL || "http://localhost:3000";

function parseArgs() {
  const args = process.argv.slice(2);
  const viaHttp = args.includes("--via-http");
  const limitIdx = args.indexOf("--limit");
  const categoryIdx = args.indexOf("--category");
  const outIdx = args.indexOf("--out");

  return {
    viaHttp,
    limit: limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : undefined,
    category: categoryIdx >= 0 ? args[categoryIdx + 1] : undefined,
    outFile: outIdx >= 0 ? args[outIdx + 1] : undefined,
  };
}

function loadTestset(): EvalCase[] {
  const testsetPath = path.join(process.cwd(), "eval", "testset.json");
  const raw = fs.readFileSync(testsetPath, "utf-8");
  return JSON.parse(raw) as EvalCase[];
}

function mergeDemoOptions(partial?: Partial<DemoOptions>): DemoOptions {
  return {
    enableAdversarialMode: false,
    forceNewsFailure: false,
    forcePatentTimeout: false,
    forceSecUnavailable: false,
    injectConflictingEvidence: false,
    ...partial,
  };
}

async function runPipelineDirect(
  evalCase: EvalCase,
  runIndex: number
): Promise<PipelineRunRecord> {
  const startedAt = new Date().toISOString();
  const sessionId = `eval-${evalCase.id}-run${runIndex}-${Date.now()}`;
  const demoOptions = mergeDemoOptions(evalCase.demoOptions);

  const initialState = createInitialQyvenState(evalCase.query, sessionId, demoOptions);
  const finalState = await qyvenEngine.runGraph(initialState);
  const telemetry = extractTelemetryFromState(finalState);

  return {
    ...telemetry,
    runIndex,
    sessionId,
    startedAt,
    finishedAt: new Date().toISOString(),
    rawPayload: finalState,
  };
}

async function runPipelineHttp(
  evalCase: EvalCase,
  runIndex: number,
  baseUrl: string
): Promise<PipelineRunRecord> {
  const startedAt = new Date().toISOString();
  const sessionId = `eval-${evalCase.id}-run${runIndex}-${Date.now()}`;
  const demoOptions = mergeDemoOptions(evalCase.demoOptions);

  const res = await fetch(`${baseUrl}/api/agentic`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: evalCase.query, demoOptions, sessionId }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  const telemetry = extractTelemetryFromHttpPayload(data);

  return {
    ...telemetry,
    runIndex,
    sessionId,
    startedAt,
    finishedAt: new Date().toISOString(),
    rawPayload: data,
  };
}

async function runCase(
  evalCase: EvalCase,
  viaHttp: boolean,
  baseUrl: string
): Promise<EvalCaseResult> {
  const errors: string[] = [];
  const pipelineRuns: PipelineRunRecord[] = [];

  for (let i = 1; i <= REPEAT_COUNT; i++) {
    try {
      const record = viaHttp
        ? await runPipelineHttp(evalCase, i, baseUrl)
        : await runPipelineDirect(evalCase, i);
      pipelineRuns.push(record);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Pipeline run ${i}: ${msg}`);
    }
  }

  const baselineStart = new Date().toISOString();
  let baseline;
  try {
    const { modelUsed, responseText } = await runBaselineLlm(evalCase.query);
    baseline = {
      modelUsed,
      latencyMs: Date.now() - new Date(baselineStart).getTime(),
      responseText,
      startedAt: baselineStart,
      finishedAt: new Date().toISOString(),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Baseline: ${msg}`);
    baseline = {
      modelUsed: "error",
      latencyMs: 0,
      responseText: "",
      startedAt: baselineStart,
      finishedAt: new Date().toISOString(),
    };
  }

  return { case: evalCase, pipelineRuns, baseline, errors };
}

async function main() {
  const { viaHttp, limit, category, outFile } = parseArgs();
  const startedAt = new Date().toISOString();
  const runId = `eval-${Date.now()}`;

  let cases = loadTestset();
  if (category) {
    cases = cases.filter((c) => c.category === category);
  }
  if (limit && limit > 0) {
    cases = cases.slice(0, limit);
  }

  console.log(`\nQyven Eval Harness — ${cases.length} cases, mode=${viaHttp ? "http" : "direct"}, ${REPEAT_COUNT} repeats each\n`);

  const results: EvalCaseResult[] = [];
  for (let i = 0; i < cases.length; i++) {
    const evalCase = cases[i];
    process.stdout.write(`[${i + 1}/${cases.length}] ${evalCase.id} (${evalCase.category})... `);
    const result = await runCase(evalCase, viaHttp, DEFAULT_BASE_URL);
    results.push(result);
    const ok = result.pipelineRuns.length;
    console.log(`${ok}/${REPEAT_COUNT} pipeline runs, baseline=${result.baseline.modelUsed.split(" ")[0]}`);
    if (result.errors.length) {
      result.errors.forEach((e) => console.warn(`  ⚠ ${e}`));
    }
  }

  const manifest: EvalRunManifest = {
    runId,
    startedAt,
    finishedAt: new Date().toISOString(),
    mode: viaHttp ? "http" : "direct",
    baseUrl: viaHttp ? DEFAULT_BASE_URL : undefined,
    repeatCount: REPEAT_COUNT,
    env: {
      hasNewsKey: Boolean(process.env.NEWS_API_KEY),
      hasGroqKey: Boolean(process.env.GROQ_API_KEY),
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    },
    cases: results,
  };

  const resultsDir = path.join(process.cwd(), "eval", "results");
  fs.mkdirSync(resultsDir, { recursive: true });

  const timestamp = startedAt.replace(/[:.]/g, "-");
  const outputPath =
    outFile || path.join(resultsDir, `${timestamp}.json`);

  fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
  fs.writeFileSync(path.join(resultsDir, "latest.json"), JSON.stringify(manifest, null, 2));

  console.log(`\nRaw results saved to ${outputPath}`);
  console.log(`Latest symlink copy: eval/results/latest.json\n`);
}

main().catch((err) => {
  console.error("Eval run failed:", err);
  process.exit(1);
});
