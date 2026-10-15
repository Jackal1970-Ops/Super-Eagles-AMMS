/**
 * Super Eagles Athlete Performance Index (API) Engine
 * Measures athletic capability, improvement, reliability, and goal capability on a 0-100 scale.
 * Configurable weights:
 * - Verified Competition Performance (default: 35%)
 * - Longitudinal Performance Improvement (default: 30%)
 * - Target Race Capability (default: 20%)
 * - Competitive Reliability (default: 15%)
 */

export interface PerformanceIndexWeights {
  verifiedPerformanceWeight: number; // e.g. 0.35
  improvementWeight: number;           // e.g. 0.30
  targetCapabilityWeight: number;      // e.g. 0.20
  reliabilityWeight: number;           // e.g. 0.15
}

export const DEFAULT_PERFORMANCE_WEIGHTS: PerformanceIndexWeights = {
  verifiedPerformanceWeight: 0.35,
  improvementWeight: 0.30,
  targetCapabilityWeight: 0.20,
  reliabilityWeight: 0.15,
};

export interface ImprovementBreakdown {
  threeMonthImprovementPercent: number;
  sixMonthImprovementPercent: number;
  twelveMonthImprovementPercent: number;
  improvementScore: number; // 0 - 100
  trendClassification: "Rapid Improvement" | "Improving" | "Stable" | "Watch" | "Declining" | "Significant Decline";
}

export interface PerformanceIndexResult {
  totalIndex: number; // 0 - 100
  verifiedPerformanceScore: number;
  improvementScore: number;
  targetCapabilityScore: number;
  reliabilityScore: number;
  weights: PerformanceIndexWeights;
  breakdown: {
    weightedVerified: number;
    weightedImprovement: number;
    weightedTarget: number;
    weightedReliability: number;
    explanation: string;
  };
  trend: ImprovementBreakdown;
}

/**
 * Classifies longitudinal performance trend based on percentage change.
 * Negative deterioration = faster times = improvement!
 */
export function classifyTrend(changePercent: number): ImprovementBreakdown["trendClassification"] {
  // changePercent: +5% means 5% faster (improved)
  if (changePercent >= 6.0) return "Rapid Improvement";
  if (changePercent >= 2.0) return "Improving";
  if (changePercent >= -2.0) return "Stable";
  if (changePercent >= -6.0) return "Watch";
  if (changePercent >= -12.0) return "Declining";
  return "Significant Decline";
}

/**
 * Calculates improvement score from historical race results / times.
 * If times improved by 5%, score is high.
 */
export function calculateImprovementScore(
  threeMonthChangePct: number,
  sixMonthChangePct: number,
  twelveMonthChangePct: number
): ImprovementBreakdown {
  // Weighted blend: 3-month (40%), 6-month (35%), 12-month (25%)
  const compositeChangePct = (
    threeMonthChangePct * 0.40 +
    sixMonthChangePct * 0.35 +
    twelveMonthChangePct * 0.25
  );

  const trendClassification = classifyTrend(compositeChangePct);

  // Baseline 70 pts for stable (0% change).
  // +10% improvement moves to ~95 pts. -10% decline moves to ~45 pts.
  const rawScore = 70 + compositeChangePct * 2.5;
  const improvementScore = Number(Math.min(100, Math.max(10, rawScore)).toFixed(1));

  return {
    threeMonthImprovementPercent: Number(threeMonthChangePct.toFixed(2)),
    sixMonthImprovementPercent: Number(sixMonthChangePct.toFixed(2)),
    twelveMonthImprovementPercent: Number(twelveMonthChangePct.toFixed(2)),
    improvementScore,
    trendClassification,
  };
}

/**
 * Calculates overall Athlete Performance Index (API).
 */
export function calculateAthletePerformanceIndex(
  verifiedPerformanceScore: number,
  improvementScore: number,
  targetCapabilityScore: number,
  reliabilityScore: number,
  customWeights?: Partial<PerformanceIndexWeights>,
  trendDetails?: ImprovementBreakdown
): PerformanceIndexResult {
  const weights: PerformanceIndexWeights = {
    ...DEFAULT_PERFORMANCE_WEIGHTS,
    ...customWeights,
  };

  // Normalise weights to ensure they sum to 1.0
  const weightSum = (
    weights.verifiedPerformanceWeight +
    weights.improvementWeight +
    weights.targetCapabilityWeight +
    weights.reliabilityWeight
  ) || 1.0;

  const wPerf = weights.verifiedPerformanceWeight / weightSum;
  const wImprv = weights.improvementWeight / weightSum;
  const wTgt = weights.targetCapabilityWeight / weightSum;
  const wRel = weights.reliabilityWeight / weightSum;

  const vPerf = Math.min(100, Math.max(0, verifiedPerformanceScore));
  const vImprv = Math.min(100, Math.max(0, improvementScore));
  const vTgt = Math.min(100, Math.max(0, targetCapabilityScore));
  const vRel = Math.min(100, Math.max(0, reliabilityScore));

  const weightedVerified = Number((vPerf * wPerf).toFixed(2));
  const weightedImprovement = Number((vImprv * wImprv).toFixed(2));
  const weightedTarget = Number((vTgt * wTgt).toFixed(2));
  const weightedReliability = Number((vRel * wRel).toFixed(2));

  const totalIndex = Number(
    (weightedVerified + weightedImprovement + weightedTarget + weightedReliability).toFixed(1)
  );

  const explanation =
    `Athlete Performance Index: ${totalIndex}/100. Breakdown: ` +
    `Verified Performance (${vPerf} × ${(wPerf * 100).toFixed(0)}% = ${weightedVerified}), ` +
    `Improvement (${vImprv} × ${(wImprv * 100).toFixed(0)}% = ${weightedImprovement}), ` +
    `Target Capability (${vTgt} × ${(wTgt * 100).toFixed(0)}% = ${weightedTarget}), ` +
    `Competitive Reliability (${vRel} × ${(wRel * 100).toFixed(0)}% = ${weightedReliability}).`;

  const trend = trendDetails || {
    threeMonthImprovementPercent: 0,
    sixMonthImprovementPercent: 0,
    twelveMonthImprovementPercent: 0,
    improvementScore: vImprv,
    trendClassification: classifyTrend(0),
  };

  return {
    totalIndex,
    verifiedPerformanceScore: vPerf,
    improvementScore: vImprv,
    targetCapabilityScore: vTgt,
    reliabilityScore: vRel,
    weights: {
      verifiedPerformanceWeight: wPerf,
      improvementWeight: wImprv,
      targetCapabilityWeight: wTgt,
      reliabilityWeight: wRel,
    },
    breakdown: {
      weightedVerified,
      weightedImprovement,
      weightedTarget,
      weightedReliability,
      explanation,
    },
    trend,
  };
}
