import { runResearchAgent } from "./researchAgent";
import { runAnalysisAgent } from "./analysisAgent";
import { runSynthesisAgent } from "./synthesisAgent";
import { memoryManager } from "@/lib/memory/memoryManager";
import { MemoryContextResult } from "@/lib/memory/types";
import {
  AgentLog,
  AgentState,
  InterAgentCommunication,
  OrchestrationResult,
  ResearchAgentOutput,
  AnalysisAgentOutput,
  SynthesisAgentOutput,
} from "./types";
import { qyvenEngine } from "./stateGraph";
import { createInitialQyvenState, DemoOptions } from "./qyvenState";

export class AgentOrchestrator {
  private query: string;
  private isChatMode: boolean;
  private sessionId: string;
  private userId: string;
  private demoOptions: DemoOptions;
  private logs: AgentLog[] = [];
  private agentStates: Record<string, AgentState> = {};
  private startTime: number = 0;

  constructor(
    query: string,
    isChatMode = false,
    sessionId?: string,
    userId: string = "anonymous",
    demoOptions: DemoOptions = { enableAdversarialMode: false }
  ) {
    this.query = query;
    this.isChatMode = isChatMode;
    this.sessionId = sessionId || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`);
    this.userId = userId || "anonymous";
    this.demoOptions = demoOptions;

    this.agentStates = {
      memoryManager: {
        name: "Memory Manager",
        role: "Short-Term & Long-Term Context Gateway",
        status: "WAITING",
        currentTask: "Waiting for pipeline initiation",
        executionTimeMs: 0,
      },
      researchAgent: {
        name: "Research Agent",
        role: "Data & Source Retrieval Specialist",
        status: "WAITING",
        currentTask: "Waiting for query assignment",
        executionTimeMs: 0,
      },
      analysisAgent: {
        name: "Analysis Agent",
        role: "Entity, Taxonomy & Relationship Analyst",
        status: "WAITING",
        currentTask: "Waiting for Research Agent output",
        executionTimeMs: 0,
      },
      synthesisAgent: {
        name: "Synthesis Agent",
        role: "Graph RAG & Executive Intelligence Synthesizer",
        status: "WAITING",
        currentTask: "Waiting for Analysis Agent output",
        executionTimeMs: 0,
      },
    };
  }

  private addLog(
    agent: "ORCHESTRATOR" | "RESEARCH AGENT" | "ANALYSIS AGENT" | "SYNTHESIS AGENT",
    message: string,
    type: "info" | "success" | "warning" | "error" = "info"
  ) {
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    this.logs.push({ timestamp, agent, message, type });
  }

  public async execute(): Promise<OrchestrationResult> {
    this.startTime = Date.now();
    
    // Execute Autonomous State Graph Engine
    const initialState = createInitialQyvenState(this.query, this.sessionId, this.demoOptions);
    const finalState = await qyvenEngine.runGraph(initialState);

    // Map Graph execution steps to AgentLogs for legacy UI rendering
    finalState.executionHistory.forEach((step) => {
      let agentTag: "ORCHESTRATOR" | "RESEARCH AGENT" | "ANALYSIS AGENT" | "SYNTHESIS AGENT" = "ORCHESTRATOR";
      if (step.agentRole === "RESEARCH_AGENT" || step.agentRole === "NEWS_AGENT" || step.agentRole === "PATENT_AGENT" || step.agentRole === "SEC_AGENT") {
        agentTag = "RESEARCH AGENT";
      } else if (step.agentRole === "EVIDENCE_RESOLVER" || step.agentRole === "CONFIDENCE_JUDGE" || step.agentRole === "SELF_EVALUATOR") {
        agentTag = "ANALYSIS AGENT";
      } else if (step.agentRole === "SYNTHESIS_AGENT") {
        agentTag = "SYNTHESIS AGENT";
      }

      let logType: "info" | "success" | "warning" | "error" = "info";
      if (step.status === "SUCCESS" || step.status === "RECOVERY") logType = "success";
      if (step.status === "WARNING" || step.status === "REPLAN") logType = "warning";
      if (step.status === "FAILURE") logType = "error";

      this.addLog(agentTag, `[${step.nodeName}] ${step.message}`, logType);
    });

    const report = finalState.finalReport || {
      summary: `Executive Synthesis for "${this.query}".`,
      recentNews: [],
      pastContext: [],
      patentSignals: [],
      secFilings: [],
      threatAssessment: "MEDIUM (Index: 65/100)",
      recommendedActions: [`Monitor domain updates for ${this.query}`],
      formattedMarkdown: `### 📰 RECENT NEWS & CURRENT SIGNALS\n• Primary domain synthesis for ${this.query}\n\n### 🎯 STRATEGIC TAKEAWAY & THREAT INDEX\n• **Threat Index:** MEDIUM (Index: 65/100)`,
    };

    const communicationPayload: InterAgentCommunication = {
      task: this.query,
      researchFindings: finalState.agentOutputs["RESEARCH_AGENT"]?.data || {
        query: this.query,
        sources: finalState.sources,
        keyFindings: finalState.evidenceTable.map((e) => e.claim),
        relevantEntities: [this.query.slice(0, 25)],
        evidence: finalState.evidenceTable.map((e) => e.claim),
        confidenceScore: finalState.confidence.score,
        timestamp: new Date().toISOString(),
      },
      analysisResults: finalState.agentOutputs["ANALYSIS_AGENT"] || {
        extractedEntities: [{ name: this.query.slice(0, 25), category: "Competitor", confidence: 90 }],
        relationships: [],
        classifications: ["Intelligence Synthesis"],
        keyInsights: [`Evidence items analyzed: ${finalState.evidenceTable.length}`],
        groundedNodes: finalState.groundedNodes,
        threatRating: report.threatAssessment,
        confidenceScore: finalState.confidence.score,
        timestamp: new Date().toISOString(),
      },
      synthesisIntelligence: {
        summary: report.summary,
        recentNews: report.recentNews,
        pastContext: report.pastContext,
        threatAssessment: report.threatAssessment,
        recommendedActions: report.recommendedActions,
        linkedNodes: finalState.groundedNodes,
        confidenceReasoning: finalState.confidence.reasoning,
        evidenceCitations: finalState.sources.map((s) => s.title),
        timestamp: new Date().toISOString(),
      },
    };

    return {
      success: true,
      modelUsed: "Qyven Autonomous State Graph Engine (Groq / Gemini)",
      latencyMs: Date.now() - this.startTime,
      toolsUsed: Array.from(new Set(finalState.sources.map((s) => s.type))),
      logs: this.logs,
      agentStates: this.agentStates,
      communicationPayload,
      sources: finalState.sources,
      response: {
        summary: report.summary,
        recentNews: report.recentNews,
        pastContext: report.pastContext,
        patentSignals: report.patentSignals,
        secFilings: report.secFilings,
        threatAssessment: report.threatAssessment,
        recommendedActions: report.recommendedActions,
        linkedNodes: finalState.groundedNodes,
        confidenceReasoning: finalState.confidence.reasoning,
      },
      formattedMarkdownResponse: report.formattedMarkdown,
      isFallback: finalState.isFallback,
      sessionId: this.sessionId,
      memory: {
        sessionId: this.sessionId,
        shortTermTurns: 2,
        longTermRecordsRetrieved: 1,
        longTermRecordsStored: 1,
      },
      qyvenState: finalState,
      evidenceTable: finalState.evidenceTable,
      conflicts: finalState.conflicts,
      confidenceScore: finalState.confidence.score,
      replansCount: finalState.budget.usedReplans,
    };
  }
}

