## Qyven — Autonomous Multi-Agent State Graph & Competitor Intelligence Platform

[![Live Production Deployment](https://img.shields.io/badge/🚀%20Live%20Deployment-qyven--web.vercel.app-00f0ff?style=for-the-badge&logo=vercel)](https://qyven-web.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React Three Fiber](https://img.shields.io/badge/Three.js-R3F-blue?style=flat-square&logo=three.js)](https://docs.pmnd.rs/react-three-fiber)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Groq LPU](https://img.shields.io/badge/Groq-LPU%20Inference-orange?style=flat-square)](https://groq.com/)

> 🚀 **Live Production Deployment**: [**https://qyven-web.vercel.app/**](https://qyven-web.vercel.app/)
> 
> **Qyven is an autonomous, self-healing multi-agent intelligence platform featuring dynamic planning, parallel task execution, tool failure recovery, evidence conflict resolution, deterministic confidence scoring (0–100%), self-evaluation loops, persistent memory, a 3D interactive knowledge graph, and a rigorous Evaluation Harness.**

---

## 🌟 Core Platform Features

### 1. Autonomous Multi-Agent State Graph Engine
- **Dynamic Supervisor / Planner**: Decomposes complex research objectives dynamically into parallel execution vectors.
- **Parallel Multi-Source Agents**: Concurrent dispatch across **Research (ArXiv)**, **News Feed**, **Patent Office (USPTO/WIPO)**, and **SEC EDGAR Corporate Filings**.
- **Tool Failure Recovery & Replanning**: Automatically catches tool disruptions (e.g., HTTP 503 API outages or timeouts), logs failure telemetry, increments plan versions, and routes through fallback domain knowledge.
- **Evidence Verification & Conflict Resolver**: Resolves competing claims using a strict **Source Reliability Hierarchy**:
  $$\text{SEC EDGAR (0.98)} > \text{Company Official (0.95)} > \text{News (0.88)} > \text{Patent (0.85)} > \text{ArXiv (0.82)}$$
- **Deterministic Confidence Judge**: Computes exact 0–100% confidence scores derived from evidence count, source diversity, source reliability, conflict resolution status, and replan penalties.
- **Self-Evaluation Loop**: Evaluates answer quality against user goals and triggers autonomous replanning if evidence coverage or confidence score is insufficient.

### 2. Built-in Evaluation Harness & Scorecard (`eval/`)
- **36 Test Queries Across 6 Categories**: Evaluates real pipeline performance across `normal`, `ambiguous`, `adversarial`, `contradictory`, `incomplete`, and `tool_failure` categories.
- **Single-LLM Direct Baseline Comparison**: Runs side-by-side comparative benchmarks against single-prompt direct LLM completions (Groq / Gemini) to compute accuracy and groundedness deltas.
- **Rigorous Evaluation Telemetry**: Captures full response payloads, evidence item citations, latency (mean and p95), tool failure counts, replan triggers, and consistency metrics over 3 repeated runs per query.
- **Strict Non-Fabrication**: Unscored metrics (e.g. empty ground truth facts or absent evidence claims) are cleanly marked `"unscored"` rather than producing fabricated numbers.
- **Interactive UI Dashboard & Embedded View**: View complete scorecard metrics directly on the main application (`#eval-scorecard`) or via the dedicated route (`/eval-dashboard`).

- **3D Pipeline Visualizer**: Animated ingestion streams modeling data collection, analysis, community clustering, and Graph RAG synthesis.

---

## 📊 Evaluation Harness Scorecard Benchmark Results

The table below reflects raw benchmark results computed by `npm run eval` comparing Qyven's multi-agent state graph pipeline against a single-LLM direct baseline:

| Category | Cases | Accuracy | Groundedness | Hallucination Rate | Consistency | Recovery Rate | Latency (mean) | Latency (p95) | Δ vs Baseline |
|---|---|---|---|---|---|---|---|---|---|
| **normal** | 6 | 100.0% | 74.4% | 25.6% | 100.0% | unscored | 905ms | 1689ms | +74.4% Groundedness |
| **ambiguous** | 6 | 100.0% | 67.4% | 32.6% | 100.0% | unscored | 2409ms | 6787ms | +67.4% Groundedness |
| **adversarial** | 6 | 100.0% | 71.3% | 28.7% | 100.0% | **100.0%** | 1605ms | 1706ms | +71.3% Groundedness |
| **contradictory** | 6 | 88.9% | 71.1% | 28.9% | 100.0% | unscored | 1974ms | 4162ms | +71.1% Groundedness |
| **incomplete** | 6 | 100.0% | 72.0% | 28.0% | 100.0% | unscored | 1870ms | 3916ms | +25.0% Accuracy |
| **tool_failure** | 6 | 100.0% | 62.8% | 37.2% | 100.0% | **100.0%** | 2671ms | 3567ms | +13.9% Accuracy |
| **OVERALL AVERAGE** | **36** | **98.1%** | **69.8%** | **30.2%** | **100.0%** | **100.0%** | **1906ms** | **3638ms** | **+69.8% Groundedness** |

---

## 🤖 Multi-Agent State Graph Workflow

```text
                                USER QUERY / EVALUATION HARNESS
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

- **`POST /api/agentic`**: Runs the complete `QyvenStateGraph` engine with dynamic planning, parallel execution, conflict resolution, deterministic confidence judging, self-evaluation, and investigation memory storage.
- **`GET /api/eval/scorecard`**: Serves the latest evaluation harness scorecard JSON, markdown summary, and run metadata to the dashboard.
- **`POST /api/memory`**: Performs short-term sliding window context retrieval, cross-session long-term memory commits, and integrity checks.
- **`POST /api/oracle`**: Oracle Terminal simulator with Graph RAG vector search, sub-graph traversal, and executive dossier synthesis.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x / 20+ / 24+ LTS
- npm, pnpm, or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/ssolanke22562/Qyven.git
cd Qyven

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Run Evaluation Harness Benchmark

```bash
# Execute end-to-end evaluation harness across all 36 test cases & compute scorecard
npm run eval
```

View the generated scorecard report in `eval/scorecard.md`, inspect raw results in `eval/results/latest.json`, or view the interactive UI dashboard at [http://localhost:3000/eval-dashboard](http://localhost:3000/eval-dashboard).

---

## 📂 Directory Structure

```
├── eval/                           # Evaluation Harness Suite
│   ├── testset.json                # 36 test queries across 6 categories
│   ├── runEval.ts                  # Harness runner (3x repeated pipeline runs + single-LLM baseline)
│   ├── scoreResults.ts             # Scoring module computing accuracy, groundedness, consistency, etc.
│   ├── baselineLlm.ts              # Baseline LLM provider (Groq / Gemini)
│   ├── telemetry.ts                # Telemetry extraction from QyvenState and HTTP payloads
│   ├── types.ts                    # TypeScript types for test cases, telemetry, metrics, and scorecard
│   ├── scorecard.md                # Markdown scorecard benchmark report
│   └── utils/                      # Text matching, Jaccard similarity, and statistics utilities
├── data/                           # Persistent JSON memory & investigation store
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── agentic/            # Autonomous State Graph API route
│   │   │   ├── eval/scorecard/     # Evaluation Scorecard API route
│   │   │   ├── memory/             # Context & Memory Management API route
│   │   │   └── oracle/             # Oracle terminal Graph RAG API route
│   │   ├── eval-dashboard/         # Dedicated Evaluation Scorecard Dashboard page
│   │   ├── globals.css             # Cyber aesthetic, scanlines & scrollbars
│   │   ├── layout.tsx              # Root layout with Space Grotesk / Inter fonts
│   │   └── page.tsx                # Main showcase page assembling all sections
│   ├── components/
│   │   ├── 3d/                     # Three.js 3D Knowledge Graph & Pipeline components
│   │   ├── sections/
│   │   │   ├── AgenticDashboardSection.tsx # Adversarial Demo & Telemetry HUD
│   │   │   ├── EvalScorecardSection.tsx    # Main App Embedded Evaluation Scorecard
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
