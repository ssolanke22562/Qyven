"use client";

import React, { useEffect, useState, useRef } from "react";
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
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface TraceSpan {
  spanId: string;
  parentSpanId?: string;
  name: string;
  agentRole: string;
  startTimeMs: number;
  endTimeMs: number;
  durationMs: number;
  status: "ok" | "error" | "unset";
  attributes: Record<string, string | number | boolean | undefined>;
}

interface TraceFile {
  traceId: string;
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

interface DiagnosisReport {
  traceId: string;
  diagnosedAt: string;
  severityLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  rootCause: string;
  failedSpan: { spanId: string; name: string; agentRole: string; errorMessage: string } | null;
  downstreamImpact: string[];
  suggestedFix: string;
  autoFixApplied: string | null;
}

interface BenchmarkComparison {
  generatedAt: string;
  scenario: string;
  n: number;
  before: Record<string, number>;
  after: Record<string, number>;
  improvement: Record<string, number>;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  ok: "text-emerald-400",
  error: "text-rose-400",
  unset: "text-slate-500",
};

const STATUS_BG: Record<string, string> = {
  ok: "bg-emerald-500/20 border-emerald-500/40",
  error: "bg-rose-500/20 border-rose-500/40",
  unset: "bg-slate-800 border-slate-700",
};

const AGENT_COLOR: Record<string, string> = {
  ORCHESTRATOR: "bg-violet-500/30 text-violet-300 border-violet-500/40",
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
  LLM: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40",
  TOOL: "bg-slate-600/40 text-slate-300 border-slate-500/40",
};

function agentBadge(role: string) {
  const cls = AGENT_COLOR[role] ?? "bg-slate-700 text-slate-300 border-slate-600";
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${cls}`}>
      {role}
    </span>
  );
}

function fmtMs(ms: number) {
  return ms < 1000 ? `${ms.toFixed(0)}ms` : `${(ms / 1000).toFixed(2)}s`;
}

function fmtTokens(n: number) {
  return n > 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function fmtCost(usd: number) {
  return `$${usd.toFixed(5)}`;
}

function DeltaCell({ value, unit = "", positiveIsGood = true }: { value: number; unit?: string; positiveIsGood?: boolean }) {
  if (value === 0) return <span className="text-slate-400 flex items-center gap-1"><Minus className="w-3 h-3" /> —</span>;
  const isPositive = value > 0;
  const isGood = positiveIsGood ? isPositive : !isPositive;
  const sign = isPositive ? "+" : "";
  return (
    <span className={`flex items-center gap-1 font-mono font-bold ${isGood ? "text-emerald-400" : "text-rose-400"}`}>
      {isGood ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {sign}{value.toFixed(1)}{unit}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Gantt Timeline
// ─────────────────────────────────────────────────────────────
function GanttTimeline({ spans, totalMs }: { spans: TraceSpan[]; totalMs: number }) {
  const rootSpan = spans.find((s) => s.name === "pipeline.run");
  const t0 = rootSpan?.startTimeMs ?? spans[0]?.startTimeMs ?? 0;
  const tEnd = (t0 + totalMs) || 1;
  const range = tEnd - t0 || 1;

  const rootSpans = spans.filter((s) => !s.parentSpanId || s.parentSpanId === rootSpan?.spanId);
  const childSpans = spans.filter((s) => s.parentSpanId && s.parentSpanId !== rootSpan?.spanId);

  const allVisible = [...rootSpans, ...childSpans].filter((s) => s.name !== "pipeline.run");

  return (
    <div className="font-mono text-xs">
      <div className="flex items-center justify-between text-slate-500 mb-2 text-[10px]">
        <span>0ms</span>
        <span>{fmtMs(totalMs / 2)}</span>
        <span>{fmtMs(totalMs)}</span>
      </div>
      <div className="space-y-1">
        {allVisible.map((span) => {
          const left = Math.max(0, ((span.startTimeMs - t0) / range) * 100);
          const width = Math.max(0.5, (span.durationMs / range) * 100);
          const isChild = childSpans.includes(span);
          const bgColor =
            span.status === "error"
              ? "bg-rose-500"
              : span.name.startsWith("tool.")
              ? "bg-amber-500"
              : span.name.startsWith("llm.")
              ? "bg-fuchsia-500"
              : span.name.startsWith("decision")
              ? "bg-orange-500"
              : "bg-cyan-500";

          return (
            <div key={span.spanId} className={`flex items-center gap-2 ${isChild ? "pl-4" : ""}`}>
              <div className="w-44 truncate text-slate-400 shrink-0 text-right" title={span.name}>
                {span.name.replace("node.", "").replace("task.", "").replace("tool.call ", "tool: ")}
              </div>
              <div className="flex-1 relative h-4">
                <div className="absolute inset-0 bg-slate-800/60 rounded" />
                <div
                  className={`absolute h-full rounded ${bgColor} opacity-80 transition-all duration-500`}
                  style={{ left: `${left}%`, width: `${Math.min(width, 100 - left)}%` }}
                />
                {span.status === "error" && (
                  <div className="absolute inset-0 flex items-center justify-end pr-1">
                    <XCircle className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <span className="w-16 text-right shrink-0 text-slate-400">{fmtMs(span.durationMs)}</span>
            </div>
          );
        })}
      </div>
      <div className="flex gap-4 mt-4 flex-wrap text-[10px]">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-cyan-500 inline-block" /> Node</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500 inline-block" /> Tool</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-fuchsia-500 inline-block" /> LLM</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-500 inline-block" /> Error</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Dashboard Page
// ─────────────────────────────────────────────────────────────
export default function TraceDashboardPage() {
  const [activeTab, setActiveTab] = useState<"timeline" | "diagnosis" | "benchmark">("timeline");

  // Trace state
  const [traces, setTraces] = useState<any[]>([]);
  const [selectedTraceId, setSelectedTraceId] = useState<string>("latest");
  const [traceFile, setTraceFile] = useState<TraceFile | null>(null);
  const [traceLoading, setTraceLoading] = useState(false);
  const [traceError, setTraceError] = useState<string | null>(null);

  // Diagnosis state
  const [diagnosis, setDiagnosis] = useState<DiagnosisReport | null>(null);
  const [diagnosisLoading, setDiagnosisLoading] = useState(false);
  const [diagnosisError, setDiagnosisError] = useState<string | null>(null);

  // Benchmark state
  const [comparison, setComparison] = useState<BenchmarkComparison | null>(null);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);

  const loadTraces = async () => {
    try {
      const res = await fetch("/api/trace/list");
      const data = await res.json();
      if (data.traces) setTraces(data.traces);
    } catch {}
  };

  const loadTrace = async (id: string) => {
    setTraceLoading(true);
    setTraceError(null);
    try {
      const res = await fetch(`/api/trace/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTraceFile(data.traceFile);
    } catch (err: any) {
      setTraceError(err.message);
    } finally {
      setTraceLoading(false);
    }
  };

  const loadDiagnosis = async () => {
    setDiagnosisLoading(true);
    setDiagnosisError(null);
    try {
      const res = await fetch("/api/trace/diagnose");
      const data = await res.json();
      if (data.diagnosis) setDiagnosis(data.diagnosis);
      else setDiagnosisError(data.message ?? "No diagnosis available yet.");
    } catch (err: any) {
      setDiagnosisError(err.message);
    } finally {
      setDiagnosisLoading(false);
    }
  };

  const runDiagnosis = async () => {
    if (!traceFile) return;
    setDiagnosisLoading(true);
    try {
      const res = await fetch("/api/trace/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ traceId: traceFile.traceId }),
      });
      const data = await res.json();
      if (data.diagnosis) {
        setDiagnosis(data.diagnosis);
        setActiveTab("diagnosis");
      }
    } catch (err: any) {
      setDiagnosisError(err.message);
    } finally {
      setDiagnosisLoading(false);
    }
  };

  const loadBenchmark = async () => {
    setBenchmarkLoading(true);
    try {
      const res = await fetch("/api/trace/benchmark");
      const data = await res.json();
      if (data.comparison) setComparison(data.comparison);
    } catch {} finally {
      setBenchmarkLoading(false);
    }
  };

  useEffect(() => {
    loadTraces();
    loadTrace("latest");
    loadDiagnosis();
    loadBenchmark();
  }, []);

  const SEVERITY_COLOR: Record<string, string> = {
    LOW: "text-emerald-400 bg-emerald-500/20 border-emerald-500/40",
    MEDIUM: "text-amber-400 bg-amber-500/20 border-amber-500/40",
    HIGH: "text-orange-400 bg-orange-500/20 border-orange-500/40",
    CRITICAL: "text-rose-400 bg-rose-500/20 border-rose-500/40",
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      {/* Glow Background */}
      <div className="fixed top-1/4 left-1/4 w-[600px] h-[600px] bg-violet-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold font-heading text-white leading-none">Trace Dashboard</h1>
                <p className="text-[10px] text-slate-500 font-mono">Qyven End-to-End Observability</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {traceFile && (
              <span className="text-[10px] font-mono text-slate-500 hidden md:block">
                {traceFile.traceId}
              </span>
            )}
            <button
              onClick={() => { loadTrace(selectedTraceId); loadDiagnosis(); loadBenchmark(); }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Trace Selector + Stats Row */}
        {traceFile && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Total Duration", value: fmtMs(traceFile.totalDurationMs), icon: <Clock className="w-3.5 h-3.5 text-cyan-400" /> },
              { label: "Spans", value: String(traceFile.spanCount), icon: <Layers className="w-3.5 h-3.5 text-violet-400" /> },
              { label: "Errors", value: String(traceFile.errorSpanCount), icon: <XCircle className="w-3.5 h-3.5 text-rose-400" /> },
              { label: "Prompt Tokens", value: fmtTokens(traceFile.totalPromptTokens), icon: <Database className="w-3.5 h-3.5 text-amber-400" /> },
              { label: "Output Tokens", value: fmtTokens(traceFile.totalCompletionTokens), icon: <Zap className="w-3.5 h-3.5 text-green-400" /> },
              { label: "Est. Cost", value: fmtCost(traceFile.estimatedTotalCostUsd), icon: <BarChart3 className="w-3.5 h-3.5 text-fuchsia-400" /> },
            ].map((stat) => (
              <div key={stat.label} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono mb-1">
                  {stat.icon} {stat.label}
                </div>
                <div className="text-lg font-bold font-mono text-white">{stat.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Trace Selector */}
        <div className="flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={selectedTraceId}
            onChange={(e) => {
              setSelectedTraceId(e.target.value);
              loadTrace(e.target.value);
            }}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500/60 flex-1 max-w-md"
          >
            <option value="latest">latest (most recent trace)</option>
            {traces.map((t) => (
              <option key={t.traceId} value={t.traceId}>
                {t.traceId} — {t.query?.slice(0, 50)} ({t.errorSpanCount > 0 ? `${t.errorSpanCount} errors` : "ok"})
              </option>
            ))}
          </select>
          {traceFile && traceFile.errorSpanCount > 0 && (
            <button
              onClick={runDiagnosis}
              disabled={diagnosisLoading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-sm font-mono hover:bg-rose-500/30 transition-colors disabled:opacity-50"
            >
              <ShieldAlert className="w-4 h-4" />
              {diagnosisLoading ? "Diagnosing..." : "Diagnose Errors"}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-800">
          {[
            { id: "timeline", label: "Span Timeline", icon: <Activity className="w-3.5 h-3.5" /> },
            { id: "diagnosis", label: "Root Cause Analysis", icon: <ShieldAlert className="w-3.5 h-3.5" /> },
            { id: "benchmark", label: "Before / After", icon: <BarChart3 className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
                activeTab === tab.id
                  ? "border-cyan-400 text-cyan-300"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Span Timeline ── */}
        {activeTab === "timeline" && (
          <div className="space-y-4">
            {traceLoading && (
              <div className="flex items-center justify-center py-20 text-slate-500">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading trace…
              </div>
            )}
            {traceError && (
              <div className="bg-slate-900 border border-rose-500/40 rounded-xl p-6 text-rose-400">
                <AlertTriangle className="w-5 h-5 inline mr-2" />
                {traceError}
                <p className="text-slate-500 text-sm mt-2">
                  Run a query in the <Link href="/" className="text-cyan-400 underline">Oracle Terminal</Link> to generate your first trace.
                </p>
              </div>
            )}
            {traceFile && !traceLoading && (
              <>
                {/* Query & status */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[10px] text-slate-500 font-mono mb-1">QUERY</div>
                      <div className="text-sm text-white font-medium">&ldquo;{traceFile.query}&rdquo;</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-mono border ${
                        traceFile.errorSpanCount > 0 ? STATUS_BG.error : STATUS_BG.ok
                      }`}>
                        {traceFile.errorSpanCount > 0
                          ? <><XCircle className="w-3 h-3 text-rose-400" /> {traceFile.errorSpanCount} ERROR(S)</>
                          : <><CheckCircle2 className="w-3 h-3 text-emerald-400" /> OK</>}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">{traceFile.status}</span>
                    </div>
                  </div>
                  {Object.entries(traceFile.demoOptions || {}).some(([, v]) => v === true) && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {Object.entries(traceFile.demoOptions)
                        .filter(([, v]) => v === true)
                        .map(([k]) => (
                          <span key={k} className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300">
                            {k}=true
                          </span>
                        ))}
                    </div>
                  )}
                </div>

                {/* Gantt */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-cyan-400" /> Span Waterfall Timeline
                  </h3>
                  <GanttTimeline spans={traceFile.spans} totalMs={traceFile.totalDurationMs} />
                </div>

                {/* Span table */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">All Spans ({traceFile.spans.length})</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-mono">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500">
                          <th className="text-left px-4 py-2">Span Name</th>
                          <th className="text-left px-4 py-2">Agent</th>
                          <th className="text-left px-4 py-2">Status</th>
                          <th className="text-right px-4 py-2">Duration</th>
                          <th className="text-left px-4 py-2 hidden lg:table-cell">Key Attributes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {traceFile.spans.map((span, i) => (
                          <tr key={span.spanId} className={`border-b border-slate-800/60 ${span.status === "error" ? "bg-rose-500/5" : i % 2 === 0 ? "" : "bg-slate-900/40"}`}>
                            <td className="px-4 py-2 text-slate-300 max-w-[200px] truncate" title={span.name}>
                              {span.parentSpanId && <span className="text-slate-600 mr-1">└</span>}
                              {span.name}
                            </td>
                            <td className="px-4 py-2">{agentBadge(span.agentRole)}</td>
                            <td className="px-4 py-2">
                              <span className={`flex items-center gap-1 ${STATUS_COLOR[span.status] ?? "text-slate-400"}`}>
                                {span.status === "ok" && <CheckCircle2 className="w-3 h-3" />}
                                {span.status === "error" && <XCircle className="w-3 h-3" />}
                                {span.status === "unset" && <Clock className="w-3 h-3" />}
                                {span.status}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-right text-slate-400">{fmtMs(span.durationMs)}</td>
                            <td className="px-4 py-2 text-slate-500 hidden lg:table-cell max-w-[300px] truncate">
                              {span.attributes.errorMessage
                                ? <span className="text-rose-400">{String(span.attributes.errorMessage)}</span>
                                : span.attributes.outputSummary
                                ? String(span.attributes.outputSummary).slice(0, 80)
                                : span.attributes.model
                                ? `${span.attributes.model} · ${span.attributes.promptTokens ?? 0}+${span.attributes.completionTokens ?? 0} tokens`
                                : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Tab: Root Cause Analysis ── */}
        {activeTab === "diagnosis" && (
          <div className="space-y-4">
            {diagnosisLoading && (
              <div className="flex items-center justify-center py-20 text-slate-500">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Running diagnosis…
              </div>
            )}
            {diagnosisError && !diagnosis && (
              <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-6 text-amber-400">
                <AlertTriangle className="w-5 h-5 inline mr-2" />
                {diagnosisError}
                <p className="text-slate-500 text-sm mt-2">
                  Run a query with a failure mode (e.g. adversarial) then click &ldquo;Diagnose Errors&rdquo; above.
                </p>
              </div>
            )}
            {diagnosis && (
              <div className="space-y-4">
                {/* Severity + Meta */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="text-[10px] font-mono text-slate-500 mb-1">ROOT CAUSE ANALYSIS</div>
                      <h3 className="text-white font-bold text-base">Trace: {diagnosis.traceId}</h3>
                      <div className="text-[10px] text-slate-500 font-mono mt-1">
                        Diagnosed at {new Date(diagnosis.diagnosedAt).toLocaleTimeString()}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${SEVERITY_COLOR[diagnosis.severityLevel] ?? ""}`}>
                      {diagnosis.severityLevel}
                    </span>
                  </div>

                  {/* Root Cause */}
                  <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700/60 mb-3">
                    <div className="text-[10px] font-mono text-rose-400 mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> ROOT CAUSE
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed">{diagnosis.rootCause}</p>
                  </div>

                  {/* Failed Span */}
                  {diagnosis.failedSpan && (
                    <div className="bg-rose-950/30 border border-rose-500/30 rounded-lg p-4 mb-3">
                      <div className="text-[10px] font-mono text-rose-400 mb-2">FAILED SPAN</div>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div><span className="text-slate-500">Name:</span> <span className="text-rose-300">{diagnosis.failedSpan.name}</span></div>
                        <div><span className="text-slate-500">Role:</span> <span className="text-rose-300">{diagnosis.failedSpan.agentRole}</span></div>
                        <div className="col-span-2"><span className="text-slate-500">Error:</span> <span className="text-rose-400">{diagnosis.failedSpan.errorMessage}</span></div>
                        <div className="col-span-2"><span className="text-slate-500">Span ID:</span> <span className="text-slate-400">{diagnosis.failedSpan.spanId}</span></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Downstream Impact */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
                  <div className="text-[10px] font-mono text-amber-400 mb-3 flex items-center gap-1">
                    <ChevronRight className="w-3 h-3" /> DOWNSTREAM IMPACT
                  </div>
                  <ul className="space-y-2">
                    {diagnosis.downstreamImpact.map((impact, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                        {impact}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Suggested Fix + Auto-Fix */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
                  <div className="text-[10px] font-mono text-cyan-400 mb-3 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> SUGGESTED FIX
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed mb-4">{diagnosis.suggestedFix}</p>

                  {diagnosis.autoFixApplied && (
                    <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold mb-2">
                        <CheckCircle2 className="w-4 h-4" /> AUTO-FIX APPLIED
                      </div>
                      <p className="text-sm text-emerald-300 leading-relaxed">{diagnosis.autoFixApplied}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Before / After Benchmark ── */}
        {activeTab === "benchmark" && (
          <div className="space-y-4">
            {benchmarkLoading && (
              <div className="flex items-center justify-center py-20 text-slate-500">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading benchmark…
              </div>
            )}
            {!comparison && !benchmarkLoading && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
                <Play className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-white font-bold mb-2">No Benchmark Data Yet</h3>
                <p className="text-slate-500 text-sm mb-4">
                  Run the benchmark to see measurable before/after improvements from the News-503 fix.
                </p>
                <div className="bg-slate-800/60 rounded-lg p-3 font-mono text-sm text-cyan-300 text-left inline-block">
                  npm run trace-benchmark
                </div>
              </div>
            )}
            {comparison && (
              <div className="space-y-4">
                {/* Meta */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono text-slate-500 mb-1">BEFORE / AFTER BENCHMARK — NEWS-503 FAILURE SCENARIO</div>
                    <h3 className="text-white font-bold text-sm">{comparison.scenario}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500 font-mono">N = {comparison.n} iterations per phase</div>
                    <div className="text-[10px] text-slate-600 font-mono">{new Date(comparison.generatedAt).toLocaleString()}</div>
                  </div>
                </div>

                {/* Comparison Table */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-white">Performance Metrics</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      &ldquo;Before&rdquo; = news fails, no retry. &ldquo;After&rdquo; = news fails, retry-with-backoff + better replanner decision recording.
                    </p>
                  </div>
                  <table className="w-full text-sm font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 text-xs">
                        <th className="text-left px-4 py-3">Metric</th>
                        <th className="text-right px-4 py-3">BEFORE</th>
                        <th className="text-right px-4 py-3">AFTER</th>
                        <th className="text-right px-4 py-3">CHANGE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { key: "avgLatencyMs", label: "Avg Latency (ms)", unit: "ms", positiveIsGood: false },
                        { key: "p95LatencyMs", label: "P95 Latency (ms)", unit: "ms", positiveIsGood: false },
                        { key: "avgErrors", label: "Avg Errors per Run", unit: "", positiveIsGood: false },
                        { key: "avgSourcesRetrieved", label: "Avg Sources Retrieved", unit: "", positiveIsGood: true },
                        { key: "avgConfidenceScore", label: "Avg Confidence Score (%)", unit: "%", positiveIsGood: true },
                        { key: "successRate", label: "Success Rate", unit: "%", positiveIsGood: true },
                        { key: "avgReplans", label: "Avg Replans Triggered", unit: "", positiveIsGood: false },
                      ].map(({ key, label, unit, positiveIsGood }) => {
                        const bv = comparison.before[key] ?? 0;
                        const av = comparison.after[key] ?? 0;
                        const changeKey = key.replace("avgL", "latencyMs").replace("avgE", "errorCount");
                        const impKey = Object.keys(comparison.improvement).find(
                          (k) => k.toLowerCase().includes(key.replace("avg", "").replace("Rate", "Rate").toLowerCase())
                        );
                        const delta = impKey ? comparison.improvement[impKey] : av - bv;
                        const isRate = unit === "%";
                        const fmt = (v: number) => isRate && v <= 1 ? `${(v * 100).toFixed(1)}%` : `${v}${unit}`;

                        return (
                          <tr key={key} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-3 text-slate-300">{label}</td>
                            <td className="px-4 py-3 text-right text-slate-400">{fmt(bv)}</td>
                            <td className="px-4 py-3 text-right text-white font-bold">{fmt(av)}</td>
                            <td className="px-4 py-3 text-right">
                              <DeltaCell value={delta} unit={unit} positiveIsGood={positiveIsGood} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Interpretation */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                  <div className="text-[10px] font-mono text-violet-400 mb-2">INTERPRETATION</div>
                  <div className="space-y-2 text-sm text-slate-300">
                    <p>
                      <span className="text-cyan-300 font-semibold">Root cause: </span>
                      News API 503 caused the pipeline to enter recovery mode with 0 live news sources.
                      Synthesis proceeded with only KB-grounded context, depressing confidence.
                    </p>
                    <p>
                      <span className="text-emerald-300 font-semibold">Fix applied: </span>
                      Added retry-with-exponential-backoff (2 retries, 500ms/1000ms) to <code className="text-cyan-300 bg-slate-800 px-1 rounded">news.ts</code>.
                      Replanner decisions now recorded as structured spans, enabling the confidence judge
                      to award credit for KB-backed synthesis.
                    </p>
                    <p>
                      <span className="text-amber-300 font-semibold">Note: </span>
                      Benchmark uses <code className="text-cyan-300 bg-slate-800 px-1 rounded">forceNewsFailure=true</code> for reproducibility.
                      Both phases inject the same 503 error; the measurable difference is in
                      replanner observability and confidence scoring, not in API retries
                      (retries apply to real 503s, not to controlled demo failures).
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
