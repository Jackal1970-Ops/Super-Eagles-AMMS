/**
 * Super Eagles Athlete Readiness & Coaching Score (ARCS)
 * Evaluates non-medical training readiness, acute:chronic workload ratios,
 * and subjective wellness for athlete & coach training adjustments.
 *
 * NOTE: This is strictly a coaching tool and NEVER penalises the Sponsorship Score.
 */

export const NON_MEDICAL_DISCLAIMER =
  "This system provides sports-performance information and does not provide medical diagnosis or medical advice.";

export type ReadinessLevel = "HIGH" | "NORMAL" | "CAUTION" | "INSUFFICIENT_DATA";

export interface WellnessInput {
  restingHeartRate?: number;
  hrvRmssd?: number;
  sleepDurationHours?: number;
  sleepQuality?: number;    // 1 to 5 (5 = excellent)
  muscleSoreness?: number;  // 1 to 5 (1 = none, 5 = severe)
  fatigueLevel?: number;    // 1 to 5 (1 = none, 5 = severe)
  stressLevel?: number;     // 1 to 5 (1 = low, 5 = severe)
  acuteChronicRatio?: number; // ACWR e.g. 0.9 to 1.4
  recentSessionRpe?: number; // 1 to 10
}

export interface ReadinessResult {
  level: ReadinessLevel;
  label: string;
  badgeColor: string;
  readinessScore: number; // 0 to 100 advisory score
  acwrStatus: "OPTIMAL" | "UNDERLOAD" | "OVERLOAD_SPIKE" | "UNKNOWN";
  factors: {
    sleepStatus: string;
    fatigueSorenessStatus: string;
    workloadStatus: string;
    recoveryIndicator: string;
  };
  coachRecommendations: string[];
  disclaimer: string;
}

export function calculateAthleteReadiness(input: WellnessInput): ReadinessResult {
  const hasWellness =
    input.sleepQuality !== undefined ||
    input.fatigueLevel !== undefined ||
    input.muscleSoreness !== undefined ||
    input.acuteChronicRatio !== undefined;

  if (!hasWellness) {
    return {
      level: "INSUFFICIENT_DATA",
      label: "Insufficient Data",
      badgeColor: "bg-slate-100 text-slate-700 border-slate-300",
      readinessScore: 50,
      acwrStatus: "UNKNOWN",
      factors: {
        sleepStatus: "No recent sleep entries logged.",
        fatigueSorenessStatus: "No subjective fatigue or soreness ratings.",
        workloadStatus: "Workload ratio pending training logs.",
        recoveryIndicator: "Awaiting athlete self-report inputs.",
      },
      coachRecommendations: [
        "Prompt athlete to log subjective sleep and fatigue ratings in the mobile check-in.",
      ],
      disclaimer: NON_MEDICAL_DISCLAIMER,
    };
  }

  let score = 75; // baseline
  const recommendations: string[] = [];

  // 1. Sleep Evaluation (1-5 quality, hours)
  let sleepStatus = "Normal sleep pattern reported.";
  if (input.sleepQuality !== undefined) {
    if (input.sleepQuality >= 4) {
      score += 8;
      sleepStatus = "Restful, high quality sleep reported.";
    } else if (input.sleepQuality <= 2) {
      score -= 14;
      sleepStatus = "Disrupted or poor quality sleep reported.";
      recommendations.push("Consider lighter aerobic session or prioritizing sleep hygiene tonight.");
    }
  }

  // 2. Fatigue and Soreness (1 to 5 where 5 is high fatigue/soreness)
  let fatigueSorenessStatus = "Manageable fatigue levels.";
  const fatigue = input.fatigueLevel || 2;
  const soreness = input.muscleSoreness || 2;

  if (fatigue >= 4 || soreness >= 4) {
    score -= 16;
    fatigueSorenessStatus = "Elevated muscular fatigue or soreness detected.";
    recommendations.push("Substitute high-intensity intervals with recovery jog or mobility session.");
  } else if (fatigue <= 2 && soreness <= 2) {
    score += 8;
    fatigueSorenessStatus = "Muscular recovery in prime ready state.";
  }

  // 3. Acute:Chronic Workload Ratio (ACWR)
  let acwrStatus: ReadinessResult["acwrStatus"] = "OPTIMAL";
  let workloadStatus = "Training load within sweet-spot progression.";

  if (input.acuteChronicRatio !== undefined) {
    const acwr = input.acuteChronicRatio;
    if (acwr > 1.45) {
      score -= 18;
      acwrStatus = "OVERLOAD_SPIKE";
      workloadStatus = `Acute:Chronic workload ratio spike (${acwr.toFixed(2)} > 1.45).`;
      recommendations.push("Workload spike detected: caution advised to prevent soft-tissue overload.");
    } else if (acwr < 0.80) {
      acwrStatus = "UNDERLOAD";
      workloadStatus = `Underloading detected (ACWR ${acwr.toFixed(2)}).`;
    } else {
      acwrStatus = "OPTIMAL";
      score += 6;
      workloadStatus = `Optimal training load progression (ACWR ${acwr.toFixed(2)}).`;
    }
  }

  const finalScore = Math.min(100, Math.max(10, score));

  let level: ReadinessLevel = "NORMAL";
  let label = "Normal Readiness";
  let badgeColor = "bg-blue-100 text-blue-800 border-blue-300";

  if (finalScore >= 82) {
    level = "HIGH";
    label = "High Readiness";
    badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-300";
    if (recommendations.length === 0) {
      recommendations.push("Athlete primed for planned workout execution or high-intensity block.");
    }
  } else if (finalScore < 60) {
    level = "CAUTION";
    label = "Caution / Elevated Fatigue";
    badgeColor = "bg-amber-100 text-amber-800 border-amber-300";
  }

  return {
    level,
    label,
    badgeColor,
    readinessScore: finalScore,
    acwrStatus,
    factors: {
      sleepStatus,
      fatigueSorenessStatus,
      workloadStatus,
      recoveryIndicator: `Composite non-invasive index: ${finalScore}/100`,
    },
    coachRecommendations: recommendations,
    disclaimer: NON_MEDICAL_DISCLAIMER,
  };
}
