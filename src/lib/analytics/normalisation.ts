/**
 * Super Eagles Performance Normalisation Engine
 * Uses World Athletics and Riegel-Purdy principles to normalise competition times
 * across different distances and genders on a transparent 0-100 scale.
 */

export interface DistanceBenchmark {
  distanceKm: number;
  name: string;
  maleWorldRecordSeconds: number;
  femaleWorldRecordSeconds: number;
  maleClubEliteSeconds: number;
  femaleClubEliteSeconds: number;
  maleClubQualifyingSeconds: number;
  femaleClubQualifyingSeconds: number;
}

export const DISTANCE_BENCHMARKS: Record<string, DistanceBenchmark> = {
  "5K": {
    distanceKm: 5.0,
    name: "5 km Road / Parkrun",
    maleWorldRecordSeconds: 770,     // 12:50
    femaleWorldRecordSeconds: 853,   // 14:13
    maleClubEliteSeconds: 885,       // 14:45
    femaleClubEliteSeconds: 1005,    // 16:45
    maleClubQualifyingSeconds: 1200, // 20:00
    femaleClubQualifyingSeconds: 1380// 23:00
  },
  "10K": {
    distanceKm: 10.0,
    name: "10 km Road",
    maleWorldRecordSeconds: 1611,    // 26:51
    femaleWorldRecordSeconds: 1780,  // 29:40
    maleClubEliteSeconds: 1860,      // 31:00
    femaleClubEliteSeconds: 2130,    // 35:30
    maleClubQualifyingSeconds: 2520, // 42:00
    femaleClubQualifyingSeconds: 2880// 48:00
  },
  "15K": {
    distanceKm: 15.0,
    name: "15 km Road",
    maleWorldRecordSeconds: 2470,    // 41:10
    femaleWorldRecordSeconds: 2680,  // 44:40
    maleClubEliteSeconds: 2880,      // 48:00
    femaleClubEliteSeconds: 3300,    // 55:00
    maleClubQualifyingSeconds: 3900, // 65:00
    femaleClubQualifyingSeconds: 4500// 75:00
  },
  "HALF_MARATHON": {
    distanceKm: 21.0975,
    name: "Half Marathon (21.1 km)",
    maleWorldRecordSeconds: 3451,    // 57:31
    femaleWorldRecordSeconds: 3832,  // 1:03:52
    maleClubEliteSeconds: 4020,      // 1:07:00
    femaleClubEliteSeconds: 4620,    // 1:17:00
    maleClubQualifyingSeconds: 5400, // 1:30:00
    femaleClubQualifyingSeconds: 6300// 1:45:00
  },
  "MARATHON": {
    distanceKm: 42.195,
    name: "Marathon (42.2 km)",
    maleWorldRecordSeconds: 7235,    // 2:00:35
    femaleWorldRecordSeconds: 7796,  // 2:09:56
    maleClubEliteSeconds: 8400,      // 2:20:00
    femaleClubEliteSeconds: 9720,    // 2:42:00
    maleClubQualifyingSeconds: 11400,// 3:10:00
    femaleClubQualifyingSeconds: 13200 // 3:40:00
  },
  "ULTRA_50K": {
    distanceKm: 50.0,
    name: "50 km Ultra",
    maleWorldRecordSeconds: 9600,    // 2:40:00
    femaleWorldRecordSeconds: 10824, // 3:00:24
    maleClubEliteSeconds: 10800,     // 3:00:00
    femaleClubEliteSeconds: 12600,   // 3:30:00
    maleClubQualifyingSeconds: 15300,// 4:15:00
    femaleClubQualifyingSeconds: 17400 // 4:50:00
  },
  "ULTRA_56K": {
    distanceKm: 56.0,
    name: "Two Oceans Ultra (56 km)",
    maleWorldRecordSeconds: 11043,   // 3:04:03
    femaleWorldRecordSeconds: 12903, // 3:35:03
    maleClubEliteSeconds: 12600,     // 3:30:00
    femaleClubEliteSeconds: 14400,   // 4:00:00
    maleClubQualifyingSeconds: 18000,// 5:00:00
    femaleClubQualifyingSeconds: 20700 // 5:45:00
  },
  "ULTRA_90K": {
    distanceKm: 89.0,
    name: "Comrades Marathon (~89 km)",
    maleWorldRecordSeconds: 18839,   // 5:13:59
    femaleWorldRecordSeconds: 21295, // 5:54:55
    maleClubEliteSeconds: 21600,     // 6:00:00
    femaleClubEliteSeconds: 24300,   // 6:45:00
    maleClubQualifyingSeconds: 29700,// 8:15:00 (Bill Rowan / Bronze)
    femaleClubQualifyingSeconds: 32400 // 9:00:00
  }
};

/**
 * Finds the closest standard benchmark distance
 */
