const GROQ_MODELS = ["groq/compound", "openai/gpt-oss-120b", "qwen/qwen3.6-27b", "groq/compound-mini"];
const GEMINI_MODELS = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-2.5-flash"];

const BASELINE_SYSTEM = `You are a competitive intelligence analyst. Answer the user query directly in 2-4 paragraphs.
Do not claim to have searched live databases. Be factual and concise.`;

export async function runBaselineLlm(query: string): Promise<{
  modelUsed: string;
  responseText: string;
}> {
  const groqKey = process.env.GROQ_API_KEY || "";
  const geminiKey = process.env.GEMINI_API_KEY || "";
  const userPrompt = `User Query: "${query}"\n\nProvide a direct intelligence brief without tool access.`;

  if (groqKey) {
    for (const model of GROQ_MODELS) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: BASELINE_SYSTEM },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.3,
            max_tokens: 600,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content;
          if (text) {
            return { modelUsed: `Groq (${model})`, responseText: text.trim() };
          }
        }
      } catch {
        // try next model
      }
    }
  }

  if (geminiKey) {
    for (const model of GEMINI_MODELS) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
        const res = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${BASELINE_SYSTEM}\n\n${userPrompt}` }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 600 },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return { modelUsed: `Google ${model}`, responseText: text.trim() };
          }
        }
      } catch {
        // try next model
      }
    }
  }

  return {
    modelUsed: "none (no API keys)",
    responseText: `[Baseline unavailable] No GROQ_API_KEY or GEMINI_API_KEY configured. Query was: ${query}`,
  };
}
