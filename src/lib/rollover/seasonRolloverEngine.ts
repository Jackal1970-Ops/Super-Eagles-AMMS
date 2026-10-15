import { prisma } from "@/lib/prisma";

export interface RolloverPreviewResult {
  fromSeason: string;
  targetSeason: string;
  totalAthletes: number;
  athletesToRoll: number;
  athletesPendingRenewal: number;
  athletesExempt: number;
  categoryTransitions: Array<{
    athleteId: string;
    athleteName: string;
    currentCategory: string;
    projectedCategory: string;
    currentAge: number;
  }>;
  financialSummary: {
    totalProjectedRevenue: number;
    standardFee: number;
    youthFee: number;
    masterFee: number;
  };
}

export interface RolloverExecutionResult {
  success: boolean;
  archiveId: string;
  fromSeason: string;
  targetSeason: string;
  athletesRolled: number;
  categoriesUpdated: number;
  message: string;
  executedAt: string;
}

/**
 * Computes official Athletics South Africa (ASA) age category based on birth date and target season year
 */
export function determineAsaCategory(dateOfBirth: Date | string | null, targetSeasonYear: number): string {
  if (!dateOfBirth) return "Senior (20-39)";
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return "Senior (20-39)";
  
  const birthYear = dob.getFullYear();
  const ageInSeason = targetSeasonYear - birthYear;

  if (ageInSeason < 16) return "Junior (U16)";
  if (ageInSeason < 20) return "Junior (U20)";
  if (ageInSeason < 40) return "Senior (20-39)";
  if (ageInSeason < 50) return "Veteran (40-49)";
  if (ageInSeason < 60) return "Master (50-59)";
  return "Grandmaster (60+)";
}

/**
 * Previews what will happen during an annual season rollover without mutating data
 */
export async function previewSeasonRollover(targetSeason?: string): Promise<RolloverPreviewResult> {
  const currentYear = new Date().getFullYear();
  const defaultTargetSeason = targetSeason || `${currentYear + 1}`;
  const targetYear = parseInt(defaultTargetSeason.split("-")[0]) || currentYear + 1;
  const currentSeason = `${targetYear - 1}`;

  const athletes = await prisma.athlete.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      membershipCategory: true,
      membershipStatus: true,
    }
  });

  const categoryTransitions: RolloverPreviewResult["categoryTransitions"] = [];
  let youthFeeCount = 0;
  let masterFeeCount = 0;
  let seniorFeeCount = 0;

  for (const a of athletes) {
    const projectedCat = determineAsaCategory(a.dateOfBirth, targetYear);
    const dob = a.dateOfBirth ? new Date(a.dateOfBirth) : null;
    const currentAge = dob ? targetYear - dob.getFullYear() : 30;

    if (projectedCat !== a.membershipCategory) {
      categoryTransitions.push({
        athleteId: a.id,
        athleteName: `${a.firstName} ${a.lastName}`,
        currentCategory: a.membershipCategory || "Unassigned",
        projectedCategory: projectedCat,
        currentAge,
      });
    }

    if (projectedCat.includes("Junior")) {
      youthFeeCount++;
    } else if (projectedCat.includes("Master") || projectedCat.includes("Grandmaster")) {
      masterFeeCount++;
    } else {
      seniorFeeCount++;
    }
  }

  const standardFee = 450;
  const youthFee = 250;
  const masterFee = 350;
  const totalProjectedRevenue = (seniorFeeCount * standardFee) + (youthFeeCount * youthFee) + (masterFeeCount * masterFee);

  return {
    fromSeason: currentSeason,
    targetSeason: defaultTargetSeason,
    totalAthletes: athletes.length,
    athletesToRoll: athletes.filter(a => a.membershipStatus === "ACTIVE").length,
    athletesPendingRenewal: athletes.length,
    athletesExempt: 0,
    categoryTransitions,
    financialSummary: {
      totalProjectedRevenue,
      standardFee,
      youthFee,
      masterFee
    }
  };
}

