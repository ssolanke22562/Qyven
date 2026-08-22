import { SampleQuery } from "@/types";

export const SAMPLE_QUERIES: SampleQuery[] = [
  {
    id: "q-graph-rag",
    query: "What algorithmic breakthroughs in reasoning and test-time compute can we adopt to counter open-weight price drops?",
    category: "Research Trend",
    badge: "HIGH OPPORTUNITY",
    simulatedSteps: [
      { step: "Vector Search", detail: "FAISS lookup matched 'res-01' (Test-Time Compute) and 'tech-02' (Graph RAG)", latency: 110 },
      { step: "Sub-Graph Clustering", detail: "Extracting Louvain community 'Reasoning & Inference Optimization' (6 nodes)", latency: 260 },
      { step: "Benchmark Comparison", detail: "Evaluating MCTS search budget scaling vs 400B parameter raw pretraining costs", latency: 420 },
      { step: "Synthesis Complete", detail: "Synthesizing executive recommendation brief", latency: 610 }
    ],
    finalResponse: {
      summary: "Allocating dynamic test-time compute via Monte Carlo Tree Search (MCTS) and Process Reward Models allows smaller 8B-14B models to match or exceed 70B-400B static teacher models at a fraction of training and serving cost.",
      threatAssessment: "HIGH OPPORTUNITY (Threat Index: 38/100). Offsets Rival B's open-weight pricing war by shifting architectural value to autonomous self-refinement and dynamic knowledge graph verification.",
      recommendedActions: [
        "Implement speculative multi-hop verification in The Oracle (ask.py) using process reward step evaluation.",
        "Leverage synthetic self-play curricula to distill complex planning routines into lightweight edge agents.",
        "Maintain graph topological memory to eliminate repetitive context window token re-computations."
      ],
      linkedNodes: ["res-01", "res-03", "tech-02", "comp-02"]
    }
  },
  {
    id: "q-compliance",
    query: "Assess our regulatory exposure under the latest EU AI Act and copyright web-scraping rulings.",
    category: "Policy",
    badge: "COMPLIANCE RISK",
    simulatedSteps: [
      { step: "Vector Search", detail: "Querying legal and regulatory graph cluster (K=4 nodes matched in 1.1ms)", latency: 105 },
      { step: "Regulatory Clause Cross-Check", detail: "Matching Article 52 High-Risk AI audit requirements with AgentX logging architecture", latency: 250 },
      { step: "Provenance Audit", detail: "Verifying SHA-256 source citation trails against US 2nd Circuit scraping rulings", latency: 410 },
      { step: "Compliance Brief Rendered", detail: "Generating audit-ready governance documentation", latency: 590 }
    ],
    finalResponse: {
      summary: "EU AI Act Regulation 2026/1689 imposes mandatory algorithmic audit trails and training data lineage for autonomous enterprise decision systems, while US appellate courts have denied copyright safe-harbor for paywall scrapers.",
      threatAssessment: "HIGH (Index 85/100). Failure to maintain cryptographically verifiable source lineage risks regulatory fines of up to 7% global turnover and copyright injunctions on scraped datasets.",
      recommendedActions: [
        "Enforce AgentX's SHA-256 cryptographic provenance logs on every ingested document across all crawlers.",
        "Adopt NIST SP 800-244 watermarking standards for all synthesized external intelligence briefings.",
        "Utilize clean licensed feeds and synthetic data curricula for all internal model fine-tuning."
      ],
      linkedNodes: ["pol-01", "pol-02", "pol-04", "tech-03"]
    }
  },
  {
    id: "q-market",
    query: "Analyze enterprise SaaS migration trends toward autonomous multi-agent systems.",
    category: "Market Signal",
    badge: "MARKET SHIFT",
    simulatedSteps: [
      { step: "Vector Search", detail: "Querying market signals and enterprise budget reallocation vectors (K=4 nodes)", latency: 115 },
      { step: "CIO Survey Synthesis", detail: "Aggregating Gartner 1,200 CIO budget reallocations away from standalone chatbots", latency: 270 },
      { step: "ROI Correlation", detail: "Benchmarking autonomous research ROI against fixed SaaS seat licenses", latency: 440 },
      { step: "Executive Summary", detail: "Generating commercial intelligence analysis", latency: 620 }
    ],
    finalResponse: {
      summary: "Enterprise IT budgets have shifted 72% away from generic chat interfaces toward autonomous multi-agent task orchestration, driven by measurable ROI in automated research and competitor monitoring.",
      threatAssessment: "OPPORTUNITY (Index: 35/100). Validates AgentX market timing and autonomous graph execution architecture over legacy conversational UI seats.",
      recommendedActions: [
        "Focus commercial go-to-market on automated competitor intelligence and continuous IP monitoring.",
        "Provide direct REST and webhook APIs for enterprise ERP/CRM integration.",
        "Deploy multi-tenant sovereign knowledge graphs with role-based access control."
      ],
      linkedNodes: ["mkt-01", "mkt-04", "comp-03", "tech-02"]
    }
  }
];