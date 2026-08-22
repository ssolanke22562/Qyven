import { DemoOptions } from "@/lib/agents/qyvenState";

// ──────────────────────────────────────────────
// Distributed Tracing Types (OTel-compatible)
// ──────────────────────────────────────────────

export type SpanStatus = "ok" | "error" | "unset";

export interface TraceSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  agentRole: string;
  startTimeMs: number;
  endTimeMs: number;
  durationMs: number;
  status: SpanStatus;
  attributes: {
    // LLM call attributes
    model?: string;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    estimatedCostUsd?: number;
    llmLatencyMs?: number;
    // Tool call attributes
    toolName?: string;
    toolArgs?: string;
    toolResult?: string;
    toolLatencyMs?: number;
    // Decision attributes
    decision?: string;
    reasoning?: string;
    // Error attributes
    errorMessage?: string;
    errorType?: string;
    // Agent attributes
    inputSummary?: string;
    outputSummary?: string;
    sourcesRetrieved?: number;
    entitiesExtracted?: number;
    confidenceScore?: number;
    isFallback?: boolean;
    // General
    [key: string]: string | number | boolean | undefined;
  };
  events?: Array<{ name: string; timestampMs: number; attributes?: Record<string, string | number | boolean> }>;
}

export interface TraceFile {
  traceId: string;
  investigationId: string;
  sessionId: string;
  query: string;
  status: string;
  startTimeMs: number;
  endTimeMs: number;
  totalDurationMs: number;
  spanCount: number;
  errorSpanCount: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  estimatedTotalCostUsd: number;
  spans: TraceSpan[];
  demoOptions: Record<string, boolean | string | undefined>;
}

export interface DiagnosisReport {
  traceId: string;
  diagnosedAt: string;
  severityLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  rootCause: string;
  failedSpan: {
    spanId: string;
    name: string;
    agentRole: string;
    errorMessage: string;
  } | null;
  downstreamImpact: string[];
  suggestedFix: string;
  autoFixApplied: string | null;
  beforeAfterSummary?: {
    sourcesWithoutFix: number;
    sourcesWithFix: number;
    confidenceWithoutFix: number;
    confidenceWithFix: number;
  };
  raw?: string;
}

// ──────────────────────────────────────────────
// Benchmark Types
// ──────────────────────────────────────────────

export interface BenchmarkRunRecord {
  phase: "before" | "after";
  iteration: number;
  traceId: string;
  sessionId: string;
  startedAt: string;
  finishedAt: string;
  latencyMs: number;
  toolCallCount: number;
  errorCount: number;
  sourcesRetrieved: number;
  confidenceScore: number;
  success: boolean;
  isFallback: boolean;
  replansTriggered: number;
}

export interface BenchmarkComparison {
  generatedAt: string;
  scenario: string;
  n: number;
  before: {
    avgLatencyMs: number;
    p95LatencyMs: number;
    avgToolCalls: number;
    avgErrors: number;
    avgSourcesRetrieved: number;
    avgConfidenceScore: number;
    successRate: number;
    avgReplans: number;
  };
  after: {
    avgLatencyMs: number;
    p95LatencyMs: number;
    avgToolCalls: number;
    avgErrors: number;
    avgSourcesRetrieved: number;
    avgConfidenceScore: number;
    successRate: number;
    avgReplans: number;
  };
  improvement: {
    latencyMsChange: number;
    latencyPctChange: number;
    errorCountChange: number;
    errorPctChange: number;
    successRateChange: number;
    confidenceChange: number;
    sourcesChange: number;
  };
  rawBefore: BenchmarkRunRecord[];
  rawAfter: BenchmarkRunRecord[];
}

export type EvalCategory =
  | "normal"
  | "ambiguous"
  | "adversarial"
  | "contradictory"
  | "incomplete"
  | "tool_failure";

export interface EvalCase {
  id: string;
  category: EvalCategory;
  query: string;
  expected_behavior: string;
  ground_truth_facts: string[];
  demoOptions?: Partial<DemoOptions>;
}

export interface PipelineTelemetry {
  latencyMs: number;
  confidenceScore: number;
  toolsCalled: string[];
  toolFailures: string[];
  replansTriggered: boolean;
  replansCount: number;
  llmCalls: number;
  searchCalls: number;
  evidenceCount: number;
  conflictsCount: number;
  isFallback: boolean;
  status: string;
  selfEvaluationPassed: boolean | null;
  responseText: string;
  keyFindings: string[];
}

