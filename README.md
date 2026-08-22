# AgentX (InsightScout Engine) — Autonomous Competitor Intelligence Agent

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React Three Fiber](https://img.shields.io/badge/Three.js-R3F-blue?style=flat-square&logo=three.js)](https://docs.pmnd.rs/react-three-fiber)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Groq LPU](https://img.shields.io/badge/Groq-LPU%20650%20tok%2Fs-orange?style=flat-square)](https://groq.com/)

> **Visually striking, dark-themed, 3D interactive landing and showcase application for AgentX — an autonomous competitor intelligence & research agent powered by persistent self-organizing knowledge graphs, Groq LPU inference, and Graph RAG.**

---

## 🌟 Highlights & Features

1. **Persistent Self-Organizing 3D Knowledge Graph**
   - Initialized with scattered 3D coordinates, nodes dynamically self-organize and converge into semantic thematic clusters on page load using dampening spring physics.
   - Categorized by color:
     - 🔵 **Research Trend** (`#00f0ff` Electric Cyan)
     - 🔴 **Competitor Strategy** (`#f43f5e` Neon Rose)
     - 🟣 **Technological Development** (`#a855f7` Electric Violet)
     - 🟢 **Policy & Regulation** (`#10b981` Neon Emerald)
     - 🟡 **Market Signal** (`#f59e0b` Amber Gold)
   - Real-time traveling light pulses along similarity edges with smooth mouse parallax and orbital drift.

2. **3D Interactive Pipeline Flow**
   - Horizontal 3D scene modeling the 4 weekly development stages:
     - **Week 1: The Scout** (`monitor.py`) — Multi-stream async crawlers (ArXiv, Patents, SEC 8-K, Social).
     - **Week 2: The Analyst** (`classify.py, recommend.py, link.py`) — Structured JSON extraction and 1024-dim embeddings.
     - **Week 3: The Cartographer** (`build_graph.py`) — Louvain community clustering & topological graph synthesis.
     - **Week 4: The Oracle** (`ask.py, app.py`) — Conversational Graph RAG & proactive threat alerts.
   - Animated ingestion streams (ArXiv, Patents, News, Social) feed particle streams into Stage 1.
   - Clickable modules with slide-over detail drawers showing contracts, metrics, and executable Python 3.11 code.

3. **Live Knowledge Graph Demo (Dedicated 3D Sandbox)**
   - Complete 3D sandbox with `OrbitControls` (pan, rotate, zoom).
   - Real-time taxonomy filtering and instant substring search.
   - **Node Inspector Drawer**: View complete executive summaries, threat severity ratings (1-100), source citations, connected node jump links, and simulated Oracle triggers.

4. **Tech Stack Showcase (3D Holographic Tilt Cards)**
   - Interactive 3D tilt cards for Python 3.11+, Groq LPU (Llama 3.3 70B), Sentence-Transformers, Scikit-Learn/NetworkX, React Three Fiber, Vis-Network, Next.js 14, and FAISS.

5. **5 Strategic Architecture Safeguards**
   - Production safeguards with code snippets, architecture highlights, and impact metrics:
     1. *Idempotent Ingestion Pipeline (SHA-256 Bloom Filter)*
     2. *Graceful Multi-LLM Fallbacks & Circuit Breakers*
     3. *Decoupled Asynchronous Worker Queues*
     4. *Social Noise & Hallucination Filtering*
     5. *UI & Vector Scalability (LOD & Instancing)*

6. **Ask The Oracle: Live Interactive Query Simulator**
   - Interactive terminal simulator executing multi-step Graph RAG traversal traces (*Vector Search* → *Sub-graph Traversal* → *Evidence Synthesis* → *Executive Dossier*).

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **3D Graphics**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **Animations**: `framer-motion`, Tailwind CSS keyframes
- **Icons**: `lucide-react`
- **Effects**: Custom cyber glassmorphism, scanlines, Canvas Confetti

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or 20+ / 24+ LTS
- npm or pnpm / yarn

### Installation

```bash
# Clone repository
git clone https://github.com/crystalOG9/Qyven.git
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

## 📂 Project Structure

```
├── public/                     # Static assets & icons
├── src/
│   ├── app/
│   │   ├── globals.css         # Cyber aesthetic, scanlines & scrollbars
│   │   ├── layout.tsx          # Root layout with Space Grotesk / Inter fonts
│   │   └── page.tsx            # Main showcase page assembling all sections
│   ├── components/
│   │   ├── 3d/
│   │   │   ├── BackgroundGraph.tsx          # Persistent 3D self-organizing graph
│   │   │   ├── CanvasWrapper.tsx            # Performance & SSR-safe Canvas wrapper
│   │   │   ├── EdgeMesh.tsx                 # Glowing edges & traveling light packets
│   │   │   ├── InteractiveGraphExplorer.tsx # Full 3D sandbox with OrbitControls
│   │   │   ├── NodeMesh.tsx                 # Pulsing 3D node spheres & halos
│   │   │   └── Pipeline3DScene.tsx          # Horizontal 3D pipeline visualization
│   │   ├── sections/
│   │   │   ├── HeroSection.tsx
│   │   │   ├── PipelineSection.tsx
│   │   │   ├── GraphDemoSection.tsx
│   │   │   ├── TechStackSection.tsx
│   │   │   ├── SafeguardsSection.tsx
│   │   │   ├── OracleTerminalSection.tsx
│   │   │   └── FooterSection.tsx
│   │   └── ui/
│   │       ├── ArchitectureModal.tsx
│   │       ├── CustomCursor.tsx
│   │       ├── Navbar.tsx
│   │       ├── NodeInspectorDrawer.tsx
│   │       └── PipelineDetailDrawer.tsx
│   ├── data/
│   │   ├── knowledgeGraphData.ts   # 40+ nodes & 60+ edges schema
│   │   ├── pipelineStages.ts       # 4-stage architecture specifications
│   │   ├── safeguardsData.ts       # 5 strategic production safeguards
│   │   ├── sampleQueries.ts        # Presets for the Oracle simulator
│   │   └── techStackData.ts        # Benchmarks & tech specifications
│   ├── hooks/
│   │   ├── useReducedMotion.ts
│   │   └── useScrollSpy.ts
│   ├── lib/
│   │   └── utils.ts
│   └── types/
│       └── index.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 📜 License

MIT License — feel free to use and adapt for your own hackathon showcases!