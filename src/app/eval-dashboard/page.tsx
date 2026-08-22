"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, BarChart3, RefreshCw, FileText, ArrowLeft } from "lucide-react";
import { ScorecardView, MetricValue } from "@/types/evalScorecard";

function fmtRatio(v: MetricValue | undefined): string {
  if (v === undefined || v === "unscored") return "unscored";
  return `${(v * 100).toFixed(1)}%`;
}

function fmtMs(v: MetricValue | undefined): string {
  if (v === undefined || v === "unscored") return "unscored";
  return `${v.toFixed(0)} ms`;
}

export default function EvalDashboardPage() {
  const [scorecard, setScorecard] = useState<ScorecardView | null>(null);
  const [meta, setMeta] = useState<{ runId: string; mode: string; startedAt: string; finishedAt: string; env: Record<string, boolean> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/eval/scorecard");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setScorecard(data.scorecard);
      setMeta(data.manifest);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-cyan-400 text-sm mb-3 hover:text-cyan-300">
              <ArrowLeft className="w-4 h-4" /> Back to showcase
            </Link>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-mono text-xs mb-2">
              <BarChart3 className="w-4 h-4" />
              QYVEN EVAL HARNESS
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-white">
              Evaluation <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">Scorecard</span>
            </h1>
            <p className="text-slate-400 mt-2 text-sm max-w-2xl">
              Multi-agent pipeline metrics vs single-LLM baseline. Run <code className="text-cyan-300">npm run eval</code> to refresh.
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-600/30 transition-colors text-sm font-mono"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {loading && (
          <div className="text-slate-400 font-mono text-sm animate-pulse">Loading scorecard...</div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-sm">
            {error}
          </div>
        )}

        {scorecard && meta && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Run ID", value: meta.runId.slice(0, 20) + "..." },
                { label: "Mode", value: meta.mode },
                { label: "Cases", value: String(scorecard.overall.caseCount) },
                { label: "Overall Accuracy", value: fmtRatio(scorecard.overall.accuracy) },
              ].map((item) => (
                <div key={item.label} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] uppercase font-mono text-slate-500">{item.label}</div>
                  <div className="text-lg font-heading font-bold text-white mt-1">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-cyan-500/30 bg-slate-950/90 overflow-hidden mb-8">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                <h2 className="font-heading font-bold text-white">Metrics by Category</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 font-mono text-[10px] uppercase border-b border-slate-800">
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Accuracy</th>
                      <th className="px-4 py-3">Groundedness</th>
                      <th className="px-4 py-3">Hallucination</th>
                      <th className="px-4 py-3">Consistency</th>
                      <th className="px-4 py-3">Recovery</th>
                      <th className="px-4 py-3">Uncertainty</th>
                      <th className="px-4 py-3">Latency</th>
                      <th className="px-4 py-3">Δ vs Baseline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scorecard.byCategory.map((row) => (
                      <tr key={row.category} className="border-b border-slate-900 hover:bg-slate-900/50">
                        <td className="px-4 py-3 font-mono text-cyan-300">{row.category}</td>
                        <td className="px-4 py-3">{fmtRatio(row.accuracy)}</td>
                        <td className="px-4 py-3">{fmtRatio(row.groundedness)}</td>
                        <td className="px-4 py-3">{fmtRatio(row.hallucinationRate)}</td>
                        <td className="px-4 py-3">{fmtRatio(row.consistency)}</td>
                        <td className="px-4 py-3">{fmtRatio(row.recoveryRate)}</td>
                        <td className="px-4 py-3">{fmtRatio(row.uncertaintyHandling)}</td>
                        <td className="px-4 py-3">{fmtMs(row.latencyMeanMs)}</td>
                        <td className="px-4 py-3">{fmtRatio(row.baselineAccuracyDelta)}</td>
                      </tr>
                    ))}
                    <tr className="bg-cyan-950/20 font-bold">
                      <td className="px-4 py-3 font-mono text-emerald-400">overall</td>
                      <td className="px-4 py-3">{fmtRatio(scorecard.overall.accuracy)}</td>
                      <td className="px-4 py-3">{fmtRatio(scorecard.overall.groundedness)}</td>
                      <td className="px-4 py-3">{fmtRatio(scorecard.overall.hallucinationRate)}</td>
                      <td className="px-4 py-3">{fmtRatio(scorecard.overall.consistency)}</td>
                      <td className="px-4 py-3">{fmtRatio(scorecard.overall.recoveryRate)}</td>
                      <td className="px-4 py-3">{fmtRatio(scorecard.overall.uncertaintyHandling)}</td>
                      <td className="px-4 py-3">{fmtMs(scorecard.overall.latencyMeanMs)}</td>
                      <td className="px-4 py-3">{fmtRatio(scorecard.overall.baselineAccuracyDelta)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/90 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-violet-400" />
                <h2 className="font-heading font-bold text-white">Per-Case Results</h2>
              </div>
              <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-950">
                    <tr className="text-left text-slate-500 font-mono text-[10px] uppercase border-b border-slate-800">
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Accuracy</th>
                      <th className="px-4 py-3">Groundedness</th>
                      <th className="px-4 py-3">Recovery</th>
                      <th className="px-4 py-3">Uncertainty</th>
                      <th className="px-4 py-3">Latency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scorecard.perCase.map((row) => (
                      <tr key={row.id} className="border-b border-slate-900 hover:bg-slate-900/50">
                        <td className="px-4 py-2 font-mono text-slate-300">{row.id}</td>
                        <td className="px-4 py-2">{row.category}</td>
                        <td className="px-4 py-2">{fmtRatio(row.accuracy)}</td>
                        <td className="px-4 py-2">{fmtRatio(row.groundedness)}</td>
                        <td className="px-4 py-2">{row.recovery === "unscored" ? "—" : row.recovery ? "yes" : "no"}</td>
                        <td className="px-4 py-2">{row.uncertaintyHandled === "unscored" ? "—" : row.uncertaintyHandled ? "yes" : "no"}</td>
                        <td className="px-4 py-2">{row.latencyMeanMs.toFixed(0)} ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
