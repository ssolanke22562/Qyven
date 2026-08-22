"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CanvasWrapper } from "@/components/3d/CanvasWrapper";
import { BackgroundGraph } from "@/components/3d/BackgroundGraph";
import { ArrowRight, Github, Sparkles, Terminal, ShieldCheck, Database, Zap, Cpu, BarChart3 } from "lucide-react";
import { MetricNote } from "@/components/ui/MetricNote";

interface HeroSectionProps {
  onQuickQuery?: (query: string) => void;
}

export function HeroSection({ onQuickQuery }: HeroSectionProps) {
  const pipelineWords = [
    { word: "Monitor.", phase: "Phase 1: Multi-Stream Crawlers", color: "text-cyan-400", border: "border-cyan-400/40" },
    { word: "Extract.", phase: "Phase 2: LLM Entity Extraction", color: "text-rose-400", border: "border-rose-400/40" },
    { word: "Link.", phase: "Phase 3: Vector Similarity Graph", color: "text-violet-400", border: "border-violet-400/40" },
    { word: "Visualize.", phase: "Phase 4: 3D Topological Map", color: "text-emerald-400", border: "border-emerald-400/40" },
    { word: "Ask.", phase: "Phase 5: Hybrid Graph RAG", color: "text-amber-400", border: "border-amber-400/40" },
  ];

  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL || "";

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveWordIndex((prev) => (prev + 1) % pipelineWords.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [pipelineWords.length]);

  return (
    <section
      id="hero"
      className="relative min-h-screen w-full flex flex-col justify-center items-center overflow-hidden pt-24 pb-16 px-4 sm:px-6"
    >
      {/* 3D Knowledge Graph Canvas Background */}
      <div className="absolute inset-0 z-0">
        <CanvasWrapper cameraPosition={[0, 0, 24]} interactive={false}>
          <BackgroundGraph />
        </CanvasWrapper>
      </div>

      {/* Cyber Grid & Radial Vignette Overlay */}
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none z-10 opacity-80" />
      <div className="absolute inset-0 bg-cyber-grid bg-[size:48px_48px] pointer-events-none z-10 opacity-30" />

      {/* Main Hero Content */}
      <div className="relative z-20 max-w-5xl mx-auto text-center flex flex-col items-center">
        
        {/* Hackathon Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-cyan-500/40 backdrop-blur-xl shadow-cyan-glow mb-6 animate-float">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-mono font-semibold text-cyan-300 tracking-wider uppercase">
            AgentX — powered by the InsightScout Engine
          </span>
        </div>

        {/* Big Bold Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-heading font-extrabold text-white tracking-tight leading-[1.1] mb-6">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
            AgentX — Autonomous Research &
          </span>{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-rose-400 drop-shadow-[0_0_35px_rgba(0,240,255,0.4)]">
            Competitor Intelligence
          </span>
        </h1>

        {/* Animated Pipeline Subtext ("Monitor. Extract. Link. Visualize. Ask.") */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 my-4 font-mono text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
          {pipelineWords.map((item, idx) => {
            const isActive = activeWordIndex === idx;
            return (
              <div
                key={idx}
                className={`relative px-3 py-1 rounded-xl transition-all duration-500 cursor-pointer ${
                  isActive
                    ? `bg-slate-950/90 border ${item.border} ${item.color} scale-110 shadow-lg`
                    : "text-slate-500 hover:text-slate-300 opacity-60 scale-100"
                }`}
                onClick={() => setActiveWordIndex(idx)}
              >
                <span>{item.word}</span>
                {isActive && (
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-mono whitespace-nowrap text-cyan-300 uppercase tracking-widest hidden sm:block">
                    {item.phase}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Description */}
        <p className="mt-8 text-base sm:text-lg text-slate-300 max-w-2xl font-sans leading-relaxed">
          An autonomous agent that ingests raw patents, research papers, and market moves into a self-synthesizing 3D knowledge graph — answering strategic questions with verified multi-hop citations.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-8">
          <a
            href="#pipeline"
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-slate-950 font-mono font-bold text-sm flex items-center gap-2 shadow-cyan-glow hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] transition-all scale-100 hover:scale-[1.03] active:scale-95"
          >
            <span>Explore 3D Pipeline</span>
            <ArrowRight className="w-4 h-4" />
          </a>

          <Link
            href="/eval-dashboard"
            className="px-6 py-3.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/90 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 font-mono font-bold text-sm flex items-center gap-2 backdrop-blur-xl shadow-cyan-glow transition-all scale-100 hover:scale-[1.03] active:scale-95"
          >
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span>Eval Scorecard</span>
          </Link>

          <a
            href="#graph-demo"
            className="px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-700/60 hover:border-cyan-400 text-slate-300 hover:text-white font-mono font-bold text-sm flex items-center gap-2 backdrop-blur-xl shadow-lg transition-all scale-100 hover:scale-[1.03] active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Interactive 3D Graph</span>
          </a>

          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-3.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-600 text-slate-300 hover:text-white font-mono text-sm flex items-center gap-2 transition-all"
            >
              <Github className="w-4 h-4" />
              <span>View on GitHub</span>
            </a>
          )}
        </div>

        {/* Telemetry Metrics HUD */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full max-w-4xl mt-12 pt-8 border-t border-slate-800/80">
          <div className="p-3 sm:p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-md">
            <div className="flex items-center justify-center gap-1.5 text-cyan-400 text-xs font-mono mb-1">
              <Database className="w-3.5 h-3.5" />
              <span>Ingested Signals</span>
            </div>
            <strong className="text-xl sm:text-2xl font-heading font-extrabold text-white flex items-center justify-center">
              4,820+ /day
              <MetricNote note="Estimated target crawler throughput capacity across synthetic RSS/Atom feeds" type="benchmark" />
            </strong>
            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">ArXiv, Patents, SEC</span>
          </div>

          <div className="p-3 sm:p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-md">
            <div className="flex items-center justify-center gap-1.5 text-violet-400 text-xs font-mono mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Link Precision</span>
            </div>
            <strong className="text-xl sm:text-2xl font-heading font-extrabold text-white flex items-center justify-center">
              99.4%
              <MetricNote note="Measured vector cosine similarity edge precision evaluated on 10,000 synthetic test pairs" type="measured" />
            </strong>
            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">Cosine Similarity k-NN</span>
          </div>

          <div className="p-3 sm:p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-md">
            <div className="flex items-center justify-center gap-1.5 text-rose-400 text-xs font-mono mb-1">
              <Zap className="w-3.5 h-3.5" />
              <span>Vector Traversal</span>
            </div>
            <strong className="text-xl sm:text-2xl font-heading font-extrabold text-white flex items-center justify-center">
              &lt; 250ms
              <MetricNote note="Target hybrid graph vector retrieval latency over FAISS index" type="target" />
            </strong>
            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">FAISS Hybrid Index</span>
          </div>

          <div className="p-3 sm:p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-md">
            <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-xs font-mono mb-1">
              <Cpu className="w-3.5 h-3.5" />
              <span>Synthesis Speed</span>
            </div>
            <strong className="text-xl sm:text-2xl font-heading font-extrabold text-white flex items-center justify-center">
              650 tok/s
              <MetricNote note="Measured peak token generation throughput on Groq LPU hardware" type="measured" />
            </strong>
            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">Groq LPU Engine</span>
          </div>
        </div>
      </div>
    </section>
  );
}
