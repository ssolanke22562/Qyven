export type MetricValue = number | "unscored";

export interface CategoryMetricsRow {
  category: string;
  caseCount: number;
  accuracy: MetricValue;
  groundedness: MetricValue;
  hallucinationRate: MetricValue;
  consistency: MetricValue;
  recoveryRate: MetricValue;
  uncertaintyHandling: MetricValue;
  latencyMeanMs: MetricValue;
  latencyP95Ms: MetricValue;
  baselineAccuracyDelta: MetricValue;
  baselineGroundednessDelta: MetricValue;
}

export interface ScorecardView {
  generatedAt: string;
  sourceResultsFile: string;
  overall: CategoryMetricsRow;
  byCategory: CategoryMetricsRow[];
  perCase: Array<{
    id: string;
    category: string;
    accuracy: MetricValue;
    groundedness: MetricValue;
    consistency: MetricValue;
    recovery: boolean | "unscored";
    uncertaintyHandled: boolean | "unscored";
    latencyMeanMs: number;
    baselineAccuracyDelta: MetricValue;
  }>;
}
