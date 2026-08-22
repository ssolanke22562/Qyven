"use client";

import React, { useState } from "react";
import { PipelineStage } from "@/types";
import { X, Check, Copy, Code2, ArrowRight, Activity, Terminal, Shield } from "lucide-react";

interface PipelineDetailDrawerProps {
  stage: PipelineStage | null;
  onClose: () => void;
}

export function PipelineDetailDrawer({ stage, onClose }: PipelineDetailDrawerProps) {
  const [copied, setCopied] = useState(false);

  if (!stage) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(stage.codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[560px] bg-slate-950/95 border-l border-cyan-500/30 backdrop-blur-2xl shadow-2xl overflow-y-auto flex flex-col transition-all duration-300 animate-in slide-in-from-right-8"
      role="dialog"
      aria-label="Pipeline Stage Details"
    >
      {/* Top Header */}
      <div className="sticky top-0 z-10 px-6 py-4 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: stage.color }}
          />
          <span className="font-mono text-xs uppercase tracking-widest text-slate-400">
            Pipeline Architecture // {stage.week}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close Pipeline Detail"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-6 flex-1">
        {/* Stage Identity */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase"
              style={{ backgroundColor: `${stage.color}20`, color: stage.color, border: `1px solid ${stage.color}40` }}
            >
              {stage.script}
            </span>
          </div>
          <h2 className="text-2xl font-heading font-extrabold text-white mt-1">
            {stage.name}
          </h2>
          <p className="text-sm font-mono text-cyan-400 mt-0.5">
            {stage.role}
          </p>
        </div>

        {/* Overview Summary */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-slate-300 leading-relaxed">
          {stage.summary}
        </div>

        {/* Telemetry Metrics */}
        <div className="grid grid-cols-3 gap-2">
          {stage.metrics.map((m, i) => (
            <div key={i} className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-center">
              <span className="block text-[10px] font-mono text-slate-400 uppercase">{m.label}</span>
              <strong className="text-sm font-mono font-bold text-white mt-1 block">{m.value}</strong>
            </div>
          ))}
        </div>

        {/* Input Data Flow vs Output Data Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              Ingested Inputs
            </span>
            <ul className="space-y-1.5">
              {stage.inputs.map((inp, idx) => (
                <li key={idx} className="text-xs text-slate-300 font-sans flex items-start gap-1.5">
                  <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{inp}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              Synthesized Outputs
            </span>
            <ul className="space-y-1.5">
              {stage.outputs.map((out, idx) => (
                <li key={idx} className="text-xs text-slate-300 font-sans flex items-start gap-1.5">
                  <Check className="w-3 h-3 text-violet-400 shrink-0 mt-0.5" />
                  <span>{out}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Core Architecture Capabilities */}
        <div className="space-y-2">
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-400" />
            Engineering Highlights
          </h4>
          <div className="space-y-2">
            {stage.features.map((feat, i) => (
              <div key={i} className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/80 flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-mono flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-xs text-slate-300 leading-relaxed font-sans">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Source Code Implementation Snippet */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-cyan-400" />
              Core Implementation ({stage.script})
            </span>
            <button
              onClick={handleCopyCode}
              className="text-[11px] font-mono text-cyan-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500 transition-all"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied" : "Copy Code"}
            </button>
          </div>
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 font-mono text-[11px] leading-relaxed">
            <div className="px-4 py-1.5 bg-slate-900/90 border-b border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Python 3.11+ Core Routine</span>
              <span className="text-emerald-400">Validated</span>
            </div>
            <pre className="p-4 text-cyan-200/90 overflow-x-auto selection:bg-cyan-500/30">
              <code>{stage.codeSnippet}</code>
            </pre>
          </div>
        </div>
      </div>
    </aside>
  );
}
