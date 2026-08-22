"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { HeroSection } from "@/components/sections/HeroSection";
import { ProblemSection } from "@/components/sections/ProblemSection";
import { PipelineSection } from "@/components/sections/PipelineSection";
import { GraphDemoSection } from "@/components/sections/GraphDemoSection";
import { TechStackSection } from "@/components/sections/TechStackSection";
import { SafeguardsSection } from "@/components/sections/SafeguardsSection";
import { OracleTerminalSection } from "@/components/sections/OracleTerminalSection";
import { FooterSection } from "@/components/sections/FooterSection";
import { ArchitectureModal } from "@/components/ui/ArchitectureModal";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { AgentChatbot } from "@/components/ui/AgentChatbot";

import { MultiAgentArchitectureSection } from "@/components/sections/MultiAgentArchitectureSection";

export default function Home() {
  const [architectureOpen, setArchitectureOpen] = useState(false);
  const [oracleQuery, setOracleQuery] = useState<string>("");

  const handleAskOracleFromGraph = (query: string) => {
    setOracleQuery(query);
  };

  return (
    <main className="relative min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      {/* Custom Cyber Cursor */}
      <CustomCursor />

      {/* Persistent Glassmorphic Navbar */}
      <Navbar
        onOpenArchitecture={() => setArchitectureOpen(true)}
      />

      {/* 1. Hero Section */}
      <HeroSection
        onQuickQuery={(q) => {
          setOracleQuery(q);
          const el = document.getElementById("oracle-simulator");
          el?.scrollIntoView({ behavior: "smooth" });
        }}
      />

      {/* Problem / Solution Framing Section */}
      <ProblemSection />

      {/* 2. Multi-Agent Architecture Section (3 Specialized Agents & Orchestrator) */}
      <MultiAgentArchitectureSection
        onRunDemoQuery={(q) => setOracleQuery(q)}
      />

      {/* 3. Pipeline Flow (3D Interactive Diagram) */}
      <PipelineSection />

      {/* 4. Live Knowledge Graph Demo (Interactive 3D Sandbox) */}
      <GraphDemoSection
        onAskOracle={handleAskOracleFromGraph}
      />

      {/* 4. Tech Stack Showcase */}
      <TechStackSection />

      {/* 5. Strategic Safeguards & Architecture Principles */}
      <SafeguardsSection />

      {/* 6. Live "Ask Oracle" Interactive Simulator */}
      <OracleTerminalSection
        initialQuery={oracleQuery}
      />

      {/* 7. Footer */}
      <FooterSection
        onOpenArchitecture={() => setArchitectureOpen(true)}
      />

      {/* Deep Architecture Whitepaper Modal */}
      <ArchitectureModal
        isOpen={architectureOpen}
        onClose={() => setArchitectureOpen(false)}
      />

      {/* Live AI Chatbot Widget */}
      <AgentChatbot />
    </main>
  );
}