/**
 * Executes the full annual season rollover with comprehensive snapshotting into SeasonArchive
 */
export async function executeSeasonRollover(
  targetSeason: string,
  executedBy: string = "ADMIN_ROLLOVER_ENGINE"
): Promise<RolloverExecutionResult> {
  const targetYear = parseInt(targetSeason.split("-")[0]) || (new Date().getFullYear() + 1);
  const fromSeason = `${targetYear - 1}`;

  // 1. Gather current season full snapshot
  const [athletes, payments, races] = await Promise.all([
    prisma.athlete.findMany({
      include: {
        trainingActivities: {
          take: 10,
          orderBy: { date: "desc" }
        },
        raceResults: {
          take: 5,
          orderBy: { date: "desc" }
        }
      }
    }),
    prisma.membershipPayment.findMany(),
    prisma.raceEdition.findMany({
      take: 20,
      orderBy: { year: "desc" }
    })
  ]);

  const activeAthletes = athletes.filter(a => a.membershipStatus === "ACTIVE").length;
  const totalPaidRevenue = payments
    .filter(p => p.status === "VERIFIED" || p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);

  const archiveSnapshot = {
    generatedAt: new Date().toISOString(),
    fromSeason,
    targetSeason,
    totalAthletes: athletes.length,
    activeAthletes,
    totalPaidRevenue,
    rosterSummary: athletes.map(a => ({
      id: a.id,
      name: `${a.firstName} ${a.lastName}`,
      category: a.membershipCategory,
      gender: a.gender,
      licenseNumber: a.asaLicenseNumber,
      email: a.contactEmail,
      phone: a.contactPhone
    })),
    recentRaces: races.map(r => ({
      id: r.id,
      year: r.year,
      raceId: r.raceId,
    }))
  };

  // 2. Write SeasonArchive record for each athlete or primary snapshot
  let archiveId = `ARCHIVE-${targetYear}`;
  if (athletes.length > 0) {
    const firstAthlete = athletes[0];
    const archive = await prisma.seasonArchive.create({
      data: {
        seasonYear: targetYear - 1,
        athleteId: firstAthlete.id,
        membershipCategory: firstAthlete.membershipCategory,
        membershipFeeStatus: firstAthlete.membershipFeeStatus,
        snapshotJson: JSON.stringify(archiveSnapshot),
      }
    });
    archiveId = archive.id;
  }

  // 3. Perform batch rollover on Athletes:
  let categoriesUpdated = 0;
  for (const athlete of athletes) {
    const updatedCategory = determineAsaCategory(athlete.dateOfBirth, targetYear);
    const categoryChanged = updatedCategory !== athlete.membershipCategory;
    if (categoryChanged) {
      categoriesUpdated++;
    }

    await prisma.athlete.update({
      where: { id: athlete.id },
      data: {
        membershipCategory: updatedCategory.includes("Junior") 
          ? "JUNIOR_RUNNER" 
          : updatedCategory.includes("Master") 
          ? "MASTER_RUNNER" 
          : "SENIOR_RUNNER",
        membershipFeeStatus: "PENDING",
      }
    });
  }

  // 4. Update system audit log
  try {
    await prisma.auditLog.create({
      data: {
        action: "SEASON_ROLLOVER_EXECUTED",
        entityType: "SeasonArchive",
        entityId: archiveId,
        newValuesJson: JSON.stringify({
          fromSeason,
          targetSeason,
          athletesRolled: athletes.length,
          categoriesUpdated,
          totalRevenuePreserved: totalPaidRevenue
        })
      }
    });
  } catch {
    // Non-critical
  }

  return {
    success: true,
    archiveId: archiveId,
    fromSeason,
    targetSeason,
    athletesRolled: athletes.length,
    categoriesUpdated,
    message: `Successfully executed annual rollover from Season ${fromSeason} to Season ${targetSeason}. Archived ${athletes.length} athlete records and updated ${categoriesUpdated} age categories.`,
    executedAt: new Date().toISOString()
  };
}
