"use client";

import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { MOCK_NODES, MOCK_EDGES, CATEGORY_COLORS } from "@/data/knowledgeGraphData";
import { KnowledgeItem, NodeCategory } from "@/types";
import { NodeMesh } from "./NodeMesh";
import { EdgeMesh } from "./EdgeMesh";

export function BackgroundGraph() {
  const groupRef = useRef<THREE.Group>(null);
  const { pointer } = useThree();

  // Create node lookup map with strict typing
  const nodeMap = useMemo(() => {
    const map = new Map<string, KnowledgeItem>();
    MOCK_NODES.forEach((n) => map.set(n.id, n));
    return map;
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Slow ambient orbit
    groupRef.current.rotation.y += delta * 0.04;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      pointer.y * 0.15,
      0.05
    );
    groupRef.current.rotation.z = THREE.MathUtils.lerp(
      groupRef.current.rotation.z,
      pointer.x * 0.1,
      0.05
    );
  });

  return (
    <group ref={groupRef}>
      {/* Render Edges */}
      {MOCK_EDGES.map((edge) => {
        const sourceNode = nodeMap.get(edge.source);
        const targetNode = nodeMap.get(edge.target);
        if (!sourceNode || !targetNode) return null;

        const categoryKey = sourceNode.primary_category as NodeCategory;
        const edgeColor = CATEGORY_COLORS[categoryKey]?.hex || "#00f0ff";
        return (
          <EdgeMesh
            key={edge.id}
            sourcePos={sourceNode.position}
            targetPos={targetNode.position}
            similarity={edge.similarity}
            color={edgeColor}
            speed={0.4 + edge.similarity * 0.3}
          />
        );
      })}

      {/* Render Nodes */}
      {MOCK_NODES.map((node) => (
        <NodeMesh key={node.id} item={node} />
      ))}
    </group>
  );
}