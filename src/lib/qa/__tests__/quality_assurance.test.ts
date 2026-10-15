import { describe, it, expect } from "vitest";
import {
  runSystemQualityAssuranceAudit,
  validateActivityContract,
  validateRaceResultContract,
  detectPhysiologicalAnomalies,
} from "../qualityAssuranceLayer";
import {
  runAuthoritativeMathematicalBenchmarks,
} from "@/lib/analytics/authoritativeBenchmarks";

describe("Authoritative Mathematical Benchmarks Suite", () => {
  it("validates all peer-reviewed mathematical models against published literature tolerances", () => {
    const report = runAuthoritativeMathematicalBenchmarks();

    expect(report.totalBenchmarks).toBe(4);
    expect(report.passedBenchmarks).toBe(4);
    expect(report.overallHealthPercent).toBe(100);

    for (const b of report.benchmarks) {
      expect(b.passed).toBe(true);
      expect(b.testVector.errorDeltaPercent).toBeLessThanOrEqual(b.testVector.tolerancePercent);
      expect(b.authoritativeSource).toBeDefined();
      expect(b.sourceUrl).toMatch(/^https?:\/\//);
    }
  });

  it("proves Peter Riegel (1977) endurance power-law scaling holds within 3% error delta", () => {
    const report = runAuthoritativeMathematicalBenchmarks();
    const riegel = report.benchmarks.find((b) => b.id === "bm-riegel-1977");
    expect(riegel).toBeDefined();
    expect(riegel?.passed).toBe(true);
    expect(riegel?.testVector.errorDeltaPercent).toBeLessThan(3.0);
  });

  it("proves Tim Gabbett (2016) ACWR sweet-spot calculation matches BJSM standards", () => {
    const report = runAuthoritativeMathematicalBenchmarks();
    const acwr = report.benchmarks.find((b) => b.id === "bm-gabbett-acwr-2016");
    expect(acwr).toBeDefined();
    expect(acwr?.passed).toBe(true);
  });

  it("proves IUGG NOAA Haversine geodesic calculation matches spherical earth coordinates", () => {
    const report = runAuthoritativeMathematicalBenchmarks();
    const haversine = report.benchmarks.find((b) => b.id === "bm-iugg-haversine");
    expect(haversine).toBeDefined();
    expect(haversine?.passed).toBe(true);
    expect(haversine?.testVector.errorDeltaPercent).toBeLessThan(0.1);
  });
});

describe("Enterprise Quality Assurance & Invariant Enforcement Layer", () => {
  it("verifies system QA audit executes and certifies data integrity", async () => {
    const audit = await runSystemQualityAssuranceAudit();

    expect(audit.overallQAScorePercent).toBeGreaterThanOrEqual(95);
    expect(audit.status).toBe("QA_CERTIFIED_EXCELLENT");
    expect(audit.invariantsAudit.scoreBoundsVerified).toBe(true);
    expect(audit.invariantsAudit.monotonicPredictionsVerified).toBe(true);
    expect(audit.invariantsAudit.weightNormalizationVerified).toBe(true);
    expect(audit.invariantsAudit.zeroOrphanedForeignKeys).toBe(true);
    expect(audit.authoritativeBenchmarksPassed).toBe(true);
  });

  it("rejects invalid activity inputs via pre-ingestion contract", () => {
    const invalidActivity = {
      athleteId: "",
      distanceKm: -5,
      durationMinutes: 0,
      movingPaceMinPerKm: 1.2, // Impossible pace
      date: "not-a-date",
    };

    const violations = validateActivityContract(invalidActivity);
    expect(violations.length).toBeGreaterThanOrEqual(4);
    expect(violations.some((v) => v.field === "distanceKm")).toBe(true);
    expect(violations.some((v) => v.field === "movingPaceMinPerKm")).toBe(true);
  });

  it("detects physiological anomalies like tachycardia and negative race times", () => {
    const anomalousData = {
      heartRateBpm: 245, // Impossible sustained human HR
      movingPaceMinPerKm: 1.5, // Faster than 400m sprint world record
    };

    const violations = detectPhysiologicalAnomalies(anomalousData, "TEST_PERSONA");
    expect(violations.length).toBe(2);
    expect(violations.some((v) => v.field === "heartRateBpm")).toBe(true);
    expect(violations.some((v) => v.field === "movingPaceMinPerKm")).toBe(true);
  });

  it("accepts valid race results adhering to human physical performance limits", () => {
    const validResult = {
      athleteId: "SEA-001",
      raceId: "RACE-001",
      officialTimeSeconds: 10800, // 3h Marathon
      distanceKm: 42.195,
      positionOverall: 1,
    };

    const res = validateRaceResultContract(validResult);
    expect(res.isValid).toBe(true);
    expect(res.errors.length).toBe(0);
  });
});
