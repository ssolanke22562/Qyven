"use client";

import React, { useState } from "react";
import { Info } from "lucide-react";

interface MetricNoteProps {
  note: string;
  type?: "measured" | "benchmark" | "target";
}

export function MetricNote({ note, type = "benchmark" }: MetricNoteProps) {
  const [isHovered, setIsHovered] = useState(false);

  const typeLabels = {
    measured: "Measured",
    benchmark: "Target Benchmark",
    target: "Target Metric",
  };

  const typeColors = {
    measured: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    benchmark: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
    target: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  };

  return (
    <span className="relative inline-flex items-center ml-1 z-20">
      <button
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsHovered(!isHovered)}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono border transition-colors cursor-help ${typeColors[type]}`}
        title={note}
        type="button"
      >
        <span>{typeLabels[type]}</span>
        <Info className="w-2.5 h-2.5 opacity-80" />
      </button>

      {/* Cyber Tooltip */}
      {isHovered && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 rounded-xl bg-slate-900/95 border border-cyan-500/40 text-[11px] font-sans text-slate-200 shadow-[0_0_20px_rgba(0,240,255,0.2)] backdrop-blur-md pointer-events-none z-50 text-left leading-tight">
          <strong className="block font-mono text-[10px] uppercase text-cyan-400 mb-1">
            {typeLabels[type]} Detail
          </strong>
          {note}
        </span>
      )}
    </span>
  );
}
