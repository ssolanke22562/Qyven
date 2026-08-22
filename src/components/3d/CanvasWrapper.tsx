"use client";

import React, { useEffect, useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface CanvasWrapperProps {
  children: React.ReactNode;
  className?: string;
  cameraPosition?: [number, number, number];
  fov?: number;
  interactive?: boolean;
}

export function CanvasWrapper({
  children,
  className = "w-full h-full",
  cameraPosition = [0, 0, 22],
  fov = 50,
  interactive = true,
}: CanvasWrapperProps) {
  const [mounted, setMounted] = useState(false);
  const [force3D, setForce3D] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`w-full h-full bg-cyber-dark flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-cyber-cyan border-t-transparent animate-spin" />
          <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase">Initializing 3D Neural Engine...</span>
        </div>
      </div>
    );
  }

  if (prefersReducedMotion && !force3D) {
    return (
      <div className={`w-full h-full bg-radial-vignette relative overflow-hidden flex items-center justify-center ${className}`}>
        <div className="absolute inset-0 bg-cyber-grid bg-[size:32px_32px] opacity-30" />
        <div className="relative z-10 text-center p-6 border border-cyan-500/30 bg-slate-900/90 rounded-2xl backdrop-blur-md max-w-md shadow-2xl">
          <p className="font-mono text-cyan-400 text-sm font-semibold mb-2">Reduced motion active: Displaying static schematic topology</p>
          <p className="text-xs text-slate-400 mb-4 font-sans leading-relaxed">
            Your OS / Browser accessibility settings have reduced motion enabled.
          </p>
          <button
            onClick={() => setForce3D(true)}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs shadow-cyan-glow transition-all"
          >
            Enable 3D Scene Anyway
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full relative ${className}`}>
      <Canvas
        camera={{ position: cameraPosition, fov, near: 0.1, far: 1000 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          alpha: true,
        }}
        className={interactive ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 15, 10]} intensity={1.2} color="#ffffff" />
          <pointLight position={[-15, 10, -5]} intensity={2.0} color="#00f0ff" distance={40} />
          <pointLight position={[15, -10, 5]} intensity={2.0} color="#a855f7" distance={40} />
          <pointLight position={[0, -15, 10]} intensity={1.5} color="#f43f5e" distance={30} />
          {children}
        </Suspense>
      </Canvas>
    </div>
  );
}
