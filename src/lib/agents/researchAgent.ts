import { searchArxiv, ArxivPaper } from "@/lib/tools/arxiv";
import { searchNews, NewsArticle } from "@/lib/tools/news";
import { ResearchAgentOutput, ResearchAgentSource } from "./types";
import { LongTermMemoryRecord } from "@/lib/memory/types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GEMINI_MODELS = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-2.5-flash"];
const GROQ_MODELS = ["groq/compound", "openai/gpt-oss-120b", "qwen/qwen3.6-27b", "groq/compound-mini"];

export const RESEARCH_AGENT_SYSTEM_PROMPT = `You are a specialized Research Agent in the AgentX Multi-Agent architecture.
Your responsibility:
1. Receive user query objectives and raw retrieved search results from ArXiv papers and live news streams.
2. Filter out noise and identify highly relevant evidence, key findings, and preliminary entities.
3. Assess evidence strength and provide a confidence score (0-100%).
4. Output structured JSON matching the requested schema strictly.`;

function cleanLlmText(text: string): string {
  let clean = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  if (clean.startsWith("```")) {
    clean = clean.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
  }
  const jsonMatch = clean.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : clean;
}

function extractKeywordsFromQuery(query: string): string[] {
  const stopwords = new Set(["what", "who", "where", "when", "why", "how", "is", "are", "the", "a", "an", "and", "or", "in", "on", "at", "to", "for", "of", "with", "about", "latest", "recent", "news", "tell", "me"]);
  const words = query.replace(/[^\w\s]/gi, "").split(/\s+/);
  return words.filter((w) => w.length > 2 && !stopwords.has(w.toLowerCase()));
}

import { TokenUsage, PromptMetadata } from "../../../eval/types";