export interface PipelineRunRecord extends PipelineTelemetry {
  runIndex: number;
  sessionId: string;
  startedAt: string;
  finishedAt: string;
  rawPayload: unknown;
}

export interface BaselineRunRecord {
  modelUsed: string;
  latencyMs: number;
  responseText: string;
  startedAt: string;
  finishedAt: string;
}

export interface EvalCaseResult {
  case: EvalCase;
  pipelineRuns: PipelineRunRecord[];
  baseline: BaselineRunRecord;
  errors: string[];
}

export interface HumanEvalRecord {
  id: string;
  caseId: string;
  evaluatorName: string;
  accuracy: number; // 1-5
  evidenceQuality: number; // 1-5
  groundedness: number; // 1-5
  taskCompletion: number; // 1-5
  clarity: number; // 1-5
  trustworthiness: number; // 1-5
  passed: boolean;
  comments: string;
  timestamp: string;
}

export interface HumanEvalSummary {
  evaluatorCount: number;
  evaluatedCaseCount: number;
  overallScore: number | "Awaiting evaluator data";
  accuracyAvg: number | "Awaiting evaluator data";
  evidenceQualityAvg: number | "Awaiting evaluator data";
  groundednessAvg: number | "Awaiting evaluator data";
  taskCompletionAvg: number | "Awaiting evaluator data";
  clarityAvg: number | "Awaiting evaluator data";
  trustworthinessAvg: number | "Awaiting evaluator data";
  passRate: number | "Awaiting evaluator data";
}

export interface EvalRunManifest {
  runId: string;
  startedAt: string;
  finishedAt: string;
  mode: "direct" | "http";
  baseUrl?: string;
  repeatCount: number;
  env: {
    hasNewsKey: boolean;
    hasGroqKey: boolean;
    hasGeminiKey: boolean;
  };
  cases: EvalCaseResult[];
}

export type MetricValue = number | "unscored";

export interface ConsistencyBreakdown {
  runCount: number;
  conclusionConsistency: number;
  evidenceConsistency: number;
  citationConsistency: number;
  overallConsistency: number; // 0.5 * conclusion + 0.25 * evidence + 0.25 * citation
}

export interface ResourceEfficiencyMetrics {
  totalLlmCalls: number;
  totalSearchCalls: number;
  totalToolCalls: number;
  totalAgentSteps: number;
  avgTokensEstimated: number;
  avgLatencyMs: number;
}

export interface CategoryMetrics {
  category: EvalCategory;
  caseCount: number;
  passedCount: number;
  failedCount: number;
  accuracy: MetricValue;
  taskCompletion: MetricValue;
  groundedness: MetricValue;
  hallucinationRate: MetricValue;
  consistency: MetricValue;
  recoveryRate: MetricValue;
  uncertaintyHandling: MetricValue;
  unsupportedRefusalRate: MetricValue;
  evidenceQuality: MetricValue;
  latencyMeanMs: MetricValue;
  latencyP95Ms: MetricValue;
  baselineAccuracyDelta: MetricValue;
  baselineGroundednessDelta: MetricValue;
}

export interface Scorecard {
  generatedAt: string;
  sourceResultsFile: string;
  runMetadata: {
    runId: string;
    mode: string;
    startedAt: string;
    finishedAt: string;
    totalCases: number;
  };
  overall: Omit<CategoryMetrics, "category"> & { category: "overall" };
  byCategory: CategoryMetrics[];
  perCase: Array<{
    id: string;
    category: EvalCategory;
    query: string;
    expectedBehavior: string;
    passed: boolean;
    accuracy: MetricValue;
    groundedness: MetricValue;
    consistency: MetricValue;
    recovery: boolean | "unscored";
    uncertaintyHandled: boolean | "unscored";
    unsupportedRefused: boolean | "unscored";
    evidenceQuality: MetricValue;
    latencyMeanMs: number;
    baselineAccuracyDelta: MetricValue;
    telemetry: PipelineTelemetry | null;
    baseline: BaselineRunRecord | null;
    rawPayload?: unknown;
  }>;
  consistencySummary?: ConsistencyBreakdown;
  resourceEfficiency?: ResourceEfficiencyMetrics;
  humanEvaluation?: HumanEvalSummary;
}