export function getClosestBenchmark(distanceKm: number): DistanceBenchmark {
  let closest: DistanceBenchmark = DISTANCE_BENCHMARKS["MARATHON"];
  let minDiff = Infinity;
  for (const key of Object.keys(DISTANCE_BENCHMARKS)) {
    const bm = DISTANCE_BENCHMARKS[key];
    const diff = Math.abs(bm.distanceKm - distanceKm);
    if (diff < minDiff) {
      minDiff = diff;
      closest = bm;
    }
  }
  return closest;
}

export interface NormalisedScoreResult {
  score: number; // 0 - 100
  worldAthleticsPoints: number; // roughly 400 - 1200
  equivalent10kTimeSeconds: number;
  equivalentMarathonTimeSeconds: number;
  percentileRank: number;
  formulaExplanation: string;
}

/**
 * Calculates normalized performance score on a 0-100 scale using benchmark ratios.
 * Formula:
 * 1. Ratio = BenchmarkTime / ActualTime
 * 2. Compares against Club Elite (ratio 1.0 -> 95-100 pts) down to Club Qualifying (ratio 0.70 -> 60 pts)
 */
export function calculateNormalizedScore(
  distanceKm: number,
  timeSeconds: number,
  gender: string = "MALE",
  discipline?: string
): NormalisedScoreResult {
  if (!distanceKm || distanceKm <= 0 || !timeSeconds || timeSeconds <= 0) {
    return {
      score: 0,
      worldAthleticsPoints: 0,
      equivalent10kTimeSeconds: 0,
      equivalentMarathonTimeSeconds: 0,
      percentileRank: 0,
      formulaExplanation: "Insufficient or invalid race distance/time inputs provided.",
    };
  }

  const isFemale = gender.toUpperCase() === "FEMALE";
  const isWalking = discipline ? discipline.toUpperCase().includes("WALK") : false;
  const benchmark = getClosestBenchmark(distanceKm);

  // Use standard Riegel power projection: T2 = T1 * (D2 / D1)^1.06
  const scaleToBenchmarkRatio = Math.pow(benchmark.distanceKm / distanceKm, 1.06);
  const adjustedTimeAtBenchmark = timeSeconds * scaleToBenchmarkRatio;

  // Race walking standard adjustment factor (World Athletics certified ~1.35x running duration)
  const walkingAdjustmentFactor = isWalking ? 1.35 : 1.0;

  const eliteStandard = (isFemale
    ? benchmark.femaleClubEliteSeconds
    : benchmark.maleClubEliteSeconds) * walkingAdjustmentFactor;

  const qualifyingStandard = (isFemale
    ? benchmark.femaleClubQualifyingSeconds
    : benchmark.maleClubQualifyingSeconds) * walkingAdjustmentFactor;

  const worldRecord = (isFemale
    ? benchmark.femaleWorldRecordSeconds
    : benchmark.maleWorldRecordSeconds) * walkingAdjustmentFactor;

  // Compute performance ratio relative to elite standard
  // If actual == elite, ratio = 1.0 (92 pts)
  // If actual == world record, ratio = elite / wr (approx 1.15 -> 100 pts)
  // If actual == qualifying, ratio = elite / qualifying (~0.73 -> 65 pts)
  const ratio = eliteStandard / adjustedTimeAtBenchmark;

  let rawScore = 0;
  if (ratio >= 1.0) {
    // Top tier: 92 to 100
    const maxRatio = eliteStandard / worldRecord;
    const progress = Math.min(1.0, (ratio - 1.0) / Math.max(0.01, maxRatio - 1.0));
    rawScore = 92 + progress * 8;
  } else if (ratio >= 0.70) {
    // Competitive tier: 60 to 92
    const progress = (ratio - 0.70) / 0.30;
    rawScore = 60 + progress * 32;
  } else {
    // Recreational / developing tier: 20 to 60
    const progress = Math.max(0, ratio / 0.70);
    rawScore = Math.max(10, progress * 60);
  }

  const score = Number(Math.min(100, Math.max(0, rawScore)).toFixed(1));

  // World athletics points estimation (approx 500-1250)
  const worldAthleticsPoints = Math.round(score * 12);

  // Equivalent times via Riegel
  const equivalent10kTimeSeconds = Math.round(timeSeconds * Math.pow(10.0 / distanceKm, 1.06));
  const equivalentMarathonTimeSeconds = Math.round(timeSeconds * Math.pow(42.195 / distanceKm, 1.06));

  // Percentile estimate in competitive athletics club
  const percentileRank = Math.min(99, Math.max(5, Math.round(score * 0.98)));

  const formulaExplanation = 
    `Normalised via standard distance curve (${benchmark.name}). ` +
    `Actual time scaled to benchmark distance yields equivalent time of ${Math.floor(adjustedTimeAtBenchmark / 60)}m ${Math.round(adjustedTimeAtBenchmark % 60)}s ` +
    `against Club Elite standard (${Math.floor(eliteStandard / 60)}m ${eliteStandard % 60}s). ` +
    `Performance Ratio: ${(ratio * 100).toFixed(1)}% -> Score: ${score}/100.`;

  return {
    score,
    worldAthleticsPoints,
    equivalent10kTimeSeconds,
    equivalentMarathonTimeSeconds,
    percentileRank,
    formulaExplanation,
  };
}
