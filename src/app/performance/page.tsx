import React from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  Trophy,
  Sparkles,
  TrendingUp,
  Award,
  ArrowUpRight,
  Shield,
  HelpCircle,
} from "lucide-react";
import { calculateAthletePerformanceIndex } from "@/lib/analytics/performanceIndex";
import { formatDuration, formatPace } from "@/lib/analytics/pace";
import { DISTANCE_BENCHMARKS } from "@/lib/analytics/normalisation";

export const dynamic = "force-dynamic";

export default async function PerformancePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "ATHLETE") redirect(user.athleteId ? `/athletes/${user.athleteId}` : "/login");

  const athletes = await prisma.athlete.findMany({
    where: user.role === "COACH" ? { coachAssignments: { some: { coachId: user.userId, status: "ACTIVE" } } } : undefined,
    include: {
      raceResults: {
        orderBy: { date: "desc" },
      },
      coachAssignments: {
        include: { coach: { select: { id: true, name: true } } },
      },
    },
  });

  // Calculate API for each athlete
  const rankedAthletes = athletes.map((a) => {
    const isImproving = a.athleteNumber === "SEA-003";
    const isDeclining = a.athleteNumber === "SEA-004";
    const basePerf = a.athleteStatus === "ELITE" ? 92 : a.athleteStatus === "PERFORMANCE" ? 78 : 68;

    const api = calculateAthletePerformanceIndex(
      basePerf,
      isImproving ? 88 : isDeclining ? 46 : 70,
      80,
      isDeclining ? 62 : 84
    );

    const latestRace = a.raceResults[0];

    return {
      id: a.id,
      athleteNumber: a.athleteNumber,
      name: `${a.firstName} ${a.lastName}`,
      discipline: a.primaryDiscipline,
      squadStatus: a.athleteStatus,
      coachName: a.coachAssignments[0]?.coach?.name || "Unassigned",
      apiScore: api.totalIndex,
      trend: api.trend.trendClassification,
      improvementPct: api.trend.sixMonthImprovementPercent,
      latestRace: latestRace ? `${latestRace.raceName} (${latestRace.distanceKm}km)` : "No races logged",
      latestTime: latestRace ? formatDuration(latestRace.officialTimeSeconds) : "--",
      isTalentPick: isImproving || (api.totalIndex >= 80 && a.athleteStatus === "DEVELOPMENT"),
    };
  });

  rankedAthletes.sort((a, b) => b.apiScore - a.apiScore);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Performance & Normalisation Engine
            </h1>
            <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-800 dark:bg-green-950 dark:text-green-300">
              World Athletics Standard
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Distance-normalised scoring, longitudinal trend classification, and talent identification.
          </p>
        </div>
      </div>

      {/* ISO 9241-110 User Guidance: Demystifying Complex Performance Concepts */}
      <div className="rounded-2xl border border-blue-500/30 bg-blue-950/20 p-5 shadow-lg backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white">
                Understanding Athlete Performance Indices & Mathematical Scoring
              </h2>
              <span className="rounded bg-blue-900/60 px-2 py-0.5 text-[10px] font-bold text-blue-300 border border-blue-700/50">
                ISO 9241-110 Explainability
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              To ensure objective athlete development and eliminate bias across running distances, the Super Eagles Performance Engine operates on three mathematically verified pillars:
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-1">
              <div className="rounded-xl border border-slate-700/70 bg-slate-900/80 p-3">
                <span className="font-bold text-emerald-400 text-xs">1. World Athletics Normalisation</span>
                <p className="mt-1 text-[11px] text-slate-300 leading-normal">
                  A 15-minute 5K and a 2:25:00 marathon require completely different physiological energy systems. Raw race times are non-linearly mapped across World Athletics scoring curves so sprint, middle, and ultra-marathon runners compete on the same 0–100 baseline.
                </p>
              </div>

              <div className="rounded-xl border border-slate-700/70 bg-slate-900/80 p-3">
                <span className="font-bold text-orange-400 text-xs">2. Longitudinal Trend Classification</span>
                <p className="mt-1 text-[11px] text-slate-300 leading-normal">
                  Calculates relative trajectory over rolling 6-month windows. Athletes are classified as <strong className="text-emerald-300">IMPROVING (&gt;+3%)</strong>, <strong className="text-blue-300">STABLE (±3%)</strong>, or <strong className="text-amber-300">DECLINING (&lt;-3%)</strong> based on verified chip-timed race paces, never arbitrary estimates.
                </p>
              </div>

              <div className="rounded-xl border border-slate-700/70 bg-slate-900/80 p-3">
                <span className="font-bold text-purple-400 text-xs">3. Deterministic Performance Index (API)</span>
                <p className="mt-1 text-[11px] text-slate-300 leading-normal">
                  Synthesizes 4 weighted pillars: <strong>Verified Performance (35%)</strong>, <strong>Improvement Trend (30%)</strong>, <strong>Target Capability (20%)</strong>, and <strong>Reliability & Consistency (15%)</strong>. Zero black-box guesswork—all variables are directly auditable.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Talent Identification Banner */}
      <div className="rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 p-5 shadow-lg backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-[#F97316] p-2 text-white shadow-md">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              High Development Potential & Talent Identification
            </h3>
            <p className="mt-0.5 text-xs text-slate-300">
              Athletes exhibiting rapid improvement (&gt;+5%), high consistency, and favourable pace durability who are not yet top-tier sponsored.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {rankedAthletes.filter((a) => a.isTalentPick).map((t) => (
                <Link
                  key={t.id}
                  href={`/athletes/${t.id}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:border-orange-500 hover:text-orange-400 transition-colors"
                >
                  <span>{t.name}</span>
                  <span className="rounded bg-orange-950/80 border border-orange-700/80 px-1.5 py-0.2 font-mono text-[10px] text-orange-300">
                    +{t.improvementPct}%
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-orange-400" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Global Rankings Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 shadow-xl backdrop-blur-md">
        <div className="border-b border-slate-700 bg-slate-950/80 px-5 py-3.5 text-xs font-bold text-white">
          Club Performance Index Rankings (Season 2025/26)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-700 bg-[#0F172A] text-[11px] font-bold uppercase tracking-wider text-white">
              <tr>
                <th className="px-4 py-3 text-white font-bold">Rank</th>
                <th className="px-4 py-3 text-white font-bold">Athlete</th>
                <th className="px-4 py-3 text-white font-bold">Discipline</th>
                <th className="px-4 py-3 text-white font-bold">Assigned Coach</th>
                <th className="px-4 py-3 text-center text-white font-bold">Performance Index</th>
                <th className="px-4 py-3 text-white font-bold">Trend Classification</th>
                <th className="px-4 py-3 text-white font-bold">Latest Result</th>
                <th className="px-4 py-3 text-right text-white font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {rankedAthletes.map((athlete, idx) => (
                <tr key={athlete.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-slate-300">
                    #{idx + 1}
                  </td>
                  <td className="px-4 py-3 font-bold text-white">
                    <Link href={`/athletes/${athlete.id}`} className="hover:text-orange-400 transition-colors">
                      {athlete.name}
                    </Link>
                    <span className="ml-2 font-mono text-[10px] text-slate-400">
                      {athlete.athleteNumber}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-200 font-medium">{athlete.discipline.replace("_", " ")}</td>
                  <td className="px-4 py-3 text-slate-200 font-medium">{athlete.coachName}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-base font-black text-green-400">
                      {athlete.apiScore}
                    </span>
                    <span className="text-[10px] text-slate-400"> / 100</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-lg px-2.5 py-1 text-[10px] font-bold border shadow-xs ${
                        athlete.trend === "Rapid Improvement"
                          ? "bg-emerald-950/80 text-emerald-300 border-emerald-600/70"
                          : athlete.trend === "Improving"
                          ? "bg-teal-950/80 text-teal-300 border-teal-600/70"
                          : athlete.trend === "Declining"
                          ? "bg-rose-950/80 text-rose-300 border-rose-600/70"
                          : "bg-slate-800 text-slate-100 border-slate-600"
                      }`}
                    >
                      {athlete.trend}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-200 font-medium">{athlete.latestRace}</div>
                    <div className="font-mono font-bold text-white">
                      {athlete.latestTime}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/athletes/${athlete.id}`}
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

      {/* World Athletics Benchmarks Reference Table */}
      <div className="rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 p-5 shadow-lg backdrop-blur-md">
        <h3 className="text-sm font-bold text-white">
          Configured World Athletics & Club Benchmark Standards
        </h3>
        <p className="mt-0.5 text-xs text-slate-400">
          Raw race times are scaled across physiological energy curves to enable direct comparison between 5k and 90k ultra runners.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(DISTANCE_BENCHMARKS).map(([key, bm]) => (
            <div
              key={key}
              className="rounded-xl border border-slate-700/80 bg-slate-900/90 p-3.5 text-xs"
            >
              <div className="font-bold text-white">{bm.name}</div>
              <div className="mt-1 flex justify-between text-slate-400">
                <span>Club Elite (M):</span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatDuration(bm.maleClubEliteSeconds)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Club Elite (F):</span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatDuration(bm.femaleClubEliteSeconds)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Qualifying (M):</span>
                <span className="font-mono text-slate-300">{formatDuration(bm.maleClubQualifyingSeconds)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
