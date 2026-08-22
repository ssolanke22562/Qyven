"use client";

import React from "react";
import { KnowledgeItem } from "@/types";
import { CATEGORY_COLORS } from "@/data/knowledgeGraphData";
import { X, ExternalLink, Sparkles, AlertTriangle, ShieldAlert, Cpu, Link2, Share2, Tag, Calendar, Database } from "lucide-react";

interface NodeInspectorDrawerProps {
  node: KnowledgeItem | null;
  onClose: () => void;
  onSelectConnectedNode: (nodeId: string) => void;
  onAskOracle: (query: string) => void;
}

export function NodeInspectorDrawer({
  node,
  onClose,
  onSelectConnectedNode,
  onAskOracle,
}: NodeInspectorDrawerProps) {
  if (!node) return null;

  const categoryStyle = CATEGORY_COLORS[node.primary_category];

  const severityBadgeColors = {
    CRITICAL: "bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-rose-glow",
    HIGH: "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-amber-glow",
    MONITOR: "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-cyan-glow",
    OPPORTUNITY: "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-glow",
  };

  return (
    <aside
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-slate-950/95 border-l border-cyan-500/30 backdrop-blur-2xl shadow-2xl overflow-y-auto flex flex-col transition-all duration-300 animate-in slide-in-from-right-8"
      role="dialog"
      aria-label="Intelligence Node Inspector"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 px-6 py-4 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full animate-ping"
            style={{ backgroundColor: categoryStyle?.hex }}
          />
          <span className="font-mono text-xs uppercase tracking-widest text-slate-400">
            Node Inspector // {node.id}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close Inspector"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content Body */}
      <div className="p-6 space-y-6 flex-1">
        
        {/* Category & Severity Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wide border"
            style={{
              backgroundColor: categoryStyle?.bg,
              borderColor: categoryStyle?.border,
              color: categoryStyle?.hex,
            }}
          >
            {node.primary_category}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
              severityBadgeColors[node.severity] || "bg-slate-800 text-slate-300"
            }`}
          >
            {node.severity} SEVERITY
          </span>
          <span className="ml-auto text-xs font-mono text-slate-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {node.extracted_date}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-xl font-heading font-bold text-white leading-snug">
          {node.title}
        </h2>

        {/* One-line Executive Summary */}
        <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-cyan-200 text-sm leading-relaxed font-sans">
          <span className="block font-mono text-[10px] uppercase text-cyan-400 font-bold mb-1 tracking-wider">
            Executive Summary
          </span>
          {node.one_line_summary}
        </div>

        {/* Threat Index Score Gauge */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Competitive Threat Index
            </span>
            <span className={`font-bold ${node.threat_index > 75 ? "text-rose-400" : node.threat_index > 40 ? "text-amber-400" : "text-emerald-400"}`}>
              {node.threat_index}/100
            </span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                node.threat_index > 75
                  ? "bg-gradient-to-r from-amber-500 to-rose-500"
                  : node.threat_index > 40
                  ? "bg-gradient-to-r from-emerald-500 to-amber-500"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${node.threat_index}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>Confidence: {(node.confidence * 100).toFixed(0)}%</span>
            <span>Status: Verified via Multi-LLM Pass</span>
          </div>
        </div>

        {/* Detailed Extraction Payload */}
        <div className="space-y-2">
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-violet-400" />
            Detailed Intelligence Extract
          </h4>
          <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/40 p-4 rounded-xl border border-slate-800">
            {node.full_summary}
          </p>
        </div>

        {/* Source Citation */}
        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="block text-xs font-mono text-white font-semibold">{node.source.name}</span>
              <span className="text-[11px] font-mono text-slate-400">{node.source.citation || "Automated Stream"}</span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-cyan-300 uppercase">
            {node.source.type}
          </span>
        </div>

        {/* Key Entities & Tags */}
        <div className="space-y-2">
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-amber-400" />
            Extracted Entities & Tags
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {node.key_entities.map((entity, i) => (
              <span key={i} className="px-2.5 py-1 rounded-md text-xs font-mono bg-violet-950/40 text-violet-300 border border-violet-500/30">
                {entity}
              </span>
            ))}
            {node.tags.map((tag, i) => (
              <span key={i} className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800/80 text-slate-300 border border-slate-700">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Interactive Connected Nodes */}
        <div className="space-y-2.5 pt-2">
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Link2 className="w-4 h-4 text-cyan-400" />
            Connected Graph Nodes ({node.linked_item_ids.length})
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {node.linked_item_ids.map((linkedId) => (
              <button
                key={linkedId}
                onClick={() => onSelectConnectedNode(linkedId)}
                className="w-full text-left p-3 rounded-lg bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-cyan-400/60 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 group-hover:scale-125 transition-transform" />
                  <span className="font-mono text-xs text-slate-200 group-hover:text-cyan-300 font-medium">
                    {linkedId}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400 group-hover:text-white flex items-center gap-1">
                  Focus in 3D →
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="sticky bottom-0 p-4 bg-slate-950/95 border-t border-slate-800/80 backdrop-blur-md flex gap-2.5">
        <button
          onClick={() => onAskOracle(`Analyze competitive implications of: ${node.title}`)}
          className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-cyan-glow transition-all active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          <span>Ask Oracle About This Node</span>
        </button>
      </div>
    </aside>
  );
}
