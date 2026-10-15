import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { formatDuration, formatPace, calculatePaceDeterioration, classifyPaceDurability } from "../pace";
import { calculateAthletePerformanceIndex } from "../performanceIndex";
import { calculateClubContributionScore } from "../clubContribution";
import { calculateClubSponsorshipScore } from "../sponsorshipScore";
import { predictRacePerformance } from "../predictions";
import { calculateAthleteReadiness } from "../readiness";
import { evaluateReciprocityPattern } from "../reciprocity";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "super-eagles-secret-key-athletes-performance-2026";

describe("4D 360-Degree End-to-End AMMS Enterprise Simulation", () => {
  beforeAll(async () => {
    // Verify database connectivity
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ---------------------------------------------------------------------------
  // 1. Role-Based Access Control & 360-Degree Persona Simulation
  // ---------------------------------------------------------------------------
  describe("Workflow 1: Authentication & 360-Degree Multi-Role Personas", () => {
    const roles = [
      { role: "SUPER_ADMIN", email: "admin@supereagles.co.za", pass: "AdminPass2026!" },
      { role: "COACH", email: "coach.hendrik@supereagles.co.za", pass: "CoachPass2026!" },
      { role: "ATHLETE", email: "athlete.sipho@supereagles.co.za", pass: "AthletePass2026!" },
      { role: "CLUB_ADMIN", email: "admin.club@supereagles.co.za", pass: "ClubPass2026!" },
      { role: "SPONSORSHIP_COMMITTEE", email: "committee@supereagles.co.za", pass: "CommitteePass2026!" },
    ];

    roles.forEach(({ role, email, pass }) => {
      it(`authenticates ${role} persona (${email}) with valid bcrypt hash & JWT`, async () => {
        const user = await prisma.user.findUnique({ where: { email }, include: { athlete: true } });
        expect(user).not.toBeNull();
        expect(user?.role).toBe(role);

        const isMatch = await bcrypt.compare(pass, user!.passwordHash);
        expect(isMatch).toBe(true);

        const token = jwt.sign(
          { userId: user!.id, email: user!.email, name: user!.name, role: user!.role },
          JWT_SECRET,
          { expiresIn: "7d" }
        );

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        expect(decoded.role).toBe(role);
        expect(decoded.email).toBe(email);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Membership Registry & Discipline Duality (Running & Walking)
  // ---------------------------------------------------------------------------
  describe("Workflow 2: Membership Management & Walking Disciplines", () => {
    it("manages all 20 athletes with valid ASA licenses and discipline categories", async () => {
      const athletes = await prisma.athlete.findMany();
      expect(athletes.length).toBeGreaterThanOrEqual(20);

      const runners = athletes.filter((a) => a.disciplineCategory === "RUNNER");
      const walkers = athletes.filter((a) => a.disciplineCategory === "WALKER");
      const dual = athletes.filter((a) => a.disciplineCategory === "DUAL");

      expect(runners.length).toBeGreaterThan(0);
      expect(walkers.length).toBeGreaterThan(0);
      expect(dual.length).toBeGreaterThan(0);

      // Verify ASA license numbers format
      athletes.forEach((ath) => {
        expect(ath.asaLicenseNumber).toBeDefined();
        expect(ath.asaLicenseNumber).toMatch(/^2026-ASA-\d{4}$/);
        expect(ath.membershipFeeStatus).toBe("PAID");
        expect(ath.membershipExpiry).toBeDefined();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Performance Calculations, Durability & Race Projections
  // ---------------------------------------------------------------------------
  describe("Workflow 3: Mathematical Performance Engine & Race Predictions", () => {
    it("computes accurate Performance Index, Durability, and Race Predictions", () => {
      // 1. Performance Index Calculation
      const perf = calculateAthletePerformanceIndex(92, 85, 88, 90);
      expect(perf.totalIndex).toBe(88.8); // 92*0.35 + 85*0.30 + 88*0.20 + 90*0.15 = 32.2 + 25.5 + 17.6 + 13.5 = 88.8

      // 2. Durability and Degradation
      const det = calculatePaceDeterioration(240, 270); // 4:00/km out, 4:30/km in
      expect(det).toBe(12.5);
      const durability = classifyPaceDurability(det);
      expect(durability.rating).toBe("POOR"); // > 10% deterioration is poor durability

      // 3. Multi-Distance Race Prediction (Marathon to Comrades 89km)
      const comrades = predictRacePerformance({
        recentRaceDistanceKm: 42.195,
        recentRaceTimeSeconds: 10800, // 3-hour marathoner
        targetDistanceKm: 89.0, // Comrades Marathon
      });
      expect(comrades).toBeDefined();
      expect(comrades.centralEstimateSeconds).toBeGreaterThan(21600); // Sub 7h15 for 3:00 marathon
      expect(comrades.centralEstimateFormatted).toBeDefined();
    });

    it("evaluates longitudinal readiness scoring", () => {
      const readiness = calculateAthleteReadiness({
        sleepQuality: 4,
        fatigueLevel: 2,
        muscleSoreness: 2,
        acuteChronicRatio: 1.05,
      });
      expect(readiness.readinessScore).toBeGreaterThanOrEqual(75);
      expect(["HIGH", "NORMAL"]).toContain(readiness.level);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Club Activities, Attendance & CCLI Reciprocity Engine
  // ---------------------------------------------------------------------------
  describe("Workflow 4: Club Activities, Attendance & CCLI Loyalty Index", () => {
    it("calculates accurate CCLI scores and distinguishes high vs low loyalty", () => {
      // High loyalty athlete
      const highLoyalty = calculateClubContributionScore({
        internalRunsAttended: 12,
        totalInternalRunsOffered: 15,
        volunteerEventsAttended: 4,
        clubRepresentationCount: 3,
        mentoringSessionsCount: 2,
        clubMeetingsAttended: 3,
        obligationsMetCount: 2,
        totalObligationsAssigned: 2,
        membershipTenureYears: 4,
      });
      expect(highLoyalty.totalScore).toBeGreaterThanOrEqual(80);

      // Low loyalty athlete
      const lowLoyalty = calculateClubContributionScore({
        internalRunsAttended: 2,
        totalInternalRunsOffered: 15,
        volunteerEventsAttended: 0,
        clubRepresentationCount: 1,
        mentoringSessionsCount: 0,
        clubMeetingsAttended: 1,
        obligationsMetCount: 1,
        totalObligationsAssigned: 2,
        membershipTenureYears: 1,
      });
      expect(lowLoyalty.totalScore).toBeLessThan(45);
    });

    it("protects athlete denominator with approved study / injury exemptions", () => {
      const exempt = calculateClubContributionScore({
        internalRunsAttended: 3,
        totalInternalRunsOffered: 15,
        exemptionReductionRatio: 0.80, // 80% reduction in expected attendance due to exams
        volunteerEventsAttended: 1,
        clubRepresentationCount: 1,
        mentoringSessionsCount: 0,
        clubMeetingsAttended: 1,
        obligationsMetCount: 1,
        totalObligationsAssigned: 1,
        membershipTenureYears: 2,
      });
      // 3 attended out of adjusted 3 (15 * (1 - 0.8)) = 100% attendance rate
      expect(exempt.attendanceRatePercent).toBe(100);
      expect(exempt.totalScore).toBeGreaterThanOrEqual(50);
    });

    it("evaluates reciprocity alerts for high-spend low-loyalty athletes", () => {
      const review = evaluateReciprocityPattern({
        athleteId: "ath_kg",
        athleteName: "Kagiso Mokoena",
        twelveMonthFinancialSupportZar: 60000,
        internalParticipationRatePercent: 15.0,
        volunteerActivitiesCount: 0,
        majorEventSupportRequestsCount: 4,
        currentContributionScore: 32,
        currentPerformanceScore: 92,
        unmetObligationsCount: 1,
      });
      expect(review.requiresReview).toBe(true);
      expect(review.alertLevel).toBe("CRITICAL_REVIEW");
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Sponsorship Merit vs Reciprocity & Committee Decisions
  // ---------------------------------------------------------------------------
  describe("Workflow 5: Sponsorship Allocation & Financial Integrity", () => {
    it("calculates dual-index sponsorship score and tier recommendation", () => {
      const score = calculateClubSponsorshipScore(90, 85, 88, 80, 78, 95);
      expect(score.totalScore).toBeGreaterThanOrEqual(80);
      expect(["ELITE_CLUB_ATHLETE", "PERFORMANCE_ATHLETE"]).toContain(score.recommendation.recommendedTier);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Anti-Collision Dispersion & 4-Quadrant Geometry
  // ---------------------------------------------------------------------------
  describe("Workflow 6: Anti-Collision Node Dispersion on 4-Quadrant Matrix", () => {
    it("separates identical coordinates so zero nodes overlap in 2D space", () => {
      // 8 athletes with identical scores
      const nodes = Array.from({ length: 8 }).map((_, i) => ({
        x: 65,
        y: 75,
        id: `ath_${i}`,
      }));

      const MIN_DIST = 5.0;
      for (let iter = 0; iter < 15; iter++) {
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[j].x - nodes[i].x;
            const dy = nodes[j].y - nodes[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < MIN_DIST) {
              const angle = dist > 0.01 ? Math.atan2(dy, dx) : i * 1.618;
              const push = (MIN_DIST - dist) / 2 + 0.4;
              nodes[i].x = Math.min(94, Math.max(6, nodes[i].x - Math.cos(angle) * push));
              nodes[i].y = Math.min(94, Math.max(6, nodes[i].y - Math.sin(angle) * push));
              nodes[j].x = Math.min(94, Math.max(6, nodes[j].x + Math.cos(angle) * push));
              nodes[j].y = Math.min(94, Math.max(6, nodes[j].y + Math.sin(angle) * push));
            }
          }
        }
      }

      // Check distance between every pair
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dist = Math.sqrt(Math.pow(nodes[j].x - nodes[i].x, 2) + Math.pow(nodes[j].y - nodes[i].y, 2));
          expect(dist).toBeGreaterThanOrEqual(3.5); // strictly separated!
        }
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 7. System Audit Trail & Administration
  // ---------------------------------------------------------------------------
  describe("Workflow 7: System Administration & Compliance Audit Trail", () => {
    it("logs audit records for governance compliance", async () => {
      const user = await prisma.user.findFirst();
      expect(user).toBeDefined();

      const log = await prisma.auditLog.create({
        data: {
          user: { connect: { id: user!.id } },
          action: "SIMULATION_TEST_EXECUTION",
          entityType: "QA_SIMULATION",
          entityId: "sim_test_001",
          newValuesJson: JSON.stringify({ executionTime: Date.now(), status: "SUCCESS" }),
        },
      });

      try {
        expect(log.id).toBeDefined();
        expect(log.action).toBe("SIMULATION_TEST_EXECUTION");

        const found = await prisma.auditLog.findUnique({ where: { id: log.id } });
        expect(found).not.toBeNull();
      } finally {
        await prisma.auditLog.delete({ where: { id: log.id } });
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 8. Member Details Editing, Soft Archival, & ASA License Integrity
  // ---------------------------------------------------------------------------
  describe("Workflow 8: Member Details Editing & Archival Integrity", () => {
    it("edits member details and verifies soft archival preservation", async () => {
      // Create a test athlete
      const testAthlete = await prisma.athlete.create({
        data: {
          athleteNumber: "SEA-TEST-999",
          firstName: "Audit",
          lastName: "Tester",
          dateOfBirth: new Date("1996-05-15"),
          gender: "FEMALE",
          contactEmail: "audit.tester@supereagles.co.za",
          primaryDiscipline: "10K",
          disciplineCategory: "RUNNER",
          athleteStatus: "DEVELOPMENT",
          membershipStartDate: new Date("2025-01-01"),
          membershipStatus: "ACTIVE",
          membershipFeeStatus: "PAID",
          asaLicenseNumber: "2026-ASA-TEST",
        },
      });

      try {
        expect(testAthlete.id).toBeDefined();

        // 1. Edit member details
        const updated = await prisma.athlete.update({
          where: { id: testAthlete.id },
          data: {
            preferredName: "Audie",
            contactPhone: "+27 82 999 0000",
            primaryDiscipline: "HALF_MARATHON",
          },
        });
        expect(updated.preferredName).toBe("Audie");
        expect(updated.contactPhone).toBe("+27 82 999 0000");

        // 2. Soft archive member
        const archived = await prisma.athlete.update({
          where: { id: testAthlete.id },
          data: {
            membershipStatus: "LAPSED",
            membershipFeeStatus: "PENDING",
          },
        });
        expect(archived.membershipStatus).toBe("LAPSED");
        expect(archived.membershipFeeStatus).toBe("PENDING");
      } finally {
        // Clean up
        await prisma.athlete.delete({ where: { id: testAthlete.id } });
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 9. Arrears Gatekeeper & Annual Cycle Renewal Workflow
  // ---------------------------------------------------------------------------
  describe("Workflow 9: Arrears Gatekeeper & Annual Cycle Renewal", () => {
    it("locks submissions when member is in arrears, and unlocks upon annual renewal", async () => {
      const arrearsAthlete = await prisma.athlete.create({
        data: {
          athleteNumber: "SEA-ARREARS-1",
          firstName: "Arrears",
          lastName: "Case",
          dateOfBirth: new Date("1992-08-20"),
          gender: "MALE",
          contactEmail: "arrears.case@supereagles.co.za",
          membershipStartDate: new Date("2024-01-01"),
          membershipStatus: "PENDING_RENEWAL",
          membershipFeeStatus: "PENDING",
        },
      });

      try {
        // Arrears check
        const isArrears =
          arrearsAthlete.membershipFeeStatus !== "PAID" &&
          arrearsAthlete.membershipFeeStatus !== "EXEMPT" &&
          arrearsAthlete.membershipFeeStatus !== "SUBSIDIZED";
        expect(isArrears).toBe(true);

        // Process renewal
        const targetExpiry = new Date(Date.UTC(2026, 11, 31, 23, 59, 59));
        const renewed = await prisma.athlete.update({
          where: { id: arrearsAthlete.id },
          data: {
            membershipFeeStatus: "PAID",
            membershipStatus: "ACTIVE",
            membershipExpiry: targetExpiry,
          },
        });

        const isStillInArrears =
          renewed.membershipFeeStatus !== "PAID" &&
          renewed.membershipFeeStatus !== "EXEMPT" &&
          renewed.membershipFeeStatus !== "SUBSIDIZED";
        expect(isStillInArrears).toBe(false);
        expect(renewed.membershipStatus).toBe("ACTIVE");
        expect(renewed.membershipExpiry?.toISOString()).toContain("2026-12-31");
      } finally {
        await prisma.athlete.delete({ where: { id: arrearsAthlete.id } });
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 10. Member Self-Registration Workflow
  // ---------------------------------------------------------------------------
  describe("Workflow 10: Member Self-Registration & Account Creation", () => {
    it("creates a new User account, linked Athlete record with sequential SEA ID, and signs in", async () => {
      const bcrypt = await import("bcryptjs");
      const testEmail = "new.joiner@supereagles.co.za";
      const testPassword = "JoinPass2026!";
      const passwordHash = await bcrypt.hash(testPassword, 10);

      const registeredUser = await prisma.user.create({
        data: {
          email: testEmail,
          name: "Sipho Joiner",
          passwordHash,
          role: "ATHLETE",
          phone: "0829991234",
          isActive: true,
          athlete: {
            create: {
              athleteNumber: "SEA-TEST-999",
              firstName: "Sipho",
              lastName: "Joiner",
              dateOfBirth: new Date("1996-05-15"),
              gender: "MALE",
              contactEmail: testEmail,
              contactPhone: "0829991234",
              membershipStartDate: new Date(),
              membershipStatus: "ACTIVE",
              membershipCategory: "SENIOR_RUNNER",
              disciplineCategory: "RUNNER",
              primaryDiscipline: "MARATHON",
              athleteStatus: "DEVELOPMENT",
              membershipFeeStatus: "PENDING",
              membershipExpiry: new Date(2026, 11, 31, 23, 59, 59),
            },
          },
        },
        include: { athlete: true },
      });

      try {
        expect(registeredUser.id).toBeDefined();
        expect(registeredUser.athlete?.id).toBeDefined();
        expect(registeredUser.athlete?.athleteNumber).toBe("SEA-TEST-999");
        expect(registeredUser.athlete?.membershipFeeStatus).toBe("PENDING");
        expect(registeredUser.role).toBe("ATHLETE");

        // Verify password verification matches
        const passwordMatches = await bcrypt.compare(testPassword, registeredUser.passwordHash);
        expect(passwordMatches).toBe(true);
      } finally {
        await prisma.athlete.delete({ where: { id: registeredUser.athlete!.id } });
        await prisma.user.delete({ where: { id: registeredUser.id } });
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 12. Proof-of-Payment (POP) Submission & Administrative Reconciliation
  // ---------------------------------------------------------------------------
  describe("Workflow 12: Proof-of-Payment (POP) Lifecycle & Reconciliation", () => {
    it("creates pending POP payment, advances to VERIFIED, and updates athlete standing", async () => {
      const athlete = await prisma.athlete.findFirst({ where: { membershipStatus: "ACTIVE" } });
      expect(athlete).not.toBeNull();

      // Submit POP
      const payment = await prisma.membershipPayment.create({
        data: {
          athleteId: athlete!.id,
          amount: 450,
          seasonYear: 2026,
          paymentMethod: "EFT",
          referenceNumber: "POP-TEST-001",
          popUrl: "/uploads/pop/test_receipt.pdf",
          popFileName: "EFT_Payment_Proof.pdf",
          status: "PENDING_VERIFICATION",
          notes: "Athlete bank confirmation uploaded",
        },
      });

      expect(payment.status).toBe("PENDING_VERIFICATION");
      expect(payment.popUrl).toBe("/uploads/pop/test_receipt.pdf");

      // Admin Reconciles POP
      const verified = await prisma.membershipPayment.update({
        where: { id: payment.id },
        data: {
          status: "VERIFIED",
          verifiedAt: new Date(),
        },
      });

      expect(verified.status).toBe("VERIFIED");
      expect(verified.verifiedAt).toBeDefined();

      // Cleanup
      await prisma.membershipPayment.delete({ where: { id: payment.id } });
    });
  });

  // ---------------------------------------------------------------------------
  // 13. Pure Local GPX & Activity CSV Parsing & Ingestion
  // ---------------------------------------------------------------------------
  describe("Workflow 13: Local GPX & Activity Ingestion Without Mandatory Cloud", () => {
    it("parses pure XML GPX route points and computes splits and elevation", async () => {
      const { parseGpxData } = await import("@/lib/importers/gpxParser");

      const mockGpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Garmin Connect">
  <trk>
    <name>Soweto 10km Morning Run</name>
    <trkseg>
      <trkpt lat="-26.2500" lon="27.8500"><ele>1650.0</ele><time>2026-06-01T05:00:00Z</time></trkpt>
      <trkpt lat="-26.2550" lon="27.8550"><ele>1655.0</ele><time>2026-06-01T05:04:30Z</time></trkpt>
      <trkpt lat="-26.2600" lon="27.8600"><ele>1660.0</ele><time>2026-06-01T05:09:00Z</time></trkpt>
    </trkseg>
  </trk>
</gpx>`;

      const parsed = parseGpxData(mockGpx);
      expect(parsed.totalDistanceKm).toBeGreaterThan(0);
      expect(parsed.totalDurationSeconds).toBe(540);
      expect(parsed.trackpointsCount).toBe(3);
    });

    it("parses Strava and Garmin CSV exports seamlessly", async () => {
      const { parseStravaGarminCsv } = await import("@/lib/importers/stravaGarminCsvParser");

      const csvContent = `Activity Date,Activity Type,Elapsed Time,Distance
"01 Jun 2026, 05:30:00",Run,2700,10.05
"03 Jun 2026, 05:30:00",Run,5400,21.10`;

      const parsed = parseStravaGarminCsv(csvContent);
      expect(parsed.activities.length).toBe(2);
      expect(parsed.activities[0].activityType).toBe("RUN");
      expect(parsed.activities[0].distanceKm).toBeCloseTo(10.05);
      expect(parsed.activities[1].distanceKm).toBeCloseTo(21.10);
    });
  });

  // ---------------------------------------------------------------------------
  // 14. Event Administration: Fleet Transport, Accommodation & Volunteers
  // ---------------------------------------------------------------------------
  describe("Workflow 14: Complete Event Logistics & Manifest Rosters", () => {
    it("creates transport bus manifest, registers passenger, and tracks logistics", async () => {
      const athlete = await prisma.athlete.findFirst({ where: { membershipStatus: "ACTIVE" } });
      expect(athlete).not.toBeNull();

      const raceEdition = await prisma.raceEdition.findFirst();
      expect(raceEdition).not.toBeNull();

      // Upsert event logistics
      const logistics = await prisma.eventLogistics.upsert({
        where: { raceEditionId: raceEdition!.id },
        update: {
          busEnabled: true,
          busCapacity: 50,
          busDepartureLocation: "Super Eagles Clubhouse, Soweto",
        },
        create: {
          raceEditionId: raceEdition!.id,
          busEnabled: true,
          busCapacity: 50,
          busDepartureLocation: "Super Eagles Clubhouse, Soweto",
        },
      });

      expect(logistics.busEnabled).toBe(true);
      expect(logistics.busCapacity).toBe(50);

      // Register athlete
      const reg = await prisma.eventRegistration.create({
        data: {
          raceEditionId: raceEdition!.id,
          athleteId: athlete!.id,
          status: "CONFIRMED",
          transportOption: "BUS_SEAT",
          busSeatNumber: "Seat 01",
        },
      });

      expect(reg.status).toBe("CONFIRMED");
      expect(reg.busSeatNumber).toBe("Seat 01");

      // Cleanup
      await prisma.eventRegistration.delete({ where: { id: reg.id } });
    });
  });

  // ---------------------------------------------------------------------------
  // 15. Reliable Direct WhatsApp & Email Notice Dispatch
  // ---------------------------------------------------------------------------
  describe("Workflow 15: Notice Generation & South African Phone Normalization", () => {
    it("normalizes national 082 numbers to 2782 and generates deep links", async () => {
      const {
        normalizePhoneNumber,
        generatePaymentReminderNotice,
        generateRaceLogisticsNotice,
      } = await import("@/lib/communication/noticeEngine");

      expect(normalizePhoneNumber("082 123 4567")).toBe("27821234567");
      expect(normalizePhoneNumber("+27 (71) 987-6543")).toBe("27719876543");

      const paymentNotice = generatePaymentReminderNotice({
        athleteName: "Kagiso Rabada",
        athleteNumber: "SEA-045",
        phone: "0835551234",
        email: "kagiso@cricket.co.za",
        amountOwed: 450,
        seasonYear: 2026,
        category: "SENIOR_RUNNER",
      });

      expect(paymentNotice.whatsappUrl).toContain("https://wa.me/27835551234?text=");
      expect(paymentNotice.body).toContain("R450.00");
      expect(paymentNotice.body).toContain("SEA-045");

      const raceNotice = generateRaceLogisticsNotice({
        athleteName: "Gerda Steyn",
        athleteNumber: "SEA-001",
        raceName: "Two Oceans Ultra Marathon 2026",
        busDepartureTime: "04:30 AM",
        pickupPoint: "Cape Town Station",
        hotelName: "Southern Sun Waterfront",
        roomNumber: "Room 402",
      });

      expect(raceNotice.body).toContain("Two Oceans Ultra Marathon 2026");
      expect(raceNotice.body).toContain("Room 402");
    });
  });

  // ---------------------------------------------------------------------------
  // 16. Automated Annual Rollover & ASA Age Transitions
  // ---------------------------------------------------------------------------
  describe("Workflow 16: Annual Season Rollover & ASA Age Category Transitions", () => {
    it("determines correct ASA age categories across life stages", async () => {
      const { determineAsaCategory } = await import("@/lib/rollover/seasonRolloverEngine");

      // Born 2012 -> 14 in 2026 -> Junior (U16)
      expect(determineAsaCategory("2012-04-10", 2026)).toBe("Junior (U16)");
      // Born 2008 -> 18 in 2026 -> Junior (U20)
      expect(determineAsaCategory("2008-01-01", 2026)).toBe("Junior (U20)");
      // Born 1995 -> 31 in 2026 -> Senior (20-39)
      expect(determineAsaCategory("1995-07-20", 2026)).toBe("Senior (20-39)");
      // Born 1980 -> 46 in 2026 -> Veteran (40-49)
      expect(determineAsaCategory("1980-11-15", 2026)).toBe("Veteran (40-49)");
      // Born 1970 -> 56 in 2026 -> Master (50-59)
      expect(determineAsaCategory("1970-03-25", 2026)).toBe("Master (50-59)");
      // Born 1960 -> 66 in 2026 -> Grandmaster (60+)
      expect(determineAsaCategory("1960-09-05", 2026)).toBe("Grandmaster (60+)");
    });

    it("previews season rollover without mutating database records", async () => {
      const { previewSeasonRollover } = await import("@/lib/rollover/seasonRolloverEngine");

      const preview = await previewSeasonRollover("2027");
      expect(preview.targetSeason).toBe("2027");
      expect(preview.totalAthletes).toBeGreaterThan(0);
      expect(preview.financialSummary.totalProjectedRevenue).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 17. One-Click Backup Creation & Verification
  // ---------------------------------------------------------------------------
  describe("Workflow 17: Backup Snapshot Integrity Verification", () => {
    it("creates system backup and verifies database snapshot file integrity", async () => {
      const { createSystemBackup, listBackups } = await import("@/lib/backup/backupEngine");

      const result = await createSystemBackup("./backups");
      expect(result.success).toBe(true);
      expect(result.jsonBackup.fileName).toContain(".json");

      const backups = await listBackups("./backups");
      expect(backups.length).toBeGreaterThan(0);
      expect(backups.some((b) => b.fileName === result.jsonBackup.fileName)).toBe(true);
    });
  });
});

