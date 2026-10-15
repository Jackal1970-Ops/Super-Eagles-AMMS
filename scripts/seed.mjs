import pkg from "@prisma/client";
const { PrismaClient } = pkg;

import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
    throw new Error(
      "Refusing to erase and demo-seed a production database. Use npm run bootstrap:admin, or explicitly set ALLOW_DEMO_SEED=true only for an isolated demo environment."
    );
  }
  console.log("🦅 Starting Super Eagles AMS synthetic database seeding...");

  // Clean existing records in reverse dependency order
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

  console.log("✓ Cleared prior records.");

  // 1. Create Default System Configurations
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
  console.log("✓ Initialized system configuration parameters.");

  // 2. Create Users for all 5 Roles
  const passwordHash = await bcrypt.hash("Password2026!", 10);
  const gmPassword = await bcrypt.hash("AdminPass2026!", 10);
  const coachPassword = await bcrypt.hash("CoachPass2026!", 10);
  const athletePassword = await bcrypt.hash("AthletePass2026!", 10);
  const clubAdminPassword = await bcrypt.hash("ClubPass2026!", 10);
  const committeePassword = await bcrypt.hash("CommitteePass2026!", 10);

  const gmUser = await prisma.user.create({
    data: {
      email: "admin@supereagles.co.za",
      name: "Dr. Sibongile Khumalo (GM)",
      role: "SUPER_ADMIN",
      passwordHash: gmPassword,
      phone: "+27 82 555 0101",
    },
  });

  const coach1 = await prisma.user.create({
    data: {
      email: "coach.hendrik@supereagles.co.za",
      name: "Coach Hendrik Botha",
      role: "COACH",
      passwordHash: coachPassword,
      phone: "+27 83 555 0202",
    },
  });

  const coach2 = await prisma.user.create({
    data: {
      email: "coach.ayanda@supereagles.co.za",
      name: "Coach Ayanda Zulu",
      role: "COACH",
      passwordHash: passwordHash,
      phone: "+27 84 555 0203",
    },
  });

  const coach3 = await prisma.user.create({
    data: {
      email: "coach.mark@supereagles.co.za",
      name: "Coach Mark Reynolds",
      role: "COACH",
      passwordHash: passwordHash,
      phone: "+27 82 555 0204",
    },
  });

  const clubAdmin = await prisma.user.create({
    data: {
      email: "admin.club@supereagles.co.za",
      name: "Fatima Patel (Club Admin)",
      role: "CLUB_ADMIN",
      passwordHash: clubAdminPassword,
      phone: "+27 83 555 0303",
    },
  });

  const committeeUser = await prisma.user.create({
    data: {
      email: "committee@supereagles.co.za",
      name: "Adv. Johannes Louw (Sponsorship Chair)",
      role: "SPONSORSHIP_COMMITTEE",
      passwordHash: committeePassword,
      phone: "+27 82 555 0404",
    },
  });

  console.log("✓ Created system users across 5 roles.");

  // 3. Seed Races Library
  const raceComrades = await prisma.race.create({
    data: {
      name: "Comrades Marathon",
      location: "KwaZulu-Natal (Durban to Pietermaritzburg)",
      country: "South Africa",
      defaultDistanceKm: 89.0,
      elevationProfile: "EXTREME_CLIMB",
      surface: "ROAD",
      raceCategory: "ULTRA_90K",
      difficultyRating: 5,
      strategicImportance: "HIGH",
    },
  });

  const raceTwoOceans = await prisma.race.create({
    data: {
      name: "Two Oceans Ultra Marathon",
      location: "Cape Town",
      country: "South Africa",
      defaultDistanceKm: 56.0,
      elevationProfile: "HILLY",
      surface: "ROAD",
      raceCategory: "ULTRA_56K",
      difficultyRating: 5,
      strategicImportance: "HIGH",
    },
  });

  const raceCapeTownMarathon = await prisma.race.create({
    data: {
      name: "Sanlam Cape Town Marathon",
      location: "Cape Town",
      country: "South Africa",
      defaultDistanceKm: 42.195,
      elevationProfile: "FLAT",
      surface: "ROAD",
      raceCategory: "MARATHON",
      difficultyRating: 3,
      strategicImportance: "HIGH",
    },
  });

  const raceSoweto = await prisma.race.create({
    data: {
      name: "Soweto Marathon",
      location: "Soweto, Johannesburg",
      country: "South Africa",
      defaultDistanceKm: 42.195,
      elevationProfile: "HILLY",
      surface: "ROAD",
      raceCategory: "MARATHON",
      difficultyRating: 4,
      strategicImportance: "HIGH",
    },
  });

  const raceKaapsehoop = await prisma.race.create({
    data: {
      name: "Kaapsehoop Marathon",
      location: "Mpumalanga",
      country: "South Africa",
      defaultDistanceKm: 42.195,
      elevationProfile: "FLAT",
      surface: "ROAD",
      raceCategory: "MARATHON",
      difficultyRating: 2,
      strategicImportance: "MEDIUM",
    },
  });

  const raceOmDieDam = await prisma.race.create({
    data: {
      name: "Om die Dam 50km Ultra",
      location: "Hartbeespoort",
      country: "South Africa",
      defaultDistanceKm: 50.0,
      elevationProfile: "HILLY",
      surface: "ROAD",
      raceCategory: "ULTRA_50K",
      difficultyRating: 4,
      strategicImportance: "MEDIUM",
    },
  });

  const raceSAHalfChamps = await prisma.race.create({
    data: {
      name: "South African Half Marathon Championships",
      location: "Gqeberha",
      country: "South Africa",
      defaultDistanceKm: 21.0975,
      elevationProfile: "FLAT",
      surface: "ROAD",
      raceCategory: "HALF_MARATHON",
      difficultyRating: 2,
      strategicImportance: "HIGH",
    },
  });

  const raceBerlin = await prisma.race.create({
    data: {
      name: "Berlin Marathon",
      location: "Berlin",
      country: "Germany",
      defaultDistanceKm: 42.195,
      elevationProfile: "FLAT",
      surface: "ROAD",
      raceCategory: "MARATHON",
      difficultyRating: 1,
      strategicImportance: "HIGH",
    },
  });

  const raceBoston = await prisma.race.create({
    data: {
      name: "Boston Marathon",
      location: "Boston, MA",
      country: "USA",
      defaultDistanceKm: 42.195,
      elevationProfile: "ROLLING",
      surface: "ROAD",
      raceCategory: "MARATHON",
      difficultyRating: 4,
      strategicImportance: "HIGH",
    },
  });

  // Create Race Editions
  const editionComrades2026 = await prisma.raceEdition.create({
    data: {
      raceId: raceComrades.id,
      year: 2026,
      date: new Date("2026-06-14"),
      qualificationStandardSeconds: 17940, // 4:59:00 marathon
      cutoffTimeSeconds: 43200, // 12h
      expectedDifficulty: 5,
    },
  });

  const editionTwoOceans2026 = await prisma.raceEdition.create({
    data: {
      raceId: raceTwoOceans.id,
      year: 2026,
      date: new Date("2026-04-18"),
      qualificationStandardSeconds: 18000, // 5:00:00
      cutoffTimeSeconds: 25200, // 7h
      expectedDifficulty: 5,
    },
  });

  const editionCapeTown2025 = await prisma.raceEdition.create({
    data: {
      raceId: raceCapeTownMarathon.id,
      year: 2025,
      date: new Date("2025-10-19"),
      cutoffTimeSeconds: 21600, // 6h
      expectedDifficulty: 3,
    },
  });

  const editionCapeTown2026 = await prisma.raceEdition.create({
    data: {
      raceId: raceCapeTownMarathon.id,
      year: 2026,
      date: new Date("2026-10-18"),
      cutoffTimeSeconds: 21600,
      expectedDifficulty: 3,
    },
  });

  console.log("✓ Populated official race library and championship editions.");

  // 4. Seed Club Activities (Internal runs, walks, time trials, volunteering)
  const activities = [
    { title: "Weekly Wednesday 8km Club Time Trial (Runners & Walkers)", type: "TIME_TRIAL", points: 10, mandatory: false },
    { title: "Saturday Morning 25km Club Long Run", type: "WEEKLY_RUN", points: 15, mandatory: false },
    { title: "Saturday Morning 12km Club Pack Walk", type: "WEEKLY_WALK", points: 15, mandatory: false },
    { title: "Super Eagles 15km Race Water Point 3 Marshalling", type: "WATER_POINT", points: 30, mandatory: true },
    { title: "Annual General Meeting & Membership Season Launch", type: "CLUB_MEETING", points: 20, mandatory: true },
    { title: "ASA Race Walking Technique & Cadence Clinic", type: "CLINIC", points: 25, mandatory: false },
    { title: "Development Squad Track & Walk Mentorship", type: "CLINIC", points: 25, mandatory: false },
    { title: "Two Oceans Cheer Station Setup & Volunteering", type: "VOLUNTEER_EVENT", points: 30, mandatory: false },
    { title: "Comrades & Ultra Walkers Pasta Party", type: "SOCIAL_EVENT", points: 15, mandatory: false },
    { title: "Club 5km Time Trial (Running & Walking Divisions)", type: "TIME_TRIAL", points: 10, mandatory: false },
  ];

  const createdClubActivities = [];
  for (let i = 0; i < activities.length; i++) {
    const act = activities[i];
    const created = await prisma.clubActivity.create({
      data: {
        title: act.title,
        activityType: act.type,
        location: "Super Eagles Clubhouse, Wanderers, Johannesburg",
        pointsValue: act.points,
        isMandatory: act.mandatory,
        date: new Date(Date.now() - (activities.length - i) * 14 * 86400000), // bi-weekly spread
      },
    });
    createdClubActivities.push(created);
  }

  // 5. Seed 20 Realistic Diverse Athletes
  // Distinct profiles:
  // 1: Sipho Sithole (Elite, High Loyalty)
  // 2: Kagiso Mokoena (High Perf, Low Loyalty / Reciprocity Review)
  // 3: Lerato Ndlovu (Rapid Improvement, Development Talent)
  // 4: Pieter van der Merwe (Declining Veteran)
  // 5: Nomvula Dlamini (High Loyalty / Moderate Perf)
  // 6: Thabo Molefe (Approved Study Exemption)
  // 7: Brandon Naidoo (Conditional Sponsorship)
  // 8-20: Diverse squad athletes

  const athletesSeedData = [
    {
      athleteNumber: "SEA-001",
      firstName: "Sipho",
      lastName: "Sithole",
      preferredName: "Sipho",
      dob: "1994-05-12",
      gender: "MALE",
      email: "athlete.sipho@supereagles.co.za",
      phone: "+27 71 555 1001",
      tenureYears: 4,
      status: "ELITE",
      discipline: "ULTRA_90K",
      coachId: coach1.id,
      userRole: "ATHLETE",
      profileType: "ELITE_LOYAL",
    },
    {
      athleteNumber: "SEA-002",
      firstName: "Kagiso",
      lastName: "Mokoena",
      preferredName: "KG",
      dob: "1996-08-23",
      gender: "MALE",
      email: "kagiso.mokoena@gmail.com",
      phone: "+27 72 555 1002",
      tenureYears: 2,
      status: "ELITE",
      discipline: "MARATHON",
      coachId: coach1.id,
      profileType: "HIGH_PERF_LOW_RECIPROCITY",
    },
    {
      athleteNumber: "SEA-003",
      firstName: "Lerato",
      lastName: "Ndlovu",
      preferredName: "Lere",
      dob: "2001-03-15",
      gender: "FEMALE",
      email: "lerato.ndlovu@gmail.com",
      phone: "+27 73 555 1003",
      tenureYears: 1.5,
      status: "DEVELOPMENT",
      discipline: "HALF_MARATHON",
      coachId: coach2.id,
      profileType: "RISING_TALENT",
    },
    {
      athleteNumber: "SEA-004",
      firstName: "Pieter",
      lastName: "van der Merwe",
      preferredName: "Oom Pieter",
      dob: "1982-11-04",
      gender: "MALE",
      email: "pieter.vdm@outlook.com",
      phone: "+27 82 555 1004",
      tenureYears: 8,
      status: "PERFORMANCE",
      discipline: "ULTRA_90K",
      membershipStatus: "LIFE_MEMBER",
      membershipCategory: "LIFE_MEMBER",
      disciplineCategory: "RUNNER",
      coachId: coach3.id,
      profileType: "DECLINING_VETERAN",
    },
    {
      athleteNumber: "SEA-005",
      firstName: "Nomvula",
      lastName: "Dlamini",
      preferredName: "Vula",
      dob: "1989-07-29",
      gender: "FEMALE",
      email: "nomvula.dlamini@yahoo.com",
      phone: "+27 74 555 1005",
      tenureYears: 6,
      status: "PERFORMANCE",
      discipline: "MARATHON",
      coachId: coach2.id,
      profileType: "HIGH_LOYALTY_MODERATE_PERF",
    },
    {
      athleteNumber: "SEA-006",
      firstName: "Thabo",
      lastName: "Molefe",
      preferredName: "Thabo",
      dob: "1998-02-18",
      gender: "MALE",
      email: "thabo.molefe@wits.ac.za",
      phone: "+27 76 555 1006",
      tenureYears: 3,
      status: "PERFORMANCE",
      discipline: "MARATHON",
      coachId: coach1.id,
      profileType: "APPROVED_EXEMPTION",
    },
    {
      athleteNumber: "SEA-007",
      firstName: "Brandon",
      lastName: "Naidoo",
      preferredName: "Brandon",
      dob: "1997-09-14",
      gender: "MALE",
      email: "brandon.naidoo@telkomsa.net",
      phone: "+27 83 555 1007",
      tenureYears: 2,
      status: "PERFORMANCE",
      discipline: "RACE_WALK",
      disciplineCategory: "WALKER",
      membershipCategory: "SENIOR_WALKER",
      coachId: coach3.id,
      profileType: "CONDITIONAL_SPONSORSHIP",
    },
    {
      athleteNumber: "SEA-008",
      firstName: "Amina",
      lastName: "Bester",
      preferredName: "Amina",
      dob: "1995-12-01",
      gender: "FEMALE",
      email: "amina.bester@vodamail.co.za",
      phone: "+27 84 555 1008",
      tenureYears: 3.5,
      status: "PERFORMANCE",
      discipline: "ULTRA_56K",
      disciplineCategory: "RUNNER",
      membershipCategory: "SENIOR_RUNNER",
      membershipStatus: "PENDING_RENEWAL",
      membershipFeeStatus: "PENDING",
      coachId: coach2.id,
      profileType: "REGULAR",
    },
    {
      athleteNumber: "SEA-009",
      firstName: "Bongani",
      lastName: "Radebe",
      preferredName: "Bongs",
      dob: "1993-04-05",
      gender: "MALE",
      email: "bongani.radebe@gmail.com",
      phone: "+27 79 555 1009",
      tenureYears: 5,
      status: "ELITE",
      discipline: "ULTRA_90K",
      disciplineCategory: "RUNNER",
      membershipCategory: "SENIOR_RUNNER",
      coachId: coach1.id,
      profileType: "REGULAR",
    },
    {
      athleteNumber: "SEA-010",
      firstName: "Chantelle",
      lastName: "de Klerk",
      preferredName: "Chani",
      dob: "2000-06-20",
      gender: "FEMALE",
      email: "chantelle.deklerk@gmail.com",
      phone: "+27 72 555 1010",
      tenureYears: 1,
      status: "DEVELOPMENT",
      discipline: "FITNESS_WALK",
      disciplineCategory: "WALKER",
      membershipCategory: "SENIOR_WALKER",
      coachId: coach2.id,
      profileType: "REGULAR",
    },
    {
      athleteNumber: "SEA-011",
      firstName: "David",
      lastName: "Mahlangu",
      preferredName: "Dave",
      dob: "1991-10-10",
      gender: "MALE",
      email: "david.mahlangu@gmail.com",
      phone: "+27 82 555 1011",
      tenureYears: 4,
      status: "PERFORMANCE",
      discipline: "MARATHON",
      coachId: coach3.id,
      profileType: "REGULAR",
    },
    {
      athleteNumber: "SEA-012",
      firstName: "Elize",
      lastName: "Pretorius",
      preferredName: "Elize",
      dob: "1987-01-30",
      gender: "FEMALE",
      email: "elize.pretorius@gmail.com",
      phone: "+27 83 555 1012",
      tenureYears: 7,
      status: "PERFORMANCE",
      discipline: "ULTRA_56K",
      coachId: coach2.id,
      profileType: "REGULAR",
    },
    {
      athleteNumber: "SEA-013",
      firstName: "Farouk",
      lastName: "Khan",
      preferredName: "Farouk",
      dob: "1999-07-14",
      gender: "MALE",
      email: "farouk.khan@gmail.com",
      phone: "+27 71 555 1013",
      tenureYears: 2,
      status: "DEVELOPMENT",
      discipline: "HALF_MARATHON",
      coachId: coach1.id,
      profileType: "REGULAR",
    },
    {
      athleteNumber: "SEA-014",
      firstName: "Grace",
      lastName: "Mthembu",
      preferredName: "Grace",
      dob: "1996-03-22",
      gender: "FEMALE",
      email: "grace.mthembu@gmail.com",
      phone: "+27 73 555 1014",
      tenureYears: 2.5,
      status: "PERFORMANCE",
      discipline: "MARATHON",
      coachId: coach2.id,
      profileType: "REGULAR",
    },
    {
      athleteNumber: "SEA-015",
      firstName: "Hein",
      lastName: "Scholtz",
      preferredName: "Hein",
      dob: "1992-08-11",
      gender: "MALE",
      email: "hein.scholtz@gmail.com",
      phone: "+27 82 555 1015",
      tenureYears: 4,
      status: "PERFORMANCE",
      discipline: "ULTRA_90K",
      coachId: coach3.id,
      profileType: "REGULAR",
    },
    {
      athleteNumber: "SEA-016",
      firstName: "Innocent",
      lastName: "Nene",
      preferredName: "Inno",
      dob: "2002-11-05",
      gender: "MALE",
      email: "innocent.nene@gmail.com",
      phone: "+27 74 555 1016",
      tenureYears: 1,
      status: "DEVELOPMENT",
      discipline: "5K",
      coachId: coach1.id,
      profileType: "REGULAR",
    },
    {
      athleteNumber: "SEA-017",
      firstName: "Johanna",
      lastName: "Viljoen",
      preferredName: "Hanrie",
      dob: "1990-05-19",
      gender: "FEMALE",
      email: "johanna.viljoen@gmail.com",
      phone: "+27 83 555 1017",
      tenureYears: 5,
      status: "PERFORMANCE",
      discipline: "ULTRA_50K",
      coachId: coach2.id,
      profileType: "REGULAR",
    },
    {
      athleteNumber: "SEA-018",
      firstName: "Kabelo",
      lastName: "Motsepe",
      preferredName: "Kabelo",
      dob: "1995-10-25",
      gender: "MALE",
      email: "kabelo.motsepe@gmail.com",
      phone: "+27 72 555 1018",
      tenureYears: 3,
      status: "PERFORMANCE",
      discipline: "MARATHON",
      coachId: coach3.id,
      profileType: "REGULAR",
    },
    {
      athleteNumber: "SEA-019",
      firstName: "Lindiwe",
      lastName: "Gumede",
      preferredName: "Lindi",
      dob: "1997-04-16",
      gender: "FEMALE",
      email: "lindiwe.gumede@gmail.com",
      phone: "+27 76 555 1019",
      tenureYears: 2,
      status: "PERFORMANCE",
      discipline: "HALF_MARATHON",
      coachId: coach2.id,
      profileType: "REGULAR",
    },
    {
      athleteNumber: "SEA-020",
      firstName: "Michael",
      lastName: "Swart",
      preferredName: "Mike",
      dob: "1988-12-12",
      gender: "MALE",
      email: "michael.swart@gmail.com",
      phone: "+27 82 555 1020",
      tenureYears: 6,
      status: "PERFORMANCE",
      discipline: "ULTRA_90K",
      coachId: coach3.id,
      profileType: "REGULAR",
    },
  ];

  console.log("✓ Seeding 20 detailed athlete master profiles & longitudinal history...");

  for (let idx = 0; idx < athletesSeedData.length; idx++) {
    const raw = athletesSeedData[idx];

    // Optionally link user account for Sipho (athlete role login test)
    let linkedUserId = null;
    if (raw.email === "athlete.sipho@supereagles.co.za") {
      const user = await prisma.user.create({
        data: {
          email: raw.email,
          name: `${raw.firstName} ${raw.lastName}`,
          role: "ATHLETE",
          passwordHash: athletePassword,
          phone: raw.phone,
        },
      });
      linkedUserId = user.id;
    }

    const membershipDate = new Date();
    membershipDate.setFullYear(membershipDate.getFullYear() - raw.tenureYears);

    const isWalker = raw.disciplineCategory === "WALKER" || raw.discipline === "WALKING" || raw.discipline === "RACE_WALK" || raw.discipline === "FITNESS_WALK";
    const disciplineCat = raw.disciplineCategory || (isWalker ? "WALKER" : "RUNNER");
    const memCat = raw.membershipCategory || (isWalker ? "SENIOR_WALKER" : (raw.tenureYears >= 7 ? "LIFE_MEMBER" : "SENIOR_RUNNER"));

    const athlete = await prisma.athlete.create({
      data: {
        userId: linkedUserId,
        athleteNumber: raw.athleteNumber,
        firstName: raw.firstName,
        lastName: raw.lastName,
        preferredName: raw.preferredName,
        dateOfBirth: new Date(raw.dob),
        gender: raw.gender,
        contactEmail: raw.email,
        contactPhone: raw.phone,
        membershipStartDate: membershipDate,
        membershipStatus: raw.membershipStatus || (raw.tenureYears >= 7 ? "LIFE_MEMBER" : "ACTIVE"),
        membershipCategory: memCat,
        disciplineCategory: disciplineCat,
        asaLicenseNumber: `ASA-2026-${8400 + idx}`,
        membershipExpiry: new Date("2026-12-31"),
        membershipFeeStatus: raw.membershipFeeStatus || "PAID",
        athleteStatus: raw.status,
        primaryDiscipline: raw.discipline,
        emergencyContact: "Club Captain (+27 11 788 1234)",
      },
    });

    // Coach Assignment
    await prisma.coachAssignment.create({
      data: {
        coachId: raw.coachId,
        athleteId: athlete.id,
        status: "ACTIVE",
        notes: `Assigned to head training squad under primary discipline ${raw.discipline}`,
      },
    });

    // Goals
    const targetRace = raw.discipline === "ULTRA_90K" ? raceComrades : raceCapeTownMarathon;
    const targetSeconds =
      raw.status === "ELITE" ? 8100 : raw.status === "PERFORMANCE" ? 10200 : 12600;

    await prisma.athleteGoal.create({
      data: {
        athleteId: athlete.id,
        targetRaceId: targetRace.id,
        targetRaceName: targetRace.name,
        targetDate: new Date("2026-06-14"),
        targetTimeSeconds: targetSeconds,
        targetQualification: "Sub-3:00 / Bill Rowan Standard",
        priority: "HIGH",
        coachComments: "Focused progression towards qualifying window.",
        status: "IN_PROGRESS",
      },
    });

    // Race Results History (over past 12 months)
    let marathonSeconds = 10800; // 3h00m default
    let halfMarathonSeconds = 4800; // 1h20m default

    if (raw.profileType === "ELITE_LOYAL") {
      marathonSeconds = 8700; // 2:25:00
      halfMarathonSeconds = 3960; // 1:06:00
    } else if (raw.profileType === "HIGH_PERF_LOW_RECIPROCITY") {
      marathonSeconds = 8520; // 2:22:00
      halfMarathonSeconds = 3900; // 1:05:00
    } else if (raw.profileType === "RISING_TALENT") {
      marathonSeconds = 10200; // 2:50:00 (down from 3:05:00 earlier!)
      halfMarathonSeconds = 4600; // 1:16:40
    } else if (raw.profileType === "DECLINING_VETERAN") {
      marathonSeconds = 12600; // 3:30:00 (up from 2:58:00 prior seasons)
      halfMarathonSeconds = 5700;
    }

    // 1. Cape Town Marathon result (6 months ago)
    await prisma.raceResult.create({
      data: {
        athleteId: athlete.id,
        raceEditionId: editionCapeTown2025.id,
        raceName: "Sanlam Cape Town Marathon 2025",
        date: new Date("2025-10-19"),
        distanceKm: 42.195,
        officialTimeSeconds: marathonSeconds,
        overallPosition: raw.profileType.startsWith("ELITE") ? 14 : 120 + idx * 10,
        genderPosition: raw.profileType.startsWith("ELITE") ? 12 : 90 + idx * 8,
        category: "OPEN",
        resultStatus: "FINISHED",
        source: "OFFICIAL_TIMING",
        verificationStatus: "VERIFIED",
        isPersonalBest: raw.profileType === "RISING_TALENT",
        qualificationAchieved: "Comrades Seed A",
        firstHalfPaceSeconds: Math.round(marathonSeconds / 42.195),
        secondHalfPaceSeconds: Math.round(
          (marathonSeconds / 42.195) * (raw.profileType === "DECLINING_VETERAN" ? 1.15 : 1.02)
        ),
        notes: "Official chip verified result.",
      },
    });

    // 2. SA Half Champs result (3 months ago)
    await prisma.raceResult.create({
      data: {
        athleteId: athlete.id,
        raceName: "South African Half Marathon Championships 2025",
        date: new Date("2025-12-05"),
        distanceKm: 21.0975,
        officialTimeSeconds: halfMarathonSeconds,
        category: "OPEN",
        resultStatus: "FINISHED",
        source: "OFFICIAL_TIMING",
        verificationStatus: "VERIFIED",
        firstHalfPaceSeconds: Math.round(halfMarathonSeconds / 21.0975),
        secondHalfPaceSeconds: Math.round((halfMarathonSeconds / 21.0975) * 1.01),
      },
    });

    // Training Activities (5 recent sessions)
    const basePace = Math.round(halfMarathonSeconds / 21.0975) + 30; // easy pace
    for (let s = 0; s < 5; s++) {
      const actDate = new Date(Date.now() - (s + 1) * 3 * 86400000);
      const isLong = s === 1;
      const dist = isLong ? 32.0 : 12.0;
      const dur = Math.round(dist * basePace);

      const activity = await prisma.trainingActivity.create({
        data: {
          athleteId: athlete.id,
          date: actDate,
          activityType: "RUN",
          distanceKm: dist,
          durationSeconds: dur,
          averagePaceSeconds: basePace,
          elevationGain: isLong ? 340 : 110,
          avgHeartRate: isLong ? 152 : 142,
          workoutType: isLong ? "LONG_RUN" : "EASY",
          surface: "ROAD",
          sessionRpe: isLong ? 7 : 5,
          source: "MANUAL",
          isLongRun: isLong,
        },
      });

      // Split sample for pace durability
      if (isLong) {
        await prisma.trainingSplit.create({
          data: {
            activityId: activity.id,
            splitNumber: 1,
            distanceKm: 16.0,
            durationSeconds: Math.round(16.0 * basePace),
            paceSeconds: basePace,
          },
        });
        const latePace =
          raw.profileType === "DECLINING_VETERAN"
            ? Math.round(basePace * 1.14)
            : Math.round(basePace * 1.02);
        await prisma.trainingSplit.create({
          data: {
            activityId: activity.id,
            splitNumber: 2,
            distanceKm: 16.0,
            durationSeconds: Math.round(16.0 * latePace),
            paceSeconds: latePace,
          },
        });
      }
    }

    // Wellness entries (recent check-in)
    await prisma.wellnessEntry.create({
      data: {
        athleteId: athlete.id,
        date: new Date(),
        restingHeartRate: 48 + (idx % 10),
        hrv: 65 + (idx % 20),
        sleepDurationHours: 7.5,
        sleepQuality: raw.profileType === "DECLINING_VETERAN" ? 2 : 4,
        fatigueLevel: raw.profileType === "DECLINING_VETERAN" ? 4 : 2,
        muscleSoreness: 2,
        stressLevel: 2,
        perceivedRecovery: 4,
        sessionRpe: 5,
      },
    });

    // Club Attendance & Volunteering setup based on profile
    let attendedRuns = 7;
    let volCount = 3;

    if (raw.profileType === "HIGH_PERF_LOW_RECIPROCITY") {
      attendedRuns = 1; // 12% attendance!
      volCount = 1;
    } else if (raw.profileType === "APPROVED_EXEMPTION") {
      attendedRuns = 4;
      volCount = 2;
      // Record approved exemption for medical studies
      await prisma.loyaltyExemption.create({
        data: {
          athleteId: athlete.id,
          reason: "STUDIES",
          startDate: new Date("2025-08-01"),
          endDate: new Date("2026-02-28"),
          expectedAttendanceReductionRatio: 0.50, // 50% denominator relief
          approvedBy: gmUser.id,
          status: "APPROVED",
          notes: "Wits Medical School clinical rotations. Denominator reduced by 50%.",
        },
      });
    } else if (raw.profileType === "HIGH_LOYALTY_MODERATE_PERF" || raw.profileType === "ELITE_LOYAL") {
      attendedRuns = 8;
      volCount = 4;
    }

    // Mark attendances in seeded club activities
    for (let a = 0; a < attendedRuns; a++) {
      if (createdClubActivities[a]) {
        await prisma.clubAttendance.create({
          data: {
            clubActivityId: createdClubActivities[a].id,
            athleteId: athlete.id,
            attended: true,
            checkInTime: new Date(createdClubActivities[a].date),
          },
        });
      }
    }

    // Volunteering
    for (let v = 0; v < volCount; v++) {
      if (createdClubActivities[v]) {
        await prisma.volunteerContribution.create({
          data: {
            clubActivityId: createdClubActivities[v].id,
            athleteId: athlete.id,
            roleName: v === 0 ? "WATER_POINT_MARSHAL" : "TIMING_ASSISTANT",
            hoursServed: 3.5,
            pointsAwarded: 25,
          },
        });
      }
    }

    // Sponsorship & Transactions
    let tier = "DEVELOPMENT";
    let annualSpend = 8000;

    if (raw.profileType === "ELITE_LOYAL") {
      tier = "ELITE";
      annualSpend = 42000;
    } else if (raw.profileType === "HIGH_PERF_LOW_RECIPROCITY") {
      tier = "PERFORMANCE";
      annualSpend = 38500; // Trigger alert!
    } else if (raw.profileType === "CONDITIONAL_SPONSORSHIP") {
      tier = "CONDITIONAL";
      annualSpend = 15000;
    }

    const sp = await prisma.sponsorship.create({
      data: {
        athleteId: athlete.id,
        currentTier: tier,
        startDate: new Date("2025-01-01"),
        status: "ACTIVE",
      },
    });

    // Record transactions
    await prisma.sponsorshipTransaction.create({
      data: {
        sponsorshipId: sp.id,
        athleteId: athlete.id,
        transactionDate: new Date("2025-07-15"),
        supportType: "RACE_ENTRY",
        amount: 2500,
        currency: "ZAR",
        raceEditionId: editionCapeTown2025.id,
        approvedBy: gmUser.id,
        notes: "Major marathon qualification entry fee.",
      },
    });

    if (annualSpend > 10000) {
      await prisma.sponsorshipTransaction.create({
        data: {
          sponsorshipId: sp.id,
          athleteId: athlete.id,
          transactionDate: new Date("2025-09-10"),
          supportType: "CASH_STIPEND",
          amount: annualSpend - 2500,
          currency: "ZAR",
          approvedBy: gmUser.id,
          notes: "Elite high-performance training stipend & footwear allocation.",
        },
      });
    }

    // If conditional, add covenants
    if (raw.profileType === "CONDITIONAL_SPONSORSHIP") {
      await prisma.sponsorshipCondition.create({
        data: {
          sponsorshipId: sp.id,
          athleteId: athlete.id,
          conditionText: "Attend at least 60% of Wednesday club time trials",
          metricType: "ATTENDANCE_PERCENT",
          targetValue: 60.0,
          currentValue: 42.0,
          deadline: new Date("2026-05-31"),
          status: "PENDING",
          responsiblePerson: coach3.name,
        },
      });

      await prisma.sponsorshipCondition.create({
        data: {
          sponsorshipId: sp.id,
          athleteId: athlete.id,
          conditionText: "Serve as volunteer marshal at 2 internal club races",
          metricType: "VOLUNTEER_COUNT",
          targetValue: 2.0,
          currentValue: 1.0,
          deadline: new Date("2026-06-30"),
          status: "PENDING",
        },
      });
    }

    // AI Coaching Recommendation
    await prisma.aIRecommendation.create({
      data: {
        athleteId: athlete.id,
        recommendationType:
          raw.profileType === "HIGH_PERF_LOW_RECIPROCITY"
            ? "SPONSORSHIP_RECIPROCITY_ALERT"
            : raw.profileType === "RISING_TALENT"
            ? "TALENT_IDENTIFICATION"
            : "COACHING_PACING",
        title:
          raw.profileType === "HIGH_PERF_LOW_RECIPROCITY"
            ? "Reciprocity Alignment Dialogue Recommended"
            : raw.profileType === "RISING_TALENT"
            ? "High Development Potential Candidate"
            : "Long Run Pacing Optimization",
        summary:
          raw.profileType === "HIGH_PERF_LOW_RECIPROCITY"
            ? "Athlete possesses elite aerobic speed but requires structured re-engagement with internal club runs."
            : "Demonstrating consistent positive trajectory across split durability and aerobic capacity.",
        factualDataJson: JSON.stringify({
          marathonSeconds,
          attendanceRate: (attendedRuns / 8) * 100,
          annualSpendZar: annualSpend,
        }),
        aiInterpretation:
          "Evidence indicates athletic capacity is progressing in line with national qualifying benchmarks.",
        status: "PROPOSED",
      },
    });
  }

  // Seed Reigning Medallions
  const siphoAth = await prisma.athlete.findUnique({ where: { athleteNumber: "SEA-001" } });
  const nomvulaAth = await prisma.athlete.findUnique({ where: { athleteNumber: "SEA-005" } });
  if (siphoAth && nomvulaAth) {
    await prisma.athleteMedallion.createMany({
      data: [
        {
          athleteId: siphoAth.id,
          awardType: "ATHLETE_OF_THE_MONTH",
          trackCategory: "COMPETITIVE",
          period: "March 2026",
          month: 3,
          year: 2026,
          title: "Athlete of the Month (March 2026) - Competitive Track",
          citation: "Conferred for an exemplary 2:18:45 marathon personal best at the Sanlam Cape Town Marathon qualifier and holding a 92.4 Athlete Performance Index (API) with zero pace degradation across all training blocks.",
          conferredBy: "Super Eagles Executive Committee & Head Coach Hendrik Coetzee",
          badgeVariant: "PLATINUM_ELITE",
          criteriaMetricsJson: JSON.stringify({
            apiScore: 92.4,
            pdiScore: 3.2,
            raceAchieved: "Cape Town Marathon Qualifier",
            raceTime: "2:18:45",
            distanceKm: 42.2,
            paceAverage: "3:17/km",
            status: "ELITE",
          }),
        },
        {
          athleteId: nomvulaAth.id,
          awardType: "ATHLETE_OF_THE_MONTH",
          trackCategory: "HEALTH_WELLNESS",
          period: "March 2026",
          month: 3,
          year: 2026,
          title: "Athlete of the Month (March 2026) - Health & Wellness Track",
          citation: "Conferred in recognition of unbroken 100% attendance at Wednesday time trials and Saturday club pack walks, logging 142.5 km of community mileage, and mentoring 4 junior walkers.",
          conferredBy: "Super Eagles Club Management & Community Wellness Directorate",
          badgeVariant: "EMERALD_WELLNESS",
          criteriaMetricsJson: JSON.stringify({
            attendancePct: 100,
            monthlyMileageKm: 142.5,
            ccliScore: 98.0,
            communitySessions: 14,
            volunteerEvents: 2,
            menteesCount: 4,
          }),
        },
        {
          athleteId: siphoAth.id,
          awardType: "ATHLETE_OF_THE_YEAR",
          trackCategory: "COMPETITIVE",
          period: "2025/2026 Season",
          year: 2026,
          title: "Athlete of the Year (2025/2026) - Competitive Gold Laurel",
          citation: "Super Eagles' highest athletic distinction. Sipho achieved a Comrades Gold Medal contention standard, maintained the club's #1 API ranking for 12 consecutive months, and anchored the senior championship relay squad.",
          conferredBy: "Super Eagles Athletics Club Annual General Assembly",
          badgeVariant: "GOLD_CHAMPION",
          criteriaMetricsJson: JSON.stringify({
            apiScore: 94.1,
            seasonPbs: 3,
            marathonPb: "2:18:45",
            ultra56kPb: "3:08:12",
            comradesSeeding: "Batch A - Green Number Contender",
          }),
        },
        {
          athleteId: nomvulaAth.id,
          awardType: "ATHLETE_OF_THE_YEAR",
          trackCategory: "HEALTH_WELLNESS",
          period: "2025/2026 Season",
          year: 2026,
          title: "Athlete of the Year (2025/2026) - Community & Wellness Laurel",
          citation: "Conferred for unparalleled commitment to club culture, leading the weekend walking initiative, organizing 6 marshal water points, and inspiring club-wide health transformation.",
          conferredBy: "Super Eagles Athletics Club Annual General Assembly",
          badgeVariant: "EMERALD_WELLNESS",
          criteriaMetricsJson: JSON.stringify({
            annualMileageKm: 1680.0,
            clubEventsMarshaled: 6,
            lifetimeLoyaltyPoints: 480,
            ccliScore: 99.2,
          }),
        },
      ],
    });
    console.log("✓ Seeded official reigning medallions (Competitive & Health/Wellness).");
  }

  console.log("✓ Seeding complete! All 20 athletes, 3 coaches, races, and transactions ready.");

  // Refresh the optional root recovery snapshot from Prisma's live SQLite file.
  try {
    if (fs.existsSync("./prisma/dev.db")) {
      fs.copyFileSync("./prisma/dev.db", "./dev.db");
      console.log("✓ Refreshed root SQLite recovery snapshot from ./prisma/dev.db");
    }
  } catch (err) {
    console.warn("Notice: Could not refresh the root SQLite recovery snapshot:", err.message);
  }
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
