import { QyvenState } from "./qyvenState";

export function calculateDeterministicConfidence(state: QyvenState): {
  score: number;
  supportingEvidenceCount: number;
  independentSourcesCount: number;
  totalConflicts: number;
  resolvedConflicts: number;
  freshnessScore: number;
  reliabilityScore: number;
  reasoning: string;
} {
  const evidence = state.evidenceTable || [];
  const conflicts = state.conflicts || [];
  const replansCount = state.budget.usedReplans || 0;

  const supportingEvidenceCount = evidence.length;
  const sourceTypes = new Set(evidence.map((e) => e.sourceType));
  const independentSourcesCount = sourceTypes.size;

  const totalConflicts = conflicts.length;
  const resolvedConflicts = conflicts.filter((c) => c.isResolved).length;
  const unresolvedConflicts = totalConflicts - resolvedConflicts;

  // Calculate average reliability score of retrieved evidence
  const avgReliability = evidence.length > 0
    ? evidence.reduce((sum, e) => sum + e.reliabilityScore, 0) / evidence.length
    : 0.75;

  // Deterministic formula computation
  const baseEvidenceScore = Math.min(40, supportingEvidenceCount * 5);
  const diversityScore = Math.min(30, independentSourcesCount * 8);
  const reliabilityWeightScore = Math.round(avgReliability * 25);

  let rawScore = baseEvidenceScore + diversityScore + reliabilityWeightScore;

  // Penalties
  const unresolvedConflictPenalty = unresolvedConflicts * 18;
  const replanPenalty = replansCount * 3;

  rawScore = rawScore - unresolvedConflictPenalty - replanPenalty;

  // Clamp score between 15% and 98%
  const score = Math.max(15, Math.min(98, Math.round(rawScore)));

  // Generate breakdown explanation
  const reasoning = `Calculated ${score}% confidence deterministically: ${supportingEvidenceCount} evidence items across ${independentSourcesCount} distinct source categories (${Array.from(sourceTypes).join(", ")}). Avg Reliability: ${(avgReliability * 100).toFixed(0)}%. ${totalConflicts > 0 ? `Resolved ${resolvedConflicts}/${totalConflicts} conflicting claims.` : "0 conflicts."} ${replansCount > 0 ? `Applied ${replanPenalty}% penalty for ${replansCount} replan iteration(s).` : ""}`;

  return {
    score,
    supportingEvidenceCount,
    independentSourcesCount,
    totalConflicts,
    resolvedConflicts,
    freshnessScore: 0.92,
    reliabilityScore: parseFloat(avgReliability.toFixed(2)),
    reasoning,
  };
}