export async function runResearchAgent(
  query: string,
  memoryOptions?: {
    shortTermPrompt?: string;
    relevantPastMemory?: LongTermMemoryRecord[];
  }
): Promise<{
  output: ResearchAgentOutput;
  sources: ResearchAgentSource[];
  toolsUsed: string[];
  modelUsed: string;
  tokenUsage?: TokenUsage;
  promptMetadata?: PromptMetadata;
}> {
  const startTime = Date.now();
  const lowerQ = query.toLowerCase();
  const isNewsQuery = lowerQ.includes("news") || lowerQ.includes("market") || lowerQ.includes("recent") || lowerQ.includes("competitor") || lowerQ.includes("chip") || lowerQ.includes("acquisition") || lowerQ.includes("latest") || lowerQ.includes("today");
  const isArxivQuery = lowerQ.includes("arxiv") || lowerQ.includes("paper") || lowerQ.includes("research") || lowerQ.includes("breakthrough") || lowerQ.includes("model") || lowerQ.includes("ai");

  // Fetch real tool results in parallel
  const [newsResults, arxivResults] = await Promise.all([
    searchNews(query),
    isArxivQuery || !isNewsQuery ? searchArxiv(query) : Promise.resolve([] as ArxivPaper[]),
  ]);

  const toolsUsed: string[] = [];
  if (newsResults.length > 0) toolsUsed.push("news");
  if (arxivResults.length > 0) toolsUsed.push("arxiv");

  const sources: ResearchAgentSource[] = [
    ...newsResults.map((n) => ({
      type: "news" as const,
      title: n.title,
      link: n.url,
      source: n.source,
      published: n.publishedAt,
      summary: n.description,
      relevanceScore: 0.92,
    })),
    ...arxivResults.map((p) => ({
      type: "arxiv" as const,
      title: p.title,
      link: p.link,
      published: p.published,
      summary: p.summary,
      authors: p.authors,
      relevanceScore: 0.95,
    })),
  ];

  let memoryContextPrompt = "";
  if (memoryOptions?.shortTermPrompt) {
    memoryContextPrompt += `\n${memoryOptions.shortTermPrompt}\n`;
  }
  if (memoryOptions?.relevantPastMemory && memoryOptions.relevantPastMemory.length > 0) {
    memoryContextPrompt += `\n[RELEVANT CROSS-SESSION LONG-TERM MEMORY RECORDS]:\n` +
      memoryOptions.relevantPastMemory.map((r, i) => `[Record ${i + 1}] Query: "${r.query}" | Insights: ${r.keyInsights.join("; ")} | Grounded Nodes: ${r.groundedNodes.join(", ")}`).join("\n") + `\n`;
  }

  const userPrompt = `User Query: "${query}"
${memoryContextPrompt}
Raw Retrieved News (${newsResults.length} items):
${newsResults.length > 0 ? newsResults.map((n, i) => `[News ${i + 1}] "${n.title}" (${n.source}, ${n.publishedAt}): ${n.description}`).join("\n") : "No live news data found."}

Raw Retrieved Papers (${arxivResults.length} items):
${arxivResults.length > 0 ? arxivResults.map((p, i) => `[Paper ${i + 1}] "${p.title}" (${p.published}): ${p.summary}`).join("\n") : "No ArXiv paper data found."}

Return a valid JSON object with exact keys:
{
  "keyFindings": ["Finding 1 directly answering user query", "Finding 2"],
  "relevantEntities": ["Entity 1", "Entity 2"],
  "evidence": ["Evidence point 1", "Evidence point 2"],
  "confidenceScore": 92
}`;

  let modelUsed = "Groq Engine (groq/compound)";
  let llmText: string | null = null;
  let tokens: { promptTokens: number; completionTokens: number; totalTokens: number; isEstimated: boolean } | null = null;

  // Try Groq API first (since Groq models are verified active)
  if (GROQ_API_KEY) {
    for (const model of GROQ_MODELS) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: RESEARCH_AGENT_SYSTEM_PROMPT },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.2,
            max_tokens: 800,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content;
          if (text) {
            llmText = text;
            modelUsed = `Groq (${model})`;
            if (data.usage) {
              tokens = {
                promptTokens: data.usage.prompt_tokens || 0,
                completionTokens: data.usage.completion_tokens || 0,
                totalTokens: data.usage.total_tokens || 0,
                isEstimated: false,
              };
            }
            break;
          }
        }
      } catch (e) {
        console.warn(`ResearchAgent Groq ${model} error:`, e);
      }
    }
  }

  // Try Gemini if Groq fails
  if (!llmText && GEMINI_API_KEY) {
    for (const model of GEMINI_MODELS) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        const res = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: `${RESEARCH_AGENT_SYSTEM_PROMPT}\n\n${userPrompt}` }],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 800,
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            llmText = text;
            modelUsed = `Google ${model}`;
            if (data.usageMetadata) {
              tokens = {
                promptTokens: data.usageMetadata.promptTokenCount || 0,
                completionTokens: data.usageMetadata.candidatesTokenCount || 0,
                totalTokens: data.usageMetadata.totalTokenCount || 0,
                isEstimated: false,
              };
            }
            break;
          }
        }
      } catch (e) {
        console.warn(`ResearchAgent Gemini ${model} error:`, e);
      }
    }
  }

  // If no usage header provided, compute estimation
  if (!tokens) {
    const pTokens = Math.max(1, Math.ceil((RESEARCH_AGENT_SYSTEM_PROMPT.length + userPrompt.length) / 4));
    const cTokens = Math.max(1, Math.ceil((llmText || "").length / 4));
    tokens = {
      promptTokens: pTokens,
      completionTokens: cTokens,
      totalTokens: pTokens + cTokens,
      isEstimated: true,
    };
  }

  let keyFindings: string[] = [];
  let relevantEntities: string[] = [];
  let evidence: string[] = [];
  let confidenceScore = 88;

  if (llmText) {
    try {
      const cleaned = cleanLlmText(llmText);
      const parsed = JSON.parse(cleaned);
      keyFindings = parsed.keyFindings || [];
      relevantEntities = parsed.relevantEntities || [];
      evidence = parsed.evidence || [];
      if (typeof parsed.confidenceScore === "number") confidenceScore = parsed.confidenceScore;
    } catch (e) {
      console.warn("Failed to parse ResearchAgent LLM response JSON:", e);
    }
  }

  // DYNAMIC fallback generation tailored strictly to the user query
  const queryKeywords = extractKeywordsFromQuery(query);

  if (keyFindings.length === 0) {
    if (sources.length > 0) {
      sources.slice(0, 3).forEach((s) => {
        keyFindings.push(`[${s.type.toUpperCase()}] ${s.title}: ${s.summary || "Retrieved live intelligence data."}`);
      });
    } else {
      keyFindings.push(`Synthesized intelligence analysis regarding "${query}".`);
      if (queryKeywords.length > 0) {
        keyFindings.push(`Domain focus identified: ${queryKeywords.join(", ")}.`);
      }
    }
  }

  if (relevantEntities.length === 0) {
    const entitySet = new Set<string>();
    queryKeywords.forEach((k) => entitySet.add(k.charAt(0).toUpperCase() + k.slice(1)));
    sources.forEach((s) => {
      if (s.source) entitySet.add(s.source);
    });
    if (entitySet.size === 0) {
      entitySet.add(query.slice(0, 30));
    }
    relevantEntities = Array.from(entitySet);
  }

  if (evidence.length === 0) {
    if (sources.length > 0) {
      evidence = sources.map((s) => `[${s.type.toUpperCase()}] ${s.title}`);
    } else {
      evidence = [`Primary query directive: "${query}"`];
    }
  }

  const output: ResearchAgentOutput = {
    query,
    sources,
    keyFindings,
    relevantEntities,
    evidence,
    confidenceScore,
    timestamp: new Date().toISOString(),
    contextUsed: {
      shortTerm: Boolean(memoryOptions?.shortTermPrompt),
      longTermRecordsUsed: memoryOptions?.relevantPastMemory?.length || 0,
    },
  };

  return {
    output,
    sources,
    toolsUsed,
    modelUsed,
    tokenUsage: {
      promptTokens: tokens.promptTokens,
      completionTokens: tokens.completionTokens,
      totalTokens: tokens.totalTokens,
      isEstimated: tokens.isEstimated,
      modelName: modelUsed,
      estimatedCostUsd: (tokens.promptTokens / 1_000_000) * 0.8 + (tokens.completionTokens / 1_000_000) * 0.8,
    },
    promptMetadata: {
      systemPromptSnippet: RESEARCH_AGENT_SYSTEM_PROMPT.slice(0, 150),
      userPromptSnippet: userPrompt.slice(0, 200),
      templateName: "ResearchAgentPromptV1",
    },
  };
}


