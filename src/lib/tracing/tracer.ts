/**
 * src/lib/tracing/tracer.ts
 *
 * Lightweight in-process span collector. Produces OTel-compatible TraceSpan[] objects
 * stored directly in QyvenState.spans, then written to eval/traces/<traceId>.json
 * on pipeline completion.
 *
 * No external SDK required — zero network dependency, zero vendor lock-in.
 * Compatible with Langfuse/OTel piping later by matching their span schema.
 */

import * as fs from "fs";
import * as path from "path";
import { QyvenState } from "@/lib/agents/qyvenState";
import { TraceSpan, TraceFile, SpanStatus } from "../../../eval/types";

// ─────────────────────────────────────────────────────────────
// Cost estimation rates (as of Aug 2026, USD per 1M tokens)
// ─────────────────────────────────────────────────────────────
const COST_PER_1M: Record<string, { input: number; output: number }> = {
  "groq/compound":         { input: 0.80, output: 0.80 },
  "openai/gpt-oss-120b":   { input: 0.90, output: 0.90 },
  "qwen/qwen3.6-27b":      { input: 0.60, output: 0.60 },
  "groq/compound-mini":    { input: 0.40, output: 0.40 },
  "gemini-1.5-flash":      { input: 0.075, output: 0.30 },
  "gemini-2.0-flash":      { input: 0.10,  output: 0.40 },
  "gemini-2.5-flash":      { input: 0.15,  output: 0.60 },
};

function estimateCost(model: string, promptTokens: number, completionTokens: number): number {
  const key = Object.keys(COST_PER_1M).find((k) => model.toLowerCase().includes(k)) || "";
  const rates = COST_PER_1M[key] ?? { input: 0.50, output: 0.50 };
  return (promptTokens / 1_000_000) * rates.input + (completionTokens / 1_000_000) * rates.output;
}

function nanoid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─────────────────────────────────────────────────────────────
// Span lifecycle helpers
// ─────────────────────────────────────────────────────────────

/** Open a new span, push it to state.spans, return its spanId. */
export function startSpan(
  state: QyvenState,
  name: string,
  agentRole: string,
  parentSpanId?: string,
  attrs?: Partial<TraceSpan["attributes"]>
): string {
  const spanId = `span-${nanoid()}`;
  const span: TraceSpan = {
    traceId: state.traceId,
    spanId,
    parentSpanId,
    name,
    agentRole,
    startTimeMs: Date.now(),
    endTimeMs: 0,
    durationMs: 0,
    status: "unset",
    attributes: { ...(attrs || {}) },
  };
  state.spans.push(span);
  return spanId;
}

/** Close an open span by spanId. */
export function endSpan(
  state: QyvenState,
  spanId: string,
  status: SpanStatus = "ok",
  attrs?: Partial<TraceSpan["attributes"]>
): void {
  const span = state.spans.find((s) => s.spanId === spanId);
  if (!span) return;
  span.endTimeMs = Date.now();
  span.durationMs = span.endTimeMs - span.startTimeMs;
  span.status = status;
  if (attrs) {
    Object.assign(span.attributes, attrs);
  }
}

/** Add a span event (lightweight annotation within a span). */
export function addSpanEvent(
  state: QyvenState,
  spanId: string,
  eventName: string,
  eventAttrs?: Record<string, string | number | boolean>
): void {
  const span = state.spans.find((s) => s.spanId === spanId);
  if (!span) return;
  if (!span.events) span.events = [];
  span.events.push({
    name: eventName,
    timestampMs: Date.now(),
    attributes: eventAttrs,
  });
}

// ─────────────────────────────────────────────────────────────
// Convenience recorders for common span types
// ─────────────────────────────────────────────────────────────

