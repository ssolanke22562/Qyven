"use client";

import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { PIPELINE_STAGES } from "@/data/pipelineStages";
import { PipelineStage } from "@/types";
import { Radar, BrainCircuit, Network, Sparkles, Database, FileText, Newspaper, MessageSquare } from "lucide-react";

interface Pipeline3DSceneProps {
  activeStage: PipelineStage | null;
  onSelectStage: (stage: PipelineStage) => void;
}

// 3D Data Flow Stream Particles
function PipelineConduitParticles({
  startX,
  endX,
  y = 0,
  z = 0,
  color = "#00f0ff",
  count = 8,
  speed = 1.2,
}: {
  startX: number;
  endX: number;
  y?: number;
  z?: number;
  color?: string;
  count?: number;
  speed?: number;
}) {
  const particlesRef = useRef<THREE.Group>(null);
  const particleMeshes = useRef<THREE.Mesh[]>([]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime() * speed;
    particleMeshes.current.forEach((mesh, index) => {
      if (!mesh) return;
      const progress = ((time + (index / count)) % 1);
      mesh.position.x = startX + (endX - startX) * progress;
      mesh.position.y = y + Math.sin(time * 3 + index) * 0.15;
      mesh.position.z = z;
      // Pulse scale near center
      const scale = Math.sin(progress * Math.PI) * 0.18 + 0.08;
      mesh.scale.set(scale, scale, scale);
    });
  });

  return (
    <group ref={particlesRef}>
      {/* Neon Conduit Pipe Wireframe */}
      <mesh position={[(startX + endX) / 2, y, z]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, Math.abs(endX - startX), 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} wireframe />
      </mesh>

      {/* Floating moving data packets */}
      {Array.from({ length: count }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) particleMeshes.current[i] = el;
          }}
        >
          <sphereGeometry args={[1, 12, 12]} />
          <meshBasicMaterial color={color} transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// Ingestion Streams entering Stage 1
function IngestionStreams({ targetX, targetY }: { targetX: number; targetY: number }) {
  const sources = [
    { label: "ArXiv AI", yOffset: 3.5, color: "#38bdf8", icon: FileText },
    { label: "USPTO Patents", yOffset: 1.2, color: "#f59e0b", icon: Database },
    { label: "Tech News", yOffset: -1.2, color: "#a855f7", icon: Newspaper },
    { label: "Social Sentiment", yOffset: -3.5, color: "#10b981", icon: MessageSquare },
  ];

  return (
    <group position={[-16, 0, 0]}>
      {sources.map((src, i) => {
        const IconComponent = src.icon;
        return (
          <group key={i} position={[0, src.yOffset, 0]}>
            <Html center distanceFactor={18}>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/90 border border-slate-700/60 shadow-lg backdrop-blur-md">
                <IconComponent className="w-3.5 h-3.5" style={{ color: src.color }} />
                <span className="text-[11px] font-mono text-slate-300 whitespace-nowrap">{src.label}</span>
              </div>
            </Html>
            <PipelineConduitParticles
              startX={1.8}
              endX={targetX - (-16) - 2.5}
              y={0}
              color={src.color}
              count={5}
              speed={1.0 + i * 0.2}
            />
          </group>
        );
      })}
    </group>
  );
}

export function Pipeline3DScene({ activeStage, onSelectStage }: Pipeline3DSceneProps) {
  // Horizontal layout positions for 4 stages
  const stagePositions = [
    { x: -9, y: 0, z: 0 },
    { x: -3, y: 0, z: 0 },
    { x: 3, y: 0, z: 0 },
    { x: 9, y: 0, z: 0 },
  ];

  const icons = [Radar, BrainCircuit, Network, Sparkles];

  return (
    <group position={[0, 0, 0]}>
      {/* Ingestion streams feeding into Stage 1 */}
      <IngestionStreams targetX={stagePositions[0].x} targetY={stagePositions[0].y} />

      {/* Connecting conduits between stages */}
      {stagePositions.slice(0, -1).map((pos, idx) => (
        <PipelineConduitParticles
          key={idx}
          startX={pos.x + 2.2}
          endX={stagePositions[idx + 1].x - 2.2}
          y={pos.y}
          color={PIPELINE_STAGES[idx].color}
          count={7}
          speed={1.4}
        />
      ))}

      {/* 4 Interactive 3D Stage Cards */}
      {PIPELINE_STAGES.map((stage, idx) => {
        const pos = stagePositions[idx];
        const isActive = activeStage?.id === stage.id;
        const IconComponent = icons[idx] || Sparkles;

        return (
          <group key={stage.id} position={[pos.x, pos.y, pos.z]}>
            {/* 3D Geometric Stage Core */}
            <mesh>
              <boxGeometry args={[3.8, 4.8, 0.4]} />
              <meshStandardMaterial
                color={isActive ? "#0e1a38" : "#080e22"}
                emissive={stage.color}
                emissiveIntensity={isActive ? 0.6 : 0.15}
                roughness={0.2}
                metalness={0.8}
                transparent
                opacity={0.85}
              />
            </mesh>

            {/* Glowing Border Wireframe */}
            <mesh>
              <boxGeometry args={[3.85, 4.85, 0.45]} />
              <meshBasicMaterial
                color={stage.color}
                wireframe
                transparent
                opacity={isActive ? 0.9 : 0.4}
              />
            </mesh>

            {/* 3D HTML Content Panel */}
            <Html center distanceFactor={14} className="pointer-events-auto">
              <div
                onClick={() => onSelectStage(stage)}
                className={`w-64 p-4 rounded-xl backdrop-blur-xl transition-all duration-300 cursor-pointer text-left select-none ${
                  isActive
                    ? "bg-slate-950/95 border-2 border-cyan-400 shadow-[0_0_35px_rgba(0,240,255,0.35)] scale-105"
                    : "bg-slate-950/80 border border-slate-700/60 hover:border-cyan-500/60 hover:bg-slate-900/90 hover:scale-[1.02] shadow-xl"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${stage.color}20`, border: `1px solid ${stage.color}40` }}
                  >
                    <IconComponent className="w-5 h-5" style={{ color: stage.color }} />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    {stage.week}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                  {stage.name}
                </h3>
                <span className="text-[11px] font-mono text-cyan-400/90 block mb-2 font-semibold">
                  {stage.script}
                </span>

                <p className="text-xs text-slate-300 line-clamp-3 mb-3 leading-relaxed">
                  {stage.summary}
                </p>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">
                    {stage.metrics[0].label}: <strong className="text-white">{stage.metrics[0].value}</strong>
                  </span>
                  <span className="text-[11px] font-mono text-cyan-400 font-semibold flex items-center gap-0.5">
                    {isActive ? "Viewing Details" : "Inspect →"}
                  </span>
                </div>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
