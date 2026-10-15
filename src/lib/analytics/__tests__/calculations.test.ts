import { describe, it, expect } from "vitest";
import {
  formatDuration,
  formatPace,
  parsePace,
  calculatePace,
  calculatePaceDeterioration,
  classifyPaceDurability,
} from "../pace";
import { calculateNormalizedScore, getClosestBenchmark } from "../normalisation";
import {
  calculateAthletePerformanceIndex,
  calculateImprovementScore,
  classifyTrend,
} from "../performanceIndex";
import { calculateClubContributionScore } from "../clubContribution";
import {
  calculateClubSponsorshipScore,
  recommendSponsorshipTier,
} from "../sponsorshipScore";
import { predictRacePerformance } from "../predictions";
import { calculateAthleteReadiness } from "../readiness";
import { evaluateReciprocityPattern } from "../reciprocity";
import { computeDispersedCoordinates } from "@/components/dashboard/PerformanceMatrix";

describe("1. Pace and Durability Calculations", () => {
  it("formats seconds into hh:mm:ss accurately", () => {
    expect(formatDuration(3665)).toBe("1:01:05");
    expect(formatDuration(10800)).toBe("3:00:00");
    expect(formatDuration(0)).toBe("0:00:00");
  });

  it("calculates and formats pace correctly", () => {
    // 10km in 45 minutes = 2700s / 10 = 270s/km = 4:30/km
    const paceSec = calculatePace(10, 2700);
    expect(paceSec).toBe(270);
    expect(formatPace(paceSec)).toBe("4:30/km");
    expect(parsePace("4:30/km")).toBe(270);
  });

  it("calculates pace deterioration accurately", () => {
    // Early pace 4:00/km (240s), Late pace 4:30/km (270s)
    // ((270 - 240) / 240) * 100 = 12.5%
    const det = calculatePaceDeterioration(240, 270);
    expect(det).toBe(12.5);

    // Negative split: early 270s, late 240s -> -11.11%
    const negDet = calculatePaceDeterioration(270, 240);
    expect(negDet).toBe(-11.11);
  });

  it("correctly classifies pace durability categories", () => {
    expect(classifyPaceDurability(1.5).rating).toBe("EXCELLENT");
    expect(classifyPaceDurability(4.2).rating).toBe("GOOD");
    expect(classifyPaceDurability(8.5).rating).toBe("MODERATE");
    expect(classifyPaceDurability(15.0).rating).toBe("POOR");
    expect(classifyPaceDurability(0, false).rating).toBe("INSUFFICIENT_DATA");
  });
});

describe("2. World Athletics / Distance Normalisation", () => {
  it("retrieves the closest benchmark", () => {
    expect(getClosestBenchmark(42.2).name).toContain("Marathon");
    expect(getClosestBenchmark(21.1).name).toContain("Half Marathon");
    expect(getClosestBenchmark(56).name).toContain("Two Oceans");
  });

  it("scores elite marathon times with high normalized values", () => {
    // 2h18m marathon (8280s) for male (benchmark elite is 8400s)
    const result = calculateNormalizedScore(42.195, 8280, "MALE");
    expect(result.score).toBeGreaterThanOrEqual(92);
    expect(result.formulaExplanation).toContain("Performance Ratio");
  });

  it("scores recreational times appropriately on 0-100 scale", () => {
    // 4h30m marathon (16200s) for male
    const result = calculateNormalizedScore(42.195, 16200, "MALE");
    expect(result.score).toBeLessThan(60);
    expect(result.score).toBeGreaterThan(15);
  });
});

describe("3. Athlete Performance Index (API)", () => {
  it("computes weighted index matching specified formula", () => {
    // Verified 90, Improvement 80, Target 85, Reliability 80
    // 90 * 0.35 = 31.5
    // 80 * 0.30 = 24.0
    // 85 * 0.20 = 17.0
    // 80 * 0.15 = 12.0
    // Total = 84.5
    const res = calculateAthletePerformanceIndex(90, 80, 85, 80);
    expect(res.totalIndex).toBe(84.5);
    expect(res.breakdown.weightedVerified).toBe(31.5);
    expect(res.breakdown.weightedImprovement).toBe(24.0);
    expect(res.breakdown.weightedTarget).toBe(17.0);
    expect(res.breakdown.weightedReliability).toBe(12.0);
  });

  it("supports dynamic weight configuration", () => {
    const customWeights = {
      verifiedPerformanceWeight: 0.50,
      improvementWeight: 0.20,
      targetCapabilityWeight: 0.15,
      reliabilityWeight: 0.15,
    };
    const res = calculateAthletePerformanceIndex(100, 50, 50, 50, customWeights);
    // 100*0.5 + 50*0.2 + 50*0.15 + 50*0.15 = 50 + 10 + 7.5 + 7.5 = 75
    expect(res.totalIndex).toBe(75);
  });

  it("correctly classifies longitudinal trend", () => {
    expect(classifyTrend(7.5)).toBe("Rapid Improvement");
    expect(classifyTrend(3.0)).toBe("Improving");
    expect(classifyTrend(0.5)).toBe("Stable");
    expect(classifyTrend(-4.0)).toBe("Watch");
    expect(classifyTrend(-8.0)).toBe("Declining");
    expect(classifyTrend(-15.0)).toBe("Significant Decline");
  });
});

