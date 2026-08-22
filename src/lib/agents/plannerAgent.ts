import { QyvenPlan, QyvenTask, QyvenState } from "./qyvenState";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODELS = ["groq/compound", "openai/gpt-oss-120b", "qwen/qwen3.6-27b", "groq/compound-mini"];

export async function createDynamicPlan(
  state: QyvenState,
  options?: { isReplan?: boolean; failureContext?: string }
): Promise<QyvenPlan> {
  const query = state.userQuery;
  const lowerQ = query.toLowerCase();
  const isReplan = options?.isReplan || false;
  const version = state.currentPlan.version + (isReplan ? 1 : 0);
  const planId = `plan-v${version}-${Date.now().toString(36)}`;

  // Determine tasks dynamically based on query characteristics
  const isHardwareOrPatent =
    lowerQ.includes("chip") ||
    lowerQ.includes("hardware") ||
    lowerQ.includes("npu") ||
    lowerQ.includes("gpu") ||
    lowerQ.includes("patent") ||
    lowerQ.includes("silicon") ||
    lowerQ.includes("battery") ||
    lowerQ.includes("quantum") ||
    lowerQ.includes("architecture");

  const isCorporateOrSec =
    lowerQ.includes("acquisition") ||
    lowerQ.includes("threat") ||
    lowerQ.includes("market") ||
    lowerQ.includes("nvidia") ||
    lowerQ.includes("tesla") ||
    lowerQ.includes("sec") ||
    lowerQ.includes("company") ||
    lowerQ.includes("competitor");

  const tasks: QyvenTask[] = [];

  // Group 1: Concurrent Parallel Investigation Agents
  tasks.push({
    id: `task-research-${Date.now()}`,
    agent: "RESEARCH_AGENT",
    title: "Academic & ArXiv Research Investigation",
    description: `Extract published scientific literature & pre-prints regarding "${query}"`,
    status: "PENDING",
    parallelGroup: 1,
  });

  tasks.push({
    id: `task-news-${Date.now()}`,
    agent: "NEWS_AGENT",
    title: "Market News & Breaking Signal Feed",
    description: `Retrieve breaking news & market announcements for "${query}"`,
    status: "PENDING",
    parallelGroup: 1,
  });

  if (isHardwareOrPatent || lowerQ.length > 25) {
    tasks.push({
      id: `task-patent-${Date.now()}`,
      agent: "PATENT_AGENT",
      title: "Patent Office & IP Specification Search",
      description: `Investigate USPTO/WIPO filings & IP assignments related to "${query}"`,
      status: "PENDING",
      parallelGroup: 1,
    });
  }

  if (isCorporateOrSec || lowerQ.length > 25) {
    tasks.push({
      id: `task-sec-${Date.now()}`,
      agent: "SEC_AGENT",
      title: "SEC Corporate EDGAR Filings Audit",
      description: `Audit official SEC 10-K, 10-Q & 8-K financial disclosure filings`,
      status: "PENDING",
      parallelGroup: 1,
    });
  }

  // If this is a replan after tool failure, add fallback task configuration
  if (isReplan && options?.failureContext) {
    tasks.forEach((t) => {
      if (options.failureContext?.includes(t.agent)) {
        t.description += ` (FALLBACK MODE: Routing through cached knowledge base & graph RAG)`;
      }
    });
  }

  const parallelCount = tasks.filter((t) => t.parallelGroup === 1).length;
  const rationale = isReplan
    ? `Autonomous Replan v${version}: Re-structured plan after detecting tool disruption (${options?.failureContext || "Tool Timeout"}). Utilizing multi-source fallback.`
    : `Dynamic Plan v${version}: Identified ${parallelCount} independent parallel investigation vectors for objective "${query}".`;

  return {
    id: planId,
    objective: query,
    rationale,
    tasks,
    createdAt: new Date().toISOString(),
    version,
  };
}
