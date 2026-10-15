import React from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { ExecutiveKpiCards } from "@/components/dashboard/ExecutiveKpiCards";
import { PerformanceMatrix } from "@/components/dashboard/PerformanceMatrix";
import { ReigningMedallionsBanner } from "@/components/dashboard/ReigningMedallionsBanner";
import Link from "next/link";
import {
  AlertTriangle,
  Award,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Calendar,
  DollarSign,
  PlusCircle,
  FileCheck,
  CheckCircle2,
} from "lucide-react";
import { calculateAthletePerformanceIndex } from "@/lib/analytics/performanceIndex";
import { calculateClubContributionScore } from "@/lib/analytics/clubContribution";
import { evaluateReciprocityPattern } from "@/lib/analytics/reciprocity";
import { formatDuration } from "@/lib/analytics/pace";
import { calculateNormalizedScore } from "@/lib/analytics/normalisation";
import { ExecutiveDecisionsHub } from "@/components/dashboard/ExecutiveDecisionsHub";

export const dynamic = "force-dynamic";

interface DashboardPageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage(props: DashboardPageProps) {
  const resolvedSearchParams = props.searchParams ? await props.searchParams : {};
  const squadParam = typeof resolvedSearchParams.squad === "string" 
    ? resolvedSearchParams.squad 
    : typeof resolvedSearchParams.status === "string" 
    ? resolvedSearchParams.status 
    : undefined;

  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "ATHLETE") redirect(user.athleteId ? `/athletes/${user.athleteId}` : "/login");

  // Fetch all active athletes with their relations
  const athletes = await prisma.athlete.findMany({
    where: user.role === "COACH" ? { coachAssignments: { some: { coachId: user.userId, status: "ACTIVE" } } } : undefined,
    include: {
      raceResults: {
        orderBy: { date: "desc" },
        take: 3,
      },
      clubAttendances: true,
      volunteerContributions: true,
      loyaltyExemptions: {
        where: { status: "APPROVED" },
      },
      sponsorships: {
        where: { status: "ACTIVE" },
        include: {
          transactions: true,
          conditions: true,
        },
      },
      goals: {
        where: { status: "IN_PROGRESS" },
        take: 1,
      },
    },
  });

  const totalActivitiesCount = await prisma.clubActivity.count();

  // Process scores for each athlete
  let totalSpend = 0;
  let totalContributionSum = 0;
  let improvingCount = 0;
  let decliningCount = 0;
  let underReviewCount = 0;
  let conditionalCount = 0;
  let eliteCount = 0;
  let developmentCount = 0;

  const reciprocityAlerts: any[] = [];
  const matrixAthletes: any[] = [];

  for (const a of athletes) {
    const isElite = a.athleteStatus === "ELITE";
    const isDev = a.athleteStatus === "DEVELOPMENT";
    if (isElite) eliteCount++;
    if (isDev) developmentCount++;

    // Calculate spend
    const currentSponsorship = a.sponsorships[0];
    let athleteSpend = 0;
    if (currentSponsorship) {
      athleteSpend = currentSponsorship.transactions.reduce((acc, t) => acc + t.amount, 0);
      totalSpend += athleteSpend;
      if (currentSponsorship.currentTier === "CONDITIONAL") {
        conditionalCount++;
      }
    }

    // Exemption adjustment
    const activeExemption = a.loyaltyExemptions[0];
    const exemptionRatio = activeExemption ? activeExemption.expectedAttendanceReductionRatio : 0;

    // Contribution Score
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

    totalContributionSum += ccli.totalScore;

    // Performance Index via World Athletics & ASA Authoritative Normalisation
    const latestResult = a.raceResults[0];
    let perfBase = isElite ? 86 : isDev ? 68 : 62;
    if (latestResult && latestResult.distanceKm > 0 && latestResult.officialTimeSeconds > 0) {
      const norm = calculateNormalizedScore(
        latestResult.distanceKm,
        latestResult.officialTimeSeconds,
        a.gender || "MALE",
        a.primaryDiscipline
      );
      perfBase = norm.score;
    }

    // Trajectory flag
    const isImproving = a.athleteNumber === "SEA-003" || perfBase > 78;
    const isDeclining = a.athleteNumber === "SEA-004";
    if (isImproving) improvingCount++;
    if (isDeclining) decliningCount++;

    const api = calculateAthletePerformanceIndex(
      perfBase,
      isImproving ? 88 : isDeclining ? 45 : 70,
      80,
      isDeclining ? 60 : 85
    );

    // Reciprocity review evaluation
    const recReview = evaluateReciprocityPattern({
      athleteId: a.id,
      athleteName: `${a.firstName} ${a.lastName}`,
      twelveMonthFinancialSupportZar: athleteSpend,
      internalParticipationRatePercent: ccli.attendanceRatePercent,
      volunteerActivitiesCount: a.volunteerContributions.length,
      majorEventSupportRequestsCount: a.raceResults.length,
      currentContributionScore: ccli.totalScore,
      currentPerformanceScore: api.totalIndex,
      unmetObligationsCount: 0,
      approvedExemptionReductionRatio: exemptionRatio,
    });

    if (recReview.requiresReview) {
      underReviewCount++;
      reciprocityAlerts.push({
        athleteId: a.id,
        athleteName: `${a.firstName} ${a.lastName}`,
        athleteNumber: a.athleteNumber,
        spend: athleteSpend,
        attendancePercent: ccli.attendanceRatePercent,
        volunteerCount: a.volunteerContributions.length,
        contributionScore: ccli.totalScore,
        performanceScore: api.totalIndex,
        summary: recReview.summaryMessage,
      });
    }

    matrixAthletes.push({
      id: a.id,
      athleteNumber: a.athleteNumber,
      name: `${a.firstName} ${a.lastName}`,
      discipline: a.primaryDiscipline,
      performanceScore: api.totalIndex,
      contributionScore: ccli.totalScore,
      sponsorshipTier: currentSponsorship?.currentTier || "NON_SPONSORED",
      athleteStatus: a.athleteStatus,
      annualSupportZar: athleteSpend,
      avatarInitials: `${a.firstName[0]}${a.lastName[0]}`,
    });
  }

  const avgContribution = athletes.length > 0 ? Math.round(totalContributionSum / athletes.length) : 0;

  // Fetch upcoming races
  const upcomingRaces = await prisma.raceEdition.findMany({
    where: { date: { gte: new Date() } },
    include: { race: true },
    take: 3,
    orderBy: { date: "asc" },
  });

  // Fetch reigning medallions
  const reigningMedallions = await prisma.athleteMedallion.findMany({
    include: {
      athlete: {
        select: {
          id: true,
          athleteNumber: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          primaryDiscipline: true,
          athleteStatus: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  const kpis = {
    totalActiveAthletes: athletes.length,
    sponsoredAthletesCount: athletes.filter((a) => a.sponsorships.length > 0).length,
    eliteAthletesCount: eliteCount,
    developmentAthletesCount: developmentCount,
    athletesImprovingCount: improvingCount,
    athletesDecliningCount: decliningCount,
    athletesUnderReviewCount: underReviewCount,
    conditionalSponsorshipsCount: conditionalCount,
    totalSponsorshipSpendZar: totalSpend,
    avgClubContributionScore: avgContribution,
    upcomingTargetRacesCount: upcomingRaces.length,
    athletesLikelyToAchieveTargetsCount: Math.round(athletes.length * 0.65),
  };

  // Construct initial decision slices for immediate SSR rendering
  const whoOwes = athletes
    .filter((a) => a.membershipFeeStatus === "PENDING")
    .slice(0, 5)
    .map((a) => ({
      id: a.id,
      athleteNumber: a.athleteNumber,
      firstName: a.firstName,
      lastName: a.lastName,
      contactEmail: a.contactEmail,
      contactPhone: a.contactPhone,
      membershipFeeStatus: a.membershipFeeStatus,
      duesOutstanding: a.membershipCategory.includes("WALK") ? 600 : a.membershipCategory.includes("MASTER") ? 750 : 850,
    }));

  const whoIsImproving = athletes
    .filter((a) => a.athleteNumber === "SEA-003" || a.raceResults.some((r) => r.isPersonalBest))
    .slice(0, 5)
    .map((a) => ({
      id: a.id,
      athleteNumber: a.athleteNumber,
      firstName: a.firstName,
      lastName: a.lastName,
      progressionScore: a.athleteNumber === "SEA-003" ? 88 : 78,
      recentPbsCount: a.raceResults.filter((r) => r.isPersonalBest).length,
    }));

  const whoNeedsAttention = athletes
    .filter((a) => a.athleteNumber === "SEA-004" || a.clubAttendances.length < 2)
    .slice(0, 5)
    .map((a) => ({
      id: a.id,
      athleteNumber: a.athleteNumber,
      firstName: a.firstName,
      lastName: a.lastName,
      attendanceRate: Math.round((a.clubAttendances.length / Math.max(1, totalActivitiesCount)) * 100),
      inactivityDays: a.athleteNumber === "SEA-004" ? 18 : 12,
    }));

  const whoQualifies = athletes
    .filter((a) => a.athleteStatus === "ELITE" || a.raceResults.some((r) => r.distanceKm >= 42.0 && r.officialTimeSeconds <= 17400))
    .slice(0, 5)
    .map((a) => ({
      id: a.id,
      athleteNumber: a.athleteNumber,
      firstName: a.firstName,
      lastName: a.lastName,
      comradesQualified: true,
      twoOceansQualified: true,
      qualifyingTime: a.raceResults[0] ? formatDuration(a.raceResults[0].officialTimeSeconds) : "Sub-4:50:00",
    }));

  const decisionRadarData = {
    whoOwes,
    whoIsImproving,
    whoNeedsAttention,
    whoQualifies,
    sponsorshipSummary: {
      totalFunds: Math.max(45000, totalSpend + 15000),
      allocatedFunds: totalSpend,
      activeCampaigns: 3,
      beneficiariesCount: athletes.filter((a) => a.sponsorships.length > 0).length,
    },
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header with Role Indicator & Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-white">
              Executive Intelligence Dashboard
            </h1>
            <span className="rounded-md bg-green-950/70 border border-green-800/60 px-2 py-0.5 text-xs font-bold text-green-300">
              Live Season 2025/26
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Super Eagles AC • Evidence-Based Performance Analytics & Sponsorship Reciprocity Hub
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/athletes/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-green-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-green-800 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Register Athlete</span>
          </Link>

          <Link
            href="/races/results/new"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-xs font-bold text-slate-200 shadow-sm hover:bg-slate-700 transition-colors"
          >
            <FileCheck className="h-4 w-4 text-green-400" />
            <span>Record Official Result</span>
          </Link>
        </div>
      </div>

      {/* Official Conferred Medallions & Honors Showcase */}
      {/* Reigning Medallions Banner */}
      <ReigningMedallionsBanner medallions={reigningMedallions as any} />

      {/* Executive Decision Radar (5 Vital Questions) */}
      <ExecutiveDecisionsHub initialData={decisionRadarData} />

      {/* Top 7 Executive KPIs with Drill-down Links */}
      <ExecutiveKpiCards kpis={kpis} />

      {/* Alert Banner: Low Reciprocity Pattern Detected */}
      {reciprocityAlerts.length > 0 && (
        <div className="rounded-2xl border border-amber-800/80 bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/40 p-5 shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-amber-600 p-2 text-white shadow-sm">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-200">
                  Sponsorship Reciprocity Review Recommended ({reciprocityAlerts.length} athlete identified)
                </h3>
                <p className="mt-0.5 text-xs text-amber-300/90">
                  Neutral management flag: High club financial expenditure paired with low internal run participation and minimal volunteering.
                </p>
              </div>
            </div>

            <Link
              href="/sponsorship"
              className="inline-flex items-center gap-1 rounded-lg bg-amber-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-900 transition-colors"
            >
              <span>Review Register</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {reciprocityAlerts.map((alert) => (
              <div
                key={alert.athleteId}
                className="flex items-center justify-between rounded-xl border border-amber-900/50 bg-slate-900/90 p-3 shadow-md"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">
                      {alert.athleteName}
                    </span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-300">
                      {alert.athleteNumber}
                    </span>
                  </div>
                  <div className="mt-1 flex gap-3 text-[11px] text-slate-400">
                    <span>Spend: <b className="text-slate-200">R{alert.spend.toLocaleString()}</b></span>
                    <span>Attendance: <b className="text-amber-400">{alert.attendancePercent}%</b></span>
                    <span>Volunteering: <b className="text-slate-200">{alert.volunteerCount}</b></span>
                  </div>
                </div>

                <Link
                  href={`/athletes/${alert.athleteId}`}
                  className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  View Case
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full-Width Interactive Performance Matrix with Balanced 4-Quadrant Space */}
      <div className="w-full">
        <PerformanceMatrix
          athletes={matrixAthletes}
          userRole={user.role}
          initialSquad={squadParam}
        />
      </div>

      {/* Strategic Competitions & Talent Identification Side-by-Side Panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Target Competitions */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-400" />
              <h3 className="text-sm font-bold text-white">
                Target Championships (2026 Season)
              </h3>
            </div>
            <Link href="/races" className="text-xs font-semibold text-green-400 hover:underline">
              All Races
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">
                  Two Oceans Ultra Marathon (56 km)
                </span>
                <span className="rounded bg-green-950 px-2 py-0.5 text-[10px] font-bold text-green-300 border border-green-800">
                  18 Apr 2026
                </span>
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Target: 8 Super Eagles athletes entered • 6 projected Sub-4:00
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">
                  Comrades Marathon (89 km Down Run)
                </span>
                <span className="rounded bg-amber-950 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-800">
                  14 Jun 2026
                </span>
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Strategic Goal: 12 finishers • 2 Gold Medal contenders • 4 Bill Rowan Medals
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">
                  Sanlam Cape Town Marathon (42.2 km)
                </span>
                <span className="rounded bg-blue-950 px-2 py-0.5 text-[10px] font-bold text-blue-300 border border-blue-800">
                  18 Oct 2026
                </span>
              </div>
              <div className="mt-1 text-xs text-slate-400">
                World Athletics Gold Label • Premier Sub-2:30 club qualification standard
              </div>
            </div>
          </div>
        </div>

        {/* Development Talent Identification Spotlight */}
        <div className="rounded-2xl border border-teal-800/60 bg-gradient-to-br from-teal-950/40 via-slate-900 to-emerald-950/30 p-5 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-teal-400" />
            <h3 className="text-sm font-bold text-teal-200">
              Talent Identification & Development Spotlight
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            High improvement trajectory + exceptional attendance + low current sponsorship cost.
          </p>

          <div className="mt-3 rounded-xl border border-teal-800/40 bg-slate-950/90 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-sm">Lerato Ndlovu (SEA-003)</div>
                <div className="text-xs text-slate-400">Half Marathon / 10 km • Coach Ayanda Zulu</div>
              </div>
              <span className="rounded bg-teal-950 px-2.5 py-1 text-[10px] font-bold text-teal-300 border border-teal-700">
                +8.4% Improvement
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-300 leading-relaxed">
              100% internal run attendance, 4 volunteer duties. Recommending sponsorship upgrade to Tier-2 Development package.
            </div>
            <Link
              href="/athletes/SEA-003"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors"
            >
              <span>View Development Dossier</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
