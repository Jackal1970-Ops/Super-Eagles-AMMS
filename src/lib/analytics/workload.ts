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
  status: "OPTIMAL" | "UNDER_TRAINING" | "OVER_REACHING" | "DANGER_ZONE" | "INSUFFICIENT_DATA";
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
    return Number.isFinite(sessionTime) && diffDays >= 0 && diffDays < 28 &&
      Number.isFinite(s.durationMinutes) && s.durationMinutes > 0 &&
      Number.isFinite(s.sessionRpe) && s.sessionRpe >= 1 && s.sessionRpe <= 10;
  });

  // Calculate session training load (RPE x Duration in minutes)
  let acuteLoad = 0; // Last 7 days
  let chronicTotal28 = 0; // Last 28 days

  validSessions.forEach((s) => {
    const sessionTime = new Date(s.date).getTime();
    const diffDays = (refTime - sessionTime) / ONE_DAY_MS;
    const sessionLoad = s.sessionRpe * s.durationMinutes;

    chronicTotal28 += sessionLoad;
    if (diffDays < 7) {
      acuteLoad += sessionLoad;
    }
  });

  // Chronic weekly average (28 days / 4 weeks)
  const chronicWeeklyAverage = chronicTotal28 / 4;

  if (validSessions.length === 0 || chronicWeeklyAverage <= 0) {
    return {
      acuteLoad: 0,
      chronicWeeklyAverage: 0,
      acwrRatio: 0,
      status: "INSUFFICIENT_DATA",
      label: "Insufficient Workload Data",
      batteryLevelPercent: 0,
      colorClass: "text-slate-400 bg-slate-500/20 border-slate-500/30",
      injuryRiskMultiplier: "Not estimated",
      actionableDirective: "Record valid session duration and session-RPE data before interpreting workload progression.",
      disclaimer: "ACWR is a descriptive non-medical workload ratio, not an injury prediction or medical diagnosis. Thresholds are advisory and must be interpreted with athlete-specific context and other evidence.",
    };
  }

  // Acute:Chronic ratio
  const acwrRatio = Number((acuteLoad / chronicWeeklyAverage).toFixed(2));

  let status: ACWRResult["status"] = "OPTIMAL";
  let label = "Optimal Adaptation (Sweet Spot)";
  let batteryLevelPercent = 90;
  let colorClass = "text-emerald-400 bg-emerald-500/20 border-emerald-500/30";
  let injuryRiskMultiplier = "No injury probability estimated";
  let actionableDirective =
    "Cardiovascular progression is calibrated. Continue scheduled aerobic tempo and long run volume.";

  if (acwrRatio < 0.8) {
    status = "UNDER_TRAINING";
    label = "Under-Training / Tapering";
    batteryLevelPercent = Math.max(Math.round((acwrRatio / 0.8) * 50), 20);
    colorClass = "text-blue-400 bg-blue-500/20 border-blue-500/30";
    injuryRiskMultiplier = "No injury probability estimated";
    actionableDirective =
      "Aerobic stimulus has dipped below chronic threshold. Schedule a weekend pack long run or interval session to maintain conditioning.";
  } else if (acwrRatio >= 0.8 && acwrRatio <= 1.3) {
    status = "OPTIMAL";
    label = "Aerobic Sweet Spot";
    batteryLevelPercent = 85 + Math.round(((1.3 - acwrRatio) / 0.5) * 15);
    colorClass = "text-emerald-400 bg-emerald-500/20 border-emerald-500/30";
    injuryRiskMultiplier = "No injury probability estimated";
    actionableDirective =
      "Super-compensation zone: Tissue stress is balanced with recovery capacity. High training tolerance.";
  } else if (acwrRatio > 1.3 && acwrRatio <= 1.5) {
    status = "OVER_REACHING";
    label = "Functional Overreaching";
    batteryLevelPercent = 65;
    colorClass = "text-amber-400 bg-amber-500/20 border-amber-500/30";
    injuryRiskMultiplier = "Elevated load ratio; interpret with other evidence";
    actionableDirective =
      "Acute spike detected. Avoid back-to-back hard threshold days. Prioritize 8+ hours sleep and hydration.";
  } else {
    status = "DANGER_ZONE";
    label = "Acute Workload Spike (> 1.5)";
    batteryLevelPercent = 30;
    colorClass = "text-rose-400 bg-rose-500/20 border-rose-500/30";
    injuryRiskMultiplier = "Large load spike; not a standalone injury prediction";
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
      "ACWR is a descriptive non-medical workload ratio, not an injury prediction or medical diagnosis. Thresholds are advisory and must be interpreted with athlete-specific context and other evidence.",
  };
}
