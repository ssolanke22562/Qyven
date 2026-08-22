"use client";

import React, { useState } from "react";
import { TECH_STACK_ITEMS } from "@/data/techStackData";
import { Terminal, Zap, Layers, Share2, Box, GitBranch, Globe, Database, Activity, Cpu } from "lucide-react";

export function TechStackSection() {
  const iconMap: Record<string, any> = {
    Terminal,
    Zap,
    Layers,
    Share2,
    Box,
    GitBranch,
    Globe,
    Database,
  };

  return (
    <section
      id="tech-stack"
      className="relative min-h-screen w-full py-20 px-4 sm:px-6 bg-slate-950 flex flex-col justify-center overflow-hidden border-t border-slate-900"
    >
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 max-w-5xl mx-auto text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 font-mono text-xs mb-3">
          <Cpu className="w-3.5 h-3.5" />
          <span>PRODUCTION-GRADE FOUNDATION</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-heading font-extrabold text-white tracking-tight">
          Engineered for <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-rose-400">Sub-Second Execution</span>
        </h2>
        <p className="mt-3 text-slate-400 max-w-2xl mx-auto text-sm sm:text-base font-sans">
          Combining asynchronous Python crawling, ultra-fast Groq LPU inference, dense sentence-transformers embeddings, and WebGL 3D hardware acceleration.
        </p>
      </div>

      {/* Tech Cards Grid */}
      <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {TECH_STACK_ITEMS.map((item) => {
          const IconComp = iconMap[item.iconName] || Terminal;

          return (
            <div
              key={item.id}
              className="group relative p-6 rounded-2xl bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 backdrop-blur-xl transition-all duration-300 transform hover:-translate-y-1.5 hover:shadow-[0_0_30px_rgba(0,240,255,0.15)] flex flex-col justify-between"
            >
              <div>
                {/* Card Top */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="p-3 rounded-xl transition-transform group-hover:scale-110 duration-200"
                    style={{
                      backgroundColor: `${item.color}20`,
                      border: `1px solid ${item.color}40`,
                    }}
                  >
                    <IconComp className="w-6 h-6" style={{ color: item.color }} />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {item.category}
                  </span>
                </div>

                {/* Name & Role */}
                <h3 className="text-lg font-heading font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors">
                  {item.name}
                </h3>
                <span className="text-xs font-mono text-slate-400 block mb-3 font-medium">
                  {item.role}
                </span>

                {/* Description */}
                <p className="text-xs text-slate-300/90 leading-relaxed mb-4">
                  {item.description}
                </p>
              </div>

              {/* Card Footer: Latency & Tags */}
              <div className="pt-4 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Benchmark:</span>
                  <strong className="text-cyan-400 font-semibold">{item.latency}</strong>
                </div>

                <div className="flex flex-wrap gap-1">
                  {item.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950/80 text-slate-400 border border-slate-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
