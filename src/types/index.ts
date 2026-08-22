export type NodeCategory = 
  | "Research Trend"
  | "Competitor Strategy"
  | "Technological Development"
  | "Policy"
  | "Market Signal";

export type SeverityLevel = "CRITICAL" | "HIGH" | "MONITOR" | "OPPORTUNITY";

export interface KnowledgeItem {
  id: string;
  title: string;
  one_line_summary: string;
  primary_category: NodeCategory;
  tags: string[];
  severity: SeverityLevel;
  confidence: number;
  extracted_date: string;
  source: {
    name: string;
    type: "paper" | "patent" | "news" | "regulatory" | "filing";
    citation?: string;
  };
  full_summary: string;
  key_entities: string[];
  threat_index: number;
  linked_item_ids: string[];
  position: [number, number, number];
  scatter_position: [number, number, number];
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  similarity: number;
  relationType: string;
}

export interface PipelineStage {
  id: string;
  week: string;
  name: string;
  script: string;
  role: string;
  summary: string;
  inputs: string[];
  outputs: string[];
  features: string[];
  codeSnippet: string;
  iconName: string;
  color: string;
  metrics: { label: string; value: string }[];
}

export interface TechStackItem {
  id: string;
  name: string;
  category: "Core Engine" | "Inference & LLM" | "Embeddings & Vectors" | "Clustering & ML" | "3D & Topology" | "Frontend & UX";
  iconName: string;
  role: string;
  latency: string;
  description: string;
  tags: string[];
  color: string;
}

export interface SafeguardItem {
  id: number;
  title: string;
  subtitle: string;
  principle: string;
  implementation: string;
  impact: string;
  codeSample: string;
  iconName: string;
  color: string;
}

export interface SampleQuery {
  id: string;
  query: string;
  category: string;
  badge: string;
  simulatedSteps: {
    step: string;
    detail: string;
    latency: number;
  }[];
  finalResponse: {
    summary: string;
    threatAssessment: string;
    recommendedActions: string[];
    linkedNodes: string[];
  };
}
