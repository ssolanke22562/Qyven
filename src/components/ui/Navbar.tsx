"use client";

import React, { useState } from "react";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { Shield, Sparkles, Github, Terminal, Menu, X } from "lucide-react";

interface NavbarProps {
  onOpenTerminal?: () => void;
  onOpenArchitecture?: () => void;
}

export function Navbar({ onOpenTerminal, onOpenArchitecture }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeSection = useScrollSpy([
    "hero",
    "pipeline",
    "graph-demo",
    "tech-stack",
    "safeguards",
    "oracle-simulator"
  ]);

  const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL || "";
  const archDocUrl = process.env.NEXT_PUBLIC_ARCHITECTURE_DOC_URL || "";

  const navItems = [
    { label: "Overview", href: "#hero", id: "hero" },
    { label: "3D Pipeline", href: "#pipeline", id: "pipeline" },
    { label: "Live Graph", href: "#graph-demo", id: "graph-demo" },
    { label: "Tech Stack", href: "#tech-stack", id: "tech-stack" },
    { label: "Safeguards", href: "#safeguards", id: "safeguards" },
    { label: "Ask Oracle", href: "#oracle-simulator", id: "oracle-simulator" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-3.5 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-2.5 rounded-2xl bg-slate-950/75 border border-cyan-500/20 backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.8)]">
        
        {/* Brand & Engine Status */}
        <a href="#hero" className="flex items-center gap-3 group">
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center p-0.5 shadow-cyan-glow group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-cyan-400 group-hover:animate-spin" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-extrabold text-sm sm:text-base tracking-wider text-white">
              AGENT<span className="text-cyan-400">X</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-mono text-emerald-400 tracking-wider uppercase font-semibold">
                Autonomous Intelligence Active
              </span>
            </div>
          </div>
        </a>

        {/* Desktop Nav Items */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono tracking-wide transition-all duration-200 ${
                  isActive
                    ? "bg-cyan-500/15 text-cyan-300 border border-cyan-400/40 shadow-[0_0_15px_rgba(0,240,255,0.15)] font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="hidden sm:flex items-center gap-2.5">
          {archDocUrl ? (
            <a
              href={archDocUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/60 hover:border-violet-500/50 text-xs font-mono text-slate-300 hover:text-white transition-all shadow-sm"
            >
              <Shield className="w-3.5 h-3.5 text-violet-400" />
              <span>Architecture Doc</span>
            </a>
          ) : (
            <button
              onClick={onOpenArchitecture}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/60 hover:border-violet-500/50 text-xs font-mono text-slate-300 hover:text-white transition-all shadow-sm"
            >
              <Shield className="w-3.5 h-3.5 text-violet-400" />
              <span>Architecture Doc</span>
            </button>
          )}

          <a
            href="#oracle-simulator"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-xs font-mono font-bold text-slate-950 shadow-cyan-glow hover:shadow-[0_0_20px_rgba(0,240,255,0.5)] transition-all scale-100 hover:scale-[1.02] active:scale-95"
          >
            <Terminal className="w-3.5 h-3.5 text-slate-950" />
            <span>Launch Oracle</span>
          </a>

          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg bg-slate-900/80 border border-slate-700/60 hover:border-slate-500 text-slate-400 hover:text-white transition-all"
              aria-label="GitHub Repository"
            >
              <Github className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white border border-slate-800"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden max-w-7xl mx-auto mt-2 p-4 rounded-2xl bg-slate-950/95 border border-cyan-500/30 backdrop-blur-2xl flex flex-col gap-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-lg text-sm font-mono text-slate-300 hover:text-white hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/30"
            >
              {item.label}
            </a>
          ))}
          <div className="pt-2 border-t border-slate-800 flex flex-col gap-2 mt-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (archDocUrl) {
                  window.open(archDocUrl, "_blank");
                } else {
                  onOpenArchitecture?.();
                }
              }}
              className="w-full py-2 px-4 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-left text-slate-300"
            >
              View Architecture Whitepaper
            </button>
            <a
              href="#oracle-simulator"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2 px-4 rounded-lg bg-cyan-500 text-slate-950 font-bold font-mono text-xs text-center"
            >
              Launch Oracle Simulator
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
