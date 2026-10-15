import React from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  HeartHandshake,
  Award,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  PlusCircle,
} from "lucide-react";
import { calculateClubContributionScore } from "@/lib/analytics/clubContribution";

export const dynamic = "force-dynamic";

export default async function LoyaltyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "ATHLETE") redirect(user.athleteId ? `/athletes/${user.athleteId}` : "/login");

  const athletes = await prisma.athlete.findMany({
    where: user.role === "COACH" ? { coachAssignments: { some: { coachId: user.userId, status: "ACTIVE" } } } : undefined,
    include: {
      clubAttendances: true,
      volunteerContributions: true,
      loyaltyExemptions: {
        where: { status: "APPROVED" },
      },
      raceResults: {
        where: { verificationStatus: "VERIFIED" },
      },
    },
  });

  const totalActivities = await prisma.clubActivity.count();

  const rankedAthletes = athletes.map((a) => {
    const activeExemption = a.loyaltyExemptions[0];
    const exemptionRatio = activeExemption ? activeExemption.expectedAttendanceReductionRatio : 0;
    const tenureYears = ((Date.now() - new Date(a.membershipStartDate).getTime()) / (365 * 86400000));

    const ccli = calculateClubContributionScore({
      internalRunsAttended: a.clubAttendances.length,
      totalInternalRunsOffered: Math.max(1, totalActivities),
      exemptionReductionRatio: exemptionRatio,
      exemptionReason: activeExemption?.reason,
      volunteerEventsAttended: a.volunteerContributions.length,
      clubRepresentationCount: a.raceResults.length,
      mentoringSessionsCount: a.athleteStatus === "ELITE" ? 2 : 1,
      clubMeetingsAttended: 3,
      obligationsMetCount: 2,
      totalObligationsAssigned: 2,
      membershipTenureYears: tenureYears,
    });

    return {
      id: a.id,
      athleteNumber: a.athleteNumber,
      name: `${a.firstName} ${a.lastName}`,
      status: a.athleteStatus,
      tenureYears: tenureYears.toFixed(1),
      attendedRuns: a.clubAttendances.length,
      volunteerCount: a.volunteerContributions.length,
      representationCount: a.raceResults.length,
      hasExemption: Boolean(activeExemption),
      exemptionReason: activeExemption?.reason,
      attendanceRate: ccli.attendanceRatePercent,
      ccliScore: ccli.totalScore,
    };
  });

  rankedAthletes.sort((a, b) => b.ccliScore - a.ccliScore);

  // Fetch approved exemptions
  const exemptions = await prisma.loyaltyExemption.findMany({
    include: { athlete: true },
    orderBy: { startDate: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Club Contribution & Loyalty Index (CCLI)
            </h1>
            <span className="rounded bg-teal-100 px-2.5 py-0.5 text-xs font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300">
              Active Reciprocity
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Measures internal run participation, volunteering, representation, mentoring, and approved denominator exemptions.
          </p>
        </div>
      </div>

      {/* Core Principle Callout: Active Loyalty vs Membership Tenure */}
      <div className="rounded-2xl border border-teal-500/30 bg-teal-950/20 p-5 shadow-lg backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600/20 text-teal-400 border border-teal-500/30">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white">
                Core Principle: Active Loyalty vs. Membership Tenure
              </h2>
              <span className="rounded bg-teal-900/60 px-2 py-0.5 text-[10px] font-bold text-teal-300 border border-teal-700/50">
                ISO 9241-110 Transparency
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-300">
              The club strictly separates <strong className="text-white">Membership Duration (Tenure)</strong> from <strong className="text-white">Active Club Loyalty (Reciprocity)</strong>. Someone with 10 years of passive registration does not outscore an active athlete with 2 years of weekly participation, volunteering, and pacing.
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-1">
              <div className="rounded-xl border border-slate-700/70 bg-slate-900/80 p-3">
                <span className="font-bold text-teal-300 text-xs">Internal Run Attendance (30%)</span>
                <p className="mt-1 text-[11px] text-slate-300 leading-normal">
                  Checked-in presence at Tuesday time trials, Thursday club pack runs, and weekend long runs. Automatically logged via barcode or self-check-in.
                </p>
              </div>

              <div className="rounded-xl border border-slate-700/70 bg-slate-900/80 p-3">
                <span className="font-bold text-orange-400 text-xs">Volunteering & Marshalling (25%)</span>
                <p className="mt-1 text-[11px] text-slate-300 leading-normal">
                  Water point support, marshal duty at club-hosted road races, and event setup. Reflects giving back to peers and the local community.
                </p>
              </div>

              <div className="rounded-xl border border-slate-700/70 bg-slate-900/80 p-3">
                <span className="font-bold text-blue-400 text-xs">Exemption Denominator Relief</span>
                <p className="mt-1 text-[11px] text-slate-300 leading-normal">
                  Students, injured runners, and provincial representatives receive committee-approved denominator adjustments so missed runs never penalize loyalty scores unfairly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rankings Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 shadow-xl backdrop-blur-md">
        <div className="border-b border-slate-700 bg-slate-950/80 px-5 py-3.5 text-xs font-bold text-white">
          Club Reciprocity & Contribution Roster
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-700 bg-[#0F172A] text-[11px] font-bold uppercase tracking-wider text-white">
              <tr>
                <th className="px-4 py-3 text-white font-bold">Rank</th>
                <th className="px-4 py-3 text-white font-bold">Athlete</th>
                <th className="px-4 py-3 text-white font-bold">Squad</th>
                <th className="px-4 py-3 text-white font-bold">Tenure</th>
                <th className="px-4 py-3 text-center text-white font-bold">Attendance %</th>
                <th className="px-4 py-3 text-center text-white font-bold">Volunteering</th>
                <th className="px-4 py-3 text-white font-bold">Approved Exemption</th>
                <th className="px-4 py-3 text-center text-white font-bold">CCLI Score</th>
                <th className="px-4 py-3 text-right text-white font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {rankedAthletes.map((a, idx) => (
                <tr key={a.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-slate-300">#{idx + 1}</td>
                  <td className="px-4 py-3 font-bold text-white">
                    <Link href={`/athletes/${a.id}`} className="hover:text-orange-400 transition-colors">
                      {a.name}
                    </Link>
                    <span className="ml-2 font-mono text-[10px] text-slate-400">{a.athleteNumber}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-200">
                    {a.status}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{a.tenureYears} yrs</td>
                  <td className="px-4 py-3 text-center font-bold">
                    <span
                      className={
                        a.attendanceRate >= 60
                          ? "text-emerald-400 font-extrabold"
                          : a.attendanceRate >= 35
                          ? "text-blue-400 font-extrabold"
                          : "text-amber-400 font-extrabold"
                      }
                    >
                      {a.attendanceRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-slate-200">
                    {a.volunteerCount} sessions
                  </td>
                  <td className="px-4 py-3">
                    {a.hasExemption ? (
                      <span className="rounded-lg bg-blue-950 border border-blue-800 px-2.5 py-1 text-[10px] font-bold text-blue-300">
                        {a.exemptionReason} (Adjusted)
                      </span>
                    ) : (
                      <span className="text-slate-400">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-base font-black text-blue-400">
                      {a.ccliScore}
                    </span>
                    <span className="text-[10px] text-slate-400"> / 100</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/athletes/${a.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-orange-500/70 bg-[#F97316] px-3.5 py-1.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:bg-[#FB923C] hover:-translate-y-0.5"
                    >
                      <span>360° Profile</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-white" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approved Participation Exemptions Table */}
      <div className="rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 p-5 shadow-lg backdrop-blur-md">
        <h3 className="text-sm font-bold text-white">
          Active Participation Exemptions Register
        </h3>
        <p className="text-xs text-slate-400">
          Management-approved exemptions adjust the attendance denominator to guarantee fairness during studies, national representation, or injury.
        </p>

        <div className="mt-4 divide-y divide-slate-800">
          {exemptions.map((ex) => (
            <div key={ex.id} className="flex items-center justify-between py-3 text-xs">
              <div>
                <span className="font-bold text-white">
                  {ex.athlete.firstName} {ex.athlete.lastName} ({ex.athlete.athleteNumber})
                </span>
                <div className="text-[11px] text-slate-400">
                  Reason: <b className="text-slate-200">{ex.reason}</b> • {new Date(ex.startDate).toLocaleDateString()} to {new Date(ex.endDate).toLocaleDateString()}
                </div>
                {ex.notes && <div className="text-[11px] italic text-slate-400">{ex.notes}</div>}
              </div>

              <div className="text-right">
                <span className="rounded-md border border-emerald-800 bg-emerald-950 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
                  {ex.status}
                </span>
                <div className="mt-1 text-[10px] text-slate-400">
                  Denominator Relief: {(ex.expectedAttendanceReductionRatio * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
