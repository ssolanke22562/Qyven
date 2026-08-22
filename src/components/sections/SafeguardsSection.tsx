"use client";

import React, { useState } from "react";
import { SAFEGUARDS_DATA } from "@/data/safeguardsData";
import { ShieldCheck, Cpu, Layers, Filter, Zap, ChevronDown, ChevronUp, Code2, CheckCircle2 } from "lucide-react";

export function SafeguardsSection() {
  const [expandedId, setExpandedId] = useState<number | null>(1);

  const iconMap: Record<string, any> = {
    ShieldCheck,
    Cpu,
    Layers,
    Filter,
    Zap,
  };

  return (
    <section
      id="safeguards"
      className="relative min-h-screen w-full py-20 px-4 sm:px-6 bg-slate-950 flex flex-col justify-center overflow-hidden border-t border-slate-900"
    >
      {/* Background radial highlight */}
      <div className="absolute top-1/3 left-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 max-w-5xl mx-auto text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-mono text-xs mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>PRODUCTION RESILIENCE & INTEGRITY</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-heading font-extrabold text-white tracking-tight">
          5 Strategic <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-emerald-400 to-violet-400">Architecture Safeguards</span>
        </h2>
        <p className="mt-3 text-slate-400 max-w-2xl mx-auto text-sm sm:text-base font-sans">
          Engineered to eliminate hallucinated links, survive API rate limits, deduplicate high-frequency news, and maintain sub-second graph traversal at enterprise scale.
        </p>
      </div>

      {/* 5 Safeguard Accordion Cards */}
      <div className="relative z-10 max-w-4xl mx-auto space-y-4 w-full">
        {SAFEGUARDS_DATA.map((item) => {
          const isExpanded = expandedId === item.id;
          const IconComp = iconMap[item.iconName] || ShieldCheck;

          return (
            <div
              key={item.id}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden backdrop-blur-xl ${
                isExpanded
                  ? "bg-slate-900/90 border-cyan-500/50 shadow-cyan-glow"
                  : "bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70"
              }`}
            >
              {/* Header Bar */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 select-none"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm shrink-0"
                    style={{
                      backgroundColor: `${item.color}20`,
                      color: item.color,
                      border: `1px solid ${item.color}40`,
                    }}
                  >
                    0{item.id}
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-heading font-bold text-white flex items-center gap-2">
                      {item.title}
                    </h3>
                    <span className="text-xs font-mono text-cyan-400">
                      {item.subtitle}
                    </span>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-800/80 text-slate-400">
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>

              {/* Expanded Detail Body */}
              {isExpanded && (
                <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-slate-800 space-y-4 animate-in fade-in duration-200">
                  
                  {/* Principle & Implementation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                        Core Vulnerability Prevented
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        {item.principle}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold block">
                        Technical Implementation
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        {item.implementation}
                      </p>
                    </div>
                  </div>

                  {/* Impact Metric Banner */}
                  <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-mono text-emerald-300">
                      <strong>Measured Impact:</strong> {item.impact}
                    </span>
                  </div>

                  {/* Code Implementation Sample */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                      <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Production Routine Snippet</span>
                    </div>
                    <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-200/90 overflow-x-auto leading-relaxed">
                      <code>{item.codeSample}</code>
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
