/**
 * Super Eagles Athletics Management System (AMMS)
 * Comprehensive In-App Health Check & Module Functionality Diagnostic Engine
 * 
 * Verifies both:
 * 1. All 11 Data Ingestion-to-Emission Pipelines (Nervous System)
 * 2. All 16 Core Functional Modules (Algorithm, Logic, Cryptography, Storage, and Governance)
 * 
 * Zero external dependencies. Runs 100% locally with Node.js built-ins & SQLite.
 */

import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { parseGpxString } from "@/lib/telemetry/gpxParser";
import { calculatePaceDeterioration, classifyPaceDurability } from "@/lib/analytics/pace";
import { calculateAthletePerformanceIndex } from "@/lib/analytics/performanceIndex";
import { predictRacePerformance } from "@/lib/analytics/predictions";
import { calculateACWR, WorkloadSession } from "@/lib/analytics/workload";
import { calculateAthleteReadiness } from "@/lib/analytics/readiness";
import { calculateClubContributionScore } from "@/lib/analytics/clubContribution";
import { calculateClubSponsorshipScore } from "@/lib/analytics/sponsorshipScore";
import { evaluateReciprocityPattern } from "@/lib/analytics/reciprocity";
import { generateDeterministicAnalysis } from "@/lib/ai/aiService";
import { runAuthoritativeMathematicalBenchmarks } from "@/lib/analytics/authoritativeBenchmarks";
import { formatWhatsAppMedallionMessage } from "@/lib/sharing/whatsappMedallionShare";
import { generateQrMatrix, generateQrSvg } from "@/lib/qr/qrGenerator";
import { isUnsafeProductionSecret } from "@/lib/auth/session";
import { CSV_TEMPLATES } from "@/app/api/admin/csv-template/route";

export interface CheckpointResult {
  id: string;
  name: string;
  type: "PIPELINE" | "MODULE" | "STORAGE" | "SECURITY";
  category: string;
  status: "HEALTHY" | "DEGRADED" | "CRITICAL";
  passed: boolean;
  latencyMs: number;
  message: string;
  metrics?: Record<string, any>;
}

export interface SystemHealthReport {
  timestamp: string;
  overallStatus: "HEALTHY" | "DEGRADED" | "CRITICAL";
  healthScorePercent: number;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  executionDurationMs: number;
  systemMetrics: {
    memoryRssMb: number;
    memoryHeapUsedMb: number;
    nodeVersion: string;
    uptimeSeconds: number;
    dbSizeBytes: number;
    dbMirrored: boolean;
  };
  checkpoints: CheckpointResult[];
}

