import { QyvenState, QyvenEvidence, QyvenConflict } from "./qyvenState";

export async function processEvidenceAndConflicts(state: QyvenState): Promise<{
  evidenceTable: QyvenEvidence[];
  conflicts: QyvenConflict[];
  logsMessage: string;
}> {
  const evidenceTable: QyvenEvidence[] = [];
  const conflicts: QyvenConflict[] = [];
  let idCounter = 1;

  // 1. Process Research Agent (ArXiv) evidence
  const researchData = state.agentOutputs["RESEARCH_AGENT"];
  if (researchData?.keyFindings) {
    researchData.keyFindings.forEach((finding: string) => {
      evidenceTable.push({
        id: `ev-${idCounter++}`,
        claim: finding,
        source: "ArXiv Pre-print Repository",
        sourceType: "ARXIV",
        reliabilityScore: 0.82,
        extractedFromTask: "task-research",
        confidence: researchData.confidenceScore || 85,
      });
    });
  }

  // 2. Process News Agent evidence
  const newsData = state.agentOutputs["NEWS_AGENT"];
  if (newsData?.articles && Array.isArray(newsData.articles)) {
    newsData.articles.forEach((art: any) => {
      evidenceTable.push({
        id: `ev-${idCounter++}`,
        claim: `${art.title}: ${art.description || art.summary || ""}`,
        source: art.source || "Market News Feed",
        sourceType: "NEWS",
        reliabilityScore: 0.88,
        publishedDate: art.publishedAt,
        url: art.url,
        extractedFromTask: "task-news",
        confidence: 88,
      });
    });
  } else if (newsData?.fallbackUsed) {
    evidenceTable.push({
      id: `ev-${idCounter++}`,
      claim: `Market signals retrieved via fallback: ${newsData.summary || "Cached news context"}`,
      source: "Cached Knowledge Base",
      sourceType: "NEWS",
      reliabilityScore: 0.85,
      extractedFromTask: "task-news-fallback",
      confidence: 80,
    });
  }

  // 3. Process Patent Agent evidence
  const patentData = state.agentOutputs["PATENT_AGENT"];
  if (patentData?.data && Array.isArray(patentData.data)) {
    patentData.data.forEach((pat: any) => {
      evidenceTable.push({
        id: `ev-${idCounter++}`,
        claim: `[${pat.patentId}] ${pat.title} (${pat.assignee}): ${pat.abstract}`,
        source: `Patent Office (${pat.patentId})`,
        sourceType: "PATENT",
        reliabilityScore: 0.85,
        publishedDate: pat.filingDate,
        url: pat.url,
        extractedFromTask: "task-patent",
        confidence: 90,
      });
    });
  }

  // 4. Process SEC Agent evidence
  const secData = state.agentOutputs["SEC_AGENT"];
  if (secData?.data && Array.isArray(secData.data)) {
    secData.data.forEach((filing: any) => {
      evidenceTable.push({
        id: `ev-${idCounter++}`,
        claim: `[SEC ${filing.formType}] ${filing.headline}: ${filing.summary}`,
        source: `SEC EDGAR (${filing.companyName})`,
        sourceType: "SEC",
        reliabilityScore: 0.98,
        publishedDate: filing.filingDate,
        url: filing.url,
        extractedFromTask: "task-sec",
        confidence: 98,
      });
    });
  }

  // 5. Adversarial Demo Mode: Inject conflicting evidence if enabled or query mentions NVIDIA/Tesla timeline
  const isNvidiaQuery = state.userQuery.toLowerCase().includes("nvidia");
  const injectConflict = state.demoOptions.injectConflictingEvidence || (state.demoOptions.enableAdversarialMode && isNvidiaQuery);

  if (injectConflict) {
    const evConflictSec: QyvenEvidence = {
      id: `ev-${idCounter++}`,
      claim: "SEC Form 10-K Filing: Official commercial delivery schedule for next-gen AI inference silicon is set for Q2 2027.",
      source: "SEC EDGAR Form 10-K (Official Filing)",
      sourceType: "SEC",
      reliabilityScore: 0.98,
      publishedDate: "2024-02-21",
      extractedFromTask: "task-sec",
      confidence: 98,
    };

    const evConflictNews: QyvenEvidence = {
      id: `ev-${idCounter++}`,
      claim: "Tech Market News Report: Next-gen AI inference silicon volume shipments will start aggressively in early 2026.",
      source: "Unverified Tech Market Daily News",
      sourceType: "NEWS",
      reliabilityScore: 0.88,
      publishedDate: "2024-08-15",
      extractedFromTask: "task-news",
      confidence: 88,
    };

    evidenceTable.push(evConflictSec, evConflictNews);

    // Resolve conflict using Source Reliability Hierarchy (SEC > NEWS)
    conflicts.push({
      id: `conf-1`,
      topic: "Target Market Commercial Delivery Timeline",
      competingClaims: [
        {
          claim: evConflictSec.claim,
          source: evConflictSec.source,
          sourceType: evConflictSec.sourceType,
          reliabilityScore: evConflictSec.reliabilityScore,
          evidenceId: evConflictSec.id,
        },
        {
          claim: evConflictNews.claim,
          source: evConflictNews.source,
          sourceType: evConflictNews.sourceType,
          reliabilityScore: evConflictNews.reliabilityScore,
          evidenceId: evConflictNews.id,
        },
      ],
      isResolved: true,
      chosenClaim: evConflictSec.claim,
      resolutionReasoning: "Preferred official SEC EDGAR Form 10-K regulatory disclosure (Reliability: 0.98) over unverified market news rumor (Reliability: 0.88). Timeline grounded to Q2 2027.",
    });
  }

  const logsMessage = conflicts.length > 0
    ? `Collected ${evidenceTable.length} evidence items. DETECTED ${conflicts.length} conflicting claim(s). RESOLVED ${conflicts.filter((c) => c.isResolved).length} conflict(s) using Source Reliability Hierarchy (SEC > NEWS).`
    : `Collected ${evidenceTable.length} evidence items across ${state.currentPlan.tasks.length} tasks. 0 unresolved conflicts detected.`;

  return {
    evidenceTable,
    conflicts,
    logsMessage,
  };
}
