import { TechStackItem } from "@/types";

export const TECH_STACK_ITEMS: TechStackItem[] = [
  {
    id: "tech-python",
    name: "Python 3.11+ Core",
    category: "Core Engine",
    iconName: "Terminal",
    color: "#38bdf8",
    role: "Async Pipeline Orchestration & Engine Runtime",
    latency: "Native AsyncIO",
    description: "Powers the asynchronous crawling workers, multiprocessing data extractors, and orchestrates the end-to-end InsightScout engine with typing and Pydantic validation.",
    tags: ["AsyncIO", "Pydantic v2", "Multiprocessing", "Type-Safe"]
  },
  {
    id: "tech-groq",
    name: "Groq & Llama 3.3 70B",
    category: "Inference & LLM",
    iconName: "Zap",
    color: "#f59e0b",
    role: "Ultra-Low Latency Entity Extraction & Synthesis",
    latency: "< 50ms TTFT / 650 tok/s",
    description: "Executes structured schema extraction on raw patents and news in milliseconds, enabling real-time classification without pipeline queuing bottlenecks.",
    tags: ["LPU Hardware", "JSON Mode", "Llama 3.3", "DeepSeek-V3"]
  },
  {
    id: "tech-sentence-transformers",
    name: "Sentence-Transformers",
    category: "Embeddings & Vectors",
    iconName: "Layers",
    color: "#00f0ff",
    role: "Dense Semantic Vector Embeddings",
    latency: "18ms / batch",
    description: "Transforms unstructured intelligence summaries into 1024-dimensional continuous vector spaces for precision similarity scoring and thematic discovery.",
    tags: ["BGE-Large", "Cosine Metric", "Torch JIT", "CUDA"]
  },
  {
    id: "tech-sklearn",
    name: "Scikit-Learn & NetworkX",
    category: "Clustering & ML",
    iconName: "Share2",
    color: "#a855f7",
    role: "Community Clustering & Graph Partitioning",
    latency: "O(V + E) Sub-graphing",
    description: "Applies Louvain community detection, DBSCAN clustering, and topological centrality algorithms to extract high-density competitive threat clusters.",
    tags: ["Louvain", "DBSCAN", "Centrality", "Eigenvector"]
  },
  {
    id: "tech-threejs",
    name: "React Three Fiber & Drei",
    category: "3D & Topology",
    iconName: "Box",
    color: "#10b981",
    role: "3D Hardware-Accelerated Knowledge Graph Canvas",
    latency: "60 FPS WebGL 2.0",
    description: "Renders responsive, hardware-accelerated 3D knowledge graphs with instanced node meshes, animated glowing shaders, and interactive raycasting controls.",
    tags: ["WebGL 2.0", "Instancing", "Raycasting", "Custom Shaders"]
  },
  {
    id: "tech-vis-network",
    name: "Vis-Network & D3",
    category: "3D & Topology",
    iconName: "GitBranch",
    color: "#ec4899",
    role: "2D Topological Force-Directed Network Graph",
    latency: "< 10ms Physics Step",
    description: "Provides dual-mode 2D network views with physics relaxation, edge weight thickness mapping, and intuitive cluster boundary visualizations.",
    tags: ["Force Atlas 2", "Canvas 2D", "Hierarchical", "Clustering"]
  },
  {
    id: "tech-nextjs",
    name: "Next.js 14 App Router",
    category: "Frontend & UX",
    iconName: "Globe",
    color: "#ffffff",
    role: "Executive Intelligence Web Portal & SSR Showcase",
    latency: "Instant Hydration",
    description: "Delivers a dark-mode-first, cyber-aesthetic command center with server components, streaming graph telemetry, and Framer Motion micro-interactions.",
    tags: ["App Router", "TypeScript", "Tailwind CSS", "Framer Motion"]
  },
  {
    id: "tech-faiss",
    name: "FAISS & Vector Index",
    category: "Embeddings & Vectors",
    iconName: "Database",
    color: "#6366f1",
    role: "Sub-Millisecond Vector Similarity Traversal",
    latency: "< 2ms KNN Lookup",
    description: "Indexes hundreds of thousands of intelligence vectors with Inverted File (IVF-PQ) quantization for instantaneous semantic nearest-neighbor retrieval.",
    tags: ["IVF-PQ", "Inner Product", "SIMD AVX-512", "Sub-2ms"]
  }
];
