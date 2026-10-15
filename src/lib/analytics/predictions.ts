/**
 * Super Eagles Race Prediction Engine
 * Deterministic mathematical prediction model using modified Riegel power curves,
 * adjusted by volume consistency, long-run preparedness, and pace durability.
 *
 * T2 = T1 * (D2 / D1)^(1.06 + fadeFactor - consistencyBonus)
 */

import { formatDuration } from "./pace";

export interface PredictionInput {
  recentRaceDistanceKm: number;
  recentRaceTimeSeconds: number;
  targetDistanceKm: number;
  targetGoalTimeSeconds?: number; // optional target goal time, e.g. 10800 for sub-3h
  weeklyVolumeAvgKm?: number;      // average weekly km over last 8 weeks
  longestRunKm?: number;           // longest run in last 6 weeks
  paceDurabilityDeteriorationPct?: number; // +2% to +15%
  trainingConsistencyRatio?: number; // 0.0 to 1.0 (attended vs planned)
}

export interface PredictionResult {
  targetDistanceKm: number;
  centralEstimateSeconds: number;
  centralEstimateFormatted: string;
  predictedRangeSeconds: {
    minSeconds: number;
    maxSeconds: number;
    minFormatted: string;
    maxFormatted: string;
  };
  confidencePercent: number;
  targetGoalTimeSeconds?: number;
  targetGoalFormatted?: string;
  probabilityOfTargetPercent?: number;
  assumptions: string[];
  fatigueFactorApplied: number;
}

/**
 * Standard Gaussian cumulative distribution function approximation (error function)
 */
function normalCdf(x: number, mean: number, stdDev: number): number {
  const z = (x - mean) / (stdDev || 1);
  const t = 1.0 / (1.0 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2.0);
  const prob =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1.0 - prob : prob;
}

export function predictRacePerformance(input: PredictionInput): PredictionResult {
  const d1 = input.recentRaceDistanceKm;
  const t1 = input.recentRaceTimeSeconds;
  const d2 = input.targetDistanceKm;

  if (!d1 || d1 <= 0 || !t1 || t1 <= 0 || !d2 || d2 <= 0) {
    return {
      targetDistanceKm: d2 || 0,
      centralEstimateSeconds: 0,
      centralEstimateFormatted: "--:--:--",
      predictedRangeSeconds: {
        minSeconds: 0,
        maxSeconds: 0,
        minFormatted: "--:--:--",
        maxFormatted: "--:--:--",
      },
      confidencePercent: 0,
      assumptions: ["Insufficient race baseline history to project race time."],
      fatigueFactorApplied: 1.06,
    };
  }

  // Base Riegel exponent is 1.06
  let exponent = 1.06;
  const assumptions: string[] = [];

  // 1. Durability adjustments
  const pdi = input.paceDurabilityDeteriorationPct;
  if (pdi !== undefined) {
    if (pdi <= 2.0) {
      exponent -= 0.012; // exceptional stamina
      assumptions.push("Favourable pace durability (-0.012 exponent bonus applied).");
    } else if (pdi > 8.0) {
      exponent += 0.025; // aerobic fade
      assumptions.push("Pace deterioration observed on long runs (+0.025 fatigue exponent added).");
    }
  }

  // 2. Target distance relative to baseline distance
  const distanceRatio = d2 / d1;

  // 3. Long run preparedness for marathon / ultra
  if (d2 >= 40.0) {
    const longestRun = input.longestRunKm || 0;
    if (longestRun < 28.0) {
      exponent += 0.03;
      assumptions.push("Longest recorded run is under 28 km; endurance decay anticipated.");
    } else if (longestRun >= 35.0) {
      exponent -= 0.01;
      assumptions.push("Solid 35+ km long run preparation verified.");
    }
  }

  // 4. Volume consistency
  const consistency = input.trainingConsistencyRatio ?? 0.85;
  if (consistency >= 0.90) {
    exponent -= 0.008;
    assumptions.push("High training consistency (>90%) enhances race sustainability.");
  } else if (consistency < 0.70) {
    exponent += 0.02;
    assumptions.push("Training consistency under 70% increases race variance.");
  }

  // Calculate central projection
  const projectedTimeSeconds = Math.round(t1 * Math.pow(d2 / d1, exponent));

  // Compute confidence percentage based on distance leap and data richness
  let baseConfidence = 85;
  if (distanceRatio > 3.0) baseConfidence -= 18; // e.g. predicting marathon from 5k
  else if (distanceRatio > 2.0) baseConfidence -= 10; // e.g. 10k to marathon
  else if (distanceRatio > 1.2) baseConfidence -= 4;

  if (pdi === undefined) baseConfidence -= 8;
  if (!input.longestRunKm && d2 >= 40) baseConfidence -= 10;
  const confidencePercent = Math.min(94, Math.max(45, baseConfidence));

  // Prediction range width (wider for lower confidence)
  const rangeVariancePercent = (100 - confidencePercent) * 0.12; // e.g. ~2% - 4.5%
  const minSeconds = Math.round(projectedTimeSeconds * (1.0 - rangeVariancePercent / 100));
  const maxSeconds = Math.round(projectedTimeSeconds * (1.0 + rangeVariancePercent / 100));

  // Target probability (if target time given)
  let probabilityOfTargetPercent: number | undefined;
  if (input.targetGoalTimeSeconds && input.targetGoalTimeSeconds > 0) {
    // Standard deviation estimated from prediction range
    const stdDevSeconds = (maxSeconds - minSeconds) / 3.92; // 95% interval
    // Probability that actual time <= target time
    const prob = normalCdf(input.targetGoalTimeSeconds, projectedTimeSeconds, stdDevSeconds);
    probabilityOfTargetPercent = Math.min(98, Math.max(2, Math.round(prob * 100)));
  }

  return {
    targetDistanceKm: d2,
    centralEstimateSeconds: projectedTimeSeconds,
    centralEstimateFormatted: formatDuration(projectedTimeSeconds),
    predictedRangeSeconds: {
      minSeconds,
      maxSeconds,
      minFormatted: formatDuration(minSeconds),
      maxFormatted: formatDuration(maxSeconds),
    },
    confidencePercent,
    targetGoalTimeSeconds: input.targetGoalTimeSeconds,
    targetGoalFormatted: input.targetGoalTimeSeconds
      ? formatDuration(input.targetGoalTimeSeconds)
      : undefined,
    probabilityOfTargetPercent,
    assumptions,
    fatigueFactorApplied: Number(exponent.toFixed(4)),
  };
}