describe("4. Club Contribution, Loyalty & Approved Exemptions", () => {
  it("adjusts expected denominator when an approved exemption is applied", () => {
    // Athlete attended 10 runs. Total offered = 20.
    // Without exemption: 10 / 20 = 50%
    const withoutExemption = calculateClubContributionScore({
      internalRunsAttended: 10,
      totalInternalRunsOffered: 20,
      exemptionReductionRatio: 0,
      volunteerEventsAttended: 4,
      clubRepresentationCount: 3,
      mentoringSessionsCount: 2,
      clubMeetingsAttended: 4,
      obligationsMetCount: 2,
      totalObligationsAssigned: 2,
      membershipTenureYears: 3,
    });
    expect(withoutExemption.attendanceRatePercent).toBe(50);

    // With 50% approved study/work exemption:
    // Adjusted expected runs = 20 * (1 - 0.5) = 10.
    // With 10 attended, attendance rate = 10 / 10 = 100%!
    const withExemption = calculateClubContributionScore({
      internalRunsAttended: 10,
      totalInternalRunsOffered: 20,
      exemptionReductionRatio: 0.5,
      exemptionReason: "University Exam Preparation",
      volunteerEventsAttended: 4,
      clubRepresentationCount: 3,
      mentoringSessionsCount: 2,
      clubMeetingsAttended: 4,
      obligationsMetCount: 2,
      totalObligationsAssigned: 2,
      membershipTenureYears: 3,
    });
    expect(withExemption.attendanceRatePercent).toBe(100);
    expect(withExemption.exemptionAdjustment.hasApprovedExemption).toBe(true);
    expect(withExemption.totalScore).toBeGreaterThan(withoutExemption.totalScore);
  });
});

describe("5. Club Sponsorship Score & Decision Workflow", () => {
  it("calculates exact transparent weighted sponsorship score", () => {
    // 91 * 0.25 = 22.75
    // 84 * 0.20 = 16.80
    // 88 * 0.15 = 13.20
    // 79 * 0.10 = 7.90
    // 32 * 0.20 = 6.40
    // 65 * 0.10 = 6.50
    // Total = 73.55
    const res = calculateClubSponsorshipScore(91, 84, 88, 79, 32, 65);
    expect(res.totalScore).toBe(73.55);
    expect(res.weightedScores.weightedPerformance).toBe(22.75);
    expect(res.weightedScores.weightedImprovement).toBe(16.8);
    expect(res.weightedScores.weightedPotential).toBe(13.2);
    expect(res.weightedScores.weightedReliability).toBe(7.9);
    expect(res.weightedScores.weightedContribution).toBe(6.4);
    expect(res.weightedScores.weightedCompliance).toBe(6.5);
  });

  it("recommends Conditional Sponsorship for High Performance with Low Contribution", () => {
    // Perf 90, Contribution 30
    const rec = recommendSponsorshipTier(72, 90, 30, 80, 80);
    expect(rec.recommendedTier).toBe("CONDITIONAL_SPONSORSHIP");
    expect(rec.suggestedConditions).toBeDefined();
    expect(rec.suggestedConditions?.length).toBeGreaterThan(0);
  });

  it("recommends Elite Club Athlete for high performance and high loyalty", () => {
    const rec = recommendSponsorshipTier(88, 92, 85, 85, 95);
    expect(rec.recommendedTier).toBe("ELITE_CLUB_ATHLETE");
  });

  it("recommends Reduce Sponsorship when conditions are breached", () => {
    const rec = recommendSponsorshipTier(75, 80, 70, 70, 70, true);
    expect(rec.recommendedTier).toBe("REDUCE_SPONSORSHIP");
  });
});

describe("6. Race Prediction Engine", () => {
  it("projects target marathon time from half marathon baseline", () => {
    // 21.1 km in 1:20:00 (4800s) -> Marathon (~2:46:00 to 2:54:00)
    const pred = predictRacePerformance({
      recentRaceDistanceKm: 21.0975,
      recentRaceTimeSeconds: 4800,
      targetDistanceKm: 42.195,
      targetGoalTimeSeconds: 10800, // 3:00:00
      longestRunKm: 34,
      paceDurabilityDeteriorationPct: 2.5,
      trainingConsistencyRatio: 0.92,
    });

    expect(pred.centralEstimateSeconds).toBeGreaterThan(9500);
    expect(pred.centralEstimateSeconds).toBeLessThan(10600);
    expect(pred.confidencePercent).toBeGreaterThanOrEqual(70);
    // Predicted ~2h50m is faster than 3h goal, so probability of sub-3h should be high
    expect(pred.probabilityOfTargetPercent).toBeGreaterThanOrEqual(75);
  });
});

