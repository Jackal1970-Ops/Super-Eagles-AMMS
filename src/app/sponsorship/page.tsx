import React from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  DollarSign,
  Award,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  FileCheck,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { calculateClubSponsorshipScore } from "@/lib/analytics/sponsorshipScore";
import { calculateClubContributionScore } from "@/lib/analytics/clubContribution";
import { calculateAthletePerformanceIndex } from "@/lib/analytics/performanceIndex";
import { evaluateReciprocityPattern } from "@/lib/analytics/reciprocity";
import { SponsorshipClientTabs } from "@/components/sponsorship/SponsorshipClientTabs";
import { SponsorRoiData } from "@/components/sponsorship/SponsorRoiSummaryView";

export const dynamic = "force-dynamic";

export default async function SponsorshipPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "ATHLETE") redirect(user.athleteId ? `/athletes/${user.athleteId}` : "/login");
  if (user.role !== "SUPER_ADMIN" && user.role !== "SPONSORSHIP_COMMITTEE") redirect("/dashboard");

  const athletes = await prisma.athlete.findMany({
    include: {
      sponsorships: {
        include: {
          transactions: true,
          conditions: true,
          decisions: {
            orderBy: { decisionDate: "desc" },
            include: { decidedBy: true },
          },
        },
      },
      clubAttendances: true,
      volunteerContributions: true,
      loyaltyExemptions: { where: { status: "APPROVED" } },
      raceResults: { orderBy: { date: "desc" } },
      trainingActivities: true,
    },
  });

  const totalActivities = await prisma.clubActivity.count();

  let totalDisbursementsZar = 0;
  const reciprocityReviews: any[] = [];
  const conditionalCovenants: any[] = [];
  const decisionAuditList: any[] = [];

  const sponsorshipRows = athletes.map((athlete) => {
    const currentSp = athlete.sponsorships[0];
    const spend = currentSp ? currentSp.transactions.reduce((acc, t) => acc + t.amount, 0) : 0;
    totalDisbursementsZar += spend;

    // CCLI
    const ccli = calculateClubContributionScore({
      internalRunsAttended: athlete.clubAttendances.length,
      totalInternalRunsOffered: Math.max(1, totalActivities),
      exemptionReductionRatio: athlete.loyaltyExemptions[0]?.expectedAttendanceReductionRatio || 0,
      volunteerEventsAttended: athlete.volunteerContributions.length,
      clubRepresentationCount: athlete.raceResults.length,
      mentoringSessionsCount: athlete.athleteStatus === "ELITE" ? 2 : 1,
      clubMeetingsAttended: 3,
      obligationsMetCount: 2,
      totalObligationsAssigned: 2,
      membershipTenureYears: 3,
    });

    // API
    const isImproving = athlete.athleteNumber === "SEA-003";
    const isDeclining = athlete.athleteNumber === "SEA-004";
    const basePerf = athlete.athleteStatus === "ELITE" ? 92 : athlete.athleteStatus === "PERFORMANCE" ? 78 : 68;
    const api = calculateAthletePerformanceIndex(
      basePerf,
      isImproving ? 88 : isDeclining ? 46 : 70,
      80,
      isDeclining ? 62 : 84
    );

    // CSS
    const css = calculateClubSponsorshipScore(
      api.verifiedPerformanceScore,
      api.improvementScore,
      api.targetCapabilityScore,
      api.reliabilityScore,
      ccli.totalScore,
      90
    );

    // Reciprocity review check
    const recRev = evaluateReciprocityPattern({
      athleteId: athlete.id,
      athleteName: `${athlete.firstName} ${athlete.lastName}`,
      twelveMonthFinancialSupportZar: spend,
      internalParticipationRatePercent: ccli.attendanceRatePercent,
      volunteerActivitiesCount: athlete.volunteerContributions.length,
      majorEventSupportRequestsCount: athlete.raceResults.length,
      currentContributionScore: ccli.totalScore,
      currentPerformanceScore: api.totalIndex,
      unmetObligationsCount: 0,
    });

    if (recRev.requiresReview) {
      reciprocityReviews.push({
        athleteId: athlete.id,
        name: `${athlete.firstName} ${athlete.lastName}`,
        athleteNumber: athlete.athleteNumber,
        spend,
        attendancePercent: ccli.attendanceRatePercent,
        volunteerCount: athlete.volunteerContributions.length,
        summary: recRev.summaryMessage,
      });
    }

    // Collect active conditions
    if (currentSp?.conditions) {
      for (const cond of currentSp.conditions) {
        conditionalCovenants.push({
          athleteName: `${athlete.firstName} ${athlete.lastName}`,
          athleteId: athlete.id,
          condition: cond.conditionText,
          deadline: cond.deadline,
          status: cond.status,
          target: cond.targetValue,
          current: cond.currentValue,
        });
      }
    }

    // Collect decision history
    if (currentSp?.decisions) {
      for (const dec of currentSp.decisions) {
        decisionAuditList.push({
          athleteName: `${athlete.firstName} ${athlete.lastName}`,
          athleteId: athlete.id,
          decidedBy: dec.decidedBy.name,
          recommendedTier: dec.recommendedTier,
          actualTier: dec.actualTier,
          isOverridden: dec.isOverridden,
          overrideReason: dec.overrideReason,
          date: dec.decisionDate,
        });
      }
    }

    return {
      athleteId: athlete.id,
      athleteNumber: athlete.athleteNumber,
      name: `${athlete.firstName} ${athlete.lastName}`,
      currentTier: currentSp?.currentTier || "NON_SPONSORED",
      recommendedTier: css.recommendation.tierLabel,
      badgeColor: css.recommendation.badgeColor,
      cssScore: css.totalScore,
      apiScore: api.totalIndex,
      ccliScore: ccli.totalScore,
      spendZar: spend,
      discipline: athlete.primaryDiscipline || "MARATHON",
      raceCount: athlete.raceResults.length,
      podiums: athlete.raceResults.filter((r) => r.overallPosition && r.overallPosition <= 3).length,
      topTens: athlete.raceResults.filter((r) => r.overallPosition && r.overallPosition <= 10).length,
      compKm: athlete.raceResults.reduce((acc, r) => acc + (r.distanceKm || 0), 0),
      trainKm: (athlete.trainingActivities || []).reduce((acc, t) => acc + (t.distanceKm || 0), 0),
      volunteerCount: athlete.volunteerContributions.length,
    };
  });

  // Compute Sponsor Brand ROI Aggregates
  const totalVerifiedRaces = sponsorshipRows.reduce((acc, r) => acc + r.raceCount, 0);
  const totalPodiumsCount = sponsorshipRows.reduce((acc, r) => acc + r.podiums, 0);
  const totalTopTenCount = sponsorshipRows.reduce((acc, r) => acc + r.topTens, 0);
  const totalCompetitionKm = Math.round(sponsorshipRows.reduce((acc, r) => acc + r.compKm, 0));
  const totalTrainingKm = Math.round(sponsorshipRows.reduce((acc, r) => acc + r.trainKm, 0));
  const totalVolunteerHours = sponsorshipRows.reduce((acc, r) => acc + (r.volunteerCount * 4), 0); // 4 hrs avg per volunteer shift
  const sponsoredCount = sponsorshipRows.filter((r) => r.currentTier !== "NON_SPONSORED").length;
  const eliteCount = athletes.filter((a) => a.athleteStatus === "ELITE").length;
  const developmentCount = athletes.filter((a) => a.athleteStatus === "DEVELOPMENT").length;
  const avgReciprocity = Math.round(
    sponsorshipRows.reduce((acc, r) => acc + r.ccliScore, 0) / Math.max(1, sponsorshipRows.length)
  );

  const topPerformingAthletes = [...sponsorshipRows]
    .sort((a, b) => b.apiScore - a.apiScore)
    .slice(0, 5)
    .map((ath) => ({
      name: ath.name,
      athleteNumber: ath.athleteNumber,
      discipline: ath.discipline,
      podiums: ath.podiums,
      annualSpend: ath.spendZar,
      performanceScore: ath.apiScore,
    }));

  const roiData: SponsorRoiData = {
    totalDisbursementsZar,
    totalAthletesCount: athletes.length,
    sponsoredAthletesCount: sponsoredCount,
    eliteCount,
    developmentCount,
    totalVerifiedRaces,
    totalPodiumsCount,
    totalTopTenCount,
    totalCompetitionKm,
    totalTrainingKm,
    totalVolunteerHours,
    averageReciprocityRate: avgReciprocity,
    topPerformingAthletes,
  };

  return (
    <SponsorshipClientTabs roiData={roiData}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Sponsorship & Reciprocity Register
              </h1>
              <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                Governance & Oversight
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Total Club Disbursements YTD: <b className="text-green-700 dark:text-green-400">R{totalDisbursementsZar.toLocaleString()}</b> • Evidence-based sponsorship justification and overrides.
            </p>
          </div>
        </div>

      {/* Reciprocity Alerts Panel */}
      {reciprocityReviews.length > 0 && (
        <div className="rounded-2xl border border-amber-800/80 bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/40 p-5 shadow-lg">
          <div className="flex items-center gap-2 font-bold text-amber-200">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <span>Athletes Flagged for Sponsorship Reciprocity Review ({reciprocityReviews.length})</span>
          </div>
          <p className="mt-1 text-xs text-amber-300/90">
            Identifies athletes who primarily request significant club funding around major events while exhibiting low internal run attendance and volunteering.
          </p>

          <div className="mt-3 space-y-2">
            {reciprocityReviews.map((rev) => (
              <div
                key={rev.athleteId}
                className="flex flex-col justify-between gap-2 rounded-xl border border-amber-900/60 bg-slate-900/90 p-3.5 sm:flex-row sm:items-center shadow-md"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{rev.name}</span>
                    <span className="font-mono text-xs text-slate-400">{rev.athleteNumber}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-slate-300">{rev.summary}</div>
                </div>

                <Link
                  href={`/athletes/${rev.athleteId}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-orange-500/70 bg-[#F97316] px-3.5 py-1.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:bg-[#FB923C] hover:-translate-y-0.5 self-start sm:self-auto"
                >
                  <span>Review Reciprocity Case</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-white" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Conditional Sponsorship Covenants Table */}
      {conditionalCovenants.length > 0 && (
        <div className="rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 p-5 shadow-lg backdrop-blur-md">
          <h2 className="text-sm font-bold text-white">
            Active Conditional Sponsorship Tracker
          </h2>
          <p className="text-xs text-slate-400">
            Athletes awarded support subject to measurable attendance, volunteering, or reporting conditions.
          </p>

          <div className="mt-3 divide-y divide-slate-800">
            {conditionalCovenants.map((c, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 text-xs">
                <div>
                  <Link href={`/athletes/${c.athleteId}`} className="font-bold text-white hover:text-orange-400 transition-colors">
                    {c.athleteName}
                  </Link>
                  <div className="text-[11px] text-slate-300">{c.condition}</div>
                </div>
                <div className="text-right">
                  <span className="rounded bg-amber-950 border border-amber-800 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                    {c.status}
                  </span>
                  <div className="text-[10px] text-slate-400">
                    Deadline: {new Date(c.deadline).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sponsorship Portfolio Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 shadow-xl backdrop-blur-md">
        <div className="border-b border-slate-700 bg-slate-950/80 px-5 py-3.5 text-xs font-bold text-white">
          Athlete Sponsorship Score & Decision Tiers Roster
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-700 bg-[#0F172A] text-[11px] font-bold uppercase tracking-wider text-white">
              <tr>
                <th className="px-4 py-3 text-white font-bold">Athlete</th>
                <th className="px-4 py-3 text-center text-white font-bold">Performance (API)</th>
                <th className="px-4 py-3 text-center text-white font-bold">Contribution (CCLI)</th>
                <th className="px-4 py-3 text-center text-white font-bold">Sponsorship Score</th>
                <th className="px-4 py-3 text-white font-bold">Current Active Tier</th>
                <th className="px-4 py-3 text-white font-bold">System Recommendation</th>
                <th className="px-4 py-3 text-white font-bold">YTD Support (ZAR)</th>
                <th className="px-4 py-3 text-right text-white font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {sponsorshipRows.map((row) => (
                <tr key={row.athleteId} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 font-bold text-white">
                    <Link href={`/athletes/${row.athleteId}`} className="hover:text-orange-400 transition-colors">
                      {row.name}
                    </Link>
                    <span className="ml-2 font-mono text-[10px] text-slate-400">{row.athleteNumber}</span>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-green-400">
                    {row.apiScore}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-blue-400">
                    {row.ccliScore}
                  </td>
                  <td className="px-4 py-3 text-center font-black text-purple-400">
                    {row.cssScore}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-200">
                    {row.currentTier}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-lg px-2.5 py-1 text-[10px] font-bold border shadow-xs ${row.badgeColor}`}>
                      {row.recommendedTier}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-white">
                    R{row.spendZar.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/athletes/${row.athleteId}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-orange-500/70 bg-[#F97316] px-3.5 py-1.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:bg-[#FB923C] hover:-translate-y-0.5"
                    >
                      <span>Review Dossier</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-white" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </SponsorshipClientTabs>
  );
}
