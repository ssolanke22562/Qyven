import { QyvenState } from "@/lib/agents/qyvenState";
import { PipelineTelemetry } from "./types";

function extractKeyFindings(state: QyvenState): string[] {
  const research = state.agentOutputs["RESEARCH_AGENT"];
  const findings: string[] = [];

  if (research?.data?.keyFindings) {
    findings.push(...research.data.keyFindings);
  } else if (research?.keyFindings) {
    findings.push(...research.keyFindings);
  }

  if (state.finalReport?.recentNews) {
    findings.push(...state.finalReport.recentNews);
  }

  return findings.slice(0, 20);
}

export function extractTelemetryFromState(state: QyvenState): PipelineTelemetry {
  const toolFailures = state.executionHistory
    .filter((s) => s.status === "FAILURE")
    .map((s) => `${s.agentRole}: ${s.message}`);

  state.currentPlan.tasks
    .filter((t) => t.status === "FAILED" && t.error)
    .forEach((t) => toolFailures.push(`${t.agent}: ${t.error}`));

  const toolsCalled = Array.from(
    new Set([
      ...state.currentPlan.tasks.map((t) => t.agent),
      ...Object.keys(state.agentOutputs),
    ])
  );

  const replansTriggered =
    state.budget.usedReplans > 0 ||
    state.executionHistory.some((s) => s.status === "REPLAN" || s.status === "RECOVERY");

  const responseText =
    state.finalReport?.formattedMarkdown ||
    state.finalReport?.summary ||
    "";

  return {
    latencyMs: state.totalLatencyMs ?? Date.now() - state.startTimeMs,
    confidenceScore: state.confidence.score,
    toolsCalled,
    toolFailures: Array.from(new Set(toolFailures)),
    replansTriggered,
    replansCount: state.budget.usedReplans,
    llmCalls: state.budget.usedLlmCalls,
    searchCalls: state.budget.usedSearchCalls,
    evidenceCount: state.evidenceTable.length,
    conflictsCount: state.conflicts.length,
    isFallback: state.isFallback,
    status: state.status,
    selfEvaluationPassed: state.selfEvaluation?.passed ?? null,
    responseText,
    keyFindings: extractKeyFindings(state),
  };
}

export function extractTelemetryFromHttpPayload(data: Record<string, unknown>): PipelineTelemetry {
  const state = (data.qyvenState || data) as QyvenState;
  return extractTelemetryFromState(state);
}

export function hasValidSynthesis(telemetry: PipelineTelemetry): boolean {
  return (
    telemetry.status !== "FAILED" &&
    telemetry.responseText.trim().length > 20
  );
}

export function hasRecoveryEvidence(telemetry: PipelineTelemetry): boolean {
  return (
    telemetry.replansTriggered ||
    telemetry.isFallback ||
    telemetry.toolFailures.length > 0
  );
}

export function indicatesLowEvidence(telemetry: PipelineTelemetry): boolean {
  const reasoning = (telemetry as { confidenceReasoning?: string }).confidenceReasoning || "";
  const lowConfidence = telemetry.confidenceScore < 60;
  const lowEvidence = telemetry.evidenceCount < 3;
  const selfEvalFailed = telemetry.selfEvaluationPassed === false;
  const mentionsUncertainty =
    /insufficient|low evidence|limited|uncertain|partial|fallback|rejected/i.test(
      telemetry.responseText + reasoning
    );
  return lowConfidence || (lowEvidence && selfEvalFailed) || mentionsUncertainty;
}
