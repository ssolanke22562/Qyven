"use client";

import React, { useState, useMemo, useRef } from "react";
import * as THREE from "three";
import { OrbitControls, Html } from "@react-three/drei";
import { MOCK_NODES, MOCK_EDGES, CATEGORY_COLORS } from "@/data/knowledgeGraphData";
import { KnowledgeItem, NodeCategory } from "@/types";
import { NodeMesh } from "./NodeMesh";
import { EdgeMesh } from "./EdgeMesh";

interface InteractiveGraphExplorerProps {
  selectedNode: KnowledgeItem | null;
  onSelectNode: (node: KnowledgeItem | null) => void;
  activeCategory: NodeCategory | "All";
  searchQuery: string;
}

export function InteractiveGraphExplorer({
  selectedNode,
  onSelectNode,
  activeCategory,
  searchQuery,
}: InteractiveGraphExplorerProps) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const controlsRef = useRef<any>(null);

  // Node Map
  const nodeMap = useMemo(() => {
    const map = new Map<string, KnowledgeItem>();
    MOCK_NODES.forEach((n) => map.set(n.id, n));
    return map;
  }, []);

  // Filtered nodes based on category and search query
  const filteredNodes = useMemo(() => {
    return MOCK_NODES.filter((node) => {
      const matchesCategory = activeCategory === "All" || node.primary_category === activeCategory;
      const matchesSearch =
        searchQuery.trim() === "" ||
        node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        node.key_entities.some((e) => e.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  // Set of linked item IDs when a node is selected or hovered
  const linkedNodeIds = useMemo(() => {
    const activeId = selectedNode?.id || hoveredNodeId;
    if (!activeId) return new Set<string>();
    const node = nodeMap.get(activeId);
    if (!node) return new Set<string>();
    return new Set(node.linked_item_ids);
  }, [selectedNode, hoveredNodeId, nodeMap]);

  const activeFocusId = selectedNode?.id || hoveredNodeId;

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        autoRotate={!selectedNode && !hoveredNodeId}
        autoRotateSpeed={0.4}
        maxDistance={45}
        minDistance={6}
        dampingFactor={0.05}
      />

      <group>
        {/* Render Edges */}
        {MOCK_EDGES.map((edge) => {
          const sourceNode = nodeMap.get(edge.source);
          const targetNode = nodeMap.get(edge.target);
          if (!sourceNode || !targetNode) return null;

          const isConnectedToActive =
            activeFocusId === edge.source || activeFocusId === edge.target;
          
          const isDimmed = activeFocusId ? !isConnectedToActive : false;
          const categoryKey = sourceNode.primary_category as NodeCategory;
          const edgeColor = CATEGORY_COLORS[categoryKey]?.hex || "#00f0ff";

          return (
            <EdgeMesh
              key={edge.id}
              sourcePos={sourceNode.position}
              targetPos={targetNode.position}
              similarity={edge.similarity}
              isHighlighted={isConnectedToActive}
              isDimmed={isDimmed}
              color={edgeColor}
              speed={isConnectedToActive ? 1.2 : 0.4}
            />
          );
        })}

        {/* Render Nodes */}
        {MOCK_NODES.map((node) => {
          const isSelected = selectedNode?.id === node.id;
          const isHovered = hoveredNodeId === node.id;
          const isLinked = linkedNodeIds.has(node.id);
          const matchesFilter = filteredNodes.some((fn) => fn.id === node.id);

          const isDimmed =
            !matchesFilter ||
            (activeFocusId ? activeFocusId !== node.id && !isLinked : false);

          return (
            <group key={node.id} position={node.position}>
              <NodeMesh
                item={node}
                isSelected={isSelected}
                isHovered={isHovered}
                isLinked={isLinked}
                isDimmed={isDimmed}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  setHoveredNodeId(node.id);
                }}
                onPointerOut={(e) => {
                  e.stopPropagation();
                  setHoveredNodeId(null);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNode(isSelected ? null : node);
                }}
              />

              {/* 3D Floating Tooltip on Hover */}
              {isHovered && !isSelected && (
                <Html position={[0, 0.8, 0]} center distanceFactor={20} className="pointer-events-none">
                  <div className="bg-slate-950/90 border border-cyan-400/60 text-white px-3 py-1.5 rounded-lg shadow-xl shadow-cyan-500/20 backdrop-blur-md whitespace-nowrap z-50">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full animate-ping"
                        style={{ backgroundColor: CATEGORY_COLORS[node.primary_category]?.hex }}
                      />
                      <span className="font-mono text-xs font-semibold text-cyan-300">{node.primary_category}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        node.severity === "CRITICAL" ? "bg-rose-500/20 text-rose-400 border border-rose-500/40" :
                        node.severity === "HIGH" ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" :
                        "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                      }`}>
                        {node.severity}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-200 mt-1 max-w-xs truncate">{node.title}</p>
                    <p className="text-[10px] text-cyan-400/80 font-mono mt-0.5">Click to inspect intelligence dossier →</p>
                  </div>
                </Html>
              )}
            </group>
          );
        })}
      </group>
    </>
  );
}