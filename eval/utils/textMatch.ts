const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "in", "on", "at", "to", "for", "of", "with",
  "is", "are", "was", "were", "be", "been", "being", "that", "this", "it",
  "as", "by", "from", "about", "into", "via", "will", "may", "can", "should",
]);

export function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(" ")
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

export function factMatchScore(responseText: string, facts: string[]): number | "unscored" {
  if (facts.length === 0) return "unscored";
  const normalizedResponse = normalizeText(responseText);
  const hits = facts.filter((fact) => {
    const nf = normalizeText(fact);
    if (nf.length <= 3) return normalizedResponse.includes(nf);
    const tokens = tokenize(fact);
    if (tokens.length === 0) return normalizedResponse.includes(nf);
    const matched = tokens.filter((t) => normalizedResponse.includes(t)).length;
    return matched / tokens.length >= 0.5 || normalizedResponse.includes(nf);
  });
  return hits.length / facts.length;
}

export function extractClaims(text: string): string[] {
  if (!text.trim()) return [];

  const lines = text
    .split(/\n+/)
    .map((l) => l.replace(/^[\s•\-\*\d\.]+/, "").trim())
    .filter((l) => l.length > 20);

  if (lines.length >= 2) return lines.slice(0, 30);

  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25);

  return sentences.slice(0, 20);
}

export function claimGrounded(
  claim: string,
  evidenceTexts: string[]
): boolean {
  const claimTokens = tokenize(claim);
  if (claimTokens.length === 0) return false;

  const normalizedEvidence = evidenceTexts.map(normalizeText).join(" ");
  const matched = claimTokens.filter((t) => normalizedEvidence.includes(t)).length;
  return matched / claimTokens.length >= 0.4;
}

export function groundednessScore(
  responseText: string,
  evidenceTexts: string[]
): number | "unscored" {
  if (evidenceTexts.length === 0) return "unscored";
  const claims = extractClaims(responseText);
  if (claims.length === 0) return "unscored";

  const grounded = claims.filter((c) => claimGrounded(c, evidenceTexts)).length;
  return grounded / claims.length;
}

export function collectEvidenceTexts(payload: {
  evidenceTable?: Array<{ claim?: string }>;
  sources?: Array<{ title?: string; summary?: string }>;
  formattedMarkdown?: string;
  response?: { summary?: string; recentNews?: string[] };
}): string[] {
  const texts: string[] = [];
  payload.evidenceTable?.forEach((e) => e.claim && texts.push(e.claim));
  payload.sources?.forEach((s) => {
    if (s.title) texts.push(s.title);
    if (s.summary) texts.push(s.summary);
  });
  payload.response?.recentNews?.forEach((n) => texts.push(n));
  if (payload.response?.summary) texts.push(payload.response.summary);
  return texts;
}
