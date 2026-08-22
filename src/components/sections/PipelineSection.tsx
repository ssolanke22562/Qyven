"use client";

import React, { useState } from "react";
import { CanvasWrapper } from "@/components/3d/CanvasWrapper";
import { Pipeline3DScene } from "@/components/3d/Pipeline3DScene";
import { PipelineDetailDrawer } from "@/components/ui/PipelineDetailDrawer";
import { PIPELINE_STAGES } from "@/data/pipelineStages";
import { PipelineStage } from "@/types";
import { Radar, BrainCircuit, Network, Sparkles, Layers } from "lucide-react";

export function PipelineSection() {
  const [selectedStage, setSelectedStage] = useState<PipelineStage | null>(null);
  const [viewMode, setViewMode] = useState<"3d" | "cards">("3d");

  const icons = [Radar, BrainCircuit, Network, Sparkles];

  return (
    <section
      id="pipeline"
      className="relative min-h-screen w-full py-20 px-4 sm:px-6 bg-slate-950 flex flex-col justify-center overflow-hidden border-t border-slate-900"
    >
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Section Header */}
      <div className="relative z-10 max-w-5xl mx-auto text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 font-mono text-xs mb-3">
          <Layers className="w-3.5 h-3.5" />
          <span>4-PHASE AUTONOMOUS PIPELINE</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-heading font-extrabold text-white tracking-tight">
          From Raw Noise to <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-rose-400">Actionable Intelligence</span>
        </h2>
        <p className="mt-3 text-slate-400 max-w-2xl mx-auto text-sm sm:text-base font-sans">
          AgentX operates in an asynchronous 4-phase architecture — powered by the InsightScout Engine: multi-stream monitoring, taxonomic vector extraction, topological graph synthesis, and conversational Graph RAG.
        </p>

        {/* View Mode Toggle */}
        <div className="inline-flex p-1 rounded-xl bg-slate-900/80 border border-slate-800 mt-6 gap-1">
          <button
            onClick={() => setViewMode("3d")}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono transition-all ${
              viewMode === "3d"
                ? "bg-cyan-500 text-slate-950 font-bold shadow-cyan-glow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            3D Interactive Pipeline
          </button>
          <button
            onClick={() => setViewMode("cards")}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono transition-all ${
              viewMode === "cards"
                ? "bg-cyan-500 text-slate-950 font-bold shadow-cyan-glow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Modular Grid View
          </button>
        </div>
      </div>

      {/* 3D Pipeline Viewport */}
      {viewMode === "3d" ? (
        <div className="relative z-10 w-full max-w-7xl mx-auto h-[540px] rounded-2xl bg-slate-950/80 border border-cyan-500/20 shadow-2xl overflow-hidden backdrop-blur-xl">
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-950/90 border border-slate-800 px-3 py-1.5 rounded-lg backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono text-slate-300">
              Interactive 3D Pipeline Flow: Click any module to inspect code & architecture
            </span>
          </div>

          <CanvasWrapper cameraPosition={[0, 0, 18]} fov={45} interactive={true}>
            <Pipeline3DScene
              activeStage={selectedStage}
              onSelectStage={(stage) => setSelectedStage(stage)}
            />
          </CanvasWrapper>
        </div>
      ) : (
        /* Modular 2D Grid View */
        <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {PIPELINE_STAGES.map((stage, idx) => {
            const IconComponent = icons[idx] || Sparkles;
            const isSelected = selectedStage?.id === stage.id;
            return (
              <div
                key={stage.id}
                onClick={() => setSelectedStage(stage)}
                className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                  isSelected
                    ? "bg-slate-900 border-2 border-cyan-400 shadow-cyan-glow scale-[1.02]"
                    : "bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/90"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="p-2.5 rounded-xl"
                      style={{ backgroundColor: `${stage.color}20`, border: `1px solid ${stage.color}40` }}
                    >
                      <IconComponent className="w-6 h-6" style={{ color: stage.color }} />
                    </div>
                    <span className="text-[10px] font-mono uppercase text-slate-400">
                      {stage.week}
                    </span>
                  </div>

                  <h3 className="text-xl font-heading font-bold text-white mb-1">
                    {stage.name}
                  </h3>
                  <span className="text-xs font-mono text-cyan-400 font-semibold block mb-3">
                    {stage.script}
                  </span>

                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-4 mb-4">
                    {stage.summary}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">
                    {stage.metrics[0].label}: <strong className="text-white">{stage.metrics[0].value}</strong>
                  </span>
                  <span className="text-xs font-mono text-cyan-400 flex items-center gap-1 font-semibold">
                    Inspect →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stage Detail Drawer */}
      <PipelineDetailDrawer
        stage={selectedStage}
        onClose={() => setSelectedStage(null)}
      />
    </section>
  );
}
