"use client";

import React, { useState, useEffect } from "react";
import { SAMPLE_QUERIES } from "@/data/sampleQueries";
import { SampleQuery } from "@/types";
import { Terminal, Play, Sparkles, CheckCircle2, ArrowRight, ShieldAlert, RefreshCw, BookOpen, Newspaper, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import confetti from "canvas-confetti";

interface OracleTerminalSectionProps {
  initialQuery?: string;
}

export function OracleTerminalSection({ initialQuery }: OracleTerminalSectionProps) {
  const [selectedScenario, setSelectedScenario] = useState<SampleQuery | null>(null);
  const [customInput, setCustomInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number>(0);
  const [showResult, setShowResult] = useState(false);
  const [liveResponse, setLiveResponse] = useState<any>(null);
  const [activeModel, setActiveModel] = useState<string>("Google gemini-2.5-flash");
  const [isLiveApi, setIsLiveApi] = useState<boolean | null>(null);
  const [toolsUsed, setToolsUsed] = useState<string[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [showSources, setShowSources] = useState<boolean>(true);

  useEffect(() => {
    if (initialQuery) {
      setCustomInput(initialQuery);
      const match = SAMPLE_QUERIES.find((q) =>
        q.query.toLowerCase().includes(initialQuery.toLowerCase()) ||
        initialQuery.toLowerCase().includes(q.category.toLowerCase())
      );
      if (match) {
        setSelectedScenario(match);
      }
    }
  }, [initialQuery]);

  const handleRunExecution = async (overrideQuery?: string) => {
    const queryToRun = overrideQuery || customInput.trim() || selectedScenario?.query || "What are the latest breakthroughs in competitor strategy and AI reasoning?";
    setIsRunning(true);
    setCompletedSteps(0);
    setShowResult(false);
    setLiveResponse(null);
    setToolsUsed([]);
    setSources([]);

    // Step-by-step UI animation
    const timer1 = setTimeout(() => setCompletedSteps(1), 250);
    const timer2 = setTimeout(() => setCompletedSteps(2), 500);
    const timer3 = setTimeout(() => setCompletedSteps(3), 850);

    try {
      // Call Live Multi-Agent API Route
      const res = await fetch("/api/oracle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryToRun, isChatMode: false }),
      });

      const data = await res.json();

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setCompletedSteps(4);

      if (data.success && data.response) {
        setLiveResponse(data.response);
        setIsLiveApi(!data.isFallback);
        if (data.modelUsed) setActiveModel(data.modelUsed);
        if (data.toolsUsed) setToolsUsed(data.toolsUsed);
        if (data.sources) setSources(data.sources);
      } else {
        setIsLiveApi(false);
        setLiveResponse(selectedScenario?.finalResponse || SAMPLE_QUERIES[0].finalResponse);
      }

      setShowResult(true);
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ["#00f0ff", "#a855f7", "#10b981"],
        });
      } catch (e) {
        // ignore
      }
    } catch (err) {
      console.warn("API fallback triggered:", err);
      setIsLiveApi(false);
      setLiveResponse(selectedScenario?.finalResponse || SAMPLE_QUERIES[0].finalResponse);
      setShowResult(true);
    } finally {
      setIsRunning(false);
    }
  };

  const currentOutput = liveResponse || selectedScenario?.finalResponse || SAMPLE_QUERIES[0].finalResponse;

  const renderToolBadge = () => {
    const hasArxiv = toolsUsed.includes("arxiv");
    const hasNews = toolsUsed.includes("news");

    if (hasArxiv && hasNews) {
      return (
        <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold flex items-center gap-1.5 shadow-purple-glow">
          <span>🔬📰</span>
          <span>Both (ArXiv + News)</span>
        </span>
      );
    }
    if (hasArxiv) {
      return (
        <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold flex items-center gap-1.5 shadow-cyan-glow">
          <span>🔬</span>
          <span>ArXiv Research</span>
        </span>
      );
    }
    if (hasNews) {
      return (
        <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1.5">
          <span>📰</span>
          <span>Market News</span>
        </span>
      );
    }
    return (
      <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1.5">
        <span>🧠</span>
        <span>Direct LLM</span>
      </span>
    );
  };

  return (
    <section
      id="oracle-simulator"
      className="relative min-h-screen w-full py-20 px-4 sm:px-6 bg-slate-950 flex flex-col justify-center overflow-hidden border-t border-slate-900"
    >
      {/* Background cyber glow */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 max-w-5xl mx-auto text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 font-mono text-xs mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>PHASE 4 CONVERSATIONAL ENGINE</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-heading font-extrabold text-white tracking-tight">
          Ask The Oracle: <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-emerald-400">Live API Tool-Use RAG</span>
        </h2>
        <p className="mt-3 text-slate-400 max-w-2xl mx-auto text-sm sm:text-base font-sans">
          Powered by live Google Gemini & Groq inference with dynamic ArXiv paper & market news function calling. Type any question below or click a preset scenario!
        </p>
      </div>

      {/* Terminal Container */}
      <div className="relative z-10 max-w-5xl mx-auto w-full rounded-2xl bg-slate-950/95 border border-cyan-500/30 shadow-[0_0_50px_rgba(0,240,255,0.15)] overflow-hidden backdrop-blur-2xl">
        
        {/* Terminal Titlebar */}
        <div className="px-6 py-3.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-xs font-mono text-slate-300 font-semibold flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              agentx-oracle@agentx:~# ask.py --tools arxiv,news
            </span>
          </div>

          {/* Runtime Mode Status Badge */}
          <div className="flex items-center gap-2">
            {isLiveApi === true ? (
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1.5 shadow-emerald-glow">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Gemini / Groq API</span>
              </span>
            ) : isLiveApi === false ? (
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>Demo Mode — Simulated Responses</span>
              </span>
            ) : (
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {activeModel}
              </span>
            )}
          </div>
        </div>

        {/* Terminal Body */}
        <div className="p-6 space-y-6">
          
          {/* Preset Intelligence Scenarios */}
          <div>
            <span className="text-[11px] font-mono uppercase text-slate-400 font-bold block mb-2">
              Preset Intelligence Scenarios (Click to Load):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {SAMPLE_QUERIES.map((sq) => {
                const isSelected = selectedScenario?.id === sq.id;
                return (
                  <button
                    key={sq.id}
                    onClick={() => {
                      setSelectedScenario(sq);
                      setCustomInput(sq.query);
                      setShowResult(false);
                      setCompletedSteps(0);
                    }}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      isSelected
                        ? "bg-cyan-950/30 border-cyan-400 text-white shadow-cyan-glow"
                        : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">
                        {sq.category}
                      </span>
                      <span className="text-[9px] font-mono text-rose-400 font-bold">
                        {sq.badge}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-200 line-clamp-2 mt-1">
                      {sq.query}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Input Bar */}
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRunExecution();
                }}
                placeholder="Ask Oracle any research paper, competitor news, or strategy question..."
                className="w-full pl-4 pr-10 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-sm font-mono text-cyan-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors shadow-inner"
              />
            </div>
            <button
              onClick={() => handleRunExecution()}
              disabled={isRunning}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono font-bold text-xs flex items-center gap-2 shadow-cyan-glow transition-all active:scale-95 disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Evaluating Tools...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Execute Agent</span>
                </>
              )}
            </button>
          </div>

          {/* Step-by-Step Traversal Visualization Trace */}
          {(isRunning || completedSteps > 0) && (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <span className="text-xs font-mono uppercase text-slate-400 font-bold block">
                Multi-Agent Pipeline Execution Trace:
              </span>
              <div className="space-y-2">
                {[
                  { step: "[ORCHESTRATOR] Context & Pipeline Initialization", detail: "Orchestrator receives user query, initializes task state & context", latency: 85 },
                  { step: "[RESEARCH AGENT] Source Retrieval & Evidence Filtering", detail: toolsUsed.length > 0 ? `Invoked live APIs in parallel: [${toolsUsed.join(", ")}]` : "Executing ArXiv paper & live news retrieval pipeline", latency: 240 },
                  { step: "[ANALYSIS AGENT] Entity, Relationship & Graph Extraction", detail: "Discovered multi-hop entity relations & grounded against 3D knowledge graph nodes", latency: 215 },
                  { step: "[SYNTHESIS AGENT] Graph RAG Intelligence Generation", detail: "Synthesizing executive briefing with RECENT NEWS FIRST, followed by PAST CONTEXT", latency: 190 },
                ].map((s, idx) => {
                  const isDone = completedSteps > idx;
                  const isCurrent = completedSteps === idx && isRunning;

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border text-xs font-mono flex items-center justify-between transition-all duration-300 ${
                        isDone
                          ? "bg-cyan-950/20 border-cyan-500/40 text-cyan-300"
                          : isCurrent
                          ? "bg-slate-800 border-amber-500/60 text-amber-300 animate-pulse"
                          : "bg-slate-950/40 border-slate-800/60 text-slate-500"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                        ) : isCurrent ? (
                          <RefreshCw className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                        )}
                        <div>
                          <strong className="text-white block">{s.step}</strong>
                          <span className="text-[11px] text-slate-400">{s.detail}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {isDone ? `✓ ${s.latency}ms` : `+${s.latency}ms`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Synthesized Output Result Brief */}
          {showResult && (
            <div className="p-6 rounded-xl bg-slate-900/90 border border-cyan-400/50 shadow-cyan-glow space-y-5 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-sm font-mono uppercase font-bold text-white tracking-wider">
                    Executive Intelligence Dossier
                  </h4>
                </div>
                
                {/* Tool-Use Badge */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Routing Path:</span>
                  {renderToolBadge()}
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold block">Executive Brief</span>
                <p className="text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                  {currentOutput.summary}
                </p>
              </div>

              {/* Retrieved Sources Section */}
              {sources.length > 0 && (
                <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 space-y-3">
                  <button
                    onClick={() => setShowSources(!showSources)}
                    className="w-full flex items-center justify-between text-xs font-mono font-bold text-cyan-300 hover:text-cyan-200 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-cyan-400" />
                      <span>Retrieved External Evidence & Literature ({sources.length})</span>
                    </div>
                    {showSources ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showSources && (
                    <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                      {sources.map((src, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 hover:border-cyan-500/30 transition-colors text-xs font-sans space-y-1 group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 font-mono text-[11px]">
                              {src.type === "arxiv" ? (
                                <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold flex items-center gap-1">
                                  <BookOpen className="w-3 h-3" /> ArXiv Paper
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold flex items-center gap-1">
                                  <Newspaper className="w-3 h-3" /> {src.source || "News"}
                                </span>
                              )}
                              {src.published && <span className="text-slate-400">• {src.published}</span>}
                            </div>
                            {src.link && src.link !== "#" && (
                              <a
                                href={src.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] font-mono shrink-0 group-hover:underline"
                              >
                                <span>View</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          <h5 className="font-semibold text-slate-100 text-xs leading-snug">
                            {src.title}
                          </h5>
                          {src.authors && src.authors.length > 0 && (
                            <p className="text-[11px] text-slate-400 font-mono">
                              Authors: {src.authors.join(", ")}
                            </p>
                          )}
                          {src.summary && (
                            <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-2">
                              {src.summary}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Threat Assessment */}
              {currentOutput.threatAssessment && (
                <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 text-rose-200 text-xs font-mono leading-relaxed">
                  <span className="text-[10px] uppercase text-rose-400 font-bold block mb-1 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Threat & Impact Assessment
                  </span>
                  {currentOutput.threatAssessment}
                </div>
              )}

              {/* Recommended Strategic Actions */}
              {currentOutput.recommendedActions && currentOutput.recommendedActions.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                    Recommended Strategic Counter-Actions
                  </span>
                  <ul className="space-y-1.5">
                    {currentOutput.recommendedActions.map((action: string, i: number) => (
                      <li key={i} className="text-xs text-slate-300 font-sans flex items-start gap-2">
                        <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Linked Citation Nodes */}
              {currentOutput.linkedNodes && currentOutput.linkedNodes.length > 0 && (
                <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400">Cited Knowledge Nodes:</span>
                  {currentOutput.linkedNodes.map((nid: string) => (
                    <span
                      key={nid}
                      className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700"
                    >
                      #{nid}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}