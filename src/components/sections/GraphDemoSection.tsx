"use client";

import React, { useState, useMemo } from "react";
import { CanvasWrapper } from "@/components/3d/CanvasWrapper";
import { InteractiveGraphExplorer } from "@/components/3d/InteractiveGraphExplorer";
import { NodeInspectorDrawer } from "@/components/ui/NodeInspectorDrawer";
import { MOCK_NODES, CATEGORY_COLORS } from "@/data/knowledgeGraphData";
import { KnowledgeItem, NodeCategory } from "@/types";
import { Search, RotateCcw, Sparkles, Filter, Info, ShieldAlert, Cpu, Eye } from "lucide-react";

interface GraphDemoSectionProps {
  onAskOracle?: (query: string) => void;
}

export function GraphDemoSection({ onAskOracle }: GraphDemoSectionProps) {
  const [selectedNode, setSelectedNode] = useState<KnowledgeItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<NodeCategory | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");

  const categories: (NodeCategory | "All")[] = [
    "All",
    "Research Trend",
    "Competitor Strategy",
    "Technological Development",
    "Policy",
    "Market Signal",
  ];

  const handleSelectConnectedNode = (nodeId: string) => {
    const targetNode = MOCK_NODES.find((n) => n.id === nodeId);
    if (targetNode) {
      setSelectedNode(targetNode);
    }
  };

  const handleAskOracle = (query: string) => {
    if (onAskOracle) {
      onAskOracle(query);
      const oracleSection = document.getElementById("oracle-simulator");
      if (oracleSection) {
        oracleSection.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <section
      id="graph-demo"
      className="relative min-h-screen w-full py-20 px-4 sm:px-6 bg-slate-950 flex flex-col justify-center overflow-hidden border-t border-slate-900"
    >
      {/* Glow Backdrops */}
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Section Header */}
      <div className="relative z-10 max-w-5xl mx-auto text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/40 border border-violet-500/30 text-violet-300 font-mono text-xs mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>REAL-TIME 3D TOPOLOGY SANDBOX</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-heading font-extrabold text-white tracking-tight">
          Interactive <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-rose-400">Knowledge Graph Explorer</span>
        </h2>
        <p className="mt-3 text-slate-400 max-w-2xl mx-auto text-sm sm:text-base font-sans">
          Explore multi-relational intelligence clusters synthesized across patents, papers, and corporate filings. Click any node to inspect raw dossiers and traverse similarity links in 3D.
        </p>
      </div>

      {/* Controls Bar: Category Filters & Search */}
      <div className="relative z-10 max-w-7xl mx-auto w-full mb-4 flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800 backdrop-blur-xl">
        
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => {
            const isSelected = activeCategory === cat;
            const style = cat === "All" ? null : CATEGORY_COLORS[cat as NodeCategory];
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-cyan-500 text-slate-950 font-bold shadow-cyan-glow"
                    : "bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800"
                }`}
              >
                {style && (
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: style.hex }}
                  />
                )}
                <span>{cat}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-xs min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patents, MCTS, TSMC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>
      </div>

      {/* 3D Knowledge Graph Sandbox Viewport */}
      <div className="relative z-10 w-full max-w-7xl mx-auto h-[600px] rounded-2xl bg-slate-950/90 border border-cyan-500/20 shadow-2xl overflow-hidden backdrop-blur-xl">
        
        {/* Top HUD overlay */}
        <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 pointer-events-none">
          <div className="flex items-center gap-2 bg-slate-950/90 border border-slate-800 px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[11px] font-mono text-slate-300">
              Drag to Rotate // Scroll to Zoom // Click Node to Inspect
            </span>
          </div>
        </div>

        {/* Category Legend Overlay (Bottom Left) */}
        <div className="absolute bottom-4 left-4 z-20 p-3 rounded-xl bg-slate-950/90 border border-slate-800/90 backdrop-blur-md shadow-xl hidden sm:block max-w-xs">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-2">
            Taxonomy Legend
          </span>
          <div className="space-y-1.5">
            {Object.entries(CATEGORY_COLORS).map(([name, conf]) => (
              <div key={name} className="flex items-center gap-2 text-[11px] font-mono text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: conf.hex }} />
                <span>{name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3D Canvas */}
        <CanvasWrapper cameraPosition={[0, 0, 20]} fov={45} interactive={true}>
          <InteractiveGraphExplorer
            selectedNode={selectedNode}
            onSelectNode={(node) => setSelectedNode(node)}
            activeCategory={activeCategory}
            searchQuery={searchQuery}
          />
        </CanvasWrapper>
      </div>

      {/* Node Inspector Drawer */}
      <NodeInspectorDrawer
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
        onSelectConnectedNode={handleSelectConnectedNode}
        onAskOracle={handleAskOracle}
      />
    </section>
  );
}
