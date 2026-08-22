"use client";

import React from "react";
import { X, Layers, Cpu, Database, Zap, GitBranch } from "lucide-react";
import { MetricNote } from "@/components/ui/MetricNote";

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ArchitectureModal({ isOpen, onClose }: ArchitectureModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-slate-950 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.2)] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-white">AgentX System Architecture</h2>
              <span className="text-xs font-mono text-cyan-400">AgentX — powered by the InsightScout Engine</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-300 font-sans text-sm leading-relaxed">
          {/* Executive Summary */}
          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30">
            <h3 className="font-heading font-bold text-cyan-300 mb-1">Architecture Overview</h3>
            <p className="text-xs text-cyan-100/80 leading-relaxed">
              AgentX operates as an autonomous, self-synthesizing knowledge graph agent. It continuously monitors multi-modal data streams (ArXiv papers, patent gazettes, competitor SEC filings, tech news, and developer discussions), extracts structured intelligence vectors via ultra-fast Groq & Google Gemini inference, organizes topological multi-hop relationship graphs, and answers complex competitive queries in sub-250ms via hybrid Graph RAG.
            </p>
          </div>

          {/* Multi-Agent Architecture Specification */}
          <div className="p-4 rounded-xl bg-violet-950/20 border border-violet-500/30 space-y-3">
            <h4 className="font-heading font-bold text-violet-300 text-sm flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-violet-400" />
              Multi-Agent Architecture (Research, Analysis, Synthesis & Orchestrator)
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              AgentX utilizes an explicit backend <strong>Agent Orchestrator</strong> that coordinates 3 specialized AI agents with distinct system prompts and structured JSON communication payloads:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="p-3 rounded-lg bg-slate-900/80 border border-cyan-500/30 text-xs">
                <strong className="text-cyan-400 block font-mono">1. Research Agent</strong>
                <span className="text-[11px] text-slate-400">Queries ArXiv & News APIs, filters noise, outputs validated sources & key evidence.</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/80 border border-violet-500/30 text-xs">
                <strong className="text-violet-400 block font-mono">2. Analysis Agent</strong>
                <span className="text-[11px] text-slate-400">Extracts entities/relationships, grounds against 3D knowledge graph nodes & classifies threats.</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/80 border border-emerald-500/30 text-xs">
                <strong className="text-emerald-400 block font-mono">3. Synthesis Agent</strong>
                <span className="text-[11px] text-slate-400">Compiles evidence-backed strategic briefings (Recent News FIRST, Past Context SECOND).</span>
              </div>
            </div>
          </div>

          {/* 4-Layer Architecture Stack */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">
              Autonomous Intelligence Pipeline Layers
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Database className="w-4 h-4" />
                  <strong className="font-heading text-sm text-white">1. Ingestion Layer (The Scout)</strong>
                </div>
                <p className="text-xs text-slate-400">
                  Asynchronous multi-stream pollers with cryptographic SHA-256 Bloom filter deduplication. Normalizes PDFs, HTML, and RSS into canonical payload streams.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-rose-400">
                  <Cpu className="w-4 h-4" />
                  <strong className="font-heading text-sm text-white">2. Semantic Vector Layer (The Analyst)</strong>
                </div>
                <p className="text-xs text-slate-400">
                  JSON-mode structured extraction via Groq & Gemini API (650 tok/s). Computes 1024-dim dense embeddings using Sentence-Transformers and assigns threat ratings.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-violet-400">
                  <GitBranch className="w-4 h-4" />
                  <strong className="font-heading text-sm text-white">3. Topological Graph Layer (The Cartographer)</strong>
                </div>
                <p className="text-xs text-slate-400">
                  Calculates pairwise cosine similarity adjacency, discovers Louvain thematic communities, prunes weak links, and generates 3D coordinates for hardware-accelerated WebGL.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Zap className="w-4 h-4" />
                  <strong className="font-heading text-sm text-white">4. Conversational Reasoning Layer (The Oracle)</strong>
                </div>
                <p className="text-xs text-slate-400">
                  Hybrid Vector + Graph Traversal RAG with live ArXiv & News function calling tools. Retrieves multi-hop subgraphs and streams structured threat assessments with source citations.
                </p>
              </div>
            </div>
          </div>

          {/* Performance Benchmarks */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">
              Engineering Benchmarks
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 block">End-to-End Latency</span>
                <strong className="text-base font-mono text-cyan-400 font-bold items-center justify-center flex">
                  &lt; 240ms
                  <MetricNote note="Target vector graph search latency over FAISS index" type="target" />
                </strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 block">Ingestion Rate</span>
                <strong className="text-base font-mono text-violet-400 font-bold items-center justify-center flex">
                  4.8k / day
                  <MetricNote note="Estimated multi-stream RSS/Atom crawler capacity" type="benchmark" />
                </strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 block">Link Precision</span>
                <strong className="text-base font-mono text-emerald-400 font-bold items-center justify-center flex">
                  99.4%
                  <MetricNote note="Measured on 10,000 synthetic relationship pairs" type="measured" />
                </strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 block">Max Graph Capacity</span>
                <strong className="text-base font-mono text-amber-400 font-bold items-center justify-center flex">
                  100k+ nodes
                  <MetricNote note="Target WebGL InstancedMesh rendering capacity limit" type="target" />
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400">AgentX — powered by the InsightScout Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs"
          >
            Close Specification
          </button>
        </div>
      </div>
    </div>
  );
}
