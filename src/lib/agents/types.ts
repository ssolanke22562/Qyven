export type AgentStatus = "IDLE" | "WAITING" | "RUNNING" | "COMPLETED" | "FAILED";

export interface AgentLog {
  timestamp: string;
  agent: "ORCHESTRATOR" | "RESEARCH AGENT" | "ANALYSIS AGENT" | "SYNTHESIS AGENT";
  message: string;
  type: "info" | "success" | "warning" | "error";
}

export interface AgentState {
  name: string;
  role: string;
  status: AgentStatus;
  currentTask: string;
  executionTimeMs: number;
  inputSummary?: string;
  outputSummary?: string;
  sourcesProcessed?: number;
  entitiesExtracted?: number;
  relationshipsIdentified?: number;
  error?: string;
}

export interface ResearchAgentSource {
  type: "news" | "arxiv";
  title: string;
  link: string;
  source?: string;
  published?: string;
  summary: string;
  authors?: string[];
  relevanceScore?: number;
}

import { TokenUsage, PromptMetadata } from "../../../eval/types";

export interface ResearchAgentOutput {
  query: string;
  sources: ResearchAgentSource[];
  keyFindings: string[];
  relevantEntities: string[];
  evidence: string[];
  confidenceScore: number;
  timestamp: string;
  contextUsed?: { shortTerm: boolean; longTermRecordsUsed: number };
  tokenUsage?: TokenUsage;
  promptMetadata?: PromptMetadata;
}

export interface AnalysisEntity {
  id?: string;
  name: string;
  category: "Competitor" | "Technology" | "Market Signal" | "Patent" | "Organization" | "Concept";
  confidence: number;
  threatIndex?: number;
}

export interface AnalysisRelationship {
  source: string;
  target: string;
  relationType: string;
  confidence: number;
}

export interface AnalysisAgentOutput {
  extractedEntities: AnalysisEntity[];
  relationships: AnalysisRelationship[];
  classifications: string[];
  keyInsights: string[];
  groundedNodes: string[];
  threatRating: string;
  confidenceScore: number;
  timestamp: string;
  modelUsed?: string;
  tokenUsage?: TokenUsage;
  promptMetadata?: PromptMetadata;
}

export interface SynthesisAgentOutput {
  summary: string;
  recentNews: string[];
  pastContext: string[];
  threatAssessment: string;
  recommendedActions: string[];
  linkedNodes: string[];
  confidenceReasoning: string;
  evidenceCitations: string[];
  timestamp: string;
  contextUsed?: { shortTerm: boolean; longTermRecordsUsed: number };
  modelUsed?: string;
  tokenUsage?: TokenUsage;
  promptMetadata?: PromptMetadata;
}

export interface InterAgentCommunication {
  task: string;
  researchFindings: ResearchAgentOutput;
  analysisResults: AnalysisAgentOutput;
  synthesisIntelligence: SynthesisAgentOutput;
}

export interface OrchestrationResult {
  success: boolean;
  modelUsed: string;
  latencyMs: number;
  toolsUsed: string[];
  logs: AgentLog[];
  agentStates: Record<string, AgentState>;
  communicationPayload: InterAgentCommunication;
  sources: ResearchAgentSource[];
  response: {
    summary: string;
    recentNews?: string[];
    pastContext?: string[];
    patentSignals?: string[];
    secFilings?: string[];
    threatAssessment: string;
    recommendedActions: string[];
    linkedNodes: string[];
    confidenceReasoning?: string;
  };
  formattedMarkdownResponse?: string;
  isFallback?: boolean;
  sessionId?: string;
  memory?: {
    sessionId: string;
    shortTermTurns: number;
    longTermRecordsRetrieved: number;
    longTermRecordsStored: number;
  };
  // Agentic Framework Upgrades
  qyvenState?: any;
  evidenceTable?: any[];
  conflicts?: any[];
  confidenceScore?: number;
  replansCount?: number;
}