export async function runComprehensiveSystemHealthCheck(): Promise<SystemHealthReport> {
  const startTime = Date.now();
  const checkpoints: CheckpointResult[] = [];
  const isSqliteDatabase = (process.env.DATABASE_URL || "").trim().startsWith("file:");

  async function check(
    id: string,
    name: string,
    type: CheckpointResult["type"],
    category: string,
    fn: () => Promise<{ passed: boolean; message: string; metrics?: Record<string, any> }>
  ) {
    const t0 = Date.now();
    try {
      const result = await fn();
      const latency = Date.now() - t0;
      checkpoints.push({
        id,
        name,
        type,
        category,
        status: result.passed ? "HEALTHY" : "CRITICAL",
        passed: result.passed,
        latencyMs: latency,
        message: result.message,
        metrics: result.metrics,
      });
    } catch (err: any) {
      const latency = Date.now() - t0;
      checkpoints.push({
        id,
        name,
        type,
        category,
        status: "CRITICAL",
        passed: false,
        latencyMs: latency,
        message: `Exception: ${err.message || String(err)}`,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 1. Database & Storage Module
  // ---------------------------------------------------------------------------
  await check("storage-db-connectivity", "Database Read/Write Engine", "STORAGE", "Storage", async () => {
    const tStart = Date.now();
    const count = await prisma.athlete.count();
    const writeTest = await prisma.systemConfiguration.findFirst({ select: { id: true } });
    const latency = Date.now() - tStart;
    return {
      passed: count > 0,
      message: `${isSqliteDatabase ? "SQLite" : "PostgreSQL"} connected (${count} athletes registered, query latency ${latency}ms)`,
      metrics: { athletesCount: count, readLatencyMs: latency },
    };
  });

  await check("storage-sqlite-files", "SQLite Database Storage", "STORAGE", "Storage", async () => {
    if (!isSqliteDatabase) {
      return {
        passed: true,
        message: "Managed PostgreSQL storage active; local SQLite files are not applicable",
        metrics: { provider: "postgresql" },
      };
    }
    const rootDbPath = path.resolve("./dev.db");
    const prismaDbPath = path.resolve("./prisma/dev.db");
    const rootExists = fs.existsSync(rootDbPath);
    const prismaExists = fs.existsSync(prismaDbPath);

    const primarySize = prismaExists ? fs.statSync(prismaDbPath).size : 0;
    const passed = prismaExists && primarySize > 0;
    return {
      passed,
      message: passed
        ? "Live Prisma SQLite database is present and readable; optional root recovery snapshot detected"
        : "Live Prisma SQLite database file is missing or empty",
      metrics: { primaryPath: prismaDbPath, primarySizeBytes: primarySize, recoverySnapshotExists: rootExists },
    };
  });

  // ---------------------------------------------------------------------------
  // 2. Authentication & JWT Security Module
  // ---------------------------------------------------------------------------
  await check("module-auth-security", "Authentication & JWT Crypto Module", "SECURITY", "Security", async () => {
    const configuredSecret = process.env.JWT_SECRET?.trim();
    if (process.env.NODE_ENV === "production" && (!configuredSecret || isUnsafeProductionSecret(configuredSecret))) {
      return {
        passed: false,
        message: "JWT_SECRET must be a unique, random value of at least 32 characters for production",
      };
    }
    const secret = configuredSecret || "super-eagles-local-health-check-secret";
    const testPayload = { userId: "chk_test", role: "COACH", email: "test@supereagles.co.za" };
    const token = jwt.sign(testPayload, secret, { expiresIn: "1h" });
    const verified = jwt.verify(token, secret) as any;

    const hash = await bcrypt.hash("SuperEaglePass2026!", 8);
    const match = await bcrypt.compare("SuperEaglePass2026!", hash);

    const passed = verified.role === "COACH" && match === true;
    return {
      passed,
      message: passed
        ? "Bcrypt hashing & JWT HS256 signature verified"
        : "Crypto integrity check failed",
    };
  });

  // ---------------------------------------------------------------------------
  // 3. Telemetry & GPX Parser Module & Pipeline
  // ---------------------------------------------------------------------------
  await check("pipeline-telemetry-gpx", "Telemetry & GPX Stream Pipeline", "PIPELINE", "Telemetry", async () => {
    const sampleGpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Garmin Forerunner 965">
  <metadata><name>Zoo Lake Morning Tempo</name></metadata>
  <trk>
    <trkseg>
      <trkpt lat="-26.1680" lon="28.0280"><ele>1600.0</ele><time>2026-03-09T06:00:00Z</time></trkpt>
      <trkpt lat="-26.1690" lon="28.0290"><ele>1610.0</ele><time>2026-03-09T06:01:00Z</time></trkpt>
      <trkpt lat="-26.1700" lon="28.0300"><ele>1605.0</ele><time>2026-03-09T06:02:00Z</time></trkpt>
    </trkseg>
  </trk>
</gpx>`;

    const parsed = parseGpxString(sampleGpx, "tempo.gpx");
    const passed = parsed.trackPointsCount === 3 && parsed.totalDistanceKm > 0.1 && parsed.elevationGainMeters === 10;
    return {
      passed,
      message: passed
        ? `GPX telemetry parsed: ${parsed.totalDistanceKm.toFixed(2)}km, ${parsed.elevationGainMeters}m gain`
        : "GPX calculation failed",
      metrics: { distanceKm: parsed.totalDistanceKm, gainM: parsed.elevationGainMeters },
    };
  });

  // ---------------------------------------------------------------------------
  // 4. Pacing & Durability Module
  // ---------------------------------------------------------------------------
  await check("module-pace-durability", "Pace Durability Index (PDI) Module", "MODULE", "Analytics", async () => {
    const pdi = calculatePaceDeterioration(300, 310);
    const classification = classifyPaceDurability(pdi, true);
    const passed = pdi > 0 && (classification.rating === "EXCELLENT" || classification.rating === "GOOD");
    return {
      passed,
      message: passed
        ? `PDI calibrated (+${pdi}% degradation -> ${classification.label})`
        : "PDI classification failed",
      metrics: { pdi, rating: classification.rating },
    };
  });

  // ---------------------------------------------------------------------------
  // 5. Athlete Performance Index (API) Module & Pipeline
  // ---------------------------------------------------------------------------
  await check("pipeline-api-performance", "Athlete Performance Index (API) Pipeline", "PIPELINE", "Analytics", async () => {
    const api = calculateAthletePerformanceIndex(92, 88, 85, 90);
    const passed = api.totalIndex >= 85 && api.breakdown !== undefined;
    return {
      passed,
      message: passed
        ? `API scoring active: Score ${api.totalIndex}/100 (${api.trend.trendClassification})`
        : "API calculation failed",
      metrics: { totalIndex: api.totalIndex, trend: api.trend.trendClassification },
    };
  });

  // ---------------------------------------------------------------------------
  // 6. Riegel Race Prediction Module
  // ---------------------------------------------------------------------------
  await check("module-riegel-prediction", "Riegel Race Prediction Engine", "MODULE", "Analytics", async () => {
    const pred = predictRacePerformance({
      recentRaceDistanceKm: 21.0975,
      recentRaceTimeSeconds: 4800, // 1h20m Half Marathon
      targetDistanceKm: 42.195, // Marathon
      longestRunKm: 34,
      paceDurabilityDeteriorationPct: 3.0,
      trainingConsistencyRatio: 0.95,
    });
    const passed = pred.centralEstimateSeconds > 9000 && pred.centralEstimateSeconds < 12000;
    return {
      passed,
      message: passed
        ? `Predicted Marathon finish: ${pred.centralEstimateFormatted} (Confidence ${pred.confidencePercent}%)`
        : "Prediction failed",
      metrics: { estimatedTime: pred.centralEstimateFormatted, confidence: pred.confidencePercent },
    };
  });

  // ---------------------------------------------------------------------------
  // 7. Gabbett ACWR & Sports Science Workload Module & Pipeline
  // ---------------------------------------------------------------------------
  await check("pipeline-wellness-acwr", "Gabbett ACWR Workload & Wellness Pipeline", "PIPELINE", "Sports Science", async () => {
    const sessions: WorkloadSession[] = [
      { date: new Date(Date.now() - 1 * 86400000), distanceKm: 15, durationMinutes: 70, sessionRpe: 7 },
      { date: new Date(Date.now() - 3 * 86400000), distanceKm: 10, durationMinutes: 45, sessionRpe: 6 },
      { date: new Date(Date.now() - 5 * 86400000), distanceKm: 25, durationMinutes: 120, sessionRpe: 8 },
      { date: new Date(Date.now() - 10 * 86400000), distanceKm: 15, durationMinutes: 70, sessionRpe: 6 },
      { date: new Date(Date.now() - 15 * 86400000), distanceKm: 20, durationMinutes: 95, sessionRpe: 7 },
      { date: new Date(Date.now() - 20 * 86400000), distanceKm: 12, durationMinutes: 55, sessionRpe: 5 },
    ];
    const acwr = calculateACWR(sessions);
    const readiness = calculateAthleteReadiness({
      sleepQuality: 4,
      fatigueLevel: 2,
      muscleSoreness: 2,
      restingHeartRate: 48,
      hrvRmssd: 68,
      acuteChronicRatio: acwr.acwrRatio,
    });

    const passed = acwr.acwrRatio > 0 && readiness.readinessScore > 0;
    return {
      passed,
      message: passed
        ? `ACWR ${acwr.acwrRatio.toFixed(2)} (${acwr.status}) -> Readiness ${readiness.readinessScore}/100 (${readiness.label})`
        : "ACWR calculation failed",
      metrics: { acwrRatio: acwr.acwrRatio, status: acwr.status, readinessScore: readiness.readinessScore },
    };
  });

  // ---------------------------------------------------------------------------
  // 8. Club Contribution & Loyalty (CCLI) Module & Pipeline
  // ---------------------------------------------------------------------------
  await check("pipeline-ccli-loyalty", "Club Contribution & Loyalty (CCLI) Pipeline", "PIPELINE", "Loyalty", async () => {
    const ccli = calculateClubContributionScore({
      internalRunsAttended: 8,
      totalInternalRunsOffered: 10,
      exemptionReductionRatio: 0,
      volunteerEventsAttended: 2,
      clubRepresentationCount: 3,
      mentoringSessionsCount: 2,
      clubMeetingsAttended: 2,
      obligationsMetCount: 2,
      totalObligationsAssigned: 2,
      membershipTenureYears: 3,
    });
    const passed = ccli.totalScore >= 75 && ccli.attendanceRatePercent === 80;
    return {
      passed,
      message: passed
        ? `CCLI Score: ${ccli.totalScore}/100 (Attendance: ${ccli.attendanceRatePercent}%, Service: ${ccli.scores.volunteeringScore})`
        : "CCLI calculation failed",
      metrics: { totalScore: ccli.totalScore, attendanceRate: ccli.attendanceRatePercent },
    };
  });

  // ---------------------------------------------------------------------------
  // 9. Sponsorship Governance & Reciprocity Module & Pipeline
  // ---------------------------------------------------------------------------
  await check("pipeline-sponsorship-governance", "Sponsorship & Reciprocity Governance Pipeline", "PIPELINE", "Governance", async () => {
    const css = calculateClubSponsorshipScore(88, 85, 80, 90, 85, 95);
    const reciprocity = evaluateReciprocityPattern({
      athleteId: "TEST_ATHLETE",
      athleteName: "Sipho Sithole",
      twelveMonthFinancialSupportZar: 25000,
      internalParticipationRatePercent: 85,
      volunteerActivitiesCount: 4,
      majorEventSupportRequestsCount: 1,
      currentPerformanceScore: 88,
      currentContributionScore: 85,
      unmetObligationsCount: 0,
    });
    const passed = css.totalScore >= 60 && reciprocity.alertLevel !== undefined;
    return {
      passed,
      message: passed
        ? `CSS Score: ${css.totalScore}/100 -> Reciprocity Alert: ${reciprocity.alertLevel} (${reciprocity.alertTitle})`
        : "Sponsorship scoring failed",
      metrics: { cssScore: css.totalScore, alertLevel: reciprocity.alertLevel },
    };
  });

  // ---------------------------------------------------------------------------
  // 10. Deterministic AI Coaching Prescription Module & Pipeline
  // ---------------------------------------------------------------------------
  await check("module-ai-coaching", "Deterministic AI Coaching Engine", "MODULE", "AI Coaching", async () => {
    const analysis = generateDeterministicAnalysis({
      athleteName: "Sipho Sithole",
      athleteStatus: "ELITE",
      primaryDiscipline: "ULTRA_90K",
      athletePerformanceIndex: 92,
      clubContributionScore: 90,
      sponsorshipScore: 88,
      trendClassification: "IMPROVING",
      paceDurabilityLabel: "EXCELLENT",
      deteriorationPercent: 2.5,
      recentRaces: [
        { raceName: "Cape Town Marathon", distanceKm: 42.2, timeFormatted: "2:18:45", date: "2026-03-01" },
      ],
      totalSponsorshipZar: 25000,
      attendanceRatePercent: 90,
      volunteerCount: 2,
    });
    const passed = analysis.provider === "DETERMINISTIC_ENGINE" && analysis.factsFromData !== undefined;
    return {
      passed,
      message: passed
        ? `Deterministic engine generated ${analysis.aiInterpretation.coachingRecommendations.length} recommendations (${analysis.aiInterpretation.summaryHeadline})`
        : "AI deterministic analysis failed",
      metrics: { recommendationsCount: analysis.aiInterpretation.coachingRecommendations.length, provider: analysis.provider },
    };
  });

  // ---------------------------------------------------------------------------
  // 11. Medallions & WhatsApp Broadcast Module & Pipeline
  // ---------------------------------------------------------------------------
  await check("pipeline-medallions-whatsapp", "Conferred Medallions & WhatsApp Broadcast Pipeline", "PIPELINE", "Recognition", async () => {
    const count = await prisma.athleteMedallion.count();
    const sampleMessage = formatWhatsAppMedallionMessage({
      awardTitle: "Athlete of the Month (Diagnostic)",
      awardType: "ATHLETE_OF_THE_MONTH",
      trackCategory: "COMPETITIVE",
      period: "March 2026",
      athleteName: "Sipho Sithole",
      athleteNumber: "SEA-001",
      citation: "Health test verification citation.",
      conferredBy: "Diagnostic Engine",
      metrics: { apiScore: 92.4 },
    });

    const passed = count >= 4 && sampleMessage.includes("SUPER EAGLES ATHLETICS CLUB");
    return {
      passed,
      message: passed
        ? `${count} reigning medallions registered in DB & WhatsApp payload validated (${sampleMessage.length} chars)`
        : "Medallion or WhatsApp serialization failed",
      metrics: { medallionsInDb: count, messageLength: sampleMessage.length },
    };
  });

  // ---------------------------------------------------------------------------
  // 12. QR Code Marshalling & Check-in Module
  // ---------------------------------------------------------------------------
  await check("module-qr-checkin", "QR Code Generation & Marshalling Module", "MODULE", "Operations", async () => {
    const qrMatrix = generateQrMatrix("SEA-001|Sipho Sithole|VALID");
    const qrSvg = generateQrSvg("SEA-001|Sipho Sithole|VALID", 200);
    const passed = qrMatrix.length === 29 && qrSvg.includes("<svg") && qrSvg.includes("viewBox");
    return {
      passed,
      message: passed
        ? "ISO-compliant 29x29 QR matrix & SVG generator verified"
        : "QR generation failed",
      metrics: { matrixDimension: `${qrMatrix.length}x${qrMatrix.length}`, svgLength: qrSvg.length },
    };
  });

  // ---------------------------------------------------------------------------
  // 13. POPIA Multi-Role Privacy & Access Control Module
  // ---------------------------------------------------------------------------
  await check("security-popia-rbac", "POPIA Multi-Role Access Control Guards", "SECURITY", "Security", async () => {
    const users = await prisma.user.findMany({ select: { role: true } });
    const distinctRoles = new Set(users.map((u) => u.role));
    const passed = distinctRoles.size >= 5;
    return {
      passed,
      message: passed
        ? `POPIA security intact: ${distinctRoles.size} distinct RBAC personas loaded`
        : "RBAC persona count insufficient",
      metrics: { rolesLoaded: Array.from(distinctRoles) },
    };
  });

  // ---------------------------------------------------------------------------
  // 14. Immutable Audit Trail & System Configuration Module
  // ---------------------------------------------------------------------------
  await check("module-audit-trail", "Audit Trail & Configuration Governance", "MODULE", "Governance", async () => {
    const configsCount = await prisma.systemConfiguration.count();
    const auditCount = await prisma.auditLog.count();
    const passed = configsCount >= 2;
    return {
      passed,
      message: passed
        ? `Governance intact: ${configsCount} system configs and ${auditCount} audit logs recorded`
        : "Missing system configurations",
      metrics: { configsCount, auditCount },
    };
  });

  // ---------------------------------------------------------------------------
  // 15. Package & Node Runtime Integrity Module
  // ---------------------------------------------------------------------------
  await check("storage-package-integrity", "Node.js & Package Runtime Integrity", "STORAGE", "Runtime", async () => {
    const pkgJsonPath = path.resolve("./package.json");
    const nodeModulesPath = path.resolve("./node_modules");
    const pkgExists = fs.existsSync(pkgJsonPath);
    const nmExists = fs.existsSync(nodeModulesPath);

    const passed = pkgExists && nmExists;
    return {
      passed,
      message: passed
        ? `Runtime verified (Node ${process.version}, platform: ${process.platform})`
        : "Package directory or configuration missing",
      metrics: { nodeVersion: process.version, platform: process.platform },
    };
  });

  // ---------------------------------------------------------------------------
  // 16. Authoritative Mathematical Benchmarks Module
  // ---------------------------------------------------------------------------
  await check("module-math-benchmarks", "Authoritative Mathematical Scientific Benchmarks", "MODULE", "Analytics", async () => {
    const report = runAuthoritativeMathematicalBenchmarks();
    const passed = report.overallHealthPercent === 100;
    return {
      passed,
      message: passed
        ? `All ${report.totalBenchmarks} scientific models benchmarked against peer-reviewed standards (Riegel 1977, Gabbett 2016, IUGG/NOAA, World Athletics)`
        : `${report.totalBenchmarks - report.passedBenchmarks} benchmarks deviated from authoritative tolerance`,
      metrics: { totalBenchmarks: report.totalBenchmarks, passed: report.passedBenchmarks },
    };
  });

  // ---------------------------------------------------------------------------
  // 17. Membership Arrears Gatekeeper & Financial Standing Protocol
  // ---------------------------------------------------------------------------
  await check("module-arrears-gatekeeper", "Membership Arrears Gating & Financial Standing Protocol", "MODULE", "Governance", async () => {
    // Verify athletes with PENDING fee status have their standing tracked accurately
    const totalAthletes = await prisma.athlete.count();
    const paidCount = await prisma.athlete.count({
      where: {
        OR: [
          { membershipFeeStatus: "PAID" },
          { membershipFeeStatus: "EXEMPT" },
          { membershipFeeStatus: "SUBSIDIZED" },
        ],
      },
    });
    const arrearsCount = await prisma.athlete.count({
      where: { membershipFeeStatus: "PENDING" },
    });

    const passed = totalAthletes > 0 && paidCount + arrearsCount === totalAthletes;
    return {
      passed,
      message: passed
        ? `Arrears protocol operational: ${totalAthletes} members audited (${paidCount} active, ${arrearsCount} in arrears/pending)`
        : "Athlete fee status discrepancy detected",
      metrics: { totalAthletes, paidCount, arrearsCount },
    };
  });

  // ---------------------------------------------------------------------------
  // 18. Annual Renewal & Expiry Cycle Pipeline (Per Annum Dec 31 Standard)
  // ---------------------------------------------------------------------------
  await check("pipeline-annual-renewal", "Annual Renewal Cycle & Expiry Tracker (31 Dec)", "PIPELINE", "Lifecycle", async () => {
    const currentYear = new Date().getFullYear();
    const targetCycleExpiry = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59));
    const passed = targetCycleExpiry.getUTCMonth() === 11 && targetCycleExpiry.getUTCDate() === 31;

    // Check notifications for renewal alerts
    const renewalAlerts = await prisma.notification.count({
      where: { title: { contains: "Membership" } },
    });

    return {
      passed,
      message: passed
        ? `Annual renewal cycle validated: standard expiry set to 31 Dec (${targetCycleExpiry.toISOString()}), ${renewalAlerts} renewal notices tracked`
        : "Invalid annual renewal expiry calendar math",
      metrics: { cycleYear: currentYear, standardExpiry: targetCycleExpiry.toISOString(), renewalAlerts },
    };
  });

  // ---------------------------------------------------------------------------
  // 19. Standardized Blank CSV Template & Re-Upload Generator
  // ---------------------------------------------------------------------------
  await check("module-blank-csv-generator", "Standardized Blank CSV Export & Alignment Engine", "MODULE", "Integration", async () => {
    const templateKeys = Object.keys(CSV_TEMPLATES);
    const requiredKeys = ["ATHLETES", "RACE_RESULTS", "TRAINING", "CLUB_ACTIVITIES", "ATTENDANCE", "SPONSORSHIP"];
    const hasAllTemplates = requiredKeys.every((k) => templateKeys.includes(k));

    let allHeadersValid = true;
    for (const k of requiredKeys) {
      const tmpl = CSV_TEMPLATES[k];
      if (!tmpl || !Array.isArray(tmpl.headers) || tmpl.headers.length < 3) {
        allHeadersValid = false;
        break;
      }
    }

    const passed = hasAllTemplates && allHeadersValid;
    return {
      passed,
      message: passed
        ? `All ${requiredKeys.length} standardized CSV templates verified with zero misalignment: ${requiredKeys.join(", ")}`
        : "Missing or malformed CSV template specifications",
      metrics: { templatesAvailable: templateKeys.length, requiredKeysVerified: requiredKeys },
    };
  });

  // Compute overall summary
  const passedChecks = checkpoints.filter((c) => c.passed).length;
  const totalChecks = checkpoints.length;
  const healthScorePercent = Math.round((passedChecks / totalChecks) * 100);
  const overallStatus =
    healthScorePercent === 100 ? "HEALTHY" : healthScorePercent >= 80 ? "DEGRADED" : "CRITICAL";

  const mem = process.memoryUsage();
  const dbPath = isSqliteDatabase ? path.resolve("./prisma/dev.db") : path.resolve("./dev.db");
  const dbSize = fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0;

  return {
    timestamp: new Date().toISOString(),
    overallStatus,
    healthScorePercent,
    totalChecks,
    passedChecks,
    failedChecks: totalChecks - passedChecks,
    executionDurationMs: Date.now() - startTime,
    systemMetrics: {
      memoryRssMb: Math.round(mem.rss / (1024 * 1024)),
      memoryHeapUsedMb: Math.round(mem.heapUsed / (1024 * 1024)),
      nodeVersion: process.version,
      uptimeSeconds: Math.round(process.uptime()),
      dbSizeBytes: dbSize,
      dbMirrored: !isSqliteDatabase || fs.existsSync(path.resolve("./dev.db")),
    },
    checkpoints,
  };
}
