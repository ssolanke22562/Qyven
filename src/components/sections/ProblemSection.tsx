"use client";

import React from "react";
import { AlertTriangle, Sparkles, ArrowRight, ShieldAlert, Cpu } from "lucide-react";

export function ProblemSection() {
  const scrollToSimulator = () => {
    const el = document.getElementById("oracle-simulator");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative w-full py-16 px-4 sm:px-6 bg-slate-950/90 border-t border-slate-900 overflow-hidden">
      {/* Background cyber glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6 text-center sm:text-left">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/40 border border-rose-500/30 text-rose-400 font-mono text-xs">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>THE STRATEGIC CHALLENGE</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-white tracking-tight">
            The Problem: <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-cyan-400">Scattered Signals & Fragmented Intelligence</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-300 leading-relaxed font-sans">
            <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/20 space-y-2">
              <h3 className="font-mono font-bold text-rose-300 text-xs uppercase flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                The Pain Point
              </h3>
              <p>
                Product and strategy teams currently waste dozens of hours manually tracking competitor moves across fragmented channels — from patent filings and ArXiv preprints to press releases and social signals. By the time scattered data points are manually assembled, competitors have already launched their counter-strategies, leaving teams reactive and vulnerable to market disruption.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 space-y-2">
              <h3 className="font-mono font-bold text-cyan-300 text-xs uppercase flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                The AgentX Solution
              </h3>
              <p>
                AgentX automates multi-source ingestion into a self-organizing 3D knowledge graph, continuously analyzing relationship topologies and vector similarity. By combining real-time ArXiv paper research and market news tool-calling with graph-grounded reasoning, AgentX synthesizes authoritative threat dossiers in seconds.
              </p>
            </div>
          </div>

          <div className="pt-4 flex justify-center sm:justify-start">
            <button
              onClick={scrollToSimulator}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-slate-950 font-mono font-bold text-xs flex items-center gap-2 shadow-[0_0_30px_rgba(0,240,255,0.3)] hover:shadow-[0_0_40px_rgba(0,240,255,0.5)] transition-all transform hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Try the Live Demo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
