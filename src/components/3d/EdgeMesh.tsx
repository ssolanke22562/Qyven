"use client";

import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface EdgeMeshProps {
  sourcePos: [number, number, number];
  targetPos: [number, number, number];
  similarity: number;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  color?: string;
  speed?: number;
}

export function EdgeMesh({
  sourcePos,
  targetPos,
  similarity,
  isHighlighted = false,
  isDimmed = false,
  color = "#00f0ff",
  speed = 0.6,
}: EdgeMeshProps) {
  const pulseParticleRef = useRef<THREE.Mesh>(null);
  
  const startVec = useMemo(() => new THREE.Vector3(...sourcePos), [sourcePos]);
  const endVec = useMemo(() => new THREE.Vector3(...targetPos), [targetPos]);

  // Create geometry line curve between source & target
  const linePoints = useMemo(() => {
    return [startVec, endVec];
  }, [startVec, endVec]);

  const lineGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry().setFromPoints(linePoints);
    return geom;
  }, [linePoints]);

  const edgeOffset = useMemo(() => Math.random(), []);

  useFrame(({ clock }) => {
    if (!pulseParticleRef.current) return;
    const t = (clock.getElapsedTime() * speed + edgeOffset) % 1.0;
    // Interpolate along edge vector
    pulseParticleRef.current.position.lerpVectors(startVec, endVec, t);
  });

  const opacity = isDimmed ? 0.06 : isHighlighted ? 0.9 : Math.max(0.18, similarity * 0.45);
  const pulseColor = isHighlighted ? "#ffffff" : color;

  return (
    <group>
      {/* Edge Line */}
      {/* @ts-ignore */}
      <line geometry={lineGeometry}>
        <lineBasicMaterial
          color={isHighlighted ? "#ffffff" : color}
          transparent
          opacity={opacity}
          linewidth={isHighlighted ? 2 : 1}
        />
      </line>

      {/* Traveling Energy Pulse Packet */}
      {!isDimmed && (
        <mesh ref={pulseParticleRef}>
          <sphereGeometry args={[isHighlighted ? 0.12 : 0.08, 12, 12]} />
          <meshBasicMaterial
            color={pulseColor}
            transparent
            opacity={isHighlighted ? 1.0 : 0.75}
          />
        </mesh>
      )}
    </group>
  );
}
