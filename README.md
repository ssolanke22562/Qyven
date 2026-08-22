## Qyven — Autonomous Multi-Agent State Graph, Tracing & Competitor Intelligence Platform

[![Live Production Deployment](https://img.shields.io/badge/🚀%20Live%20Deployment-qyven--web.vercel.app-00f0ff?style=for-the-badge&logo=vercel)](https://qyven-web.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React Three Fiber](https://img.shields.io/badge/Three.js-R3F-blue?style=flat-square&logo=three.js)](https://docs.pmnd.rs/react-three-fiber)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Groq LPU](https://img.shields.io/badge/Groq-LPU%20Inference-orange?style=flat-square)](https://groq.com/)

> 🚀 **Live Production Deployment**: [**https://qyven-web.vercel.app/**](https://qyven-web.vercel.app/)
> 
> **Qyven is an autonomous, self-healing multi-agent intelligence platform featuring dynamic planning, parallel task execution, end-to-end distributed tracing, automated root-cause diagnosis, tool failure recovery, evidence conflict resolution, deterministic confidence scoring (0–100%), self-evaluation loops, persistent memory, a 3D interactive knowledge graph, and a rigorous Before-vs-After Benchmarking subsystem.**

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

### 2. End-to-End Tracing & Automated Diagnosis Subsystem
- **OTel-Compatible Span Collector**: In-process distributed tracing capturing node latencies, LLM prompt/completion token usage, tool invocations, and agent decision branches stored in `eval/traces/<traceId>.json`.
- **Automated Root-Cause Diagnosis**: Rule-based diagnosis engine that isolates root causes (e.g. News 503, Patent Timeout, LLM Cascade), traces downstream impacts (hallucination risk, source deprivation), and generates machine-readable reports in `eval/diagnoses/`.
- **System Improvement**: Implemented `retryFetch()` with exponential backoff (2 retries at 500ms/1000ms delay) in `src/lib/tools/news.ts` to overcome transient API disruptions before falling back.
- **Dedicated Trace Dashboard (`/trace-dashboard`)**: Visual interface featuring a Gantt-style span waterfall timeline, root cause analysis panel, and before/after performance comparison tables.

### 3. Built-in Evaluation Harness & Scorecard (`eval/`)
- **36 Test Queries Across 6 Categories**: Evaluates real pipeline performance across `normal`, `ambiguous`, `adversarial`, `contradictory`, `incomplete`, and `tool_failure` categories.
- **Single-LLM Direct Baseline Comparison**: Runs side-by-side comparative benchmarks against single-prompt direct LLM completions (Groq / Gemini) to compute accuracy and groundedness deltas.
- **Strict Non-Fabrication**: Unscored metrics (e.g. empty ground truth facts or absent evidence claims) are cleanly marked `"unscored"` rather than producing fabricated numbers.
- **Interactive UI Dashboard**: View complete scorecard metrics directly on the main application (`#eval-scorecard`) or via dedicated routes (`/eval-dashboard` and `/trace-dashboard`).

---

## 📈 Before vs. After System Improvement Benchmark

Empirical benchmark results generated via `npm run trace-benchmark` under controlled News API 503 disruption (`forceNewsFailure: true`):

| Metric | BEFORE Fix | AFTER Fix | Measurable Improvement |
|---|---|---|---|
| **Average Latency** | **729 ms** | **675 ms** | **-54 ms (-7.4%)** ▲ |
| **P95 Latency** | **860 ms** | **691 ms** | **-169 ms (-19.7%)** ▲ |
| **Average Tool Calls** | 6 | 6 | Maintained |
| **Task Success Rate** | 100.0% | 100.0% | 100% Reliable |
| **Average Replans Triggered** | 1 | 1 | Autonomous Recovery Active |

*Raw comparison manifests and per-iteration logs are saved to `eval/results/benchmark-comparison.json`.*

---

## 📊 Evaluation Scorecard Benchmark Results

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
- **`POST /api/oracle`**: Oracle Terminal simulator returning synthesized dossiers, sources, tools, and execution `traceId`.
- **`GET /api/trace/:traceId`**: Fetches granular span trace files from `eval/traces/`.
- **`POST /api/trace/diagnose`**: Runs the root-cause diagnosis engine on a trace and writes a structured report.
- **`GET /api/trace/benchmark`**: Serves before-vs-after benchmark performance comparison datasets.
- **`GET /api/eval/scorecard`**: Serves the latest evaluation harness scorecard JSON and markdown summary.
- **`POST /api/memory`**: Performs short-term sliding window context retrieval, cross-session long-term memory commits, and integrity checks.

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

### Run Tracing Benchmark & Scorecard Evaluation

```bash
# 1. Run the Before vs. After Tracing Benchmark (News 503 Controlled Failure)
npm run trace-benchmark

# 2. Execute the Full 36-Case Evaluation Harness
npm run eval
```

- View the **Trace Dashboard** at [http://localhost:3000/trace-dashboard](http://localhost:3000/trace-dashboard).
- View the **Evaluation Scorecard** at [http://localhost:3000/eval-dashboard](http://localhost:3000/eval-dashboard).

---

## 📂 Directory Structure

```
├── eval/                           # Evaluation & Tracing Suite
│   ├── testset.json                # 36 test queries across 6 categories
│   ├── runEval.ts                  # Harness runner (3x repeated pipeline runs + single-LLM baseline)
│   ├── scoreResults.ts             # Scoring module computing accuracy, groundedness, consistency, etc.
│   ├── trace-benchmark.ts          # Before/After benchmark harness for failure scenarios
│   ├── traces/                     # Saved OTel-compatible JSON execution traces
│   ├── diagnoses/                  # Machine-readable automated root cause reports
│   ├── results/                    # Scorecards and benchmark-comparison.json
│   ├── baselineLlm.ts              # Baseline LLM provider (Groq / Gemini)
│   ├── telemetry.ts                # Telemetry extraction from QyvenState and HTTP payloads
│   └── types.ts                    # TypeScript types for test cases, traces, spans, and scorecard
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── agentic/            # Autonomous State Graph API route
│   │   │   ├── eval/scorecard/     # Evaluation Scorecard API route
│   │   │   ├── memory/             # Context & Memory Management API route
│   │   │   ├── oracle/             # Oracle terminal Graph RAG API route
│   │   │   └── trace/              # Trace retrieval, list, diagnose & benchmark API routes
│   │   ├── trace-dashboard/        # Visual Span Waterfall & Root Cause Dashboard
│   │   ├── eval-dashboard/         # Dedicated Evaluation Scorecard Dashboard page
│   │   ├── globals.css             # Cyber aesthetic, scanlines & scrollbars
│   │   └── layout.tsx              # Root layout
│   ├── components/
│   │   ├── 3d/                     # Three.js 3D Knowledge Graph & Pipeline components
│   │   ├── sections/               # Architectural HUDs, Scorecards & Simulator sections
│   │   └── ui/                     # Navigation, Modals & Terminal UI
│   ├── lib/
│   │   ├── agents/                 # State Graph engine, Planner, Confidence Judge, Evaluator
│   │   ├── tracing/                # In-process span collector (tracer.ts) & diagnosis engine (diagnose.ts)
│   │   ├── memory/                 # Short-term & Long-term Memory Managers
│   │   └── tools/                  # Patent, SEC, News (with retry-backoff), and ArXiv tools
```

---

## 📜 License

MIT License — feel free to use and adapt for your own hackathon showcases!
