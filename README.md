## Qyven — Autonomous Multi-Agent State Graph & Competitor Intelligence Platform

[![Live Production Deployment](https://img.shields.io/badge/🚀%20Live%20Deployment-qyven--web.vercel.app-00f0ff?style=for-the-badge&logo=vercel)](https://qyven-web.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React Three Fiber](https://img.shields.io/badge/Three.js-R3F-blue?style=flat-square&logo=three.js)](https://docs.pmnd.rs/react-three-fiber)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Groq LPU](https://img.shields.io/badge/Groq-LPU%20Inference-orange?style=flat-square)](https://groq.com/)

> 🚀 **Live Production Deployment**: [**https://qyven-web.vercel.app/**](https://qyven-web.vercel.app/)
> 
> **Qyven is an autonomous, self-healing multi-agent intelligence platform featuring dynamic planning, parallel task execution, tool failure recovery, evidence conflict resolution, deterministic confidence scoring (0–100%), self-evaluation loops, persistent memory, and a 3D interactive knowledge graph.**

---

## 🌟 Architecture Highlights

### 1. Autonomous Multi-Agent State Graph Architecture
- **Dynamic Supervisor / Planner**: Decomposes user goals dynamically into parallel execution vectors.
- **Parallel Multi-Source Agents**: Concurrent dispatch across **Research (ArXiv)**, **News Feed**, **Patent Office (USPTO/WIPO)**, and **SEC EDGAR Corporate Filings**.
- **Tool Failure Recovery & Replanning**: Automatically catches tool disruptions (e.g. 503 errors or timeouts), logs failures, updates plan versions, and routes through fallback domain knowledge.
- **Evidence Verification & Conflict Resolver**: Resolves competing claims using the **Source Reliability Hierarchy**:
  $$\text{SEC EDGAR (0.98)} > \text{Company Official (0.95)} > \text{News (0.88)} > \text{Patent (0.85)} > \text{ArXiv (0.82)}$$
- **Deterministic Confidence Judge**: Computes exact 0–100% scores via formula from evidence item count, source diversity, source reliability, conflict resolution, and replan penalties.
- **Self-Evaluation Loop**: Evaluates answer quality against user goals and triggers autonomous replanning if evidence or confidence is insufficient.

### 2. Demonstrable Context & Memory Management
- **Short-Term Context Gateway**: Sliding window managing turn history, entity recency, and conversational context injection.
- **Cross-Session Long-Term Memory**: Keyword and entity overlap scoring for persistent cross-session retrieval.
- **Production Serverless Persistence**: Supports Upstash Redis / Vercel KV REST API with in-memory caching and safe local fallback.

### 3. Adversarial University Demo Panel (Interactive UI)
- **1-Click Adversarial Demo Preset**: Executes complex query *"Analyze whether NVIDIA is becoming a major competitive threat in AI inference hardware."*
- **Failure Controls**: Toggle forced News API failures (503), Patent timeouts, or injected conflicting timeline evidence.
- **Real-Time Execution Telemetry**: Visual step-by-step stream displaying state transitions (`PLANNER → PARALLEL_EXECUTION → TOOL_FAILURE → REPLANNER → EVIDENCE_RESOLVER → CONFIDENCE_JUDGE → SELF_EVALUATOR → SYNTHESIS`).

### 4. Interactive 3D Knowledge Graph & 3D Pipeline
- **3D Self-Organizing Knowledge Graph**: Three.js / React Three Fiber interactive scene with semantic clustering, glowing edges, mouse parallax, and node inspection drawers.
- **3D Pipeline Scene**: Animated ingestion streams modeling data collection, analysis, community clustering, and Graph RAG synthesis.

---

## 🤖 Multi-Agent State Graph Workflow

```text
                                USER QUERY / ADVERSARIAL DEMO TRIGGER
                                                 │
                                                 ▼
                                     🧠 PLANNER / SUPERVISOR
                             (Dynamic Task Decomposition & Budgeting)
                                                 │
                  ┌──────────────────────────────┼──────────────────────────────┐
                  ▼                              ▼                              ▼
          📜 PATENT AGENT                📰 NEWS AGENT                  🔬 RESEARCH AGENT
     (Patent Office Search API)      (News & Signal Feed API)         (ArXiv & Academic API)
                  │                              │                              │
                  └──────────────────────────────┼──────────────────────────────┘
                                                 ▼
                                         🏢 SEC AGENT
                                    (EDGAR Corporate Filings)
                                                 │
                                                 ▼
                                ⚖ EVIDENCE & CONFLICT RESOLVER
                      (Claim Extraction, Reliability Hierarchy, Freshness)
                                                 │
                                                 ▼
                                      🎯 CONFIDENCE JUDGE
                         (Deterministic Score Formula: 0-100% + LLM Reasoning)
                                                 │
                                                 ▼
                                      🔍 SELF-EVALUATOR
                            (Question Alignment & Coverage Check)
                                 │                            │
                     Passed      │                            │  Failed Evaluation
                 ┌───────────────┘                            └──────────────────┐
                 ▼                                                               ▼
        🧠 SYNTHESIS AGENT                                              🔄 REPLANNER
(Executive Intelligence Report)                                 (Alternative Tool / Source)
                 │                                                               │
                 ▼                                                               ▼
    MEMORIZE & CHECKPOINT                                               RE-EXECUTE TASK
```

---

## 🛠️ API Endpoints

- **`POST /api/agentic`**: Runs the full `QyvenStateGraph` pipeline with dynamic planning, parallel execution, conflict resolution, deterministic confidence judging, self-evaluation, and investigation memory storage.
- **`POST /api/memory`**: Performs short-term sliding window context retrieval, cross-session long-term memory commits, and integrity checks.
- **`POST /api/oracle`**: Oracle Terminal simulator with Graph RAG vector search, sub-graph traversal, and executive dossier synthesis.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or 20+ / 24+ LTS
- npm or pnpm / yarn

### Installation

```bash
# Clone repository
git clone https://github.com/ssolanke22562/Qyven.git
cd Qyven

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

---

## 📂 Key Directory Structure

```
├── data/                       # Persistent JSON memory & investigation store
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── agentic/        # Autonomous State Graph API route
│   │   │   ├── memory/         # Context & Memory Management API route
│   │   │   └── oracle/         # Oracle terminal Graph RAG API route
│   │   ├── globals.css         # Cyber aesthetic, scanlines & scrollbars
│   │   ├── layout.tsx          # Root layout with Space Grotesk / Inter fonts
│   │   └── page.tsx            # Main showcase page assembling all sections
│   ├── components/
│   │   ├── 3d/                 # Three.js 3D Knowledge Graph & Pipeline components
│   │   ├── sections/
│   │   │   ├── AgenticDashboardSection.tsx # Adversarial Demo & Telemetry HUD
│   │   │   ├── MemoryDemoSection.tsx       # Context & Memory Hackathon Section
│   │   │   ├── MultiAgentArchitectureSection.tsx
│   │   │   ├── OracleTerminalSection.tsx
│   │   │   └── ...
│   │   └── ui/
│   ├── lib/
│   │   ├── agents/
│   │   │   ├── qyvenState.ts          # Typed Investigation State Schema
│   │   │   ├── stateGraph.ts          # TypeScript State Graph Execution Engine
│   │   │   ├── plannerAgent.ts        # Dynamic Planner / Supervisor Agent
│   │   │   ├── evidenceAgent.ts       # Verification & Conflict Resolution Agent
│   │   │   ├── confidenceJudge.ts     # Deterministic Confidence Judge (0-100%)
│   │   │   ├── selfEvaluator.ts       # Self-Evaluation Agent
│   │   │   ├── investigationMemory.ts # Serverless-safe Investigation Store
│   │   │   └── orchestrator.ts        # Backward-compatible Agent Orchestrator
│   │   ├── memory/                    # Short-term & Long-term Memory Managers
│   │   └── tools/                     # Patent, SEC, News, and ArXiv tools
```

---

## 📜 License

MIT License — feel free to use and adapt for your own hackathon showcases!
