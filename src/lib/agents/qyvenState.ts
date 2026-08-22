import { ResearchAgentSource } from "./types";
import { TraceSpan } from "../../../eval/types";


export type AgentRole =
  | "PLANNER"
  | "RESEARCH_AGENT"
  | "NEWS_AGENT"
  | "PATENT_AGENT"
  | "SEC_AGENT"
  | "EVIDENCE_RESOLVER"
  | "CONFIDENCE_JUDGE"
  | "SELF_EVALUATOR"
  | "REPLANNER"
  | "SYNTHESIS_AGENT";

export type TaskStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "SKIPPED";

export interface QyvenTask {
  id: string;
  agent: AgentRole;
  title: string;
  description: string;
  status: TaskStatus;
  dependsOn?: string[];
  parallelGroup?: number;
  outputSummary?: string;
  executionTimeMs?: number;
  error?: string;
  retryCount?: number;
}

export interface QyvenEvidence {
  id: string;
  claim: string;
  source: string;
  sourceType: "SEC" | "COMPANY_OFFICIAL" | "NEWS" | "PATENT" | "ARXIV" | "GRAPH_NODE" | "OTHER";
  reliabilityScore: number; // 0-1.0
  publishedDate?: string;
  url?: string;
  extractedFromTask: string;
  confidence: number;
}

export interface QyvenConflict {
  id: string;
  topic: string;
  competingClaims: {
    claim: string;
    source: string;
    sourceType: string;
    reliabilityScore: number;
    evidenceId: string;
  }[];
  isResolved: boolean;
  chosenClaim?: string;
  resolutionReasoning?: string;
}

export interface QyvenPlan {
  id: string;
  objective: string;
  rationale: string;
  tasks: QyvenTask[];
  createdAt: string;
  version: number;
}

export interface QyvenBudget {
  maxLlmCalls: number;
  usedLlmCalls: number;
  maxSearchCalls: number;
  usedSearchCalls: number;
  maxRetries: number;
  usedRetries: number;
  maxReplans: number;
  usedReplans: number;
}

export interface ExecutionStep {
  stepId: string;
  nodeName: string;
  agentRole: AgentRole;
  timestamp: string;
  status: "INFO" | "SUCCESS" | "WARNING" | "FAILURE" | "RECOVERY" | "REPLAN";
  message: string;
  details?: any;
  executionTimeMs?: number;
}

export interface QyvenCheckpoint {
  checkpointId: string;
  nodeName: string;
  timestamp: string;
  planVersion: number;
  completedTasksCount: number;
  evidenceCount: number;
  conflictsCount: number;
  confidenceScore: number;
}

export interface DemoOptions {
  enableAdversarialMode: boolean;
  forceNewsFailure?: boolean;
  forcePatentTimeout?: boolean;
  forceSecUnavailable?: boolean;
  injectConflictingEvidence?: boolean;
  deterministicSeed?: string;
}

export interface QyvenState {
  investigationId: string;
  sessionId: string;
  userId: string;
  userQuery: string;
  
  // Execution Control
  status: "IDLE" | "PLANNING" | "EXECUTING" | "EVALUATING" | "REPLANNING" | "COMPLETED" | "FAILED" | "LOOP_DETECTED";
  currentPlan: QyvenPlan;
  executionHistory: ExecutionStep[];
  checkpoints: QyvenCheckpoint[];
  
  // Accumulated Evidence & Outputs
  agentOutputs: Record<string, any>;
  sources: ResearchAgentSource[];
  evidenceTable: QyvenEvidence[];
  conflicts: QyvenConflict[];
  groundedNodes: string[];
  
  // Confidence & Verification Metrics
  confidence: {
    score: number; // 0 - 100
    supportingEvidenceCount: number;
    independentSourcesCount: number;
    totalConflicts: number;
    resolvedConflicts: number;
    freshnessScore: number;
    reliabilityScore: number;
    reasoning: string;
  };
  
  // Self Evaluation
  selfEvaluation?: {
    passed: boolean;
    answersQuestion: boolean;
    evidenceSufficient: boolean;
    conflictsResolved: boolean;
    feedback: string;
  };
  
  // Resources & Safeguards
  budget: QyvenBudget;
  nodeHistory: string[];
  stateSignatures: string[];
  isFallback: boolean;
  
  // Demo Mode Settings
  demoOptions: DemoOptions;
  
  // Final Result Payload
  finalReport?: {
    summary: string;
    recentNews: string[];
    pastContext: string[];
    patentSignals: string[];
    secFilings: string[];
    threatAssessment: string;
    recommendedActions: string[];
    formattedMarkdown: string;
  };

  startTimeMs: number;
  totalLatencyMs?: number;
  // ──────────────────────────────────────────────
  // Distributed Tracing
  // ──────────────────────────────────────────────
  traceId: string;
  spans: TraceSpan[];
}

export function createInitialQyvenState(
  userQuery: string,
  sessionId: string = `sess-${Date.now()}`,
  demoOptions: DemoOptions = { enableAdversarialMode: false }
): QyvenState {
  const investigationId = `inv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  
  return {
    investigationId,
    sessionId,
    userId: "anonymous",
    userQuery,
    status: "IDLE",
    currentPlan: {
      id: `plan-0`,
      objective: userQuery,
      rationale: "Initial plan initialization",
      tasks: [],
      createdAt: new Date().toISOString(),
      version: 1,
    },
    executionHistory: [],
    checkpoints: [],
    agentOutputs: {},
    sources: [],
    evidenceTable: [],
    conflicts: [],
    groundedNodes: [],
    confidence: {
      score: 50,
      supportingEvidenceCount: 0,
      independentSourcesCount: 0,
      totalConflicts: 0,
      resolvedConflicts: 0,
      freshnessScore: 0.8,
      reliabilityScore: 0.8,
      reasoning: "Initial state prior to agent execution",
    },
    budget: {
      maxLlmCalls: 10,
      usedLlmCalls: 0,
      maxSearchCalls: 20,
      usedSearchCalls: 0,
      maxRetries: 3,
      usedRetries: 0,
      maxReplans: 3,
      usedReplans: 0,
    },
    nodeHistory: [],
    stateSignatures: [],
    isFallback: false,
    demoOptions,
    startTimeMs: Date.now(),
    traceId: `trace-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    spans: [],
  };
}
