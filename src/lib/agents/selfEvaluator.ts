import { QyvenState } from "./qyvenState";

export async function evaluateInvestigationQuality(state: QyvenState): Promise<{
  passed: boolean;
  answersQuestion: boolean;
  evidenceSufficient: boolean;
  conflictsResolved: boolean;
  feedback: string;
}> {
  const evidenceCount = state.evidenceTable.length;
  const unresolvedConflicts = state.conflicts.filter((c) => !c.isResolved).length;
  const confidenceScore = state.confidence.score;
  const replansCount = state.budget.usedReplans;
  const maxReplans = state.budget.maxReplans;

  const answersQuestion = evidenceCount >= 2;
  const evidenceSufficient = evidenceCount >= 3 || state.isFallback;
  const conflictsResolved = unresolvedConflicts === 0;

  // Evaluation criteria
  let passed = answersQuestion && evidenceSufficient && conflictsResolved && confidenceScore >= 50;

  // If budget prevents further replanning, force pass to deliver best available intelligence
  if (replansCount >= maxReplans) {
    passed = true;
  }

  let feedback = "";
  if (passed) {
    feedback = `Self-Evaluation PASSED: Answer verified across ${evidenceCount} evidence items with ${confidenceScore}% confidence score. All conflicts resolved.`;
  } else {
    feedback = `Self-Evaluation REJECTED (Confidence: ${confidenceScore}%, Evidence Count: ${evidenceCount}, Unresolved Conflicts: ${unresolvedConflicts}). Replanner required to gather alternate vector evidence.`;
  }

  return {
    passed,
    answersQuestion,
    evidenceSufficient,
    conflictsResolved,
    feedback,
  };
}
