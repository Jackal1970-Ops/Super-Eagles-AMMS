import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function main() {
  console.log("🦅 Seeding Super Eagles Official Medallions...");

  const sipho = await prisma.athlete.findUnique({ where: { athleteNumber: "SEA-001" } });
  const kagiso = await prisma.athlete.findUnique({ where: { athleteNumber: "SEA-002" } });
  const nomvula = await prisma.athlete.findUnique({ where: { athleteNumber: "SEA-005" } });
  const lerato = await prisma.athlete.findUnique({ where: { athleteNumber: "SEA-003" } });

  if (!sipho || !nomvula) {
    console.error("Required athletes not found in database.");
    return;
  }

  // Clear existing medallions first
  await prisma.athleteMedallion.deleteMany();

  // 1. Athlete of the Month (March 2026) - Competitive Track -> Sipho Sithole
  await prisma.athleteMedallion.create({
    data: {
      athleteId: sipho.id,
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
  });

  // 2. Athlete of the Month (March 2026) - Health & Wellness Track -> Nomvula Dlamini
  await prisma.athleteMedallion.create({
    data: {
      athleteId: nomvula.id,
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
  });

  // 3. Athlete of the Year (2025/2026 Season) - Competitive Track -> Sipho Sithole
  await prisma.athleteMedallion.create({
    data: {
      athleteId: sipho.id,
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
  });

  // 4. Athlete of the Year (2025/2026 Season) - Health & Wellness Track -> Nomvula Dlamini
  await prisma.athleteMedallion.create({
    data: {
      athleteId: nomvula.id,
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
  });

  console.log("✓ Conferred 4 reigning medallions successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
