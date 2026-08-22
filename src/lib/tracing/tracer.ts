/**
 * src/lib/tracing/tracer.ts
 *
 * Comprehensive in-process OpenTelemetry-compatible span collector and trace emitter.
 * Records hierarchical spans, agent prompts (sanitized), decisions, tool calls,
 * token accounting with model pricing, and error cascades.
 *
 * Fully self-contained with graceful external degradation (OTel / Langfuse / LangSmith export).
 */

import * as fs from "fs";
import * as path from "path";
import { QyvenState } from "@/lib/agents/qyvenState";
import {
  TraceSpan,
  TraceFile,
  SpanStatus,
  TraceEventType,
  DecisionPayload,
  PromptMetadata,
  TokenUsage,
  AgentTokenBreakdown,
} from "../../../eval/types";
import { redactSensitiveData } from "./redactor";

// ─────────────────────────────────────────────────────────────
// Real Pricing Matrix (USD per 1M tokens)
// ─────────────────────────────────────────────────────────────
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "groq/compound":         { input: 0.80, output: 0.80 },
  "openai/gpt-oss-120b":   { input: 0.90, output: 0.90 },
  "qwen/qwen3.6-27b":      { input: 0.60, output: 0.60 },
  "groq/compound-mini":    { input: 0.40, output: 0.40 },
  "gemini-1.5-flash":      { input: 0.075, output: 0.30 },
  "gemini-2.0-flash":      { input: 0.10,  output: 0.40 },
  "gemini-2.5-flash":      { input: 0.15,  output: 0.60 },
  "default":               { input: 0.50,  output: 0.50 },
};

export function estimateTokenCost(model: string, promptTokens: number, completionTokens: number): number {
  const matchedKey = Object.keys(MODEL_PRICING).find((k) => model.toLowerCase().includes(k)) || "default";
  const rates = MODEL_PRICING[matchedKey] || MODEL_PRICING["default"];
  return (promptTokens / 1_000_000) * rates.input + (completionTokens / 1_000_000) * rates.output;
}

/**
 * Deterministic character-based token estimator for providers that omit usage headers.
 * Rule of thumb: ~4 characters per token in English text.
 */
export function estimateTokensFromText(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.trim().length / 4));
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─────────────────────────────────────────────────────────────
// Span Lifecycle
// ─────────────────────────────────────────────────────────────

export function startSpan(
  state: QyvenState,
  name: string,
  agentRole: string,
  parentSpanId?: string,
  eventType: TraceEventType = "SPAN_START",
  promptMetadata?: PromptMetadata,
  attrs?: Partial<TraceSpan["attributes"]>
): string {
  const spanId = generateId("span");
  const sanitizedAttrs = redactSensitiveData(attrs || {}) as TraceSpan["attributes"];
  const sanitizedPrompt = promptMetadata ? redactSensitiveData(promptMetadata) : undefined;

  const span: TraceSpan = {
    traceId: state.traceId,
    runId: state.runId || state.traceId,
    spanId,
    parentSpanId,
    name,
    agentRole,
    eventType,
    startTimeMs: Date.now(),
    endTimeMs: 0,
    durationMs: 0,
    status: "unset",
    promptMetadata: sanitizedPrompt,
    attributes: { ...sanitizedAttrs },
  };

  state.spans.push(span);
  return spanId;
}

export function endSpan(
  state: QyvenState,
  spanId: string,
  status: SpanStatus = "ok",
  attrs?: Partial<TraceSpan["attributes"]>,
  tokenUsage?: TokenUsage
): void {
  const span = state.spans.find((s) => s.spanId === spanId);
  if (!span) return;

  span.endTimeMs = Date.now();
  span.durationMs = Math.max(1, span.endTimeMs - span.startTimeMs);
  span.status = status;

  if (attrs) {
    const sanitized = redactSensitiveData(attrs);
    Object.assign(span.attributes, sanitized);
  }

  if (tokenUsage) {
    span.tokenUsage = tokenUsage;
    span.attributes.promptTokens = tokenUsage.promptTokens;
    span.attributes.completionTokens = tokenUsage.completionTokens;
    span.attributes.totalTokens = tokenUsage.totalTokens;
    span.attributes.isEstimatedTokens = tokenUsage.isEstimated;
    span.attributes.estimatedCostUsd = tokenUsage.estimatedCostUsd;
    span.attributes.model = tokenUsage.modelName;
  }
}

// ─────────────────────────────────────────────────────────────
// Specific Recorders (Decision, Tool, LLM)
// ─────────────────────────────────────────────────────────────

export function recordDecisionSpan(
  state: QyvenState,
  parentSpanId: string,
  agentRole: string,
  decision: DecisionPayload
): string {
  const spanId = generateId("decision");
  const now = Date.now();
  const sanitized = redactSensitiveData(decision);

  const span: TraceSpan = {
    traceId: state.traceId,
    runId: state.runId || state.traceId,
    spanId,
    parentSpanId,
    name: `decision [${sanitized.decisionType}]`,
    agentRole,
    eventType: sanitized.decisionType,
    startTimeMs: now,
    endTimeMs: now,
    durationMs: 0,
    status: "ok",
    decision: sanitized,
    attributes: {
      decision: sanitized.selectedOption,
      decisionType: sanitized.decisionType,
      reasoning: sanitized.reasonSummary.slice(0, 500),
      trigger: sanitized.trigger,
      confidence: sanitized.confidence,
    },
  };

  state.spans.push(span);
  return spanId;
}

