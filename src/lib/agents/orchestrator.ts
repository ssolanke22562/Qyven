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

export class AgentOrchestrator {
  private query: string;
  private isChatMode: boolean;
  private sessionId: string;
  private userId: string;
  private logs: AgentLog[] = [];
  private agentStates: Record<string, AgentState> = {};
  private startTime: number = 0;

  constructor(query: string, isChatMode = false, sessionId?: string, userId: string = "anonymous") {
    this.query = query;
    this.isChatMode = isChatMode;
    this.sessionId = sessionId || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`);
    this.userId = userId || "anonymous";

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
    this.addLog("ORCHESTRATOR", `Task received: "${this.query}" (Session ID: ${this.sessionId})`, "info");

    let researchOutput!: ResearchAgentOutput;
    let analysisOutput!: AnalysisAgentOutput;
    let synthesisOutput!: SynthesisAgentOutput;
    let formattedMarkdown: string | undefined;
    let toolsUsed: string[] = [];
    let modelUsed = "Google Gemini 2.5 Flash / Groq LPU";
    let isFallback = false;

    // STEP 0: MEMORY RETRIEVAL
    const tMemoryStart = Date.now();
    this.agentStates.memoryManager.status = "RUNNING";
    this.agentStates.memoryManager.currentTask = "Retrieving short-term turns & long-term memory...";
    this.addLog("ORCHESTRATOR", "Step 0: MEMORY_RETRIEVAL - Accessing short-term sliding window & long-term memory", "info");

    let memoryContext!: MemoryContextResult;
    try {
      memoryContext = await memoryManager.getContext(this.sessionId, this.userId, this.query);
      const tMemoryEnd = Date.now();
      this.agentStates.memoryManager.executionTimeMs = tMemoryEnd - tMemoryStart;
      this.agentStates.memoryManager.inputSummary = `Session: ${this.sessionId}, Query: "${this.query}"`;
      this.agentStates.memoryManager.outputSummary = `${memoryContext.shortTermContext.turns.length} short-term turns, ${memoryContext.relevantPastMemory.length} long-term records retrieved`;
      this.addLog(
        "ORCHESTRATOR",
        `Memory retrieval complete (${memoryContext.shortTermContext.turns.length} short-term turns, ${memoryContext.relevantPastMemory.length} long-term records retrieved)`,
        "success"
      );
    } catch (err: any) {
      console.warn("Memory retrieval error:", err);
      memoryContext = {
        shortTermContext: { sessionId: this.sessionId, turns: [], activeEntities: [], lastUpdated: new Date().toISOString() },
        shortTermPrompt: "",
        relevantPastMemory: [],
      };
    }

    // STEP 1: RESEARCH AGENT
    const tResearchStart = Date.now();
    this.agentStates.researchAgent.status = "RUNNING";
    this.agentStates.researchAgent.currentTask = "Searching live news & ArXiv papers with context injection...";
    this.addLog("RESEARCH AGENT", "Searching sources (ArXiv API & News API)...", "info");

    try {
      const researchRes = await runResearchAgent(this.query, {
        shortTermPrompt: memoryContext.shortTermPrompt,
        relevantPastMemory: memoryContext.relevantPastMemory,
      });
      researchOutput = researchRes.output;
      toolsUsed = researchRes.toolsUsed;
      if (researchRes.modelUsed) modelUsed = researchRes.modelUsed;

      const tResearchEnd = Date.now();
      this.agentStates.researchAgent.status = "COMPLETED";
      this.agentStates.researchAgent.executionTimeMs = tResearchEnd - tResearchStart;
      this.agentStates.researchAgent.sourcesProcessed = researchOutput.sources.length;
      this.agentStates.researchAgent.inputSummary = `User Query: "${this.query}" (+ Context Injected)`;
      this.agentStates.researchAgent.outputSummary = `${researchOutput.sources.length} sources retrieved, ${researchOutput.keyFindings.length} findings, confidence: ${researchOutput.confidenceScore}%`;
      this.agentStates.researchAgent.currentTask = "Research completed successfully";

      this.addLog(
        "RESEARCH AGENT",
        `${researchOutput.sources.length} relevant documents retrieved (${researchOutput.confidenceScore}% confidence)`,
        "success"
      );
    } catch (err: any) {
      console.error("Research Agent failed:", err);
      this.agentStates.researchAgent.status = "FAILED";
      this.agentStates.researchAgent.error = err.message || "Research failed";
      this.addLog("RESEARCH AGENT", `Research error: ${err.message || "Failed to fetch tools"}`, "error");

      // Construct fallback Research output dynamically
      researchOutput = {
        query: this.query,
        sources: [],
        keyFindings: [`Synthesized initial domain analysis for "${this.query}".`],
        relevantEntities: [this.query.slice(0, 30)],
        evidence: [`Query directive: "${this.query}"`],
        confidenceScore: 75,
        timestamp: new Date().toISOString(),
      };
      isFallback = true;
    }

    // STEP 2: ANALYSIS AGENT
    const tAnalysisStart = Date.now();
    this.agentStates.analysisAgent.status = "RUNNING";
    this.agentStates.analysisAgent.currentTask = "Extracting entities, relationships & matching graph nodes...";
    this.addLog("ANALYSIS AGENT", "Extracting entities and discovering relationships...", "info");

    try {
      analysisOutput = await runAnalysisAgent(researchOutput);

      const tAnalysisEnd = Date.now();
      this.agentStates.analysisAgent.status = "COMPLETED";
      this.agentStates.analysisAgent.executionTimeMs = tAnalysisEnd - tAnalysisStart;
      this.agentStates.analysisAgent.entitiesExtracted = analysisOutput.extractedEntities.length;
      this.agentStates.analysisAgent.relationshipsIdentified = analysisOutput.relationships.length;
      this.agentStates.analysisAgent.inputSummary = `Research Output: ${researchOutput.sources.length} sources, ${researchOutput.keyFindings.length} findings`;
      this.agentStates.analysisAgent.outputSummary = `${analysisOutput.extractedEntities.length} entities / ${analysisOutput.relationships.length} relationships identified. Grounded Nodes: [${analysisOutput.groundedNodes.join(", ")}]`;
      this.agentStates.analysisAgent.currentTask = "Entity & graph analysis complete";

      this.addLog(
        "ANALYSIS AGENT",
        `${analysisOutput.extractedEntities.length} entities / ${analysisOutput.relationships.length} relationships identified across ${analysisOutput.groundedNodes.length} graph nodes`,
        "success"
      );
    } catch (err: any) {
      console.error("Analysis Agent failed:", err);
      this.agentStates.analysisAgent.status = "FAILED";
      this.agentStates.analysisAgent.error = err.message || "Analysis failed";
      this.addLog("ANALYSIS AGENT", `Analysis error: ${err.message || "Failed to analyze findings"}`, "error");

      analysisOutput = {
        extractedEntities: [{ name: this.query.slice(0, 30), category: "Competitor", confidence: 85 }],
        relationships: [],
        classifications: ["Domain Intelligence"],
        keyInsights: [`Analysis derived for "${this.query}".`],
        groundedNodes: ["comp-01", "tech-01"],
        threatRating: "MEDIUM (Index: 65/100)",
        confidenceScore: 75,
        timestamp: new Date().toISOString(),
      };
      isFallback = true;
    }

    // STEP 3: SYNTHESIS AGENT
    const tSynthesisStart = Date.now();
    this.agentStates.synthesisAgent.status = "RUNNING";
    this.agentStates.synthesisAgent.currentTask = "Generating evidence-backed Graph RAG intelligence...";
    this.addLog("SYNTHESIS AGENT", "Generating strategic intelligence briefing...", "info");

    try {
      const synthesisRes = await runSynthesisAgent(researchOutput, analysisOutput, this.isChatMode, {
        shortTermPrompt: memoryContext.shortTermPrompt,
        relevantPastMemory: memoryContext.relevantPastMemory,
      });
      synthesisOutput = synthesisRes.output;
      formattedMarkdown = synthesisRes.formattedMarkdown;

      const tSynthesisEnd = Date.now();
      this.agentStates.synthesisAgent.status = "COMPLETED";
      this.agentStates.synthesisAgent.executionTimeMs = tSynthesisEnd - tSynthesisStart;
      this.agentStates.synthesisAgent.inputSummary = `Research + Analysis outputs (${analysisOutput.extractedEntities.length} entities, ${researchOutput.sources.length} sources)`;
      this.agentStates.synthesisAgent.outputSummary = `Strategic briefing synthesized. Threat Rating: ${synthesisOutput.threatAssessment}`;
      this.agentStates.synthesisAgent.currentTask = "Synthesis complete";

      this.addLog("SYNTHESIS AGENT", "Final intelligence report & recommendations generated", "success");
    } catch (err: any) {
      console.error("Synthesis Agent failed:", err);
      this.agentStates.synthesisAgent.status = "FAILED";
      this.agentStates.synthesisAgent.error = err.message || "Synthesis failed";
      this.addLog("SYNTHESIS AGENT", `Synthesis error: ${err.message || "Failed to synthesize"}`, "error");

      synthesisOutput = {
        summary: `Executive Intelligence Briefing for "${this.query}".`,
        recentNews: [`• Primary signal for "${this.query}"`],
        pastContext: [`• Context grounding for "${this.query}"`],
        threatAssessment: "MEDIUM (Index: 65/100)",
        recommendedActions: [`Monitor updates for "${this.query}"`, "Evaluate domain strategy"],
        linkedNodes: ["comp-01", "tech-01"],
        confidenceReasoning: "Fallback synthesis generated dynamically.",
        evidenceCitations: [],
        timestamp: new Date().toISOString(),
      };
      isFallback = true;
    }

    // STEP 4: MEMORY COMMIT
    const tCommitStart = Date.now();
    this.addLog("ORCHESTRATOR", "Step 4: MEMORY_COMMIT - Committing turn to short-term & long-term memory stores", "info");

    try {
      await memoryManager.commit(this.sessionId, this.userId, {
        query: this.query,
        summary: synthesisOutput.summary,
        keyEntities: analysisOutput.extractedEntities.map((e) => e.name),
        threatRating: synthesisOutput.threatAssessment,
        groundedNodes: analysisOutput.groundedNodes,
        keyInsights: analysisOutput.keyInsights,
      });

      this.agentStates.memoryManager.status = "COMPLETED";
      this.agentStates.memoryManager.executionTimeMs += Date.now() - tCommitStart;
      this.agentStates.memoryManager.currentTask = "Context retrieval & turn commit completed";
      this.addLog("ORCHESTRATOR", "Memory update complete (turn stored in short-term window & persistent record committed)", "success");
    } catch (err: any) {
      console.warn("Memory commit error:", err);
    }

    const latencyMs = Date.now() - this.startTime;
    this.addLog("ORCHESTRATOR", `Final response generated in ${latencyMs}ms across 3 specialized agents + Memory Manager`, "success");

    const communicationPayload: InterAgentCommunication = {
      task: this.query,
      researchFindings: researchOutput,
      analysisResults: analysisOutput,
      synthesisIntelligence: synthesisOutput,
    };

    const finalShortTermTurns = memoryContext.shortTermContext.turns.length + 2;

    return {
      success: true,
      modelUsed,
      latencyMs,
      toolsUsed,
      logs: this.logs,
      agentStates: this.agentStates,
      communicationPayload,
      sources: researchOutput.sources,
      response: {
        summary: synthesisOutput.summary,
        recentNews: synthesisOutput.recentNews,
        pastContext: synthesisOutput.pastContext,
        threatAssessment: synthesisOutput.threatAssessment,
        recommendedActions: synthesisOutput.recommendedActions,
        linkedNodes: synthesisOutput.linkedNodes,
        confidenceReasoning: synthesisOutput.confidenceReasoning,
      },
      formattedMarkdownResponse: formattedMarkdown,
      isFallback,
      sessionId: this.sessionId,
      memory: {
        sessionId: this.sessionId,
        shortTermTurns: finalShortTermTurns,
        longTermRecordsRetrieved: memoryContext.relevantPastMemory.length,
        longTermRecordsStored: 1,
      },
    };
  }
}
