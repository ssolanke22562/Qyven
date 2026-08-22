"use client";

import React, { useEffect, useState } from "react";
import { ScorecardView, MetricValue } from "@/types/evalScorecard";
import { BarChart3, Activity, RefreshCw, FileText, ArrowUpRight, ChevronDown, ChevronUp } from "lucide-react";

function fmtRatio(v: MetricValue | undefined): string {
  if (v === undefined || v === "unscored") return "unscored";
  return `${(v * 100).toFixed(1)}%`;
}

function fmtMs(v: MetricValue | undefined): string {
  if (v === undefined || v === "unscored") return "unscored";
  return `${v.toFixed(0)} ms`;
}

export function EvalScorecardSection() {
  const [scorecard, setScorecard] = useState<ScorecardView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPerCase, setShowPerCase] = useState(false);

  const loadScorecard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/eval/scorecard");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load scorecard");
      setScorecard(data.scorecard);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScorecard();
  }, []);

  return (
    <section id="eval-scorecard" className="relative py-20 px-4 sm:px-6 bg-slate-950/90 border-t border-slate-900 overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/2 left-1/3 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10 border-b border-slate-800/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-xs mb-3 shadow-cyan-glow">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>HACKATHON EVALUATION HARNESS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-white">
              Evaluation <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-amber-300">Scorecard</span>
            </h2>
            <p className="text-slate-400 mt-2 text-sm sm:text-base max-w-2xl">
              Empirical benchmark evaluating Qyven&apos;s multi-agent state graph pipeline against a single-LLM direct baseline across 36 test cases in 6 categories.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadScorecard}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/90 border border-cyan-500/40 text-cyan-300 hover:text-white hover:bg-slate-800/90 transition-all text-xs font-mono shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Eval</span>
            </button>
            <a
              href="/eval-dashboard"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold font-mono text-xs hover:bg-cyan-400 transition-all shadow-cyan-glow"
            >
              <span>Full Dashboard</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Loading State */}
        {loading && !scorecard && (
          <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center font-mono text-sm text-cyan-400 animate-pulse">
            Loading Evaluation Harness Scorecard...
          </div>
        )}

        {/* Error State */}
        {error && !scorecard && (
          <div className="p-6 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-300 text-sm font-mono flex items-center justify-between">
            <span>⚠ {error}</span>
            <button onClick={loadScorecard} className="underline text-xs">Retry</button>
          </div>
        )}

        {/* Scorecard Display */}
        {scorecard && (
          <div className="space-y-8">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] uppercase font-mono text-slate-400">Total Cases</div>
                <div className="text-xl font-heading font-extrabold text-white mt-1">
                  {scorecard.overall.caseCount} <span className="text-xs font-normal text-slate-400">(6 categories)</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] uppercase font-mono text-slate-400">Overall Accuracy</div>
                <div className="text-xl font-heading font-extrabold text-emerald-400 mt-1">
                  {fmtRatio(scorecard.overall.accuracy)}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] uppercase font-mono text-slate-400">Groundedness</div>
                <div className="text-xl font-heading font-extrabold text-cyan-400 mt-1">
                  {fmtRatio(scorecard.overall.groundedness)}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] uppercase font-mono text-slate-400">Consistency</div>
                <div className="text-xl font-heading font-extrabold text-violet-400 mt-1">
                  {fmtRatio(scorecard.overall.consistency)}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] uppercase font-mono text-slate-400">Recovery Rate</div>
                <div className="text-xl font-heading font-extrabold text-amber-400 mt-1">
                  {fmtRatio(scorecard.overall.recoveryRate)}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] uppercase font-mono text-slate-400">Mean Latency</div>
                <div className="text-xl font-heading font-extrabold text-slate-200 mt-1">
                  {fmtMs(scorecard.overall.latencyMeanMs)}
                </div>
              </div>
            </div>

            {/* Category Breakdown Table */}
            <div className="rounded-2xl border border-cyan-500/30 bg-slate-950/90 overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-heading font-bold text-white text-base sm:text-lg">Category Metrics Breakdown</h3>
                </div>
                <div className="text-xs font-mono text-slate-400">
                  Baseline = Single Direct LLM Call
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800 bg-slate-900/30">
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Cases</th>
                      <th className="px-4 py-3">Accuracy</th>
                      <th className="px-4 py-3">Groundedness</th>
                      <th className="px-4 py-3">Hallucination</th>
                      <th className="px-4 py-3">Consistency</th>
                      <th className="px-4 py-3">Recovery</th>
                      <th className="px-4 py-3">Uncertainty</th>
                      <th className="px-4 py-3">Latency (mean)</th>
                      <th className="px-4 py-3">Δ Groundedness vs Baseline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {scorecard.byCategory.map((row) => (
                      <tr key={row.category} className="hover:bg-slate-900/40 transition-colors">
                        <td className="px-4 py-3.5 font-mono font-bold text-cyan-300 capitalize">{row.category}</td>
                        <td className="px-4 py-3.5 text-slate-400">{row.caseCount}</td>
                        <td className="px-4 py-3.5 font-semibold text-emerald-400">{fmtRatio(row.accuracy)}</td>
                        <td className="px-4 py-3.5 font-semibold text-cyan-300">{fmtRatio(row.groundedness)}</td>
                        <td className="px-4 py-3.5 text-slate-400">{fmtRatio(row.hallucinationRate)}</td>
                        <td className="px-4 py-3.5 text-violet-300">{fmtRatio(row.consistency)}</td>
                        <td className="px-4 py-3.5 text-amber-300">{fmtRatio(row.recoveryRate)}</td>
                        <td className="px-4 py-3.5 text-slate-300">{fmtRatio(row.uncertaintyHandling)}</td>
                        <td className="px-4 py-3.5 font-mono text-slate-400">{fmtMs(row.latencyMeanMs)}</td>
                        <td className="px-4 py-3.5 font-mono text-cyan-400 font-bold">{fmtRatio(row.baselineGroundednessDelta)}</td>
                      </tr>
                    ))}
                    <tr className="bg-cyan-950/30 font-bold border-t-2 border-cyan-500/40">
                      <td className="px-4 py-4 font-mono text-emerald-400 uppercase tracking-wider">OVERALL AVERAGE</td>
                      <td className="px-4 py-4 text-slate-300">{scorecard.overall.caseCount}</td>
                      <td className="px-4 py-4 text-emerald-400">{fmtRatio(scorecard.overall.accuracy)}</td>
                      <td className="px-4 py-4 text-cyan-300">{fmtRatio(scorecard.overall.groundedness)}</td>
                      <td className="px-4 py-4 text-slate-300">{fmtRatio(scorecard.overall.hallucinationRate)}</td>
                      <td className="px-4 py-4 text-violet-300">{fmtRatio(scorecard.overall.consistency)}</td>
                      <td className="px-4 py-4 text-amber-300">{fmtRatio(scorecard.overall.recoveryRate)}</td>
                      <td className="px-4 py-4 text-slate-300">{fmtRatio(scorecard.overall.uncertaintyHandling)}</td>
                      <td className="px-4 py-4 font-mono text-slate-300">{fmtMs(scorecard.overall.latencyMeanMs)}</td>
                      <td className="px-4 py-4 font-mono text-cyan-400">{fmtRatio(scorecard.overall.baselineGroundednessDelta)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Toggleable Per-Case Summary */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden">
              <button
                onClick={() => setShowPerCase(!showPerCase)}
                className="w-full px-6 py-4 flex items-center justify-between bg-slate-900/40 hover:bg-slate-900/70 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-violet-400" />
                  <span className="font-heading font-bold text-white text-sm sm:text-base">Per-Case Detailed Telemetry ({scorecard.perCase.length} Cases)</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-400">
                  <span>{showPerCase ? "Hide Details" : "Show All 36 Cases"}</span>
                  {showPerCase ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {showPerCase && (
                <div className="overflow-x-auto max-h-[480px] overflow-y-auto border-t border-slate-800">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-slate-950">
                      <tr className="text-left text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                        <th className="px-4 py-3">Case ID</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Accuracy</th>
                        <th className="px-4 py-3">Groundedness</th>
                        <th className="px-4 py-3">Consistency</th>
                        <th className="px-4 py-3">Recovery</th>
                        <th className="px-4 py-3">Uncertainty</th>
                        <th className="px-4 py-3">Latency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 font-mono">
                      {scorecard.perCase.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-900/40">
                          <td className="px-4 py-2.5 font-bold text-cyan-300">{row.id}</td>
                          <td className="px-4 py-2.5 text-slate-400">{row.category}</td>
                          <td className="px-4 py-2.5 text-emerald-400">{fmtRatio(row.accuracy)}</td>
                          <td className="px-4 py-2.5 text-cyan-400">{fmtRatio(row.groundedness)}</td>
                          <td className="px-4 py-2.5 text-violet-300">{fmtRatio(row.consistency)}</td>
                          <td className="px-4 py-2.5 text-amber-300">{row.recovery === "unscored" ? "—" : row.recovery ? "yes" : "no"}</td>
                          <td className="px-4 py-2.5 text-slate-400">{row.uncertaintyHandled === "unscored" ? "—" : row.uncertaintyHandled ? "yes" : "no"}</td>
                          <td className="px-4 py-2.5 text-slate-300">{row.latencyMeanMs.toFixed(0)} ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
