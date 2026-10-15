/**
 * Super Eagles Major Event Resource-Use & Reciprocity Analysis Engine
 * Detects low reciprocity patterns using neutral, evidence-based management metrics.
 */

export interface ReciprocityInput {
  athleteId: string;
  athleteName: string;
  twelveMonthFinancialSupportZar: number;
  internalParticipationRatePercent: number; // e.g. 18%
  volunteerActivitiesCount: number;         // e.g. 1
  majorEventSupportRequestsCount: number;   // e.g. 4
  currentContributionScore: number;         // e.g. 27
  currentPerformanceScore: number;          // e.g. 88
  unmetObligationsCount: number;
  approvedExemptionReductionRatio?: number; // 0.0 to 1.0 (prevents false positives for approved medical/study exemptions)
}

export interface ReciprocityReviewResult {
  requiresReview: boolean;
  alertLevel: "NORMAL" | "RECIPROCITY_REVIEW_RECOMMENDED" | "CRITICAL_REVIEW";
  badgeColor: string;
  alertTitle: string;
  summaryMessage: string;
  metrics: {
    twelveMonthSpendZar: number;
    attendancePercent: number;
    volunteerCount: number;
    supportRequestsCount: number;
    contributionScore: number;
    performanceScore: number;
  };
  recommendedActions: string[];
}

export function evaluateReciprocityPattern(input: ReciprocityInput): ReciprocityReviewResult {
  // Adjust participation rate for approved exemptions to avoid FALSE POSITIVES
  const exemptionRatio = Math.min(1.0, Math.max(0, input.approvedExemptionReductionRatio || 0));
  const effectiveParticipationRate = exemptionRatio >= 1.0
    ? 100
    : exemptionRatio > 0
      ? Math.min(100, Math.round(input.internalParticipationRatePercent / (1 - exemptionRatio)))
      : input.internalParticipationRatePercent;

  // Calibrated multi-tiered criteria to eliminate FALSE NEGATIVES:
  const isTier1HighSpend = input.twelveMonthFinancialSupportZar >= 25000 && (effectiveParticipationRate < 35 || input.currentContributionScore < 40);
  const isTier2MidSpend = input.twelveMonthFinancialSupportZar >= 15000 && (effectiveParticipationRate < 25 || input.currentContributionScore < 30);
  const isTier3LowSpendChronic = input.twelveMonthFinancialSupportZar >= 5000 && (effectiveParticipationRate < 10 || input.unmetObligationsCount >= 2);
  const isHighRequestLowEngagement = input.majorEventSupportRequestsCount >= 3 && effectiveParticipationRate < 35;

  // Reciprocity alert triggered when high resource usage co-exists with low reciprocity
  const hasLowReciprocityPattern =
    isTier1HighSpend || isTier2MidSpend || isTier3LowSpendChronic || isHighRequestLowEngagement;

  if (!hasLowReciprocityPattern) {
    return {
      requiresReview: false,
      alertLevel: "NORMAL",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-300",
      alertTitle: "Healthy Reciprocity Alignment",
      summaryMessage: `Resource allocation is well-balanced with club engagement (${input.internalParticipationRatePercent}% attendance, ${input.volunteerActivitiesCount} volunteer sessions).`,
      metrics: {
        twelveMonthSpendZar: input.twelveMonthFinancialSupportZar,
        attendancePercent: input.internalParticipationRatePercent,
        volunteerCount: input.volunteerActivitiesCount,
        supportRequestsCount: input.majorEventSupportRequestsCount,
        contributionScore: input.currentContributionScore,
        performanceScore: input.currentPerformanceScore,
      },
      recommendedActions: ["Continue regular sponsorship support."],
    };
  }

  const isCritical =
    input.twelveMonthFinancialSupportZar > 35000 &&
    input.internalParticipationRatePercent < 20 &&
    input.unmetObligationsCount > 0;

  const alertLevel = isCritical ? "CRITICAL_REVIEW" : "RECIPROCITY_REVIEW_RECOMMENDED";
  const badgeColor = isCritical
    ? "bg-rose-100 text-rose-800 border-rose-300"
    : "bg-amber-100 text-amber-800 border-amber-300";

  const formattedSpend = `R${input.twelveMonthFinancialSupportZar.toLocaleString("en-US")}`;

  const summaryMessage =
    `Sponsorship Reciprocity Review Recommended. ` +
    `Internal participation over previous 12 months: ${input.internalParticipationRatePercent}%. ` +
    `Volunteer activities: ${input.volunteerActivitiesCount}. ` +
    `Major-event sponsorship allocations: ${input.majorEventSupportRequestsCount}. ` +
    `Club financial support received: ${formattedSpend}. ` +
    `Current Club Contribution Score: ${input.currentContributionScore}/100.`;

  return {
    requiresReview: true,
    alertLevel,
    badgeColor,
    alertTitle: "Sponsorship Reciprocity Review Recommended",
    summaryMessage,
    metrics: {
      twelveMonthSpendZar: input.twelveMonthFinancialSupportZar,
      attendancePercent: input.internalParticipationRatePercent,
      volunteerCount: input.volunteerActivitiesCount,
      supportRequestsCount: input.majorEventSupportRequestsCount,
      contributionScore: input.currentContributionScore,
      performanceScore: input.currentPerformanceScore,
    },
    recommendedActions: [
      "Convene sponsorship committee dialogue with athlete regarding club participation expectations.",
      "Consider structuring future major-event funding as conditional upon internal run and water-point commitments.",
      "Verify whether valid participation exemptions (e.g. work/study/injury) apply to the athlete.",
    ],
  };
}
