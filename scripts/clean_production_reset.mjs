import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("🦅 ==============================================================");
  console.log("   SUPER EAGLES AMMS — CLEAN PRODUCTION FIELD-TRIAL RESET");
  console.log("================================================================");

  // 1. Database backup before cleaning
  const backupDir = path.resolve(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const localAppDir = process.env.LOCALAPPDATA
    ? path.join(process.env.LOCALAPPDATA, "SuperEaglesAMMS")
    : null;
  const localAppDb = localAppDir ? path.join(localAppDir, "dev.db") : null;
  const rootDb = path.resolve(process.cwd(), "prisma", "dev.db");

  // Determine active database source
  const sourceDb = fs.existsSync(rootDb) ? rootDb : (localAppDb && fs.existsSync(localAppDb) ? localAppDb : null);
  if (sourceDb) {
    const backupPath = path.join(backupDir, `backup_before_field_trial_${timestamp}.db`);
    try {
      fs.copyFileSync(sourceDb, backupPath);
      console.log(`✓ Safety snapshot created at: ${backupPath}`);
    } catch (err) {
      console.warn(`[WARN] Could not create snapshot: ${err.message}`);
    }
  }

  console.log("\n[1/3] Purging synthetic athletes, test sessions, and demo records...");

  // Wipe child records in reverse dependency order
  await prisma.athleteMedallion.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.aIRecommendation.deleteMany();
  await prisma.coachReview.deleteMany();
  await prisma.athleteObligation.deleteMany();
  await prisma.sponsorshipDecision.deleteMany();
  await prisma.sponsorshipCondition.deleteMany();
  await prisma.sponsorshipTransaction.deleteMany();
  await prisma.sponsorship.deleteMany();
  await prisma.loyaltyExemption.deleteMany();
  await prisma.volunteerContribution.deleteMany();
  await prisma.clubAttendance.deleteMany();
  await prisma.clubActivity.deleteMany();
  await prisma.performanceScore.deleteMany();
  await prisma.raceResult.deleteMany();
  await prisma.raceEdition.deleteMany();
  await prisma.race.deleteMany();
  await prisma.wellnessEntry.deleteMany();
  await prisma.trainingSplit.deleteMany();
  await prisma.trainingActivity.deleteMany();
  await prisma.athleteGoal.deleteMany();
  await prisma.coachAssignment.deleteMany();
  await prisma.athlete.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemConfiguration.deleteMany();

  console.log("✓ All synthetic athletes, test attendances, races, and demo personas removed.");

  // 2. Initialize default club configurations
  console.log("\n[2/3] Initializing official club policy configurations...");
  const defaultConfigs = [
    {
      configKey: "SCORING_WEIGHTS_PERFORMANCE",
      description: "Athlete Performance Index Component Weights",
      configValueJson: JSON.stringify({
        verifiedPerformanceWeight: 0.35,
        improvementWeight: 0.30,
        targetCapabilityWeight: 0.20,
        reliabilityWeight: 0.15,
      }),
    },
    {
      configKey: "SCORING_WEIGHTS_SPONSORSHIP",
      description: "Club Sponsorship Score Component Weights",
      configValueJson: JSON.stringify({
        verifiedPerformanceWeight: 0.25,
        improvementWeight: 0.20,
        futurePotentialWeight: 0.15,
        reliabilityWeight: 0.10,
        clubContributionWeight: 0.20,
        complianceWeight: 0.10,
      }),
    },
    {
      configKey: "SCORING_WEIGHTS_CONTRIBUTION",
      description: "Club Contribution & Loyalty Weights",
      configValueJson: JSON.stringify({
        internalRunsWeight: 0.30,
        volunteeringWeight: 0.20,
        representationWeight: 0.15,
        mentoringWeight: 0.10,
        meetingsWeight: 0.10,
        complianceWeight: 0.10,
        tenureWeight: 0.05,
      }),
    },
    {
      configKey: "CLUB_PROFILE",
      description: "Club Branding and Institutional Details",
      configValueJson: JSON.stringify({
        clubName: "Super Eagles Athletics Club",
        shortName: "Super Eagles AC",
        motto: "Fly High, Run True, Serve the Club",
        colors: { primary: "#16a34a", accent: "#eab308", dark: "#0f172a" },
        currency: "ZAR",
      }),
    },
  ];

  for (const cfg of defaultConfigs) {
    await prisma.systemConfiguration.create({ data: cfg });
  }
  console.log("✓ Core scoring weights and club profile configured.");

  // 3. Provision clean production Super Admin
  console.log("\n[3/3] Provisioning primary production administrator account...");
  const adminEmail = (process.env.INITIAL_ADMIN_EMAIL || "admin@supereagles.co.za").toLowerCase().trim();
  const adminName = (process.env.INITIAL_ADMIN_NAME || "Club General Manager").trim();
  const adminPass = process.env.INITIAL_ADMIN_PASSWORD || "AdminPass2026!";
  const passwordHash = await bcrypt.hash(adminPass, 12);

  const adminUser = await prisma.user.create({
    data: {
      email: adminEmail,
      name: adminName,
      role: "SUPER_ADMIN",
      passwordHash,
      isActive: true,
      phone: "+27 11 000 0000",
    },
    select: { id: true, email: true, name: true, role: true },
  });

  console.log(`✓ Production administrator created: ${adminUser.name} (${adminUser.email})`);

  // 4. Synchronize local host AppData database if running on workstation topology
  if (localAppDb && fs.existsSync(rootDb)) {
    try {
      if (localAppDir && !fs.existsSync(localAppDir)) {
        fs.mkdirSync(localAppDir, { recursive: true });
      }
      fs.copyFileSync(rootDb, localAppDb);
      console.log(`✓ Synchronized clean database to host runtime: ${localAppDb}`);
    } catch (syncErr) {
      console.warn(`[NOTE] Local app data sync skipped: ${syncErr.message}`);
    }
  }

  console.log("\n================================================================");
  console.log("✨ CLEAN PRODUCTION RESET COMPLETE — READY FOR FIELD TRIAL");
  console.log("================================================================");
  console.log(`Database is 100% clean with zero test records.`);
  console.log(`Admin login: ${adminEmail}`);
  console.log(`To restore synthetic demo athletes for tests: npm run db:restore-demo`);
  console.log("================================================================\n");
}

main()
  .catch((err) => {
    console.error("Clean production reset failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
