"use client";

import React from "react";
import { Sparkles, Github, Shield, ArrowUp } from "lucide-react";

interface FooterSectionProps {
  onOpenArchitecture?: () => void;
}

export function FooterSection({ onOpenArchitecture }: FooterSectionProps) {
  const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL || "";
  const archDocUrl = process.env.NEXT_PUBLIC_ARCHITECTURE_DOC_URL || "";

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative w-full py-16 px-4 sm:px-8 bg-slate-950 border-t border-slate-850 overflow-hidden">
      {/* Ambient faint background grid */}
      <div className="absolute inset-0 bg-cyber-grid bg-[size:32px_32px] opacity-10 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        
        {/* Brand & Project Info */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center p-0.5 shadow-cyan-glow">
              <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <span className="font-heading font-extrabold text-lg tracking-wider text-white">
              AGENT<span className="text-cyan-400">X</span>
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 font-mono">
              powered by the InsightScout Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-sm font-sans leading-relaxed">
            Autonomous competitor intelligence & research agent built with Next.js, React Three Fiber, Groq LPU, Google Gemini API, and multi-relational knowledge graphs.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-slate-400">
          {archDocUrl ? (
            <a
              href={archDocUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-cyan-400 transition-colors flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-violet-400" />
              <span>Architecture Whitepaper</span>
            </a>
          ) : (
            <button
              onClick={onOpenArchitecture}
              className="hover:text-cyan-400 transition-colors flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-violet-400" />
              <span>Architecture Whitepaper</span>
            </button>
          )}

          <a href="#pipeline" className="hover:text-cyan-400 transition-colors">
            3D Pipeline Flow
          </a>

          <a href="#graph-demo" className="hover:text-cyan-400 transition-colors">
            3D Graph Demo
          </a>

          <a href="#oracle-simulator" className="hover:text-cyan-400 transition-colors">
            Ask Oracle
          </a>

          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-cyan-400 transition-colors flex items-center gap-1.5"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub Repository</span>
            </a>
          )}
        </div>

        {/* Back to top button */}
        <button
          onClick={scrollToTop}
          className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/60 text-slate-400 hover:text-white transition-all shadow-lg group"
          aria-label="Back to Top"
        >
          <ArrowUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>System Status: All Ingestion & Graph Nodes Operational</span>
        </div>
        <span>Hackathon Project Showcase 2026 // AgentX</span>
      </div>
    </footer>
  );
}
