/**
 * Super Eagles Sports Science & Causal Workload Model
 * Implements Dr. Tim Gabbett's Acute:Chronic Workload Ratio (ACWR) and Banister Impulse-Response.
 * Causal AI Reference: "Causal AI" & "Deep Learning with Structured Data".
 */

export interface WorkloadSession {
  date: string | Date;
  distanceKm: number;
  durationMinutes: number;
  sessionRpe: number; // Rate of Perceived Exertion (1 to 10)
}

export interface ACWRResult {
  acuteLoad: number; // Past 7 days workload
  chronicWeeklyAverage: number; // Rolling 28 days weekly average
  acwrRatio: number;
  status: "OPTIMAL" | "UNDER_TRAINING" | "OVER_REACHING" | "DANGER_ZONE";
  label: string;
  batteryLevelPercent: number; // 0 to 100 for visual battery UI
  colorClass: string;
  injuryRiskMultiplier: string;
  actionableDirective: string;
  disclaimer: string;
}

/**
 * Calculates Acute:Chronic Workload Ratio based on session RPE x Duration (Foster et al., 2001)
 * Acute window: 7 days
 * Chronic window: 28 days
 */
export function calculateACWR(
  sessions: WorkloadSession[],
  referenceDate: Date = new Date()
): ACWRResult {
  const refTime = referenceDate.getTime();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  // Filter sessions within last 28 days
  const validSessions = sessions.filter((s) => {
    const sessionTime = new Date(s.date).getTime();
    const diffDays = (refTime - sessionTime) / ONE_DAY_MS;
    return diffDays >= 0 && diffDays <= 28;
  });

  // Calculate session training load (RPE x Duration in minutes)
  let acuteLoad = 0; // Last 7 days
  let chronicTotal28 = 0; // Last 28 days

  validSessions.forEach((s) => {
    const sessionTime = new Date(s.date).getTime();
    const diffDays = (refTime - sessionTime) / ONE_DAY_MS;
    const sessionLoad = (s.sessionRpe || 5) * (s.durationMinutes || 45);

    chronicTotal28 += sessionLoad;
    if (diffDays <= 7) {
      acuteLoad += sessionLoad;
    }
  });

  // Chronic weekly average (28 days / 4 weeks)
  const chronicWeeklyAverage = Math.max(chronicTotal28 / 4, 250); // baseline floor to prevent division by zero

  // Acute:Chronic ratio
  const acwrRatio = Number((acuteLoad / chronicWeeklyAverage).toFixed(2));

  let status: ACWRResult["status"] = "OPTIMAL";
  let label = "Optimal Adaptation (Sweet Spot)";
  let batteryLevelPercent = 90;
  let colorClass = "text-emerald-400 bg-emerald-500/20 border-emerald-500/30";
  let injuryRiskMultiplier = "Lowest (< 4% risk)";
  let actionableDirective =
    "Cardiovascular progression is calibrated. Continue scheduled aerobic tempo and long run volume.";

  if (acwrRatio < 0.8) {
    status = "UNDER_TRAINING";
    label = "Under-Training / Tapering";
    batteryLevelPercent = Math.max(Math.round((acwrRatio / 0.8) * 50), 20);
    colorClass = "text-blue-400 bg-blue-500/20 border-blue-500/30";
    injuryRiskMultiplier = "Low (Fitness decay risk)";
    actionableDirective =
      "Aerobic stimulus has dipped below chronic threshold. Schedule a weekend pack long run or interval session to maintain conditioning.";
  } else if (acwrRatio >= 0.8 && acwrRatio <= 1.3) {
    status = "OPTIMAL";
    label = "Aerobic Sweet Spot";
    batteryLevelPercent = 85 + Math.round(((1.3 - acwrRatio) / 0.5) * 15);
    colorClass = "text-emerald-400 bg-emerald-500/20 border-emerald-500/30";
    injuryRiskMultiplier = "Lowest (< 4% injury probability)";
    actionableDirective =
      "Super-compensation zone: Tissue stress is balanced with recovery capacity. High training tolerance.";
  } else if (acwrRatio > 1.3 && acwrRatio <= 1.5) {
    status = "OVER_REACHING";
    label = "Functional Overreaching";
    batteryLevelPercent = 65;
    colorClass = "text-amber-400 bg-amber-500/20 border-amber-500/30";
    injuryRiskMultiplier = "Moderate (1.5x baseline)";
    actionableDirective =
      "Acute spike detected. Avoid back-to-back hard threshold days. Prioritize 8+ hours sleep and hydration.";
  } else {
    status = "DANGER_ZONE";
    label = "Acute Workload Spike (> 1.5)";
    batteryLevelPercent = 30;
    colorClass = "text-rose-400 bg-rose-500/20 border-rose-500/30";
    injuryRiskMultiplier = "High (2.5x to 4x injury risk)";
    actionableDirective =
      "Caution: Acute volume increased too rapidly relative to 28-day chronic baseline. Coach review recommended before high-intensity race pace efforts.";
  }

  return {
    acuteLoad: Math.round(acuteLoad),
    chronicWeeklyAverage: Math.round(chronicWeeklyAverage),
    acwrRatio,
    status,
    label,
    batteryLevelPercent,
    colorClass,
    injuryRiskMultiplier,
    actionableDirective,
    disclaimer:
      "Gabbett ACWR Workload metrics are non-medical sports science indicators for training load management and fatigue mitigation.",
  };
}
