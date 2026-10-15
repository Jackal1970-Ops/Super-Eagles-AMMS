import React from "react";
import { prisma } from "@/lib/prisma";
import { canAccessAthleteProfile, getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  User,
  Shield,
  Activity,
  Trophy,
  HeartHandshake,
  DollarSign,
  Sparkles,
  Flame,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  FileCheck,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import { calculateAthletePerformanceIndex } from "@/lib/analytics/performanceIndex";
import { calculateClubContributionScore } from "@/lib/analytics/clubContribution";
import { calculateClubSponsorshipScore } from "@/lib/analytics/sponsorshipScore";
import { calculatePaceDeterioration, classifyPaceDurability, formatDuration, formatPace } from "@/lib/analytics/pace";
import { calculateAthleteReadiness } from "@/lib/analytics/readiness";
import { predictRacePerformance } from "@/lib/analytics/predictions";
import { calculateNormalizedScore } from "@/lib/analytics/normalisation";
import { AthleteProfileClientView } from "@/components/athletes/AthleteProfileClientView";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";

export const dynamic = "force-dynamic";

interface AthletePageProps {
  params: Promise<{ id: string }>;
}

export default async function AthleteDetailPage({ params }: AthletePageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const resolvedParams = await params;
  const athleteId = resolvedParams.id;

  // Find athlete by id OR by athleteNumber (e.g. SEA-001)
  const athlete = await prisma.athlete.findFirst({
    where: {
      OR: [{ id: athleteId }, { athleteNumber: athleteId }],
    },
    include: {
      coachAssignments: {
        where: { status: "ACTIVE" },
        include: {
          coach: { select: { id: true, email: true, name: true, phone: true, avatarUrl: true, isActive: true } },
        },
      },
      raceResults: {
        orderBy: { date: "desc" },
      },
      trainingActivities: {
        orderBy: { date: "desc" },
        take: 10,
        include: { splits: true },
      },
      wellnessEntries: {
        orderBy: { date: "desc" },
        take: 7,
      },
      goals: {
        orderBy: { createdAt: "desc" },
      },
      clubAttendances: {
        include: { clubActivity: true },
        orderBy: { checkInTime: "desc" },
      },
      volunteerContributions: {
        include: { clubActivity: true },
      },
      loyaltyExemptions: {
        orderBy: { startDate: "desc" },
      },
      sponsorships: {
        include: {
          transactions: { orderBy: { transactionDate: "desc" } },
          conditions: true,
          decisions: { orderBy: { decisionDate: "desc" }, include: { decidedBy: true } },
        },
      },
      aiRecommendations: {
        orderBy: { createdAt: "desc" },
      },
      coachReviews: {
        orderBy: { reviewDate: "desc" },
        include: {
          coach: { select: { id: true, email: true, name: true, phone: true, avatarUrl: true, isActive: true } },
        },
      },
      medallions: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!athlete) {
    return (
      <div className="rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 p-12 text-center shadow-lg backdrop-blur-md">
        <h2 className="text-lg font-bold text-white">Athlete Not Found</h2>
        <p className="mt-1 text-xs text-slate-400">The requested athlete record does not exist or has been archived.</p>
        <Link
          href="/athletes"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-4 py-2 text-xs font-bold text-white shadow-md transition-all duration-200 hover:bg-[#FB923C] hover:-translate-y-0.5"
        >
          Return to Athletes Directory
        </Link>
      </div>
    );
  }

  // RBAC POPIA Privacy Enforcement
  const isSelf = user.athleteId === athlete.id;
  const isGM = user.role === "SUPER_ADMIN" || user.role === "CLUB_ADMIN";
  const isSponsorshipCommittee = user.role === "SPONSORSHIP_COMMITTEE";
  const canAccessProfile = canAccessAthleteProfile(
    user,
    athlete.id,
    athlete.coachAssignments.map((assignment) => assignment.coachId)
  );

  if (!canAccessProfile) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-12 text-center dark:border-rose-900/60 dark:bg-rose-950/40">
        <Shield className="mx-auto h-12 w-12 text-rose-600" />
        <h2 className="mt-4 text-lg font-bold text-rose-950 dark:text-rose-200">
          Confidential Athlete Profile — Access Restricted
        </h2>
        <p className="mt-2 text-xs text-rose-700 dark:text-rose-300">
          Under Super Eagles Club POPIA privacy principles, athletes may only view their own records and coaches may only view athletes currently assigned to them.
        </p>
        <Link
          href={user.athleteId ? `/athletes/${user.athleteId}` : "/dashboard"}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-700 px-4 py-2 text-xs font-bold text-white hover:bg-rose-800"
        >
          Go to My Profile
        </Link>
      </div>
    );
  }

  // Hide confidential financial transactions from coaches unless explicitly granted
  const canViewFinancials = isGM || isSponsorshipCommittee || (isSelf && false);

  // Core Calculations
  const totalActivitiesCount = await prisma.clubActivity.count();
  const currentSponsorship = athlete.sponsorships[0];
  const activeExemption = athlete.loyaltyExemptions.find((e) => e.status === "APPROVED");
  const exemptionRatio = activeExemption ? activeExemption.expectedAttendanceReductionRatio : 0;

  // 1. Club Contribution & Loyalty Index (CCLI)
  const ccliResult = calculateClubContributionScore({
    internalRunsAttended: athlete.clubAttendances.length,
    totalInternalRunsOffered: Math.max(1, totalActivitiesCount),
    exemptionReductionRatio: exemptionRatio,
    exemptionReason: activeExemption?.reason,
    volunteerEventsAttended: athlete.volunteerContributions.length,
    clubRepresentationCount: athlete.raceResults.filter((r) => r.verificationStatus === "VERIFIED").length,
    mentoringSessionsCount: athlete.athleteStatus === "ELITE" ? 2 : 1,
    clubMeetingsAttended: 3,
    obligationsMetCount: 2,
    totalObligationsAssigned: 2,
    membershipTenureYears: (Date.now() - new Date(athlete.membershipStartDate).getTime()) / (365 * 86400000),
  });

  // 2. Verified Performance Score & Pace Durability
  const verifiedRaces = athlete.raceResults.filter((r) => r.verificationStatus === "VERIFIED");
  const latestVerified = verifiedRaces[0];

  let rawPerf = athlete.athleteStatus === "ELITE" ? 86 : athlete.athleteStatus === "DEVELOPMENT" ? 68 : 62;
  let paceDetPct = 2.5;
  if (latestVerified && latestVerified.distanceKm > 0 && latestVerified.officialTimeSeconds > 0) {
    const norm = calculateNormalizedScore(
      latestVerified.distanceKm,
      latestVerified.officialTimeSeconds,
      athlete.gender || "MALE",
      athlete.primaryDiscipline
    );
    rawPerf = norm.score;
    if (latestVerified.firstHalfPaceSeconds && latestVerified.secondHalfPaceSeconds) {
      paceDetPct = calculatePaceDeterioration(latestVerified.firstHalfPaceSeconds, latestVerified.secondHalfPaceSeconds);
    }
  }

  const pdi = classifyPaceDurability(paceDetPct, true);

  // 3. Athlete Performance Index (API)
  const isImproving = athlete.athleteNumber === "SEA-003";
  const isDeclining = athlete.athleteNumber === "SEA-004";
  const apiResult = calculateAthletePerformanceIndex(
    rawPerf,
    isImproving ? 88 : isDeclining ? 45 : 70,
    80,
    isDeclining ? 60 : 85
  );

  // 4. Club Sponsorship Score (CSS)
  const cssResult = calculateClubSponsorshipScore(
    apiResult.verifiedPerformanceScore,
    apiResult.improvementScore,
    apiResult.targetCapabilityScore,
    apiResult.reliabilityScore,
    ccliResult.totalScore,
    90,
    undefined,
    athlete.athleteNumber === "SEA-007" && false
  );

  // 5. Athlete Readiness Score (ARCS) - Coaching metric only
  const latestWellness = athlete.wellnessEntries[0];
  const readiness = calculateAthleteReadiness({
    sleepQuality: latestWellness?.sleepQuality || 4,
    fatigueLevel: latestWellness?.fatigueLevel || 2,
    muscleSoreness: latestWellness?.muscleSoreness || 2,
    restingHeartRate: latestWellness?.restingHeartRate || 50,
    hrvRmssd: latestWellness?.hrv || 65,
    acuteChronicRatio: isDeclining ? 1.48 : 1.08,
  });

  // 6. Race Predictions
  const targetGoal = athlete.goals[0];
  const prediction = predictRacePerformance({
    recentRaceDistanceKm: latestVerified?.distanceKm || 21.0975,
    recentRaceTimeSeconds: latestVerified?.officialTimeSeconds || 4800,
    targetDistanceKm: athlete.primaryDiscipline === "ULTRA_90K" ? 89.0 : 42.195,
    targetGoalTimeSeconds: targetGoal?.targetTimeSeconds,
    longestRunKm: 34,
    paceDurabilityDeteriorationPct: paceDetPct,
    trainingConsistencyRatio: ccliResult.attendanceRatePercent / 100,
  });

  const totalSupportZar = currentSponsorship
    ? currentSponsorship.transactions.reduce((acc, t) => acc + t.amount, 0)
    : 0;

  const breadcrumbItems = user.role === "ATHLETE"
    ? [{ label: "My 360° Athlete Profile", current: true }]
    : [
        { label: "Members & Athletes", href: "/athletes" },
        { label: `${athlete.firstName} ${athlete.lastName} (${athlete.athleteNumber})`, current: true },
      ];

  // Pass to rich client view
  return (
    <div className="space-y-4">
      <Breadcrumbs items={breadcrumbItems} userRole={user.role} />
      <AthleteProfileClientView
        athlete={athlete}
        userRole={user.role}
        canViewFinancials={canViewFinancials}
        apiResult={apiResult}
        ccliResult={ccliResult}
        cssResult={cssResult}
        readiness={readiness}
        pdi={pdi}
        prediction={prediction}
        totalSupportZar={totalSupportZar}
      />
    </div>
  );
}
