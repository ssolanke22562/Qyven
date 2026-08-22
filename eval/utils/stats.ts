export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function stddev(values: number[]): number {
  if (values.length <= 1) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

export function jaccardSimilarity(a: string[], b: string[]): number {
  const setA = new Set(a.map((s) => s.toLowerCase()));
  const setB = new Set(b.map((s) => s.toLowerCase()));
  if (setA.size === 0 && setB.size === 0) return 1;
  const arrA = Array.from(setA);
  const arrB = Array.from(setB);
  const intersection = arrA.filter((x) => setB.has(x)).length;
  const union = new Set(arrA.concat(arrB)).size;
  return union === 0 ? 0 : intersection / union;
}

export function averageMetric(values: Array<number | "unscored">): number | "unscored" {
  const nums = values.filter((v): v is number => typeof v === "number");
  if (nums.length === 0) return "unscored";
  return mean(nums);
}
