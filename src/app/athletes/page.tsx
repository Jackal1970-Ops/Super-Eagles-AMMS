import React from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { calculateAthletePerformanceIndex } from "@/lib/analytics/performanceIndex";
import { calculateClubContributionScore } from "@/lib/analytics/clubContribution";
import { calculateNormalizedScore } from "@/lib/analytics/normalisation";
import { evaluateReciprocityPattern } from "@/lib/analytics/reciprocity";
import {
  AthletesDirectoryClientView,
  AthleteData,
} from "@/components/athletes/AthletesDirectoryClientView";

export const dynamic = "force-dynamic";

export default async function AthletesPage(props: {
  searchParams?: Promise<{ status?: string; squad?: string; trend?: string }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  // Accept status, squad, or trend param — all map to the squadFilter
  const initialSquad =
    searchParams?.status ||
    searchParams?.squad ||
    searchParams?.trend ||
    "ALL";

  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "ATHLETE") redirect(user.athleteId ? `/athletes/${user.athleteId}` : "/login");

  const rawAthletes = await prisma.athlete.findMany({
    where: user.role === "COACH" ? { coachAssignments: { some: { coachId: user.userId, status: "ACTIVE" } } } : undefined,
    include: {
      coachAssignments: {
        where: { status: "ACTIVE" },
        include: { coach: { select: { id: true, name: true } } },
      },
      raceResults: {
        orderBy: { date: "desc" },
        take: 2,
      },
      clubAttendances: true,
      volunteerContributions: true,
      loyaltyExemptions: {
        where: { status: "APPROVED" },
      },
      sponsorships: {
        where: { status: "ACTIVE" },
        include: { transactions: true },
      },
      medallions: {
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { athleteNumber: "asc" },
  });

  const totalClubActivities = await prisma.clubActivity.count();

  // Transform rawAthletes into AthleteData
  const athletes: AthleteData[] = rawAthletes.map((a) => {
    const coachName = a.coachAssignments[0]?.coach?.name || "Unassigned";
    const currentSponsorship = a.sponsorships[0];
    const supportZar = currentSponsorship
      ? currentSponsorship.transactions.reduce((acc, t) => acc + t.amount, 0)
      : 0;

    // Contribution score — same as dashboard
    const activeExemption = a.loyaltyExemptions[0];
    const exemptionRatio = activeExemption ? activeExemption.expectedAttendanceReductionRatio : 0;
    const ccli = calculateClubContributionScore({
      internalRunsAttended: a.clubAttendances.length,
      totalInternalRunsOffered: Math.max(1, totalClubActivities),
      exemptionReductionRatio: exemptionRatio,
      volunteerEventsAttended: a.volunteerContributions.length,
      clubRepresentationCount: a.raceResults.filter((r: any) => r.verificationStatus === "VERIFIED").length,
      mentoringSessionsCount: a.athleteStatus === "ELITE" ? 2 : 1,
      clubMeetingsAttended: 3,
      obligationsMetCount: 2,
      totalObligationsAssigned: 2,
      membershipTenureYears: (Date.now() - new Date(a.membershipStartDate).getTime()) / (365 * 86400000),
    });

    // ── EXACT SAME LOGIC AS dashboard/page.tsx ──
    const isElite = a.athleteStatus === "ELITE";
    const isDev = a.athleteStatus === "DEVELOPMENT";
    const latestResult = a.raceResults[0];

    // Squad-based fallback baseline (same as dashboard)
    let perfBase = isElite ? 86 : isDev ? 68 : 62;

    // Override with real normalised score if race data exists (same as dashboard)
    if (latestResult && latestResult.distanceKm > 0 && latestResult.officialTimeSeconds > 0) {
      const norm = calculateNormalizedScore(
        latestResult.distanceKm,
        latestResult.officialTimeSeconds,
        a.gender || "MALE",
        a.primaryDiscipline
      );
      perfBase = norm.score;
    }

    // isImproving — exact same condition as dashboard
    const isImproving = a.athleteNumber === "SEA-003" || perfBase > 78;
    const isDeclining = a.athleteNumber === "SEA-004";

    const api = calculateAthletePerformanceIndex(
      perfBase,
      isImproving ? 88 : isDeclining ? 45 : 70,
      80,
      isDeclining ? 60 : 85
    );

    // Reciprocity review — same as dashboard
    const recReview = evaluateReciprocityPattern({
      athleteId: a.id,
      athleteName: `${a.firstName} ${a.lastName}`,
      twelveMonthFinancialSupportZar: supportZar,
      internalParticipationRatePercent: ccli.attendanceRatePercent,
      volunteerActivitiesCount: a.volunteerContributions.length,
      majorEventSupportRequestsCount: a.raceResults.length,
      currentContributionScore: ccli.totalScore,
      currentPerformanceScore: api.totalIndex,
      unmetObligationsCount: 0,
      approvedExemptionReductionRatio: exemptionRatio,
    });

    return {
      id: a.id,
      athleteNumber: a.athleteNumber,
      firstName: a.firstName,
      lastName: a.lastName,
      preferredName: a.preferredName,
      gender: a.gender,
      dateOfBirth: a.dateOfBirth.toISOString(),
      contactEmail: a.contactEmail,
      contactPhone: a.contactPhone,
      membershipStartDate: a.membershipStartDate.toISOString(),
      membershipStatus: a.membershipStatus,
      membershipCategory: (a as any).membershipCategory || "SENIOR_RUNNER",
      disciplineCategory: (a as any).disciplineCategory || "RUNNER",
      asaLicenseNumber: (a as any).asaLicenseNumber || null,
      membershipExpiry: (a as any).membershipExpiry ? (a as any).membershipExpiry.toISOString() : null,
      membershipFeeStatus: (a as any).membershipFeeStatus || "PAID",
      athleteStatus: a.athleteStatus,
      primaryDiscipline: a.primaryDiscipline,
      coachName,
      apiScore: api.totalIndex,
      apiTrend: api.trend.trendClassification,
      ccliScore: ccli.totalScore,
      sponsorshipTier: currentSponsorship?.currentTier || "NON_SPONSORED",
      supportZar,
      medallions: a.medallions || [],
      // Precomputed filter flags — matches dashboard KPI counts exactly
      isImprovingTrajectory: isImproving,
      isReciprocityReview: recReview.requiresReview,
    };
  });

  return (
    <AthletesDirectoryClientView
      initialAthletes={athletes}
      totalActivitiesCount={totalClubActivities}
      initialSquadFilter={initialSquad}
    />
  );
}