/** Record a completed LLM call as a span (with token counts + cost estimate). */
export function recordLlmSpan(
  state: QyvenState,
  parentSpanId: string,
  model: string,
  promptTokens: number,
  completionTokens: number,
  llmLatencyMs: number,
  inputSummary?: string,
  outputSummary?: string,
  error?: string
): string {
  const spanId = `span-${nanoid()}`;
  const totalTokens = promptTokens + completionTokens;
  const estimatedCostUsd = estimateCost(model, promptTokens, completionTokens);
  const span: TraceSpan = {
    traceId: state.traceId,
    spanId,
    parentSpanId,
    name: `llm.call [${model}]`,
    agentRole: "LLM",
    startTimeMs: Date.now() - llmLatencyMs,
    endTimeMs: Date.now(),
    durationMs: llmLatencyMs,
    status: error ? "error" : "ok",
    attributes: {
      model,
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCostUsd,
      llmLatencyMs,
      inputSummary: inputSummary?.slice(0, 300),
      outputSummary: outputSummary?.slice(0, 300),
      errorMessage: error,
    },
  };
  state.spans.push(span);
  return spanId;
}

/** Record a completed tool call as a span. */
export function recordToolSpan(
  state: QyvenState,
  parentSpanId: string,
  toolName: string,
  toolArgs: Record<string, unknown>,
  toolLatencyMs: number,
  resultSummary?: string,
  error?: string
): string {
  const spanId = `span-${nanoid()}`;
  const span: TraceSpan = {
    traceId: state.traceId,
    spanId,
    parentSpanId,
    name: `tool.call [${toolName}]`,
    agentRole: "TOOL",
    startTimeMs: Date.now() - toolLatencyMs,
    endTimeMs: Date.now(),
    durationMs: toolLatencyMs,
    status: error ? "error" : "ok",
    attributes: {
      toolName,
      toolArgs: JSON.stringify(toolArgs).slice(0, 500),
      toolResult: resultSummary?.slice(0, 500),
      toolLatencyMs,
      errorMessage: error,
      errorType: error ? "ToolFailure" : undefined,
    },
  };
  state.spans.push(span);
  return spanId;
}

/** Record an agent decision point (routing, fallback, replan). */
export function recordDecisionSpan(
  state: QyvenState,
  parentSpanId: string,
  agentRole: string,
  decision: string,
  reasoning: string
): string {
  const spanId = `span-${nanoid()}`;
  const now = Date.now();
  const span: TraceSpan = {
    traceId: state.traceId,
    spanId,
    parentSpanId,
    name: `decision [${decision}]`,
    agentRole,
    startTimeMs: now,
    endTimeMs: now,
    durationMs: 0,
    status: "ok",
    attributes: {
      decision,
      reasoning: reasoning.slice(0, 500),
    },
  };
  state.spans.push(span);
  return spanId;
}

// ─────────────────────────────────────────────────────────────
// Trace file writer
// ─────────────────────────────────────────────────────────────

/** Write the completed trace to eval/traces/<traceId>.json */
export function writeTraceFile(state: QyvenState): string | null {
  // Only write in Node.js (not browser/edge)
  if (typeof window !== "undefined") return null;

  try {
    const tracesDir = path.join(process.cwd(), "eval", "traces");
    fs.mkdirSync(tracesDir, { recursive: true });

    const endTimeMs = Date.now();
    const errorSpans = state.spans.filter((s) => s.status === "error");
    const llmSpans = state.spans.filter((s) => s.name.startsWith("llm.call"));
    const totalPromptTokens = llmSpans.reduce((acc, s) => acc + (s.attributes.promptTokens ?? 0), 0);
    const totalCompletionTokens = llmSpans.reduce((acc, s) => acc + (s.attributes.completionTokens ?? 0), 0);
    const estimatedTotalCostUsd = llmSpans.reduce((acc, s) => acc + (s.attributes.estimatedCostUsd ?? 0), 0);

    const traceFile: TraceFile = {
      traceId: state.traceId,
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
      estimatedTotalCostUsd,
      spans: state.spans,
      demoOptions: state.demoOptions as unknown as Record<string, boolean | string | undefined>,
    };

    const filePath = path.join(tracesDir, `${state.traceId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(traceFile, null, 2));

    // Also write latest.json for easy access
    fs.writeFileSync(path.join(tracesDir, "latest.json"), JSON.stringify(traceFile, null, 2));

    return filePath;
  } catch (err) {
    console.warn("[Tracer] Failed to write trace file:", err);
    return null;
  }
}
