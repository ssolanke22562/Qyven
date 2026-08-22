import { ResearchAgentOutput, AnalysisAgentOutput, SynthesisAgentOutput } from "./types";
import { LongTermMemoryRecord } from "@/lib/memory/types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-3.6-flash", "gemini-1.5-flash-latest"];

export const SYNTHESIS_AGENT_SYSTEM_PROMPT = `You are a strategic intelligence synthesizer in the AgentX Multi-Agent architecture.
Your responsibility:
1. Receive structured findings from Research Agent (sources, evidence, findings) AND Analysis Agent (extracted entities, relationships, threat ratings, grounded nodes).
2. Synthesize all insights into a cohesive, evidence-backed intelligence report.
3. CRITICAL STRUCTURAL RULE: Always order content as:
   - RECENT NEWS & CURRENT SIGNALS FIRST
   - PAST CONTEXT & HISTORICAL BACKGROUND SECOND
   - STRATEGIC TAKEAWAY & THREAT ASSESSMENT THIRD
4. Provide concrete evidence citations and confidence reasoning.
5. Return JSON matching the requested schema strictly.`;

export async function runSynthesisAgent(
  research: ResearchAgentOutput,
  analysis: AnalysisAgentOutput,
  isChatMode = false,
  memoryOptions?: {
    shortTermPrompt?: string;
    relevantPastMemory?: LongTermMemoryRecord[];
  }
): Promise<{
  output: SynthesisAgentOutput;
  formattedMarkdown?: string;
}> {
  const sourcesSummary = research.sources
    .map((s, i) => `[Source ${i + 1}] (${s.type.toUpperCase()}) "${s.title}" (${s.source || s.published || "Live Feed"}): ${s.summary}`)
    .join("\n");

  const entitiesSummary = analysis.extractedEntities
    .map((e) => `${e.name} (${e.category}, Threat: ${e.threatIndex || "N/A"})`)
    .join(", ");

  const relsSummary = analysis.relationships
    .map((r) => `${r.source} --[${r.relationType}]--> ${r.target}`)
    .join("; ");

  let memoryContextPrompt = "";
  if (memoryOptions?.shortTermPrompt) {
    memoryContextPrompt += `\n[SHORT-TERM CONVERSATIONAL HISTORY]:\n${memoryOptions.shortTermPrompt}\n`;
  }
  if (memoryOptions?.relevantPastMemory && memoryOptions.relevantPastMemory.length > 0) {
    memoryContextPrompt += `\n[RETRIEVED CROSS-SESSION LONG-TERM MEMORY]:\n` +
      memoryOptions.relevantPastMemory.map((r, i) => `• Past Query: "${r.query}" => Insights: ${r.keyInsights.join("; ")} (Grounded: ${r.groundedNodes.join(", ")})`).join("\n") + `\n`;
  }

  const userPrompt = `User Query: "${research.query}"
${memoryContextPrompt}
[RESEARCH AGENT INPUT]
Confidence: ${research.confidenceScore}%
Key Findings: ${research.keyFindings.join(" | ")}
Sources:
${sourcesSummary || "No external sources retrieved."}

[ANALYSIS AGENT INPUT]
Confidence: ${analysis.confidenceScore}%
Extracted Entities: ${entitiesSummary}
Discovered Relationships: ${relsSummary}
Grounded Node IDs: ${analysis.groundedNodes.join(", ")}
Threat Rating: ${analysis.threatRating}
Key Insights: ${analysis.keyInsights.join(" | ")}

Instructions:
Synthesize into a structured response.
${isChatMode ? `Format as elegant markdown strictly following:
### 📰 RECENT NEWS & CURRENT SIGNALS
(Summarize live signals, breaking news, recent competitor moves FIRST.)

### 📜 PAST CONTEXT & HISTORICAL BACKGROUND
(Synthesize historical knowledge graph background, precedent models, and cross-session past memory SECOND.)

### 🎯 STRATEGIC TAKEAWAY & THREAT INDEX
(Provide threat rating and 2-3 actionable executive recommendations.)` : `Return a JSON object with this exact schema:
{
  "summary": "Executive briefing placing RECENT NEWS FIRST, followed by PAST CONTEXT.",
  "recentNews": ["Recent breaking signal 1 with source link/name", "Recent competitor move 2"],
  "pastContext": ["Historical baseline compute context 1", "Foundational taxonomy background 2"],
  "threatAssessment": "${analysis.threatRating}",
  "recommendedActions": ["Action recommendation 1", "Action recommendation 2"],
  "linkedNodes": ${JSON.stringify(analysis.groundedNodes)},
  "confidenceReasoning": "Synthesized with 92% confidence based on validated live API search + multi-hop graph analysis.",
  "evidenceCitations": ["Citation 1", "Citation 2"]
}`}`;

  let llmText: string | null = null;

  // Try Gemini
  for (const model of GEMINI_MODELS) {
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `${SYNTHESIS_AGENT_SYSTEM_PROMPT}\n\n${userPrompt}` }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1200,
            ...(isChatMode ? {} : { responseMimeType: "application/json" }),
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          llmText = text;
          break;
        }
      }
    } catch (e) {
      console.warn(`SynthesisAgent Gemini ${model} error:`, e);
    }
  }

  // Fallback to Groq
  if (!llmText && GROQ_API_KEY) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            { role: "system", content: SYNTHESIS_AGENT_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 1200,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) llmText = text;
      }
    } catch (e) {
      console.warn("SynthesisAgent Groq fallback error:", e);
    }
  }

  let summary = `Executive Synthesis: Recent breaking news indicates accelerated competitor moves. Internal historical knowledge graph grounds this against past compute architectures.`;
  let recentNews: string[] = research.sources.map((s) => `• [${s.source || s.type.toUpperCase()}] ${s.title}`);
  let pastContext: string[] = analysis.keyInsights.map((k) => `• ${k}`);

  if (memoryOptions?.relevantPastMemory && memoryOptions.relevantPastMemory.length > 0) {
    memoryOptions.relevantPastMemory.forEach((rec) => {
      pastContext.push(`• [Past Session Record] Query: "${rec.query}" - ${rec.keyInsights.join("; ")}`);
    });
  }

  let threatAssessment = analysis.threatRating || "HIGH (Index: 85/100)";
  let recommendedActions: string[] = [
    "Accelerate internal FP4 dynamic quantization benchmark",
    "Monitor competitor custom NPU wafer allocations",
    "Cross-reference top 3D graph nodes in Inspector Drawer",
  ];
  let linkedNodes: string[] = analysis.groundedNodes.length > 0 ? analysis.groundedNodes : ["comp-01", "tech-01", "mkt-03"];
  let confidenceReasoning = `Evidence backed by Research Agent (${research.sources.length} sources) and Analysis Agent (${analysis.extractedEntities.length} entities, ${analysis.relationships.length} relationships).`;
  let evidenceCitations = research.sources.map((s) => s.title);

  if (llmText && !isChatMode) {
    try {
      const parsed = JSON.parse(llmText);
      if (parsed.summary) summary = parsed.summary;
      if (Array.isArray(parsed.recentNews)) recentNews = parsed.recentNews;
      if (Array.isArray(parsed.pastContext)) pastContext = parsed.pastContext;
      if (parsed.threatAssessment) threatAssessment = parsed.threatAssessment;
      if (Array.isArray(parsed.recommendedActions)) recommendedActions = parsed.recommendedActions;
      if (Array.isArray(parsed.linkedNodes)) linkedNodes = parsed.linkedNodes;
      if (parsed.confidenceReasoning) confidenceReasoning = parsed.confidenceReasoning;
      if (Array.isArray(parsed.evidenceCitations)) evidenceCitations = parsed.evidenceCitations;
    } catch (e) {
      summary = llmText;
    }
  }

  const output: SynthesisAgentOutput = {
    summary,
    recentNews,
    pastContext,
    threatAssessment,
    recommendedActions,
    linkedNodes,
    confidenceReasoning,
    evidenceCitations,
    timestamp: new Date().toISOString(),
    contextUsed: {
      shortTerm: Boolean(memoryOptions?.shortTermPrompt),
      longTermRecordsUsed: memoryOptions?.relevantPastMemory?.length || 0,
    },
  };

  const formattedMarkdown = isChatMode
    ? llmText || `### 📰 RECENT NEWS & CURRENT SIGNALS\n${recentNews.join("\n")}\n\n### 📜 PAST CONTEXT & HISTORICAL BACKGROUND\n${pastContext.join("\n")}\n\n### 🎯 STRATEGIC TAKEAWAY & THREAT INDEX\n• **Threat Index:** ${threatAssessment}\n${recommendedActions.map((a) => `• ${a}`).join("\n")}`
    : undefined;

  return {
    output,
    formattedMarkdown,
  };
}
