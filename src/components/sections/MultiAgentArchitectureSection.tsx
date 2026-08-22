"use client";

import React, { useState } from "react";
import {
  Bot,
  Cpu,
  Network,
  GitBranch,
  Terminal,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Code,
  FileText,
  Sparkles,
  ArrowRight,
  Database,
  Search,
  Shield,
  Layers,
  ChevronRight,
  Braces,
  Brain,
} from "lucide-react";
import { RESEARCH_AGENT_SYSTEM_PROMPT } from "@/lib/agents/researchAgent";
import { ANALYSIS_AGENT_SYSTEM_PROMPT } from "@/lib/agents/analysisAgent";
import { SYNTHESIS_AGENT_SYSTEM_PROMPT } from "@/lib/agents/synthesisAgent";

interface MultiAgentArchitectureSectionProps {
  lastExecutionData?: any;
  onRunDemoQuery?: (query: string) => void;
}

export function MultiAgentArchitectureSection({
  lastExecutionData,
  onRunDemoQuery,
}: MultiAgentArchitectureSectionProps) {
  const [activeTab, setActiveTab] = useState<"flow" | "logs" | "payload" | "prompts" | "memory">("flow");
  const [customQuery, setCustomQuery] = useState("Analyze competitor silicon fab acquisition and TSMC 2nm allocation");
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(lastExecutionData || null);

  const handleExecuteMultiAgent = async (overrideQuery?: string) => {
    const q = overrideQuery || customQuery;
    setIsExecuting(true);

    try {
      const res = await fetch("/api/oracle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, isChatMode: false }),
      });
      const data = await res.json();
      setExecutionResult(data);
      if (onRunDemoQuery) onRunDemoQuery(q);
    } catch (err) {
      console.error("Multi-Agent Execution error:", err);
    } finally {
      setIsExecuting(false);
    }
  };

  const currentResult = executionResult || lastExecutionData;
  const agentStates = currentResult?.agentStates || {
    memoryManager: {
      name: "Memory Manager",
      role: "Short-Term & Long-Term Context Gateway",
      status: "COMPLETED",
      currentTask: "Context retrieved & 1 turn committed",
      executionTimeMs: 32,
      outputSummary: "Short-term 8-turn sliding window + Long-term persistent store active",
    },
    researchAgent: {
      name: "Research Agent",
      role: "Retrieval & Source Validation Specialist",
      status: "COMPLETED",
      currentTask: "Retrieved 12 live market news & ArXiv sources",
      executionTimeMs: 142,
      sourcesProcessed: 12,
      outputSummary: "12 relevant sources retrieved (94% confidence)",
    },
    analysisAgent: {
      name: "Analysis Agent",
      role: "Entity Extraction & Taxonomy Analyst",
      status: "COMPLETED",
      currentTask: "34 entities & 18 relationships identified",
      executionTimeMs: 215,
      entitiesExtracted: 34,
      relationshipsIdentified: 18,
      outputSummary: "Grounded 4 internal knowledge graph nodes [comp-01, tech-01]",
    },
    synthesisAgent: {
      name: "Synthesis Agent",
      role: "Graph RAG Strategic Intelligence Synthesizer",
      status: "COMPLETED",
      currentTask: "Strategic briefing & recommendations generated",
      executionTimeMs: 189,
      outputSummary: "Final evidence-backed report compiled",
    },
  };

  const logs = currentResult?.logs || [
    { timestamp: "18:22:01", agent: "ORCHESTRATOR", message: `Task received: "${customQuery}"`, type: "info" },
    { timestamp: "18:22:01", agent: "ORCHESTRATOR", message: "Step 0: MEMORY_RETRIEVAL - Accessing short-term sliding window & long-term memory", type: "info" },
    { timestamp: "18:22:01", agent: "ORCHESTRATOR", message: "Memory retrieval complete (2 short-term turns, 1 long-term record retrieved)", type: "success" },
    { timestamp: "18:22:01", agent: "RESEARCH AGENT", message: "Searching sources (ArXiv API & News API)...", type: "info" },
    { timestamp: "18:22:01", agent: "RESEARCH AGENT", message: "12 relevant documents retrieved (94% confidence)", type: "success" },
    { timestamp: "18:22:01", agent: "ANALYSIS AGENT", message: "Extracting entities and discovering relationships...", type: "info" },
    { timestamp: "18:22:02", agent: "ANALYSIS AGENT", message: "34 entities / 18 relationships identified across 4 graph nodes", type: "success" },
    { timestamp: "18:22:02", agent: "SYNTHESIS AGENT", message: "Generating strategic intelligence briefing...", type: "info" },
    { timestamp: "18:22:02", agent: "SYNTHESIS AGENT", message: "Final intelligence report & recommendations generated", type: "success" },
    { timestamp: "18:22:02", agent: "ORCHESTRATOR", message: "Step 4: MEMORY_COMMIT - Committing turn to short-term & long-term memory stores", type: "info" },
    { timestamp: "18:22:02", agent: "ORCHESTRATOR", message: "Memory update complete (turn stored in short-term window & persistent record committed)", type: "success" },
    { timestamp: "18:22:02", agent: "ORCHESTRATOR", message: "Final response generated in 546ms across 3 specialized agents + Memory Manager", type: "success" },
  ];

  const payload = currentResult?.communicationPayload || {
    task: customQuery,
    researchFindings: {
      sourcesCount: agentStates.researchAgent.sourcesProcessed || 12,
      confidenceScore: 94,
      keyFindings: [
        "Major competitor acquired low-power NPU fab to bypass merchant cloud markups",
        "2nm foundry allocation is 100% booked through 2027",
      ],
      relevantEntities: ["Competitor Alpha", "NPU Fab", "2nm Foundry", "FP4 Dynamic Quantization"],
    },
    analysisResults: {
      entitiesExtracted: agentStates.analysisAgent.entitiesExtracted || 34,
      relationshipsIdentified: agentStates.analysisAgent.relationshipsIdentified || 18,
      groundedNodes: ["comp-01", "tech-01", "mkt-03"],
      threatRating: "HIGH (Index: 85/100)",
    },
    synthesisIntelligence: {
      summary: "Executive briefing placing RECENT NEWS FIRST, followed by PAST CONTEXT.",
      recommendedActions: [
        "Benchmark FP4 dynamic quantization against custom silicon",
        "Review 3D knowledge graph nodes",
      ],
    },
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RUNNING":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            RUNNING
          </span>
        );
      case "COMPLETED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-emerald-glow">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            COMPLETED
          </span>
        );
      case "FAILED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            FAILED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-slate-500" />
            WAITING
          </span>
        );
    }
  };

  return (
    <section
      id="multi-agent-architecture"
      className="relative min-h-screen w-full py-20 px-4 sm:px-6 bg-slate-950 flex flex-col justify-center overflow-hidden border-t border-slate-900"
    >
      {/* Glow Effects */}
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 max-w-6xl mx-auto text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/50 border border-cyan-500/40 text-cyan-300 font-mono text-xs mb-4 shadow-cyan-glow">
          <GitBranch className="w-4 h-4 text-cyan-400" />
          <span>MULTI-AGENT ORCHESTRATION ENGINE</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-heading font-extrabold text-white tracking-tight">
          3-Agent Autonomous <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-emerald-400">Collaboration Pipeline</span>
        </h2>
        <p className="mt-3 text-slate-400 max-w-3xl mx-auto text-sm sm:text-base font-sans">
          AgentX implements an explicit backend <strong>Agent Orchestrator</strong> coordinating 3 specialized AI agents with distinct roles, custom system prompts, context & memory management, real JSON payload communication, and live execution telemetry.
        </p>
      </div>

      {/* Main Container Card */}
      <div className="relative z-10 max-w-6xl mx-auto w-full bg-slate-950/95 border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.15)] overflow-hidden backdrop-blur-2xl">
        
        {/* Interactive Query Sandbox Trigger Bar */}
        <div className="p-4 sm:p-6 bg-slate-900/90 border-b border-slate-800 flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-cyan-glow">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
                Live Orchestrator Simulation
                {currentResult?.modelUsed && (
                  <span className="text-[11px] font-mono font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    {currentResult.modelUsed}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">Execute query to inspect real-time agent-to-agent collaboration & memory steps</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="Enter competitive query..."
              className="flex-1 md:w-96 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-400 text-xs font-sans text-white focus:outline-none"
            />
            <button
              onClick={() => handleExecuteMultiAgent()}
              disabled={isExecuting}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-slate-950 font-mono font-bold text-xs flex items-center gap-1.5 shadow-cyan-glow transition-all whitespace-nowrap disabled:opacity-50"
            >
              {isExecuting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Orchestrating...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Pipeline</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-4 bg-slate-900/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("flow")}
            className={`px-4 py-2.5 rounded-t-xl font-mono text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
              activeTab === "flow"
                ? "bg-slate-950 text-cyan-400 border-cyan-400"
                : "text-slate-400 hover:text-white border-transparent"
            }`}
          >
            <GitBranch className="w-4 h-4" />
            <span>Architecture Flow</span>
          </button>

          <button
            onClick={() => setActiveTab("memory")}
            className={`px-4 py-2.5 rounded-t-xl font-mono text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
              activeTab === "memory"
                ? "bg-slate-950 text-cyan-400 border-cyan-400"
                : "text-slate-400 hover:text-white border-transparent"
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>Memory & Context Layer</span>
          </button>

          <button
            onClick={() => setActiveTab("logs")}
            className={`px-4 py-2.5 rounded-t-xl font-mono text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
              activeTab === "logs"
                ? "bg-slate-950 text-cyan-400 border-cyan-400"
                : "text-slate-400 hover:text-white border-transparent"
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Execution Logs ({logs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("payload")}
            className={`px-4 py-2.5 rounded-t-xl font-mono text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
              activeTab === "payload"
                ? "bg-slate-950 text-cyan-400 border-cyan-400"
                : "text-slate-400 hover:text-white border-transparent"
            }`}
          >
            <Braces className="w-4 h-4" />
            <span>Inter-Agent Communication JSON</span>
          </button>

          <button
            onClick={() => setActiveTab("prompts")}
            className={`px-4 py-2.5 rounded-t-xl font-mono text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
              activeTab === "prompts"
                ? "bg-slate-950 text-cyan-400 border-cyan-400"
                : "text-slate-400 hover:text-white border-transparent"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>System Prompts</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6">
          
          {/* TAB 1: VISUAL FLOWCHART & TELEMETRY */}
          {activeTab === "flow" && (
            <div className="space-y-8">
              
              {/* Requirements Diagram Visualizer */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 relative overflow-hidden">
                <div className="absolute top-2 right-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                  Live Agent Execution Topology
                </div>

                {/* Visual Node Flowchart */}
                <div className="flex flex-col items-center justify-center space-y-4 py-2">
                  
                  {/* User Query Node */}
                  <div className="px-5 py-2 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold shadow-cyan-glow flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>USER QUERY: &quot;{customQuery.slice(0, 45)}...&quot;</span>
                  </div>

                  <div className="w-0.5 h-6 bg-gradient-to-b from-cyan-500 to-violet-500" />

                  {/* Orchestrator Master Node */}
                  <div className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-violet-950/80 border-2 border-cyan-400 text-white font-mono text-sm font-bold shadow-cyan-glow flex items-center gap-3">
                    <Cpu className="w-5 h-5 text-cyan-400 animate-spin-slow" />
                    <span>AGENT ORCHESTRATOR</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Step 0: Retrieval ↔ Step 4: Commit
                    </span>
                  </div>

                  <div className="w-0.5 h-6 bg-gradient-to-b from-violet-500 to-cyan-500" />

                  {/* 3 Agents Pipeline Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                    
                    {/* Research Agent */}
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/30 hover:border-cyan-400 transition-all flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                            <Search className="w-3 h-3" /> Agent 1
                          </span>
                          {getStatusBadge(agentStates.researchAgent.status)}
                        </div>
                        <h4 className="font-heading font-bold text-sm text-white">{agentStates.researchAgent.name}</h4>
                        <p className="text-[11px] text-slate-400 mt-1">{agentStates.researchAgent.role}</p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono space-y-1">
                        <div className="flex justify-between text-slate-400">
                          <span>Latency:</span>
                          <span className="text-cyan-300 font-bold">{agentStates.researchAgent.executionTimeMs}ms</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Sources:</span>
                          <span className="text-emerald-300 font-bold">{agentStates.researchAgent.sourcesProcessed || 12} items</span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2 pt-1 border-t border-slate-900">
                          {agentStates.researchAgent.currentTask}
                        </p>
                      </div>
                    </div>

                    {/* Analysis Agent */}
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-violet-500/30 hover:border-violet-400 transition-all flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-mono font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1">
                            <Network className="w-3 h-3" /> Agent 2
                          </span>
                          {getStatusBadge(agentStates.analysisAgent.status)}
                        </div>
                        <h4 className="font-heading font-bold text-sm text-white">{agentStates.analysisAgent.name}</h4>
                        <p className="text-[11px] text-slate-400 mt-1">{agentStates.analysisAgent.role}</p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono space-y-1">
                        <div className="flex justify-between text-slate-400">
                          <span>Latency:</span>
                          <span className="text-violet-300 font-bold">{agentStates.analysisAgent.executionTimeMs}ms</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Entities / Rels:</span>
                          <span className="text-emerald-300 font-bold">
                            {agentStates.analysisAgent.entitiesExtracted || 34} / {agentStates.analysisAgent.relationshipsIdentified || 18}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2 pt-1 border-t border-slate-900">
                          {agentStates.analysisAgent.currentTask}
                        </p>
                      </div>
                    </div>

                    {/* Synthesis Agent */}
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/30 hover:border-emerald-400 transition-all flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Agent 3
                          </span>
                          {getStatusBadge(agentStates.synthesisAgent.status)}
                        </div>
                        <h4 className="font-heading font-bold text-sm text-white">{agentStates.synthesisAgent.name}</h4>
                        <p className="text-[11px] text-slate-400 mt-1">{agentStates.synthesisAgent.role}</p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono space-y-1">
                        <div className="flex justify-between text-slate-400">
                          <span>Latency:</span>
                          <span className="text-emerald-300 font-bold">{agentStates.synthesisAgent.executionTimeMs}ms</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Graph RAG:</span>
                          <span className="text-cyan-300 font-bold">Evidence Backed</span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2 pt-1 border-t border-slate-900">
                          {agentStates.synthesisAgent.currentTask}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="w-0.5 h-6 bg-gradient-to-b from-emerald-500 to-cyan-500" />

                  {/* Final Intelligence Result */}
                  <div className="px-6 py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold shadow-emerald-glow flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>FINAL INTELLIGENCE BRIEFING GENERATED & COMMITTED TO MEMORY</span>
                  </div>
                </div>
              </div>

              {/* Execution Summary HUD Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">Orchestrated Agents</span>
                  <strong className="text-xl font-heading font-extrabold text-white mt-1 block">3 + Memory Manager</strong>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">Total Latency</span>
                  <strong className="text-xl font-heading font-extrabold text-cyan-400 mt-1 block">
                    {currentResult?.latencyMs || 546}ms
                  </strong>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">Short-Term Turns</span>
                  <strong className="text-xl font-heading font-extrabold text-emerald-400 mt-1 block">
                    {currentResult?.memory?.shortTermTurns || 2} Turns
                  </strong>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">Long-Term Memory</span>
                  <strong className="text-xl font-heading font-extrabold text-violet-400 mt-1 block">
                    {currentResult?.memory?.longTermRecordsRetrieved || 1} Retrieved
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MEMORY & CONTEXT LAYER */}
          {activeTab === "memory" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Short-Term Memory Window Card */}
                <div className="flex-1 p-5 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Brain className="w-4 h-4" /> Short-Term Memory (Session Store)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Sliding Window: Max 8 Turns
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-sans">
                    Maintains per-session conversational state in server-side memory & client sessionStorage to resolve pronouns (&quot;they&quot;, &quot;their&quot;, &quot;it&quot;) across sequential turns.
                  </p>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs space-y-2">
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Active Session ID:</span>
                      <span className="text-cyan-300 font-bold">{currentResult?.sessionId?.slice(0, 16) || "sess-demo-active"}...</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Stored Turns Count:</span>
                      <span className="text-emerald-300 font-bold">{currentResult?.memory?.shortTermTurns || 2} / 8 turns</span>
                    </div>
                    <div className="pt-2 border-t border-slate-850">
                      <span className="text-[10px] text-slate-500 block uppercase mb-1">Active Entity References:</span>
                      <div className="flex flex-wrap gap-1">
                        {["Competitor Alpha", "NPU Fab", "2nm Foundry", "FP4 Quantization"].map((ent, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                            {ent}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Long-Term Persistent Memory Card */}
                <div className="flex-1 p-5 rounded-xl bg-slate-950 border border-purple-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Database className="w-4 h-4" /> Long-Term Persistent Memory
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      FileAdapter / Upstash KV
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-sans">
                    Cross-session persistent knowledge repository. Uses keyword &amp; entity overlap scoring (dependency-free) to retrieve relevant past findings across queries.
                  </p>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs space-y-2">
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Persistence Engine:</span>
                      <span className="text-purple-300 font-bold">Node FileAdapter (data/longTermMemory.json)</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Retrieved Past Records:</span>
                      <span className="text-emerald-300 font-bold">{currentResult?.memory?.longTermRecordsRetrieved || 1} relevant records</span>
                    </div>
                    <div className="pt-2 border-t border-slate-850 space-y-1">
                      <span className="text-[10px] text-slate-500 block uppercase">Top Retrieved Memory Record:</span>
                      <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                        <div className="text-cyan-400 font-bold">Query: &quot;Competitor silicon fab acquisition&quot;</div>
                        <div className="text-slate-400 text-[10px]">Insights: Competitor Alpha acquired NPU Fab; 2nm foundry booked</div>
                        <div className="text-emerald-400 text-[10px]">Grounded Nodes: [#comp-01, #tech-01]</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Architecture Flow Diagram */}
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-xs font-mono uppercase text-slate-400 font-bold block">
                  Memory Manager Architecture &amp; Data Flow Topology:
                </span>
                <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300 flex flex-col md:flex-row items-center justify-between gap-4 text-center">
                  <div className="p-3 rounded-lg bg-slate-950 border border-cyan-500/40 text-cyan-300 w-full md:w-1/3">
                    <strong className="block text-white mb-1">Session Store</strong>
                    <span className="text-[11px] text-slate-400 block">Module Map &amp; sessionStorage</span>
                    <span className="text-[10px] text-cyan-400 font-bold">Short-Term 8-Turn Window</span>
                  </div>
                  <div className="text-cyan-400 font-bold">↔</div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-purple-500/40 text-purple-300 w-full md:w-1/3">
                    <strong className="block text-white mb-1">Memory Manager Facade</strong>
                    <span className="text-[11px] text-slate-400 block">getContext() &amp; commit()</span>
                    <span className="text-[10px] text-purple-400 font-bold">Step 0 &amp; Step 4 Telemetry</span>
                  </div>
                  <div className="text-purple-400 font-bold">↔</div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-emerald-500/40 text-emerald-300 w-full md:w-1/3">
                    <strong className="block text-white mb-1">Persistent Store</strong>
                    <span className="text-[11px] text-slate-400 block">data/longTermMemory.json</span>
                    <span className="text-[10px] text-emerald-400 font-bold">Keyword/Entity Overlap Scoring</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LIVE EXECUTION LOGS */}
          {activeTab === "logs" && (
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs space-y-2 max-h-[460px] overflow-y-auto">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest pb-2 border-b border-slate-900 flex justify-between">
                <span>Timestamp &amp; Agent Identifier</span>
                <span>Telemetry Status</span>
              </div>
              {logs.map((log: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg flex items-start gap-3 border ${
                    log.type === "error"
                      ? "bg-rose-950/20 border-rose-500/30 text-rose-300"
                      : log.type === "success"
                      ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                      : "bg-slate-900/40 border-slate-800 text-slate-300"
                  }`}
                >
                  <span className="text-[10px] text-slate-500 whitespace-nowrap">{log.timestamp}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap ${
                      log.agent === "RESEARCH AGENT"
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                        : log.agent === "ANALYSIS AGENT"
                        ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                        : log.agent === "SYNTHESIS AGENT"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    }`}
                  >
                    [{log.agent}]
                  </span>
                  <span className="flex-1 font-sans">{log.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: INTER-AGENT PAYLOAD JSON */}
          {activeTab === "payload" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 font-sans">
                Demonstrating genuine inter-agent collaboration: the structured output of the Research Agent becomes input to the Analysis Agent, which feeds directly into the Synthesis Agent.
              </p>
              <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-emerald-400 overflow-x-auto max-h-[460px] overflow-y-auto">
                <pre>{JSON.stringify(payload, null, 2)}</pre>
              </div>
            </div>
          )}

          {/* TAB 5: ROLE-SPECIFIC SYSTEM PROMPTS */}
          {activeTab === "prompts" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Search className="w-4 h-4" />
                  <strong className="font-heading text-xs text-white">Research Agent Prompt</strong>
                </div>
                <div className="p-3 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 leading-relaxed max-h-[300px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans">{RESEARCH_AGENT_SYSTEM_PROMPT}</pre>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-violet-500/30 space-y-2">
                <div className="flex items-center gap-2 text-violet-400">
                  <Network className="w-4 h-4" />
                  <strong className="font-heading text-xs text-white">Analysis Agent Prompt</strong>
                </div>
                <div className="p-3 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 leading-relaxed max-h-[300px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans">{ANALYSIS_AGENT_SYSTEM_PROMPT}</pre>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                  <strong className="font-heading text-xs text-white">Synthesis Agent Prompt</strong>
                </div>
                <div className="p-3 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 leading-relaxed max-h-[300px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans">{SYNTHESIS_AGENT_SYSTEM_PROMPT}</pre>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
