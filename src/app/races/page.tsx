import React from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  Calendar,
  Sparkles,
  Award,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { formatDuration, formatPace } from "@/lib/analytics/pace";
import { RacePredictionSimulator } from "@/components/races/RacePredictionSimulator";
import { EventLogisticsView } from "@/components/races/EventLogisticsView";

export const dynamic = "force-dynamic";

export default async function RacesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const races = await prisma.race.findMany({
    include: {
      editions: {
        orderBy: { year: "desc" },
      },
    },
    orderBy: { defaultDistanceKm: "desc" },
  });

  const recentResults = await prisma.raceResult.findMany({
    where: user.role === "ATHLETE" ? { athleteId: user.athleteId || "__unassigned__" } : user.role === "COACH" ? { athlete: { coachAssignments: { some: { coachId: user.userId, status: "ACTIVE" } } } } : undefined,
    include: {
      athlete: true,
    },
    orderBy: { date: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Official Competitions, Library & Predictions
          </h1>
          <p className="mt-1 text-xs text-slate-300">
            Dedicated competition database, configurable standards, and deterministic race prediction engine.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {user.role === "SUPER_ADMIN" || user.role === "CLUB_ADMIN" ? (
            <Link
              href="/races/results/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#F97316] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:bg-[#FB923C] hover:-translate-y-0.5"
            >
              <Trophy className="h-4 w-4" />
              <span>+ Record Official Race Result</span>
            </Link>
          ) : user.role === "ATHLETE" ? (
            <Link
              href={user.athleteId ? `/athletes/${user.athleteId}` : "/athletes"}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#F97316] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:bg-[#FB923C] hover:-translate-y-0.5"
            >
              <Trophy className="h-4 w-4" />
              <span>+ Capture Race Result on Profile</span>
            </Link>
          ) : (
            <Link
              href="/athletes"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#F97316] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:bg-[#FB923C] hover:-translate-y-0.5"
            >
              <Trophy className="h-4 w-4" />
              <span>+ Record Squad Race Result</span>
            </Link>
          )}
        </div>
      </div>

      {/* Race Data Capture Guidance */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-amber-500/20 p-2 text-amber-400 shrink-0">
            <Trophy className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold text-amber-300">How to Capture Official Race & Timing Data:</span>
            <p className="mt-0.5 text-slate-300 text-[11px] leading-relaxed">
              {user.role === "SUPER_ADMIN" || user.role === "CLUB_ADMIN"
                ? "Use '+ Record Official Race Result' above to record chip-timed finishes, positions, and personal bests for any club athlete. Results immediately update the Athlete Performance Index (API) and CCLI loyalty score."
                : user.role === "ATHLETE"
                ? "Click '+ Capture Race Result on Profile' above to open your 360° Athlete Profile, then click 'Capture Official Result' to submit your official road race, walking event, or time trial times with splits."
                : "Select any squad athlete from the Members directory to log official competition finishes and time trials."}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Race Prediction Simulator Tool */}
      <RacePredictionSimulator />

      {/* Official Race Library Cards */}
      <div className="rounded-3xl border border-slate-700/80 bg-[#1E293B]/85 p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black tracking-tight text-white">
              Club Official Race Library & Strategic Standards
            </h2>
            <p className="mt-0.5 text-xs text-slate-300">
              Configurable championship criteria, qualification windows, and difficulty ratings.
            </p>
          </div>
          <span className="self-start rounded-xl border border-green-800/80 bg-green-950/80 px-3 py-1 text-xs font-bold text-green-300 sm:self-auto">
            {races.length} Configured Events
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {races.map((race) => {
            const latestEdition = race.editions[0];
            return (
              <div
                key={race.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-800/90 bg-slate-900/90 p-5 shadow-md hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="rounded-lg border border-slate-700/80 bg-slate-800 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-200">
                      {race.raceCategory.replace(/_/g, " ")}
                    </span>
                    <span
                      className={`rounded-lg px-2.5 py-1 text-[10px] font-bold border shadow-xs ${
                        race.strategicImportance === "HIGH"
                          ? "bg-purple-950/80 border-purple-800/80 text-purple-300"
                          : race.strategicImportance === "MEDIUM"
                          ? "bg-blue-950/80 border-blue-800/80 text-blue-300"
                          : "bg-slate-800 border-slate-700 text-slate-300"
                      }`}
                    >
                      {race.strategicImportance} Priority
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-black text-white">
                    {race.name}
                  </h3>
                  <div className="mt-0.5 text-xs font-medium text-slate-300">
                    {race.location}, {race.country}
                  </div>

                  <div className="mt-4 space-y-2 border-t border-slate-800/80 pt-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 font-medium">Distance:</span>
                      <span className="font-bold text-white">{race.defaultDistanceKm} km</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 font-medium">Course Difficulty:</span>
                      <span className="font-bold text-slate-100">
                        {race.difficultyRating} / 5 ({race.elevationProfile || "Normal"})
                      </span>
                    </div>
                    {latestEdition?.cutoffTimeSeconds && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300 font-medium">Cut-off Time:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {formatDuration(latestEdition.cutoffTimeSeconds)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-800 pt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">
                    Active Edition: <b className="text-white font-bold">{latestEdition?.year || 2026}</b>
                  </span>
                  <span className="text-emerald-400 font-bold">Rules Configurable</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Logistics, Team Transport Fleet, Hotel Rooming & Marshal Roster */}
      <EventLogisticsView userRole={user.role} />

      {/* Official Verified Competition Results Register */}
      <div className="overflow-hidden rounded-3xl border border-slate-700/80 bg-[#1E293B]/85 shadow-xl backdrop-blur-md">
        <div className="border-b border-slate-700 bg-slate-950/90 px-6 py-4 text-xs font-bold uppercase tracking-wider text-white">
          {user.role === "ATHLETE" ? "My Official Verified Competition Results & PBs" : "Official Verified Competition Results Register"}
        </div>

        {recentResults.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Trophy className="mx-auto h-8 w-8 text-amber-400 opacity-60" />
            <div className="mt-2 text-sm font-bold text-white">No Verified Race Results Recorded Yet</div>
            <p className="mt-1 text-xs text-slate-400">
              {user.role === "ATHLETE"
                ? "Click '+ Capture Race Result on Profile' above to record your road race or marathon finish times."
                : "No official competition results recorded for this squad selection."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-700 bg-[#0F172A] text-[11px] font-bold uppercase tracking-wider text-white">
                <tr>
                  {user.role !== "ATHLETE" && <th className="px-5 py-3.5 text-white font-bold">Athlete</th>}
                  <th className="px-5 py-3.5 text-white font-bold">Race Name</th>
                  <th className="px-5 py-3.5 text-white font-bold">Date</th>
                  <th className="px-5 py-3.5 text-white font-bold">Distance</th>
                  <th className="px-5 py-3.5 text-white font-bold">Official Time</th>
                  <th className="px-5 py-3.5 text-white font-bold">Avg Pace</th>
                  <th className="px-5 py-3.5 text-white font-bold">Status</th>
                  <th className="px-5 py-3.5 text-right text-white font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {recentResults.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/50 transition-colors">
                    {user.role !== "ATHLETE" && (
                      <td className="px-5 py-3.5 font-bold text-white">
                        <Link href={`/athletes/${r.athleteId}`} className="hover:text-green-400">
                          {r.athlete.firstName} {r.athlete.lastName}
                        </Link>
                        <span className="ml-2 font-mono text-[11px] text-slate-400">
                          {r.athlete.athleteNumber}
                        </span>
                      </td>
                    )}
                  <td className="px-5 py-3.5 font-semibold text-slate-100">
                    {r.raceName}
                    {r.isPersonalBest && (
                      <span className="ml-2 rounded-md border border-amber-700/80 bg-amber-950/80 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                        PB
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-300 font-medium">
                    {new Date(r.date).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5 font-bold text-white">{r.distanceKm} km</td>
                  <td className="px-5 py-3.5 font-mono text-sm font-bold text-emerald-400">
                    {formatDuration(r.officialTimeSeconds)}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-200 font-medium">
                    {formatPace(Math.round(r.officialTimeSeconds / r.distanceKm))}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-700/80 bg-emerald-950/80 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
                      ✓ {r.verificationStatus}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/athletes/${r.athleteId}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-green-500/70 bg-green-950/50 px-3 py-1.5 text-xs font-bold text-green-300 shadow-sm transition-all hover:border-green-400 hover:bg-green-900/60 hover:text-white"
                    >
                      <span>360° Profile</span>
                      <span className="text-[10px]">↗</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
}
