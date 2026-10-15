/**
 * Super Eagles Club Sponsorship Score (CSS) Engine
 * Separate 0-100 score measuring whether club sponsorship is justified.
 *
 * Configurable default weights:
 * - Verified Competition Performance: 25%
 * - Performance Improvement: 20%
 * - Future Performance / Race Potential: 15%
 * - Competitive Reliability: 10%
 * - Club Contribution & Loyalty: 20%
 * - Administrative / Sponsorship Obligation Compliance: 10%
 * TOTAL = 100%
 */

export interface SponsorshipScoreWeights {
  verifiedPerformanceWeight: number; // 0.25
  improvementWeight: number;           // 0.20
  futurePotentialWeight: number;       // 0.15
  reliabilityWeight: number;           // 0.10
  clubContributionWeight: number;      // 0.20
  complianceWeight: number;            // 0.10
}

export const DEFAULT_SPONSORSHIP_WEIGHTS: SponsorshipScoreWeights = {
  verifiedPerformanceWeight: 0.25,
  improvementWeight: 0.20,
  futurePotentialWeight: 0.15,
  reliabilityWeight: 0.10,
  clubContributionWeight: 0.20,
  complianceWeight: 0.10,
};

export type SponsorshipTier =
  | "ELITE_CLUB_ATHLETE"
  | "PERFORMANCE_ATHLETE"
  | "DEVELOPMENT_ATHLETE"
  | "MAINTAIN_SPONSORSHIP"
  | "INCREASE_SPONSORSHIP"
  | "CONDITIONAL_SPONSORSHIP"
  | "SPONSORSHIP_REVIEW"
  | "REDUCE_SPONSORSHIP"
  | "NON_SPONSORED";

export interface SponsorshipRecommendation {
  recommendedTier: SponsorshipTier;
  tierLabel: string;
  badgeColor: string;
  rationale: string;
  recommendedAction: string;
  suggestedConditions?: string[];
}

export interface SponsorshipScoreResult {
  totalScore: number; // 0 - 100
  componentScores: {
    verifiedPerformanceScore: number;
    improvementScore: number;
    futurePotentialScore: number;
    reliabilityScore: number;
    clubContributionScore: number;
    complianceScore: number;
  };
  weightedScores: {
    weightedPerformance: number;
    weightedImprovement: number;
    weightedPotential: number;
    weightedReliability: number;
    weightedContribution: number;
    weightedCompliance: number;
  };
  weights: SponsorshipScoreWeights;
  recommendation: SponsorshipRecommendation;
  explanation: string;
}

export function recommendSponsorshipTier(
  totalScore: number,
  perfScore: number,
  contribScore: number,
  improvementScore: number,
  complianceScore: number,
  hasBreachedConditions: boolean = false
): SponsorshipRecommendation {
  // 1. Check for breached conditions
  if (hasBreachedConditions) {
    return {
      recommendedTier: "REDUCE_SPONSORSHIP",
      tierLabel: "Reduce Sponsorship",
      badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
      rationale: "Athlete has unmet or breached conditional sponsorship covenants.",
      recommendedAction: "Schedule management review to formally adjust or reduce stipend / race allocations.",
    };
  }

  // 2. High Performance / Low Contribution: Reciprocity Review
  if (perfScore >= 80 && contribScore < 45) {
    return {
      recommendedTier: "CONDITIONAL_SPONSORSHIP",
      tierLabel: "Conditional Sponsorship",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
      rationale: "High athletic performance observed, but club participation and reciprocity remain below acceptable threshold.",
      recommendedAction: "Offer conditional agreement tied to mandatory attendance at internal club runs and volunteer marshal duty.",
      suggestedConditions: [
        "Attend ≥60% of designated internal club runs",
        "Participate in at least 2 club volunteer activities",
        "Wear official club apparel at all sponsored target events",
      ],
    };
  }

  // 3. Elite Club Athlete (Outstanding Performance + Strong Loyalty)
  if (perfScore >= 88 && contribScore >= 75 && totalScore >= 82) {
    return {
      recommendedTier: "ELITE_CLUB_ATHLETE",
      tierLabel: "Elite Club Athlete",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
      rationale: "Exceptional athletic performance coupled with exemplary club loyalty, volunteering, and representation.",
      recommendedAction: "Award Tier-1 maximum stipend, premier race entry allocation, kit package, and travel sponsorship.",
    };
  }

  // 4. Increase Sponsorship (High overall trajectory)
  if (totalScore >= 80 && improvementScore >= 75 && contribScore >= 70) {
    return {
      recommendedTier: "INCREASE_SPONSORSHIP",
      tierLabel: "Increase Sponsorship",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      rationale: "Strong longitudinal development and consistent contribution justify increased club investment.",
      recommendedAction: "Increase travel and race entry support for upcoming national/qualifying championship.",
    };
  }

  // 5. Performance Athlete
  if (perfScore >= 75 && contribScore >= 60 && totalScore >= 70) {
    return {
      recommendedTier: "PERFORMANCE_ATHLETE",
      tierLabel: "Performance Athlete",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
      rationale: "High verified performance standards with solid club participation.",
      recommendedAction: "Maintain Tier-2 race entry and kit support.",
    };
  }

  // 6. Development Athlete (Promising future, great club engagement, improving)
  if (improvementScore >= 72 && contribScore >= 60 && totalScore >= 65) {
    return {
      recommendedTier: "DEVELOPMENT_ATHLETE",
      tierLabel: "Development Athlete",
      badgeColor: "bg-teal-100 text-teal-800 border-teal-300",
      rationale: "Rapid improvement trajectory and high club commitment make athlete an ideal development investment.",
      recommendedAction: "Provide coaching clinic subsidy, race entries, and development mentorship.",
    };
  }

  // 7. Maintain Sponsorship
  if (totalScore >= 60) {
    return {
      recommendedTier: "MAINTAIN_SPONSORSHIP",
      tierLabel: "Maintain Sponsorship",
      badgeColor: "bg-sky-100 text-sky-800 border-sky-300",
      rationale: "Athlete continues to meet expected benchmarks across performance and participation.",
      recommendedAction: "Renew current sponsorship tier without adjustment.",
    };
  }

  // 8. Sponsorship Review
  if (totalScore >= 48 || contribScore < 35) {
    return {
      recommendedTier: "SPONSORSHIP_REVIEW",
      tierLabel: "Sponsorship Review",
      badgeColor: "bg-orange-100 text-orange-800 border-orange-300",
      rationale: "Score has slipped below benchmark levels. Human management review recommended.",
      recommendedAction: "Convene coach and athlete meeting to assess training hurdles and re-align expectations.",
    };
  }

  // 9. Non-Sponsored
  return {
    recommendedTier: "NON_SPONSORED",
    tierLabel: "Non-Sponsored",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-300",
    rationale: "Current performance and contribution indices do not qualify for club sponsorship funding.",
    recommendedAction: "Encourage participation in open club runs and time trials to build qualifying record.",
  };
}