export function recordToolSpan(
  state: QyvenState,
  parentSpanId: string,
  toolName: string,
  toolArgs: Record<string, unknown>,
  toolLatencyMs: number,
  resultSummary?: string,
  error?: string,
  retryCount: number = 0
): string {
  const spanId = generateId("tool");
  const sanitizedArgs = redactSensitiveData(toolArgs);
  const now = Date.now();

  const span: TraceSpan = {
    traceId: state.traceId,
    runId: state.runId || state.traceId,
    spanId,
    parentSpanId,
    name: `tool.call [${toolName}]`,
    agentRole: "TOOL",
    eventType: "TOOL_CALL",
    startTimeMs: now - toolLatencyMs,
    endTimeMs: now,
    durationMs: toolLatencyMs,
    status: error ? "error" : "ok",
    attributes: {
      toolName,
      toolArgs: JSON.stringify(sanitizedArgs).slice(0, 500),
      toolResult: resultSummary ? redactSensitiveData(resultSummary).slice(0, 500) : undefined,
      toolLatencyMs,
      retryCount,
      errorMessage: error ? redactSensitiveData(error) : undefined,
      errorType: error ? "ToolExecutionFailure" : undefined,
    },
  };

  state.spans.push(span);
  return spanId;
}

// ─────────────────────────────────────────────────────────────
// Trace Aggregation & Storage
// ─────────────────────────────────────────────────────────────

export function calculateAgentTokenBreakdowns(spans: TraceSpan[]): AgentTokenBreakdown[] {
  const roles = ["PLANNER", "RESEARCH_AGENT", "ANALYSIS_AGENT", "SYNTHESIS_AGENT", "EVIDENCE_RESOLVER", "CONFIDENCE_JUDGE", "SELF_EVALUATOR"];
  const breakdown: Record<string, AgentTokenBreakdown> = {};

  roles.forEach((r) => {
    breakdown[r] = {
      agentRole: r,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimatedCostUsd: 0,
      callCount: 0,
    };
  });

  spans.forEach((s) => {
    if (s.tokenUsage) {
      const role = s.agentRole || "UNKNOWN";
      if (!breakdown[role]) {
        breakdown[role] = {
          agentRole: role,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          estimatedCostUsd: 0,
          callCount: 0,
        };
      }
      breakdown[role].promptTokens += s.tokenUsage.promptTokens;
      breakdown[role].completionTokens += s.tokenUsage.completionTokens;
      breakdown[role].totalTokens += s.tokenUsage.totalTokens;
      breakdown[role].estimatedCostUsd += s.tokenUsage.estimatedCostUsd;
      breakdown[role].callCount += 1;
    }
  });

  return Object.values(breakdown).filter((b) => b.callCount > 0 || ["RESEARCH_AGENT", "ANALYSIS_AGENT", "SYNTHESIS_AGENT"].includes(b.agentRole));
}

export function writeTraceFile(state: QyvenState): string | null {
  if (typeof window !== "undefined") return null;

  try {
    const tracesDir = path.join(process.cwd(), "eval", "traces");
    fs.mkdirSync(tracesDir, { recursive: true });

    const endTimeMs = Date.now();
    const errorSpans = state.spans.filter((s) => s.status === "error");

    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let estimatedTotalCostUsd = 0;

    state.spans.forEach((s) => {
      if (s.tokenUsage) {
        totalPromptTokens += s.tokenUsage.promptTokens;
        totalCompletionTokens += s.tokenUsage.completionTokens;
        estimatedTotalCostUsd += s.tokenUsage.estimatedCostUsd;
      }
    });

    const totalTokens = totalPromptTokens + totalCompletionTokens;
    const agentBreakdown = calculateAgentTokenBreakdowns(state.spans);

    const traceFile: TraceFile = {
      traceId: state.traceId,
      runId: state.runId || state.traceId,
      investigationId: state.investigationId,
      sessionId: state.sessionId,
      query: state.userQuery,
      status: state.status,
      startTimeMs: state.startTimeMs,
      endTimeMs,
      totalDurationMs: endTimeMs - state.startTimeMs,
      spanCount: state.spans.length,
      errorSpanCount: errorSpans.length,
      totalPromptTokens,
      totalCompletionTokens,
      totalTokens,
      estimatedTotalCostUsd,
      agentBreakdown,
      spans: state.spans,
      runtimePolicy: state.runtimePolicy,
      demoOptions: state.demoOptions as unknown as Record<string, boolean | string | undefined | number>,
    };

    const sanitizedTrace = redactSensitiveData(traceFile);

    const filePath = path.join(tracesDir, `${state.traceId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(sanitizedTrace, null, 2));
    fs.writeFileSync(path.join(tracesDir, "latest.json"), JSON.stringify(sanitizedTrace, null, 2));

    return filePath;
  } catch (err) {
    console.warn("[Tracer] Failed to write trace file:", err);
    return null;
  }
}
