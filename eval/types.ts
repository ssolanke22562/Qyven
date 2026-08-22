import { DemoOptions } from "@/lib/agents/qyvenState";

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

export interface CategoryMetrics {
  category: EvalCategory;
  caseCount: number;
  accuracy: MetricValue;
  groundedness: MetricValue;
  hallucinationRate: MetricValue;
  consistency: MetricValue;
  recoveryRate: MetricValue;
  uncertaintyHandling: MetricValue;
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
    accuracy: MetricValue;
    groundedness: MetricValue;
    consistency: MetricValue;
    recovery: boolean | "unscored";
    uncertaintyHandled: boolean | "unscored";
    latencyMeanMs: number;
    baselineAccuracyDelta: MetricValue;
  }>;
}
