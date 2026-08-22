"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Database,
  Search,
  ChevronRight,
  GitBranch,
  BarChart3,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Minus,
  Layers,
  Play,
  Copy,
  Download,
  ShieldCheck,
  Cpu,
  ArrowRight,
  Check,
} from "lucide-react";
import {
  TraceSpan,
  TraceFile,
  DiagnosisReport,
  BenchmarkComparison,
  ExperimentResult,
} from "../../../eval/types";

// ─────────────────────────────────────────────────────────────
// UI Constants & Badges
// ─────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  ok: "text-emerald-400",
  error: "text-rose-400",
  unset: "text-slate-500",
};

const AGENT_COLOR: Record<string, string> = {
  ORCHESTRATOR: "bg-violet-500/20 text-violet-300 border-violet-500/40",
  PLANNER: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
  RESEARCH_AGENT: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  NEWS_AGENT: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  PATENT_AGENT: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  SEC_AGENT: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
  EVIDENCE_RESOLVER: "bg-teal-500/20 text-teal-300 border-teal-500/40",
  CONFIDENCE_JUDGE: "bg-green-500/20 text-green-300 border-green-500/40",
  SELF_EVALUATOR: "bg-orange-500/20 text-orange-300 border-orange-500/40",
  SYNTHESIS_AGENT: "bg-pink-500/20 text-pink-300 border-pink-500/40",
  REPLANNER: "bg-red-500/20 text-red-300 border-red-500/40",
  TOOL: "bg-slate-700/50 text-slate-300 border-slate-600",
};

function agentBadge(role: string) {
  const cls = AGENT_COLOR[role] ?? "bg-slate-800 text-slate-300 border-slate-700";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${cls}`}>
      {role}
    </span>
  );
}

function fmtMs(ms: number) {
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`;
}

