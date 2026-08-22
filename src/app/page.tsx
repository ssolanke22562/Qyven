"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { HeroSection } from "@/components/sections/HeroSection";
import { PipelineSection } from "@/components/sections/PipelineSection";
import { GraphDemoSection } from "@/components/sections/GraphDemoSection";
import { TechStackSection } from "@/components/sections/TechStackSection";
import { SafeguardsSection } from "@/components/sections/SafeguardsSection";
import { OracleTerminalSection } from "@/components/sections/OracleTerminalSection";
import { FooterSection } from "@/components/sections/FooterSection";
import { ArchitectureModal } from "@/components/ui/ArchitectureModal";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { AgentChatbot } from "@/components/ui/AgentChatbot";

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

      {/* 2. Pipeline Flow (3D Interactive Diagram) */}
      <PipelineSection />

      {/* 3. Live Knowledge Graph Demo (Interactive 3D Sandbox) */}
      <GraphDemoSection
        onAskOracle={handleAskOracleFromGraph}
      />

      {/* 4. Tech Stack Showcase */}
      <TechStackSection />

      {/* 5. Strategic Safeguards & Architecture Principles */}
      <SafeguardsSection />

      {/* 6. Live "Ask Oracle" Interactive Simulator (Live Groq LPU) */}
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

      {/* Live AI Chatbot Widget (Groq LPU Powered) */}
      <AgentChatbot />
    </main>
  );
}