/**
 * Super Eagles Club Contribution & Loyalty Index (CCLI) Engine
 * Evaluates reciprocity, internal runs, volunteering, representation, mentoring, and compliance.
 *
 * Configurable default weights:
 * - Internal club run participation: 30%
 * - Club service / volunteering: 20%
 * - Club representation in designated races: 15%
 * - Mentoring / support of other athletes / pacing: 10%
 * - Club meetings / functions / initiatives: 10%
 * - Sponsorship obligation compliance: 10%
 * - Continuous active membership tenure: 5%
 *
 * Crucial Rule: Approved exemptions adjust the expected participation denominator,
 * ensuring athletes with valid exemptions (injuries, studies, national duty) are not penalized.
 */

export interface ClubContributionWeights {
  internalRunsWeight: number;     // 0.30
  volunteeringWeight: number;     // 0.20
  representationWeight: number;   // 0.15
  mentoringWeight: number;        // 0.10
  meetingsWeight: number;         // 0.10
  complianceWeight: number;       // 0.10
  tenureWeight: number;           // 0.05
}

export const DEFAULT_CONTRIBUTION_WEIGHTS: ClubContributionWeights = {
  internalRunsWeight: 0.30,
  volunteeringWeight: 0.20,
  representationWeight: 0.15,
  mentoringWeight: 0.10,
  meetingsWeight: 0.10,
  complianceWeight: 0.10,
  tenureWeight: 0.05,
};

export interface ExemptionAdjustment {
  hasApprovedExemption: boolean;
  exemptionReason?: string;
  originalExpectedSessions: number;
  reductionRatio: number; // e.g. 0.5 (50% reduction) or 1.0 (100% reduction)
  adjustedExpectedSessions: number;
}

export interface ContributionInput {
  internalRunsAttended: number;
  totalInternalRunsOffered: number;
  exemptionReductionRatio?: number; // 0.0 to 1.0
  exemptionReason?: string;

  volunteerEventsAttended: number;
  expectedVolunteerEvents?: number; // default 4 per year

  clubRepresentationCount: number;
  expectedRepresentationCount?: number; // default 3 per year

  mentoringSessionsCount: number;
  expectedMentoringCount?: number; // default 2 per year

  clubMeetingsAttended: number;
  totalClubMeetingsOffered?: number; // default 4 per year

  obligationsMetCount: number;
  totalObligationsAssigned: number;

  membershipTenureYears: number; // small weighting (5%)
}

export interface ClubContributionResult {
  totalScore: number; // 0 - 100
  attendanceRatePercent: number;
  scores: {
    internalRunsScore: number;
    volunteeringScore: number;
    representationScore: number;
    mentoringScore: number;
    meetingsScore: number;
    complianceScore: number;
    tenureScore: number;
  };
  weightedScores: {
    weightedInternalRuns: number;
    weightedVolunteering: number;
    weightedRepresentation: number;
    weightedMentoring: number;
    weightedMeetings: number;
    weightedCompliance: number;
    weightedTenure: number;
  };
  exemptionAdjustment: ExemptionAdjustment;
  weights: ClubContributionWeights;
  explanation: string;
}

