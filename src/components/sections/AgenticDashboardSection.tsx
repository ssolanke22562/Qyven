"use client";

import React, { useState } from "react";
import {
  GitBranch,
  Play,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Brain,
  Database,
  Terminal,
  Zap,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Layers,
  Scale,
  Activity,
  FileCheck,
  Lock,
  Radio,
} from "lucide-react";
import { DemoOptions, QyvenState } from "@/lib/agents/qyvenState";

interface AgenticDashboardSectionProps {
  onRunDemoQuery?: (query: string) => void;
}

export function AgenticDashboardSection({ onRunDemoQuery }: AgenticDashboardSectionProps) {
  const [query, setQuery] = useState("Analyze whether NVIDIA is becoming a major competitive threat in AI inference hardware.");
  const [isExecuting, setIsExecuting] = useState(false);
  const [resultState, setResultState] = useState<QyvenState | null>(null);
  const [pastMemoryList, setPastMemoryList] = useState<any[]>([]);

  // Demo Mode Toggles
  const [demoOpts, setDemoOpts] = useState<DemoOptions>({
    enableAdversarialMode: true,
    forceNewsFailure: true,
    forcePatentTimeout: false,
    forceSecUnavailable: false,
    injectConflictingEvidence: true,
  });

  const handleRunAgenticGraph = async (overrideQuery?: string, customOpts?: DemoOptions) => {
    const qToRun = overrideQuery || query;
    const optsToUse = customOpts || demoOpts;
    setIsExecuting(true);
    setResultState(null);

    try {
      const res = await fetch("/api/agentic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: qToRun,
          demoOptions: optsToUse,
        }),
      });

      const data = await res.json();
      if (data.success && data.qyvenState) {
        setResultState(data.qyvenState);
        if (data.memoryHistory) setPastMemoryList(data.memoryHistory);
        if (onRunDemoQuery) onRunDemoQuery(qToRun);
      }
    } catch (err) {
      console.error("Agentic Graph execution error:", err);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleAdversarialPreset = () => {
    const presetOpts: DemoOptions = {
      enableAdversarialMode: true,
      forceNewsFailure: true,
      forcePatentTimeout: false,
      forceSecUnavailable: false,
      injectConflictingEvidence: true,
    };
    setDemoOpts(presetOpts);
    setQuery("Analyze whether NVIDIA is becoming a major competitive threat in AI inference hardware.");
    handleRunAgenticGraph("Analyze whether NVIDIA is becoming a major competitive threat in AI inference hardware.", presetOpts);
  };

  return (
    <section
      id="agentic-dashboard"
      className="relative min-h-screen w-full py-20 px-4 sm:px-6 bg-slate-950 flex flex-col justify-center overflow-hidden border-t border-slate-900"
    >
      {/* Background Cyber Lights */}
      <div className="absolute top-1/4 left-1/3 w-[650px] h-[650px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[650px] h-[650px] bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 max-w-6xl mx-auto text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-mono text-xs mb-3 shadow-cyan-glow">
          <GitBranch className="w-4 h-4 text-cyan-400" />
          <span>AUTONOMOUS AGENTIC FRAMEWORK &amp; ADVERSARIAL DEMO</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-heading font-extrabold text-white tracking-tight">
          Autonomous <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-emerald-400">Agentic Architecture</span>
        </h2>
        <p className="mt-3 text-slate-400 max-w-3xl mx-auto text-sm sm:text-base font-sans">
          Proving true self-healing multi-agent intelligence: <strong>Dynamic planning, parallel execution, tool failure recovery, conflicting evidence resolution, deterministic confidence judging, self-evaluation loops, and replay memory</strong>.
        </p>
      </div>

      {/* Main Sandbox Window Container */}
      <div className="relative z-10 max-w-6xl mx-auto w-full bg-slate-950/95 border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.15)] overflow-hidden backdrop-blur-2xl">
        
        {/* Adversarial Controls Toolbar */}
        <div className="p-4 sm:p-5 bg-slate-900/90 border-b border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <h3 className="font-heading font-bold text-sm text-white">
                Adversarial Demo &amp; Agentic Control Panel
              </h3>
            </div>

            {/* Presets */}
            <button
              onClick={handleAdversarialPreset}
              disabled={isExecuting}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-rose-600 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-slate-950 font-mono font-bold text-xs flex items-center gap-2 shadow-purple-glow transition-all active:scale-95 disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>RUN ADVERSARIAL UNIVERSITY DEMO (1-CLICK)</span>
            </button>
          </div>

          {/* Adversarial Toggles Bar */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <span className="text-slate-400 font-bold flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              Failure Simulation Controls:
            </span>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer text-cyan-300">
                <input
                  type="checkbox"
                  checked={demoOpts.forceNewsFailure}
                  onChange={(e) => setDemoOpts({ ...demoOpts, forceNewsFailure: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                />
                <span>Force News Failure (503)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-purple-300">
                <input
                  type="checkbox"
                  checked={demoOpts.forcePatentTimeout}
                  onChange={(e) => setDemoOpts({ ...demoOpts, forcePatentTimeout: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-purple-500 focus:ring-0"
                />
                <span>Force Patent Timeout</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-amber-300">
                <input
                  type="checkbox"
                  checked={demoOpts.injectConflictingEvidence}
                  onChange={(e) => setDemoOpts({ ...demoOpts, injectConflictingEvidence: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0"
                />
                <span>Inject Conflicting Timeline Evidence</span>
              </label>
            </div>
          </div>

          {/* User Query Input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter complex investigation query..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-400 text-xs font-mono text-cyan-200 focus:outline-none"
            />
            <button
              onClick={() => handleRunAgenticGraph()}
              disabled={isExecuting}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs flex items-center gap-2 shadow-cyan-glow transition-all disabled:opacity-50"
            >
              {isExecuting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Agent Graph Running...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Execute Agent Graph</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Section Grid */}
        <div className="p-6 space-y-8">
          
          {/* LIVE AGENT ACTIVITY TELEMETRY FEED */}
          {resultState && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Telemetry Header HUD */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    Real-Time Execution Telemetry Stream ({resultState.executionHistory.length} Steps)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                    Status: {resultState.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2">
                  {resultState.executionHistory.map((step, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border font-mono text-xs flex flex-col justify-between transition-all ${
                        step.status === "FAILURE"
                          ? "bg-rose-950/30 border-rose-500/50 text-rose-300"
                          : step.status === "RECOVERY" || step.status === "REPLAN"
                          ? "bg-amber-950/30 border-amber-500/50 text-amber-300"
                          : step.status === "SUCCESS"
                          ? "bg-cyan-950/30 border-cyan-500/40 text-cyan-300"
                          : "bg-slate-900 border-slate-800 text-slate-400"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] text-slate-500">{step.timestamp}</span>
                        {step.status === "FAILURE" ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        ) : step.status === "RECOVERY" || step.status === "REPLAN" ? (
                          <RotateCcw className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                        )}
                      </div>
                      <strong className="text-white text-[11px] block">{step.nodeName}</strong>
                      <span className="text-[9px] text-slate-400 mt-1 line-clamp-2">{step.message}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* DETERMINISTIC CONFIDENCE & EVIDENCE METRICS HUD */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Deterministic Confidence Score Meter */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Scale className="w-4 h-4" /> Deterministic Confidence Judge
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Formula-Based</span>
                  </div>

                  <div className="text-center py-2">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-slate-900 border-4 border-emerald-400 text-3xl font-heading font-extrabold text-white shadow-emerald-glow">
                      {resultState.confidence.score}%
                    </div>
                    <span className="text-xs font-mono text-emerald-300 block mt-2 font-bold">
                      Calculated Reliability Score
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[11px] font-mono pt-2 border-t border-slate-850 text-slate-400">
                    <div className="flex justify-between">
                      <span>Supporting Evidence Items:</span>
                      <strong className="text-white">{resultState.confidence.supportingEvidenceCount}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Independent Source Types:</span>
                      <strong className="text-cyan-300">{resultState.confidence.independentSourcesCount}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Conflicts Resolved:</span>
                      <strong className="text-amber-300">
                        {resultState.confidence.resolvedConflicts} / {resultState.confidence.totalConflicts}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Replan Iterations:</span>
                      <strong className="text-purple-300">{resultState.budget.usedReplans}</strong>
                    </div>
                    <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-900 leading-relaxed font-sans">
                      {resultState.confidence.reasoning}
                    </p>
                  </div>
                </div>

                {/* 2. Evidence Verification & Conflict Resolver Table */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-4 md:col-span-2">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Evidence Verification &amp; Conflict Resolution Table
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {resultState.conflicts.length} Conflict(s) Detected
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[260px] overflow-y-auto font-mono text-xs">
                    {resultState.conflicts.length > 0 ? (
                      resultState.conflicts.map((conf, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <strong className="text-white text-xs">⚔ Conflict Topic: {conf.topic}</strong>
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                              RESOLVED
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] pt-1">
                            {conf.competingClaims.map((claimItem, cIdx) => (
                              <div
                                key={cIdx}
                                className={`p-2.5 rounded bg-slate-950 border ${
                                  claimItem.claim === conf.chosenClaim
                                    ? "border-emerald-500/50 text-emerald-300"
                                    : "border-slate-800 text-slate-400 opacity-60"
                                }`}
                              >
                                <div className="font-bold flex justify-between mb-1">
                                  <span>{claimItem.source}</span>
                                  <span>Rel: {(claimItem.reliabilityScore * 100).toFixed(0)}%</span>
                                </div>
                                <p className="text-[10px] font-sans">{claimItem.claim}</p>
                              </div>
                            ))}
                          </div>

                          <p className="text-[10px] text-amber-300/90 pt-1.5 border-t border-slate-800 font-sans leading-relaxed">
                            💡 <strong>Resolution Rationale:</strong> {conf.resolutionReasoning}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-900 text-slate-400 text-center">
                        ✓ No conflicting claims detected across evidence sources. All signals align cleanly.
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* FINAL SYNTHESIZED EXECUTIVE DOSSIER */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-cyan-500/40 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <span className="text-xs font-mono font-bold uppercase text-white tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Final Executive Intelligence Dossier
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Self-Evaluation Verified
                  </span>
                </div>

                <div className="prose prose-invert max-w-none text-slate-200 text-xs font-sans whitespace-pre-wrap leading-relaxed">
                  {resultState.finalReport?.formattedMarkdown}
                </div>
              </div>

            </div>
          )}

          {/* INVESTIGATION REPLAY & MEMORY SECTION */}
          {pastMemoryList.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                <span className="text-slate-300 font-bold uppercase flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-400" />
                  Investigation Memory Store &amp; Replay History ({pastMemoryList.length})
                </span>
                <span className="text-[10px] text-slate-500">Persistent Replay State</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {pastMemoryList.slice(0, 3).map((mem, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-cyan-300 font-bold text-[11px] truncate max-w-[180px]">
                        {mem.userQuery}
                      </span>
                      <span className="text-[9px] text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                        {mem.confidenceScore}% Conf
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2 font-sans">{mem.summary}</p>
                    <div className="pt-1.5 border-t border-slate-850 flex justify-between text-[9px] text-slate-500">
                      <span>Evidence: {mem.evidenceCount}</span>
                      <span>Replans: {mem.replansCount}</span>
                      <span>{new Date(mem.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
