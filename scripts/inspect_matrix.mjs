import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function main() {
  const athletes = await prisma.athlete.findMany({
    include: {
      raceResults: { orderBy: { date: "desc" }, take: 3 },
      clubAttendances: true,
      volunteerContributions: true,
      loyaltyExemptions: { where: { status: "APPROVED" } },
      sponsorships: { where: { status: "ACTIVE" } },
    }
  });

  const totalActivitiesCount = await prisma.clubActivity.count();
  console.log("Total athletes:", athletes.length);
  console.log("Total activities:", totalActivitiesCount);

  for (const a of athletes) {
    const isElite = a.athleteStatus === "ELITE";
    const isDev = a.athleteStatus === "DEVELOPMENT";
    const activeExemption = a.loyaltyExemptions[0];
    const exemptionRatio = activeExemption ? activeExemption.expectedAttendanceReductionRatio : 0;

    const ccli = calculateClubContributionScore({
      internalRunsAttended: a.clubAttendances.length,
      totalInternalRunsOffered: Math.max(1, totalActivitiesCount),
      exemptionReductionRatio: exemptionRatio,
      volunteerEventsAttended: a.volunteerContributions.length,
      clubRepresentationCount: a.raceResults.filter((r) => r.verificationStatus === "VERIFIED").length,
      mentoringSessionsCount: isElite ? 2 : 1,
      clubMeetingsAttended: 3,
      obligationsMetCount: 2,
      totalObligationsAssigned: 2,
      membershipTenureYears: (Date.now() - new Date(a.membershipStartDate).getTime()) / (365 * 86400000),
    });

    const latestResult = a.raceResults[0];
    let perfBase = 65;
    if (latestResult && latestResult.distanceKm > 0) {
      const paceSecondsPerKm = latestResult.officialTimeSeconds / latestResult.distanceKm;
      perfBase = Math.min(98, Math.max(42, Math.round(98 - (paceSecondsPerKm - 180) * 0.22)));
    } else {
      perfBase = isElite ? 86 : isDev ? 68 : 62;
    }

    const isImproving = a.athleteNumber === "SEA-003" || perfBase > 78;
    const isDeclining = a.athleteNumber === "SEA-004";

    const api = calculateAthletePerformanceIndex(
      perfBase,
      isImproving ? 88 : isDeclining ? 45 : 70,
      80,
      isDeclining ? 60 : 85
    );

    console.log(`${a.athleteNumber} | ${a.firstName} ${a.lastName.padEnd(15)} | Status: ${a.athleteStatus.padEnd(11)} | Perf: ${api.totalIndex} | Contrib: ${ccli.totalScore}`);
  }
}

main().finally(() => process.exit(0));