describe("7. Readiness & Reciprocity Engines", () => {
  it("evaluates readiness as coaching indicator with non-medical disclaimer", () => {
    const ready = calculateAthleteReadiness({
      sleepQuality: 5,
      fatigueLevel: 1,
      muscleSoreness: 1,
      acuteChronicRatio: 1.05,
    });
    expect(ready.level).toBe("HIGH");
    expect(ready.disclaimer).toContain("does not provide medical diagnosis");
  });

  it("triggers reciprocity review alert for high spend and low participation", () => {
    const review = evaluateReciprocityPattern({
      athleteId: "ath-1",
      athleteName: "Kagiso Mokoena",
      twelveMonthFinancialSupportZar: 38500,
      internalParticipationRatePercent: 18,
      volunteerActivitiesCount: 1,
      majorEventSupportRequestsCount: 4,
      currentContributionScore: 27,
      currentPerformanceScore: 91,
      unmetObligationsCount: 1,
    });

    expect(review.requiresReview).toBe(true);
    expect(review.summaryMessage).toContain("Sponsorship Reciprocity Review Recommended");
    expect(review.summaryMessage).toContain("R38,500");
    expect(review.summaryMessage).toContain("18%");
  });
});

describe("8. Performance Matrix Strict Quadrant Boundary Clamping & Calibration", () => {
  it("guarantees 100% boundary preservation under extreme cluster density", () => {
    // Simulate 30 athletes clustered within 0.2 points of the 72 / 60 crosshair threshold
    const clusteredAthletes: any[] = [];
    for (let i = 0; i < 30; i++) {
      const isAbovePerf = i % 2 === 0;
      const isAboveContrib = i % 3 === 0;
      clusteredAthletes.push({
        id: `clustered-${i}`,
        athleteNumber: `SEA-${100 + i}`,
        name: `Clustered Athlete ${i}`,
        discipline: "10km Road",
        performanceScore: isAbovePerf ? 72.0 + (i * 0.05) : 71.9 - (i * 0.05),
        contributionScore: isAboveContrib ? 60.0 + (i * 0.05) : 59.9 - (i * 0.05),
        sponsorshipTier: "ELITE",
        annualSupportZar: 15000,
        avatarInitials: `C${i}`,
      });
    }

    const dispersed = computeDispersedCoordinates(clusteredAthletes, 72, 60);

    // Assert that every single node strictly preserved its quadrant boundary
    for (const node of dispersed) {
      if (node.origY >= 72) {
        expect(node.y).toBeGreaterThanOrEqual(72);
      } else {
        expect(node.y).toBeLessThan(72);
      }

      if (node.origX >= 60) {
        expect(node.x).toBeGreaterThanOrEqual(60);
      } else {
        expect(node.x).toBeLessThan(60);
      }
    }
  });

  it("dynamically adapts boundary clamping when policy thresholds are re-calibrated", () => {
    const athletes = [
      {
        id: "ath-1",
        athleteNumber: "SEA-001",
        name: "Test Athlete 1",
        discipline: "Marathon",
        performanceScore: 76,
        contributionScore: 65,
        sponsorshipTier: "ELITE",
        annualSupportZar: 20000,
        avatarInitials: "TA",
      },
      {
        id: "ath-2",
        athleteNumber: "SEA-002",
        name: "Test Athlete 2",
        discipline: "Marathon",
        performanceScore: 74,
        contributionScore: 55,
        sponsorshipTier: "DEVELOPMENT",
        annualSupportZar: 5000,
        avatarInitials: "TB",
      },
    ];

    // Under standard 72/60: ath-1 is Q1 (Priority), ath-2 is Q2 (Reciprocity)
    const std = computeDispersedCoordinates(athletes, 72, 60);
    expect(std[0].y).toBeGreaterThanOrEqual(72);
    expect(std[0].x).toBeGreaterThanOrEqual(60);
    expect(std[1].y).toBeGreaterThanOrEqual(72);
    expect(std[1].x).toBeLessThan(60);

    // Re-calibrate policy threshold to 78 / 50 (e.g. Olympic qualifying cycle)
    const reCalibrated = computeDispersedCoordinates(athletes, 78, 50);
    // ath-1 (perf 76) is now BELOW 78 -> must be clamped below 78
    expect(reCalibrated[0].y).toBeLessThan(78);
    // ath-2 (perf 74) is now BELOW 78 -> must be clamped below 78
    expect(reCalibrated[1].y).toBeLessThan(78);
  });

  it("accurately normalises race walking times using World Athletics standards", () => {
    // 10km run elite is ~31:00 (1860s)
    // 10km walk elite is ~42:00 (2520s)
    const runScore = calculateNormalizedScore(10, 1860, "MALE", "ROAD_RUNNING");
    const walkScore = calculateNormalizedScore(10, 2520, "MALE", "RACE_WALKING");

    // Both should score in the high elite range (90+)
    expect(runScore.score).toBeGreaterThanOrEqual(90);
    expect(walkScore.score).toBeGreaterThanOrEqual(90);
  });
});
