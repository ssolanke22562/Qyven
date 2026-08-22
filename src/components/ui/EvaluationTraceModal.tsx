"use client";

import React from "react";
import { X, CheckCircle, AlertTriangle, Cpu, ShieldCheck, Clock, Zap, FileText, ArrowRight, Activity, CornerDownRight } from "lucide-react";
import { PipelineTelemetry, BaselineRunRecord } from "../../../eval/types";

interface EvaluationTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseItem: {
    id: string;
    category: string;
    query: string;
    expectedBehavior: string;
    passed: boolean;
    accuracy: number | "unscored";
    groundedness: number | "unscored";
    consistency: number | "unscored";
    recovery: boolean | "unscored";
    uncertaintyHandled: boolean | "unscored";
    unsupportedRefused: boolean | "unscored";
    evidenceQuality: number | "unscored";
    latencyMeanMs: number;
    baselineAccuracyDelta: number | "unscored";
    telemetry: PipelineTelemetry | null;
    baseline: BaselineRunRecord | null;
    rawPayload?: any;
  } | null;
}

function fmtVal(v: number | "unscored" | undefined): string {
  if (v === undefined || v === "unscored") return "N/A";
  return `${(v * 100).toFixed(1)}%`;
}

export function EvaluationTraceModal({ isOpen, onClose, caseItem }: EvaluationTraceModalProps) {
  if (!isOpen || !caseItem) return null;

  const rawState = caseItem.rawPayload?.qyvenState || caseItem.rawPayload;
  const executionHistory = rawState?.executionHistory || [];
  const checkpoints = rawState?.checkpoints || [];
  const confidence = rawState?.confidence || {};
  const evidenceTable = rawState?.evidenceTable || [];
  const conflicts = rawState?.conflicts || [];
  const finalReport = rawState?.finalReport;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-500/30 text-cyan-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-cyan-300 uppercase tracking-wider">{caseItem.id}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
                  {caseItem.category}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${caseItem.passed ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40" : "bg-red-950 text-red-300 border border-red-500/40"}`}>
                  {caseItem.passed ? "PASS" : "FAIL"}
                </span>
              </div>
              <h3 className="text-base font-heading font-bold text-white mt-0.5">
                Evaluation Trace & Agent Execution Graph
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto font-sans text-sm">
          {/* Query & Expected Behavior */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="text-[10px] font-mono uppercase text-slate-400 mb-1">User Query</div>
              <p className="text-slate-200 font-medium text-sm">&ldquo;{caseItem.query}&rdquo;</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="text-[10px] font-mono uppercase text-cyan-400 mb-1">Expected Agent Behavior</div>
              <p className="text-slate-300 text-xs font-mono">{caseItem.expectedBehavior}</p>
            </div>
          </div>

          {/* Metric Score Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-center">
              <div className="text-[10px] font-mono uppercase text-slate-400">Accuracy</div>
              <div className="text-base font-bold text-emerald-400 mt-0.5">{fmtVal(caseItem.accuracy)}</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-center">
              <div className="text-[10px] font-mono uppercase text-slate-400">Groundedness</div>
              <div className="text-base font-bold text-cyan-300 mt-0.5">{fmtVal(caseItem.groundedness)}</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-center">
              <div className="text-[10px] font-mono uppercase text-slate-400">Consistency</div>
              <div className="text-base font-bold text-violet-300 mt-0.5">{fmtVal(caseItem.consistency)}</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-center">
              <div className="text-[10px] font-mono uppercase text-slate-400">Recovery</div>
              <div className="text-base font-bold text-amber-300 mt-0.5">
                {caseItem.recovery === "unscored" ? "N/A" : caseItem.recovery ? "RECOVERED" : "UNRECOVERED"}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-center">
              <div className="text-[10px] font-mono uppercase text-slate-400">Uncertainty</div>
              <div className="text-base font-bold text-slate-200 mt-0.5">
                {caseItem.uncertaintyHandled === "unscored" ? "N/A" : caseItem.uncertaintyHandled ? "DETECTED" : "PASSED"}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-center">
              <div className="text-[10px] font-mono uppercase text-slate-400">Mean Latency</div>
              <div className="text-base font-bold text-slate-300 mt-0.5">{caseItem.latencyMeanMs.toFixed(0)} ms</div>
            </div>
          </div>

          {/* Special Demarcation Badges for Hackathon Judges */}
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30">
            <span className="text-xs font-mono font-bold text-cyan-300 uppercase">Evaluation Indicators:</span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs font-bold border ${caseItem.unsupportedRefused ? "bg-emerald-950 text-emerald-300 border-emerald-500/40" : "bg-slate-900 text-slate-400 border-slate-700"}`}>
              {caseItem.unsupportedRefused ? <CheckCircle className="w-3.5 h-3.5" /> : null}
              <span>UNSUPPORTED CONCLUSION REFUSED: {caseItem.unsupportedRefused ? "PASS" : "N/A"}</span>
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs font-bold border ${caseItem.uncertaintyHandled ? "bg-amber-950 text-amber-300 border-amber-500/40" : "bg-slate-900 text-slate-400 border-slate-700"}`}>
              {caseItem.uncertaintyHandled ? <AlertTriangle className="w-3.5 h-3.5" /> : null}
              <span>UNCERTAINTY DETECTED: {caseItem.uncertaintyHandled ? "PASS" : "N/A"}</span>
            </span>
          </div>

          {/* Execution Step Trace Timeline */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-white text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Multi-Agent State Graph Execution Trace</span>
            </h4>

            {executionHistory.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 font-mono text-xs text-slate-400">
                No step-by-step history logged for this run record.
              </div>
            ) : (
              <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {executionHistory.map((step: any, idx: number) => (
                  <div key={idx} className="relative group">
                    <div className={`absolute -left-[21px] top-1.5 w-3 h-3 rounded-full border ${step.status === "SUCCESS" ? "bg-emerald-500 border-emerald-300" : step.status === "FAILURE" ? "bg-red-500 border-red-300" : step.status === "RECOVERY" || step.status === "REPLAN" ? "bg-amber-500 border-amber-300" : "bg-cyan-500 border-cyan-300"}`} />
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 hover:border-slate-700 transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-cyan-300">{step.nodeName}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">{step.agentRole}</span>
                          <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${step.status === "SUCCESS" ? "text-emerald-400 bg-emerald-950/50" : step.status === "FAILURE" ? "text-red-400 bg-red-950/50" : step.status === "RECOVERY" ? "text-amber-400 bg-amber-950/50" : "text-cyan-400 bg-cyan-950/50"}`}>
                            {step.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
                          {step.executionTimeMs ? <span>{step.executionTimeMs}ms</span> : null}
                          <span>{step.timestamp}</span>
                        </div>
                      </div>
                      <p className="text-slate-300 text-xs mt-1 font-mono leading-relaxed">{step.message}</p>
                      {step.details ? (
                        <pre className="mt-2 p-2 rounded bg-slate-900 text-[11px] font-mono text-slate-400 overflow-x-auto">
                          {JSON.stringify(step.details, null, 2)}
                        </pre>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Evidence & Conflict Resolution Detail */}
          {evidenceTable.length > 0 || conflicts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="text-xs font-mono font-bold text-cyan-400 uppercase">Retrieved Evidence Table ({evidenceTable.length})</div>
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {evidenceTable.map((ev: any, idx: number) => (
                    <div key={idx} className="p-2 rounded bg-slate-900/90 text-xs border border-slate-800">
                      <div className="text-slate-200 font-medium">{ev.claim}</div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1">
                        <span>Source: {ev.source} ({ev.sourceType})</span>
                        <span className="text-cyan-400">Reliability: {(ev.reliabilityScore * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="text-xs font-mono font-bold text-amber-400 uppercase">Conflicts & Uncertainty Resolution ({conflicts.length})</div>
                {conflicts.length === 0 ? (
                  <div className="text-xs text-slate-400 font-mono py-4">No conflicting claims detected.</div>
                ) : (
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {conflicts.map((conf: any, idx: number) => (
                      <div key={idx} className="p-2 rounded bg-slate-900/90 text-xs border border-amber-900/40">
                        <div className="text-amber-300 font-medium">Topic: {conf.topic}</div>
                        <div className="text-[11px] text-slate-300 mt-1 font-mono">{conf.resolutionReasoning || "Resolved via source reliability hierarchy"}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Baseline vs Qyven Comparison */}
          {caseItem.baseline ? (
            <div className="p-4 rounded-xl bg-slate-950/90 border border-violet-500/30 space-y-2">
              <div className="text-xs font-mono font-bold text-violet-300 uppercase">Single LLM Baseline Response</div>
              <p className="text-xs text-slate-300 font-mono leading-relaxed bg-slate-900 p-3 rounded-lg border border-slate-800 max-h-32 overflow-y-auto">
                {caseItem.baseline.responseText || "No baseline text available."}
              </p>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between text-xs font-mono text-slate-400">
          <div>Session ID: {rawState?.sessionId || caseItem.rawPayload?.sessionId || caseItem.id}</div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Close Trace
          </button>
        </div>
      </div>
    </div>
  );
}