export function calculateClubSponsorshipScore(
  perfScore: number,
  improvementScore: number,
  futurePotentialScore: number,
  reliabilityScore: number,
  clubContributionScore: number,
  complianceScore: number,
  customWeights?: Partial<SponsorshipScoreWeights>,
  hasBreachedConditions: boolean = false
): SponsorshipScoreResult {
  const weights: SponsorshipScoreWeights = {
    ...DEFAULT_SPONSORSHIP_WEIGHTS,
    ...customWeights,
  };

  const weightSum = (
    weights.verifiedPerformanceWeight +
    weights.improvementWeight +
    weights.futurePotentialWeight +
    weights.reliabilityWeight +
    weights.clubContributionWeight +
    weights.complianceWeight
  ) || 1.0;

  const wPerf = weights.verifiedPerformanceWeight / weightSum;
  const wImprv = weights.improvementWeight / weightSum;
  const wPot = weights.futurePotentialWeight / weightSum;
  const wRel = weights.reliabilityWeight / weightSum;
  const wCont = weights.clubContributionWeight / weightSum;
  const wComp = weights.complianceWeight / weightSum;

  const vPerf = Math.min(100, Math.max(0, perfScore));
  const vImprv = Math.min(100, Math.max(0, improvementScore));
  const vPot = Math.min(100, Math.max(0, futurePotentialScore));
  const vRel = Math.min(100, Math.max(0, reliabilityScore));
  const vCont = Math.min(100, Math.max(0, clubContributionScore));
  const vComp = Math.min(100, Math.max(0, complianceScore));

  const weightedPerformance = Number((vPerf * wPerf).toFixed(2));
  const weightedImprovement = Number((vImprv * wImprv).toFixed(2));
  const weightedPotential = Number((vPot * wPot).toFixed(2));
  const weightedReliability = Number((vRel * wRel).toFixed(2));
  const weightedContribution = Number((vCont * wCont).toFixed(2));
  const weightedCompliance = Number((vComp * wComp).toFixed(2));

  const totalScore = Number(
    (
      weightedPerformance +
      weightedImprovement +
      weightedPotential +
      weightedReliability +
      weightedContribution +
      weightedCompliance
    ).toFixed(2)
  );

  const recommendation = recommendSponsorshipTier(
    totalScore,
    vPerf,
    vCont,
    vImprv,
    vComp,
    hasBreachedConditions
  );

  const explanation =
    `Club Sponsorship Score: ${totalScore}/100. ` +
    `Verified Performance (${vPerf} × ${(wPerf * 100).toFixed(0)}% = ${weightedPerformance}), ` +
    `Improvement (${vImprv} × ${(wImprv * 100).toFixed(0)}% = ${weightedImprovement}), ` +
    `Future Potential (${vPot} × ${(wPot * 100).toFixed(0)}% = ${weightedPotential}), ` +
    `Reliability (${vRel} × ${(wRel * 100).toFixed(0)}% = ${weightedReliability}), ` +
    `Club Contribution (${vCont} × ${(wCont * 100).toFixed(0)}% = ${weightedContribution}), ` +
    `Compliance (${vComp} × ${(wComp * 100).toFixed(0)}% = ${weightedCompliance}). ` +
    `Recommendation: ${recommendation.tierLabel}.`;

  return {
    totalScore,
    componentScores: {
      verifiedPerformanceScore: vPerf,
      improvementScore: vImprv,
      futurePotentialScore: vPot,
      reliabilityScore: vRel,
      clubContributionScore: vCont,
      complianceScore: vComp,
    },
    weightedScores: {
      weightedPerformance,
      weightedImprovement,
      weightedPotential,
      weightedReliability,
      weightedContribution,
      weightedCompliance,
    },
    weights: {
      verifiedPerformanceWeight: wPerf,
      improvementWeight: wImprv,
      futurePotentialWeight: wPot,
      reliabilityWeight: wRel,
      clubContributionWeight: wCont,
      complianceWeight: wComp,
    },
    recommendation,
    explanation,
  };
}
