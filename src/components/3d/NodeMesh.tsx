"use client";

import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { CATEGORY_COLORS } from "@/data/knowledgeGraphData";
import { KnowledgeItem } from "@/types";

interface NodeMeshProps {
  item: KnowledgeItem;
  isSelected?: boolean;
  isHovered?: boolean;
  isLinked?: boolean;
  isDimmed?: boolean;
  onPointerOver?: (e: any) => void;
  onPointerOut?: (e: any) => void;
  onClick?: (e: any) => void;
  organizeProgress?: number; // 0 (scattered) to 1 (organized)
}

export function NodeMesh({
  item,
  isSelected = false,
  isHovered = false,
  isLinked = false,
  isDimmed = false,
  onPointerOver,
  onPointerOut,
  onClick,
}: NodeMeshProps) {
  const meshRef = useRef<THREE.Group>(null);
  const outerGlowRef = useRef<THREE.Mesh>(null);
  const currentPos = useRef(new THREE.Vector3(...item.scatter_position));
  const targetPos = new THREE.Vector3(...item.position);
  const baseColor = CATEGORY_COLORS[item.primary_category]?.hex || "#00f0ff";

  // Pseudo-random offset based on ID for non-synchronized pulsing
  const pulseOffset = React.useMemo(() => {
    let hash = 0;
    for (let i = 0; i < item.id.length; i++) {
      hash = (hash << 5) - hash + item.id.charCodeAt(i);
    }
    return Math.abs(hash % 100) / 10;
  }, [item.id]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    // Self-organizing lerp towards target position
    currentPos.current.lerp(targetPos, 0.035);
    
    // Gentle floating drift
    const t = clock.getElapsedTime() + pulseOffset;
    const floatY = Math.sin(t * 1.2) * 0.12;
    const floatX = Math.cos(t * 0.9) * 0.08;

    meshRef.current.position.set(
      currentPos.current.x + floatX,
      currentPos.current.y + floatY,
      currentPos.current.z
    );

    // Pulse animation
    const pulseScale = 1.0 + Math.sin(t * 2.5) * 0.09;
    const targetScale = isSelected ? 1.6 : isHovered ? 1.4 : isLinked ? 1.25 : pulseScale;
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

    if (outerGlowRef.current) {
      outerGlowRef.current.rotation.y += 0.01;
      outerGlowRef.current.rotation.x += 0.005;
    }
  });

  const nodeRadius = isSelected ? 0.6 : item.severity === "CRITICAL" ? 0.52 : item.severity === "HIGH" ? 0.44 : 0.38;
  const opacity = isDimmed ? 0.2 : 1.0;
  const emissiveIntensity = isSelected ? 2.5 : isHovered ? 2.0 : isLinked ? 1.8 : isDimmed ? 0.2 : 1.1;

  return (
    <group
      ref={meshRef}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
    >
      {/* Core Node Sphere */}
      <mesh>
        <sphereGeometry args={[nodeRadius, 32, 32]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={baseColor}
          emissiveIntensity={emissiveIntensity}
          roughness={0.15}
          metalness={0.8}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* Outer Holographic Glow Shell */}
      <mesh ref={outerGlowRef}>
        <sphereGeometry args={[nodeRadius * 1.35, 16, 16]} />
        <meshBasicMaterial
          color={baseColor}
          wireframe
          transparent
          opacity={isDimmed ? 0.05 : isSelected || isHovered ? 0.5 : 0.18}
        />
      </mesh>

      {/* Halo ring for Critical / High severity items */}
      {(item.severity === "CRITICAL" || isSelected) && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[nodeRadius * 1.6, nodeRadius * 1.8, 32]} />
          <meshBasicMaterial
            color={baseColor}
            side={THREE.DoubleSide}
            transparent
            opacity={isDimmed ? 0.08 : 0.6}
          />
        </mesh>
      )}
    </group>
  );
}