export function calculateClubContributionScore(
  input: ContributionInput,
  customWeights?: Partial<ClubContributionWeights>
): ClubContributionResult {
  const weights: ClubContributionWeights = {
    ...DEFAULT_CONTRIBUTION_WEIGHTS,
    ...customWeights,
  };

  // Normalise weights
  const weightSum = (
    weights.internalRunsWeight +
    weights.volunteeringWeight +
    weights.representationWeight +
    weights.mentoringWeight +
    weights.meetingsWeight +
    weights.complianceWeight +
    weights.tenureWeight
  ) || 1.0;

  const wRuns = weights.internalRunsWeight / weightSum;
  const wVol = weights.volunteeringWeight / weightSum;
  const wRep = weights.representationWeight / weightSum;
  const wMent = weights.mentoringWeight / weightSum;
  const wMeet = weights.meetingsWeight / weightSum;
  const wComp = weights.complianceWeight / weightSum;
  const wTen = weights.tenureWeight / weightSum;

  // 1. Internal Runs with Exemption Adjustment
  const origExpectedRuns = Math.max(1, input.totalInternalRunsOffered || 24);
  const reductionRatio = Math.min(1.0, Math.max(0.0, input.exemptionReductionRatio || 0.0));
  const adjustedExpectedRuns = Math.max(1, Math.round(origExpectedRuns * (1.0 - reductionRatio)));

  const attendanceRatio = Math.min(1.0, input.internalRunsAttended / adjustedExpectedRuns);
  const internalRunsScore = Number((attendanceRatio * 100).toFixed(1));
  const attendanceRatePercent = Number((attendanceRatio * 100).toFixed(1));

  // 2. Volunteering (Target: 4 sessions = 100%)
  const targetVol = input.expectedVolunteerEvents || 4;
  const volunteeringScore = Number(
    Math.min(100, (input.volunteerEventsAttended / Math.max(1, targetVol)) * 100).toFixed(1)
  );

  // 3. Club Representation (Target: 3 events = 100%)
  const targetRep = input.expectedRepresentationCount || 3;
  const representationScore = Number(
    Math.min(100, (input.clubRepresentationCount / Math.max(1, targetRep)) * 100).toFixed(1)
  );

  // 4. Mentoring / Pacing (Target: 2 sessions = 100%)
  const targetMent = input.expectedMentoringCount || 2;
  const mentoringScore = Number(
    Math.min(100, (input.mentoringSessionsCount / Math.max(1, targetMent)) * 100).toFixed(1)
  );

  // 5. Club Meetings / Functions (Target: 4 meetings = 100%)
  const targetMeet = input.totalClubMeetingsOffered || 4;
  const meetingsScore = Number(
    Math.min(100, (input.clubMeetingsAttended / Math.max(1, targetMeet)) * 100).toFixed(1)
  );

  // 6. Sponsorship Obligations Compliance
  const totalObligations = input.totalObligationsAssigned || 0;
  let complianceScore = 100;
  if (totalObligations > 0) {
    complianceScore = Number(
      Math.min(100, (input.obligationsMetCount / totalObligations) * 100).toFixed(1)
    );
  }

  // 7. Membership Tenure (capped at 5 years for max 100 points, minimal 5% weight)
  const tenureYears = Math.max(0, input.membershipTenureYears || 0);
  const tenureScore = Number(Math.min(100, (tenureYears / 5.0) * 100).toFixed(1));

  // Compute Weighted Scores
  const weightedInternalRuns = Number((internalRunsScore * wRuns).toFixed(2));
  const weightedVolunteering = Number((volunteeringScore * wVol).toFixed(2));
  const weightedRepresentation = Number((representationScore * wRep).toFixed(2));
  const weightedMentoring = Number((mentoringScore * wMent).toFixed(2));
  const weightedMeetings = Number((meetingsScore * wMeet).toFixed(2));
  const weightedCompliance = Number((complianceScore * wComp).toFixed(2));
  const weightedTenure = Number((tenureScore * wTen).toFixed(2));

  const totalScore = Number(
    (
      weightedInternalRuns +
      weightedVolunteering +
      weightedRepresentation +
      weightedMentoring +
      weightedMeetings +
      weightedCompliance +
      weightedTenure
    ).toFixed(1)
  );

  const exemptionAdjustment: ExemptionAdjustment = {
    hasApprovedExemption: reductionRatio > 0,
    exemptionReason: input.exemptionReason,
    originalExpectedSessions: origExpectedRuns,
    reductionRatio,
    adjustedExpectedSessions: adjustedExpectedRuns,
  };

  const explanation =
    `Club Contribution & Loyalty: ${totalScore}/100. ` +
    `Internal Runs (${internalRunsScore} × ${(wRuns * 100).toFixed(0)}% = ${weightedInternalRuns}` +
    (reductionRatio > 0 ? ` [Exemption applied: ${origExpectedRuns} -> ${adjustedExpectedRuns} sessions]` : "") +
    `), Volunteering (${volunteeringScore} × ${(wVol * 100).toFixed(0)}% = ${weightedVolunteering}), ` +
    `Club Representation (${representationScore} × ${(wRep * 100).toFixed(0)}% = ${weightedRepresentation}), ` +
    `Mentoring/Pacing (${mentoringScore} × ${(wMent * 100).toFixed(0)}% = ${weightedMentoring}), ` +
    `Meetings (${meetingsScore} × ${(wMeet * 100).toFixed(0)}% = ${weightedMeetings}), ` +
    `Obligation Compliance (${complianceScore} × ${(wComp * 100).toFixed(0)}% = ${weightedCompliance}), ` +
    `Active Tenure (${tenureScore} × ${(wTen * 100).toFixed(0)}% = ${weightedTenure}).`;

  return {
    totalScore,
    attendanceRatePercent,
    scores: {
      internalRunsScore,
      volunteeringScore,
      representationScore,
      mentoringScore,
      meetingsScore,
      complianceScore,
      tenureScore,
    },
    weightedScores: {
      weightedInternalRuns,
      weightedVolunteering,
      weightedRepresentation,
      weightedMentoring,
      weightedMeetings,
      weightedCompliance,
      weightedTenure,
    },
    exemptionAdjustment,
    weights: {
      internalRunsWeight: wRuns,
      volunteeringWeight: wVol,
      representationWeight: wRep,
      mentoringWeight: wMent,
      meetingsWeight: wMeet,
      complianceWeight: wComp,
      tenureWeight: wTen,
    },
    explanation,
  };
}