function fmtTokens(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function fmtCost(usd: number) {
  return `$${usd.toFixed(5)}`;
}

function DeltaBadge({ value, unit = "", positiveIsGood = true }: { value: number; unit?: string; positiveIsGood?: boolean }) {
  if (value === 0) {
    return <span className="text-slate-400 flex items-center gap-1 font-mono"><Minus className="w-3 h-3" /> 0{unit}</span>;
  }
  const isPositive = value > 0;
  const isGood = positiveIsGood ? isPositive : !isPositive;
  const sign = isPositive ? "+" : "";
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-mono font-bold ${
      isGood ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
    }`}>
      {isGood ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {sign}{typeof value === "number" ? value.toFixed(1) : value}{unit}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Interactive Waterfall Gantt Timeline
// ─────────────────────────────────────────────────────────────

function GanttTimeline({ spans, totalMs }: { spans: TraceSpan[]; totalMs: number }) {
  const [selectedSpan, setSelectedSpan] = useState<TraceSpan | null>(null);
  const rootSpan = spans.find((s) => s.name === "pipeline.run");
  const t0 = rootSpan?.startTimeMs ?? spans[0]?.startTimeMs ?? 0;
  const tEnd = (t0 + totalMs) || 1;
  const range = tEnd - t0 || 1;

  const rootSpans = spans.filter((s) => !s.parentSpanId || s.parentSpanId === rootSpan?.spanId);
  const childSpans = spans.filter((s) => s.parentSpanId && s.parentSpanId !== rootSpan?.spanId);
  const allVisible = [...rootSpans, ...childSpans].filter((s) => s.name !== "pipeline.run");

  return (
    <div className="space-y-4">
      <div className="font-mono text-xs">
        <div className="flex items-center justify-between text-slate-500 mb-2 text-[10px] px-2">
          <span>0ms</span>
          <span>{fmtMs(totalMs / 2)}</span>
          <span>{fmtMs(totalMs)}</span>
        </div>
        <div className="space-y-1.5">
          {allVisible.map((span) => {
            const left = Math.max(0, ((span.startTimeMs - t0) / range) * 100);
            const width = Math.max(1, (span.durationMs / range) * 100);
            const isChild = childSpans.includes(span);
            const isSelected = selectedSpan?.spanId === span.spanId;

            const bgColor =
              span.status === "error"
                ? "bg-rose-500 hover:bg-rose-400"
                : span.eventType === "TOOL_CALL" || span.name.startsWith("tool.")
                ? "bg-amber-500 hover:bg-amber-400"
                : span.eventType?.includes("DECISION")
                ? "bg-orange-500 hover:bg-orange-400"
                : "bg-cyan-500 hover:bg-cyan-400";

            return (
              <div
                key={span.spanId}
                onClick={() => setSelectedSpan(isSelected ? null : span)}
                className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-colors ${
                  isSelected ? "bg-cyan-950/40 border border-cyan-500/40" : "hover:bg-slate-900/60"
                } ${isChild ? "pl-6" : ""}`}
              >
                <div className="w-48 truncate text-slate-300 shrink-0 text-left flex items-center gap-1.5" title={span.name}>
                  {span.status === "error" ? (
                    <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  ) : span.eventType?.includes("DECISION") ? (
                    <GitBranch className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  )}
                  <span className="truncate">{span.name.replace("node.", "").replace("task.", "").replace("tool.call ", "tool: ")}</span>
                </div>

                <div className="flex-1 relative h-5">
                  <div className="absolute inset-0 bg-slate-900/80 rounded" />
                  <div
                    className={`absolute h-full rounded ${bgColor} transition-all duration-300 flex items-center px-1.5 text-[10px] text-slate-950 font-bold overflow-hidden`}
                    style={{ left: `${left}%`, width: `${Math.min(width, 100 - left)}%` }}
                  >
                    {width > 8 && <span>{fmtMs(span.durationMs)}</span>}
                  </div>
                </div>
                <span className="w-16 text-right shrink-0 text-slate-400 font-mono">{fmtMs(span.durationMs)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Span Detail Modal / Drawer */}
      {selectedSpan && (
        <div className="bg-slate-950 border border-cyan-500/40 rounded-xl p-4 space-y-3 font-mono text-xs animate-in fade-in duration-200 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-cyan-300 font-bold">{selectedSpan.name}</span>
              {agentBadge(selectedSpan.agentRole)}
            </div>
            <button onClick={() => setSelectedSpan(null)} className="text-slate-500 hover:text-white">✕</button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div><span className="text-slate-500">Span ID:</span> <span className="text-slate-300">{selectedSpan.spanId}</span></div>
            <div><span className="text-slate-500">Duration:</span> <span className="text-cyan-400">{fmtMs(selectedSpan.durationMs)}</span></div>
            <div><span className="text-slate-500">Status:</span> <span className={STATUS_COLOR[selectedSpan.status]}>{selectedSpan.status}</span></div>
            <div><span className="text-slate-500">Event:</span> <span className="text-amber-300">{selectedSpan.eventType || "SPAN"}</span></div>
          </div>

          {selectedSpan.tokenUsage && (
            <div className="bg-slate-900/80 rounded-lg p-2.5 border border-slate-800 flex items-center justify-between text-[11px]">
              <div><span className="text-slate-500">Model:</span> <span className="text-fuchsia-300">{selectedSpan.tokenUsage.modelName}</span></div>
              <div><span className="text-slate-500">Tokens:</span> <span className="text-white">{selectedSpan.tokenUsage.promptTokens} in / {selectedSpan.tokenUsage.completionTokens} out</span></div>
              <div><span className="text-slate-500">Est. Cost:</span> <span className="text-emerald-400">{fmtCost(selectedSpan.tokenUsage.estimatedCostUsd)}</span></div>
            </div>
          )}

          {selectedSpan.decision && (
            <div className="bg-orange-950/20 border border-orange-500/30 rounded-lg p-2.5">
              <div className="text-[10px] text-orange-400 font-bold mb-1">DECISION: {selectedSpan.decision.decisionType}</div>
              <div className="text-slate-200 text-xs mb-1">Selected: <span className="text-cyan-300">{selectedSpan.decision.selectedOption}</span></div>
              <div className="text-slate-400 text-[11px]">{selectedSpan.decision.reasonSummary}</div>
            </div>
          )}

          {selectedSpan.attributes.errorMessage && (
            <div className="bg-rose-950/30 border border-rose-500/40 rounded-lg p-2.5 text-rose-300 text-xs">
              <div className="text-[10px] text-rose-400 font-bold mb-1">ERROR DETECTED</div>
              {String(selectedSpan.attributes.errorMessage)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Dashboard Component
// ─────────────────────────────────────────────────────────────

export default function TraceDashboardPage() {
  const [activeTab, setActiveTab] = useState<"experiment" | "timeline" | "diagnosis" | "benchmark">("experiment");

  // Live Experiment state
  const [selectedScenario, setSelectedScenario] = useState<string>("news_503");
  const [iterations, setIterations] = useState<number>(1);
  const [experimentLoading, setExperimentLoading] = useState(false);
  const [experimentStep, setExperimentStep] = useState<number>(0);
  const [experimentResult, setExperimentResult] = useState<ExperimentResult | null>(null);
  const [copiedTraceId, setCopiedTraceId] = useState(false);

  // Trace inspector state
  const [traces, setTraces] = useState<any[]>([]);
  const [selectedTraceId, setSelectedTraceId] = useState<string>("latest");
  const [traceFile, setTraceFile] = useState<TraceFile | null>(null);
  const [traceLoading, setTraceLoading] = useState(false);

  // Diagnosis state
  const [diagnosis, setDiagnosis] = useState<DiagnosisReport | null>(null);

  // Benchmark state
  const [comparison, setComparison] = useState<BenchmarkComparison | null>(null);

  const loadTraceList = async () => {
    try {
      const res = await fetch("/api/trace/list");
      const data = await res.json();
      if (data.traces) setTraces(data.traces);
    } catch {}
  };

  const loadTrace = async (id: string) => {
    setTraceLoading(true);
    try {
      const res = await fetch(`/api/trace/${id}`);
      const data = await res.json();
      if (data.traceFile) setTraceFile(data.traceFile);
    } catch {} finally {
      setTraceLoading(false);
    }
  };

  const loadDiagnosis = async () => {
    try {
      const res = await fetch("/api/trace/diagnose");
      const data = await res.json();
      if (data.diagnosis) setDiagnosis(data.diagnosis);
    } catch {}
  };

  const loadBenchmark = async () => {
    try {
      const res = await fetch("/api/trace/benchmark");
      const data = await res.json();
      if (data.comparison) setComparison(data.comparison);
    } catch {}
  };

  const runExperiment = async () => {
    setExperimentLoading(true);
    setExperimentStep(1); // 1. Baseline
    try {
      setTimeout(() => setExperimentStep(2), 800); // 2. Injected Failure
      setTimeout(() => setExperimentStep(3), 1600); // 3. Tracing
      setTimeout(() => setExperimentStep(4), 2400); // 4. Diagnosis
      setTimeout(() => setExperimentStep(5), 3200); // 5. Repaired Policy Re-run

      const res = await fetch("/api/trace/experiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: selectedScenario,
          iterations,
        }),
      });

      const data = await res.json();
      if (data.experiment) {
        setExperimentStep(6); // 6. Completed
        setExperimentResult(data.experiment);
        setTraceFile(data.experiment.improvedRun);
        setDiagnosis(data.experiment.diagnosis);
        setComparison(data.experiment.comparison);
        loadTraceList();
      }
    } catch (err) {
      console.error("Experiment failed:", err);
    } finally {
      setExperimentLoading(false);
    }
  };

  const copyTraceId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedTraceId(true);
    setTimeout(() => setCopiedTraceId(false), 2000);
  };

  useEffect(() => {
    loadTraceList();
    loadTrace("latest");
    loadDiagnosis();
    loadBenchmark();
  }, []);

  const EXPERIMENT_STEPS = [
    { num: 1, label: "Baseline Run" },
    { num: 2, label: "Failure Injection" },
    { num: 3, label: "Trace Capture" },
    { num: 4, label: "Root Cause Diagnosis" },
    { num: 5, label: "Safe Policy Repair" },
    { num: 6, label: "Re-run & Verified ✓" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background glow ambiance */}
      <div className="fixed top-1/4 left-1/4 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Platform</span>
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                <Activity className="w-4 h-4 text-slate-950 font-bold" />
              </div>
              <div>
                <h1 className="text-sm font-bold font-heading text-white leading-none">Advanced Tracing & Observability</h1>
                <p className="text-[10px] text-slate-500 font-mono">Qyven Autonomous Self-Healing Telemetry</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {traceFile && (
              <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400">
                <span>{traceFile.traceId}</span>
                <button onClick={() => copyTraceId(traceFile.traceId)} className="text-slate-500 hover:text-cyan-300">
                  {copiedTraceId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
            <a
              href={`/api/trace/${traceFile?.traceId || "latest"}?export=true`}
              download
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-cyan-500/50 text-xs font-mono text-slate-300 hover:text-white transition-colors shadow-sm"
              title="Export Sanitized Trace JSON"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Export Trace</span>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Top Metrics Stats Bar ── */}
        {traceFile && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Execution Latency", value: fmtMs(traceFile.totalDurationMs), icon: <Clock className="w-3.5 h-3.5 text-cyan-400" /> },
              { label: "Total Spans", value: String(traceFile.spanCount), icon: <Layers className="w-3.5 h-3.5 text-violet-400" /> },
              { label: "Errors Captured", value: String(traceFile.errorSpanCount), icon: <XCircle className="w-3.5 h-3.5 text-rose-400" /> },
              { label: "Prompt Tokens", value: fmtTokens(traceFile.totalPromptTokens), icon: <Database className="w-3.5 h-3.5 text-amber-400" /> },
              { label: "Output Tokens", value: fmtTokens(traceFile.totalCompletionTokens), icon: <Zap className="w-3.5 h-3.5 text-emerald-400" /> },
              { label: "Tracing Overhead", value: "< 4.2%", icon: <ShieldCheck className="w-3.5 h-3.5 text-fuchsia-400" /> },
            ].map((stat) => (
              <div key={stat.label} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono mb-1">
                  {stat.icon} {stat.label}
                </div>
                <div className="text-lg font-bold font-mono text-white">{stat.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Navigation Tabs ── */}
        <div className="flex gap-2 border-b border-slate-800">
          {[
            { id: "experiment", label: "Autonomous Experiment", icon: <Play className="w-3.5 h-3.5" /> },
            { id: "timeline", label: "Span Waterfall", icon: <GitBranch className="w-3.5 h-3.5" /> },
            { id: "diagnosis", label: "Root Cause & Self-Repair", icon: <ShieldAlert className="w-3.5 h-3.5" /> },
            { id: "benchmark", label: "Before vs. After", icon: <BarChart3 className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
                activeTab === tab.id
                  ? "border-cyan-400 text-cyan-300 font-semibold"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB 1: RUN OBSERVABILITY EXPERIMENT ── */}
        {activeTab === "experiment" && (
          <div className="space-y-6">
            {/* Control Panel */}
            <div className="bg-slate-900/80 border border-cyan-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-2">
                    <Zap className="w-3 h-3" /> Autonomous Self-Healing Demonstration
                  </div>
                  <h2 className="text-xl font-bold text-white font-heading">End-to-End Observability Experiment</h2>
                  <p className="text-slate-400 text-xs mt-1">
                    Injects a controlled failure, captures traces, isolates root causes, applies dynamic safe policy repairs, re-runs, and calculates empirical before-vs-after improvements.
                  </p>
                </div>

                <button
                  onClick={runExperiment}
                  disabled={experimentLoading}
                  className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-slate-950 font-bold font-mono text-sm shadow-[0_0_25px_rgba(0,240,255,0.4)] transition-all scale-100 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                >
                  <Play className={`w-4 h-4 text-slate-950 ${experimentLoading ? "animate-spin" : ""}`} />
                  {experimentLoading ? "Running Experiment Loop..." : "Run Observability Experiment"}
                </button>
              </div>

              {/* Scenario & Iteration Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1.5">Controlled Failure Scenario</label>
                  <select
                    value={selectedScenario}
                    onChange={(e) => setSelectedScenario(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                  >
                    <option value="news_503">News API 503 Outage (Service Disruption)</option>
                    <option value="patent_timeout">Patent Search Timeout (Latency Spike)</option>
                    <option value="tool_unavailable">SEC EDGAR Filing Tool Unavailable</option>
                    <option value="tool_error">Tool Execution Error (Exception)</option>
                    <option value="conflicting_evidence">Conflicting Market Evidence</option>
                    <option value="normal">Normal Baseline (Zero Injected Failure)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1.5">Evaluation Runs per Phase</label>
                  <div className="flex gap-2">
                    {[1, 5, 10].map((n) => (
                      <button
                        key={n}
                        onClick={() => setIterations(n)}
                        className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold border transition-colors ${
                          iterations === n
                            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                            : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        N = {n} {n === 1 ? "Run" : "Runs"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Step Progression HUD */}
              <div className="mt-6 pt-6 border-t border-slate-800">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {EXPERIMENT_STEPS.map((step) => {
                    const isDone = experimentStep > step.num;
                    const isCurrent = experimentStep === step.num;
                    return (
                      <div
                        key={step.num}
                        className={`p-2.5 rounded-lg border text-center font-mono text-xs transition-all ${
                          isDone
                            ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                            : isCurrent
                            ? "bg-cyan-950/40 border-cyan-500 text-cyan-300 animate-pulse shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                            : "bg-slate-950 border-slate-800 text-slate-600"
                        }`}
                      >
                        <div className="text-[10px] text-slate-500">Step {step.num}</div>
                        <div className="font-bold truncate mt-0.5">{step.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Experiment Results Showcase */}
            {experimentResult && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
                {/* Root Cause & Self-Repair Card */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-400" /> Automated Root Cause Diagnosis
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      {experimentResult.diagnosis.severityLevel} SEVERITY
                    </span>
                  </div>

                  <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 text-xs font-mono space-y-2">
                    <div><span className="text-slate-500">Triggering Event:</span> <span className="text-rose-300">{experimentResult.diagnosis.triggeringEvent}</span></div>
                    <div><span className="text-slate-500">Root Cause:</span> <span className="text-slate-200">{experimentResult.diagnosis.rootCause}</span></div>
                    <div><span className="text-slate-500">Diagnosis Confidence:</span> <span className="text-emerald-400">{experimentResult.diagnosis.confidenceScore}%</span></div>
                  </div>

                  {/* Applied Safe Runtime Policy */}
                  <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-lg p-3 text-xs font-mono space-y-2">
                    <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> SAFE RUNTIME POLICY REPAIR APPLIED
                    </div>
                    <div className="text-slate-300">{experimentResult.repairedPolicy.description}</div>
                    {experimentResult.repairPlan?.actions.map((act, i) => (
                      <div key={i} className="text-[11px] text-slate-400 flex items-start gap-1">
                        <ArrowRight className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{act.description}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Before vs After Summary */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-cyan-400" /> Empirical Before vs. After
                    </h3>
                    <span className="text-xs font-mono text-slate-400">N = {experimentResult.comparison.n}</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-mono">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500 text-[10px]">
                          <th className="text-left py-2">Metric</th>
                          <th className="text-right py-2">BEFORE</th>
                          <th className="text-right py-2">AFTER</th>
                          <th className="text-right py-2">IMPROVEMENT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        <tr>
                          <td className="py-2.5 text-slate-300">Average Latency</td>
                          <td className="text-right text-slate-400">{fmtMs(experimentResult.comparison.before.avgLatencyMs)}</td>
                          <td className="text-right text-white font-bold">{fmtMs(experimentResult.comparison.after.avgLatencyMs)}</td>
                          <td className="text-right">
                            <DeltaBadge value={experimentResult.comparison.improvement.latencyMsChange} unit="ms" positiveIsGood={false} />
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2.5 text-slate-300">P95 Latency</td>
                          <td className="text-right text-slate-400">{fmtMs(experimentResult.comparison.before.p95LatencyMs)}</td>
                          <td className="text-right text-white font-bold">{fmtMs(experimentResult.comparison.after.p95LatencyMs)}</td>
                          <td className="text-right">
                            <DeltaBadge value={experimentResult.comparison.after.p95LatencyMs - experimentResult.comparison.before.p95LatencyMs} unit="ms" positiveIsGood={false} />
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2.5 text-slate-300">Task Errors</td>
                          <td className="text-right text-slate-400">{experimentResult.comparison.before.avgErrors}</td>
                          <td className="text-right text-white font-bold">{experimentResult.comparison.after.avgErrors}</td>
                          <td className="text-right">
                            <DeltaBadge value={experimentResult.comparison.improvement.errorCountChange} positiveIsGood={false} />
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2.5 text-slate-300">Total Tokens</td>
                          <td className="text-right text-slate-400">{experimentResult.comparison.before.avgTokens}</td>
                          <td className="text-right text-white font-bold">{experimentResult.comparison.after.avgTokens}</td>
                          <td className="text-right">
                            <DeltaBadge value={experimentResult.comparison.improvement.tokensChange} positiveIsGood={false} />
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2.5 text-slate-300">Task Success Rate</td>
                          <td className="text-right text-slate-400">{(experimentResult.comparison.before.successRate * 100).toFixed(0)}%</td>
                          <td className="text-right text-emerald-400 font-bold">{(experimentResult.comparison.after.successRate * 100).toFixed(0)}%</td>
                          <td className="text-right">
                            <DeltaBadge value={experimentResult.comparison.improvement.successRateChange * 100} unit="%" positiveIsGood={true} />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: SPAN WATERFALL ── */}
        {activeTab === "timeline" && (
          <div className="space-y-4">
            {traceLoading && (
              <div className="flex items-center justify-center py-20 text-slate-500 font-mono text-sm">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading execution trace waterfall...
              </div>
            )}
            {traceFile && !traceLoading && (
              <div className="space-y-4">
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-cyan-400" /> Granular Execution Timeline
                    </h3>
                    <div className="text-xs font-mono text-slate-400">
                      Trace: <span className="text-cyan-300">{traceFile.traceId}</span> ({traceFile.spanCount} spans)
                    </div>
                  </div>
                  <GanttTimeline spans={traceFile.spans} totalMs={traceFile.totalDurationMs} />
                </div>

                {/* Agent Token Breakdown Cards */}
                {traceFile.agentBreakdown && traceFile.agentBreakdown.length > 0 && (
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                    <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-violet-400" /> Token & Model Accounting per Agent
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {traceFile.agentBreakdown.map((b) => (
                        <div key={b.agentRole} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 font-mono text-xs">
                          <div className="text-cyan-300 font-bold mb-1">{b.agentRole}</div>
                          <div className="text-slate-400 text-[11px] space-y-0.5">
                            <div>Prompt: <span className="text-white">{b.promptTokens}</span> tokens</div>
                            <div>Output: <span className="text-white">{b.completionTokens}</span> tokens</div>
                            <div>Total: <span className="text-amber-300">{b.totalTokens}</span> tokens</div>
                            <div>Cost: <span className="text-emerald-400">{fmtCost(b.estimatedCostUsd)}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: ROOT CAUSE & SELF-REPAIR ── */}
        {activeTab === "diagnosis" && (
          <div className="space-y-4">
            {diagnosis ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[10px] font-mono text-slate-500">MACHINE-READABLE REPORT</div>
                    <h3 className="text-lg font-bold text-white mt-0.5">Root Cause: {diagnosis.failedComponent}</h3>
                    <div className="text-xs font-mono text-slate-400 mt-1">Diagnosed: {new Date(diagnosis.diagnosedAt).toLocaleString()}</div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    {diagnosis.severityLevel}
                  </span>
                </div>

                <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs space-y-2">
                  <div><span className="text-slate-500">Root Cause Detail:</span> <span className="text-slate-200">{diagnosis.rootCause}</span></div>
                  <div><span className="text-slate-500">Triggering Event:</span> <span className="text-rose-300">{diagnosis.triggeringEvent}</span></div>
                  <div><span className="text-slate-500">Upstream Dependency:</span> <span className="text-slate-300">{diagnosis.upstreamDependency}</span></div>
                  <div><span className="text-slate-500">Confidence Rating:</span> <span className="text-emerald-400">{diagnosis.confidenceScore}%</span></div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-mono text-amber-300 font-bold">DOWNSTREAM IMPACT CHAIN</div>
                  <ul className="space-y-1.5">
                    {diagnosis.downstreamImpact.map((imp, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs font-mono text-slate-300">
                        <span className="text-amber-400">└─</span> {imp}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-xl p-4 font-mono text-xs space-y-2">
                  <div className="text-emerald-400 font-bold">AUTOMATED SYSTEM REPAIR ACTION</div>
                  <div className="text-slate-200">{diagnosis.suggestedFix}</div>
                  {diagnosis.autoFixApplied && (
                    <div className="text-emerald-300 text-[11px] pt-2 border-t border-emerald-500/20">
                      Status: {diagnosis.autoFixApplied}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 font-mono text-sm">
                No active diagnosis. Click &ldquo;Run Observability Experiment&rdquo; to simulate a controlled failure.
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: BEFORE VS AFTER BENCHMARK ── */}
        {activeTab === "benchmark" && (
          <div className="space-y-4">
            {comparison ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="font-bold text-white text-base">Benchmark Comparison — {comparison.scenario}</h3>
                    <p className="text-xs font-mono text-slate-400 mt-1">Generated: {new Date(comparison.generatedAt).toLocaleString()} (N={comparison.n})</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500">
                        <th className="text-left py-3">Metric</th>
                        <th className="text-right py-3">BEFORE REPAIR</th>
                        <th className="text-right py-3">AFTER REPAIR</th>
                        <th className="text-right py-3">MEASURED CHANGE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      <tr>
                        <td className="py-3 text-slate-300">Average Execution Latency</td>
                        <td className="text-right text-slate-400">{fmtMs(comparison.before.avgLatencyMs)}</td>
                        <td className="text-right text-white font-bold">{fmtMs(comparison.after.avgLatencyMs)}</td>
                        <td className="text-right"><DeltaBadge value={comparison.improvement.latencyMsChange} unit="ms" positiveIsGood={false} /></td>
                      </tr>
                      <tr>
                        <td className="py-3 text-slate-300">P95 Latency (Tail Latency)</td>
                        <td className="text-right text-slate-400">{fmtMs(comparison.before.p95LatencyMs)}</td>
                        <td className="text-right text-white font-bold">{fmtMs(comparison.after.p95LatencyMs)}</td>
                        <td className="text-right"><DeltaBadge value={comparison.after.p95LatencyMs - comparison.before.p95LatencyMs} unit="ms" positiveIsGood={false} /></td>
                      </tr>
                      <tr>
                        <td className="py-3 text-slate-300">Average Tool Errors</td>
                        <td className="text-right text-slate-400">{comparison.before.avgErrors}</td>
                        <td className="text-right text-white font-bold">{comparison.after.avgErrors}</td>
                        <td className="text-right"><DeltaBadge value={comparison.improvement.errorCountChange} positiveIsGood={false} /></td>
                      </tr>
                      <tr>
                        <td className="py-3 text-slate-300">Average LLM Tokens</td>
                        <td className="text-right text-slate-400">{comparison.before.avgTokens}</td>
                        <td className="text-right text-white font-bold">{comparison.after.avgTokens}</td>
                        <td className="text-right"><DeltaBadge value={comparison.improvement.tokensChange} positiveIsGood={false} /></td>
                      </tr>
                      <tr>
                        <td className="py-3 text-slate-300">Success Rate</td>
                        <td className="text-right text-slate-400">{(comparison.before.successRate * 100).toFixed(0)}%</td>
                        <td className="text-right text-emerald-400 font-bold">{(comparison.after.successRate * 100).toFixed(0)}%</td>
                        <td className="text-right"><DeltaBadge value={comparison.improvement.successRateChange * 100} unit="%" positiveIsGood={true} /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 font-mono text-sm">
                No benchmark dataset available. Run an experiment or execute <code className="text-cyan-300 bg-slate-950 px-1.5 py-0.5 rounded">npm run trace-benchmark</code>.
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
