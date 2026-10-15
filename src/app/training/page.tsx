import React from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Flame,
  PlusCircle,
  Clock,
  Activity,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  Compass,
} from "lucide-react";
import { formatDuration, formatPace } from "@/lib/analytics/pace";

export const dynamic = "force-dynamic";

export default async function TrainingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const activities = await prisma.trainingActivity.findMany({
    where:
      user.role === "ATHLETE"
        ? { athleteId: user.athleteId || "__unassigned__" }
        : user.role === "COACH"
        ? { athlete: { coachAssignments: { some: { coachId: user.userId, status: "ACTIVE" } } } }
        : undefined,
    include: {
      athlete: true,
      splits: true,
    },
    orderBy: { date: "desc" },
    take: 50,
  });

  const totalDistance = activities.reduce((acc, a) => acc + a.distanceKm, 0);
  const totalDuration = activities.reduce((acc, a) => acc + a.durationSeconds, 0);
  const avgPace = totalDistance > 0 ? Math.round(totalDuration / totalDistance) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {user.role === "ATHLETE" ? "My Training Activities & Mileage Log" : "Club Training Activities & Mileage Log"}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {user.role === "ATHLETE"
              ? "Your personal running & walking activities, GPS watch telemetry, and split pace history."
              : "Dedicated training dataset stored strictly separate from official competition results."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {user.role === "ATHLETE" ? (
            <>
              <Link
                href={user.athleteId ? `/athletes/${user.athleteId}?action=gpx` : "/athletes"}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/50 bg-amber-500/20 px-4 py-2.5 text-xs font-black text-amber-300 shadow-md transition-all duration-200 hover:bg-amber-500/30 hover:-translate-y-0.5"
              >
                <Compass className="h-4 w-4 text-amber-400" />
                <span>Upload Watch File (.GPX)</span>
              </Link>
              <Link
                href={user.athleteId ? `/athletes/${user.athleteId}` : "/athletes"}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#F97316] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:bg-[#FB923C] hover:-translate-y-0.5"
              >
                <Flame className="h-4 w-4" />
                <span>+ Log Workout / Walk</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/athletes"
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/50 bg-amber-500/20 px-4 py-2.5 text-xs font-black text-amber-300 shadow-md transition-all duration-200 hover:bg-amber-500/30 hover:-translate-y-0.5"
              >
                <Compass className="h-4 w-4 text-amber-400" />
                <span>Sync Member Watch (.GPX)</span>
              </Link>
              {(user.role === "SUPER_ADMIN" || user.role === "CLUB_ADMIN") && (
                <Link
                  href="/admin/csv-import?type=training"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 shadow-md transition-all duration-200 hover:bg-slate-700"
                >
                  <FileSpreadsheet className="h-4 w-4 text-orange-400" />
                  <span>Import Training CSV</span>
                </Link>
              )}
              <Link
                href="/athletes"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#F97316] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:bg-[#FB923C] hover:-translate-y-0.5"
              >
                <Flame className="h-4 w-4" />
                <span>+ Log Athlete Workout</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Clear Guidance on Training Data Capture */}
      <div className="rounded-2xl border border-orange-500/30 bg-orange-950/20 p-4 text-xs">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-orange-500/20 p-2 text-orange-400 shrink-0">
            <Flame className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold text-orange-300">How to Capture Training & Walk Sessions:</span>
            <p className="mt-0.5 text-slate-300 text-[11px] leading-relaxed">
              {user.role === "ATHLETE"
                ? "Click '+ Log Workout / Walk' above to open your 360° Athlete Profile, then click the orange 'Log Workout' button. You can capture distance, duration, surface, workout type (Tempo, Intervals, Long Run, Recovery, Walk), and perceived exertion (RPE 1–10)."
                : "Select any member from the Members directory to log workouts directly onto their dossier, or use 'Import Training CSV' for bulk spreadsheet uploads."}
            </p>
          </div>
        </div>
      </div>

      {/* Modular Integrations Status Banner */}
      <div className="rounded-3xl border border-slate-700/80 bg-[#1E293B]/85 p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-orange-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              External Smartwatch & Platform Integrations
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">Modular Adapters</span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center justify-between rounded-2xl border border-emerald-800/80 bg-emerald-950/40 p-3.5 text-xs">
            <div>
              <span className="font-bold text-emerald-200">GPX & TCX Watch Parser</span>
              <div className="text-[11px] text-emerald-400 font-bold">Live Drag-and-Drop Sync</div>
            </div>
            <span className="rounded-lg border border-emerald-700/80 bg-emerald-950/80 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
              Active
            </span>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-emerald-800/80 bg-emerald-950/40 p-3.5 text-xs">
            <div>
              <span className="font-bold text-emerald-200">Manual & CSV Ingestion</span>
              <div className="text-[11px] text-emerald-400 font-bold">Active & Fully Operational</div>
            </div>
            <span className="rounded-lg border border-emerald-700/80 bg-emerald-950/80 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
              Active
            </span>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-700/80 bg-slate-900/90 p-3.5 text-xs">
            <div>
              <span className="font-bold text-white">Garmin Connect API</span>
              <div className="text-[11px] text-amber-400 font-semibold">Ready for Client OAuth</div>
            </div>
            <span className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
              Standby
            </span>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-700/80 bg-slate-900/90 p-3.5 text-xs">
            <div>
              <span className="font-bold text-white">Strava Webhook API</span>
              <div className="text-[11px] text-amber-400 font-semibold">Ready for Client OAuth</div>
            </div>
            <span className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
              Standby
            </span>
          </div>
        </div>
      </div>

      {/* Aggregate Volume KPI Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 p-5 shadow-lg backdrop-blur-md">
          <span className="text-xs font-semibold text-slate-400">
            {user.role === "ATHLETE" ? "My Total Logged Mileage" : "Total Logged Mileage"}
          </span>
          <div className="mt-1 text-2xl font-black text-white">
            {totalDistance.toFixed(1)} km
          </div>
        </div>
        <div className="rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 p-5 shadow-lg backdrop-blur-md">
          <span className="text-xs font-semibold text-slate-400">
            {user.role === "ATHLETE" ? "My Cumulative Time on Feet" : "Cumulative Time on Feet"}
          </span>
          <div className="mt-1 text-2xl font-black text-orange-400">
            {formatDuration(totalDuration)}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 p-5 shadow-lg backdrop-blur-md">
          <span className="text-xs font-semibold text-slate-400">
            {user.role === "ATHLETE" ? "My Average Training Pace" : "Squad Average Training Pace"}
          </span>
          <div className="mt-1 font-mono text-2xl font-black text-blue-400">
            {formatPace(avgPace)}
          </div>
        </div>
      </div>

      {/* Training Activities Log Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-800 bg-[#0c1220]/90 shadow-xl">
        <div className="border-b border-slate-800 bg-slate-950/90 px-6 py-4 text-xs font-bold uppercase tracking-wider text-white">
          {user.role === "ATHLETE" ? "My Logged Workouts & Mileage Register" : "Squad Training Activities Register"}
        </div>
        {activities.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Flame className="mx-auto h-8 w-8 text-orange-400 opacity-60" />
            <div className="mt-2 text-sm font-bold text-white">No Training Workouts Recorded Yet</div>
            <p className="mt-1 text-xs text-slate-400">
              {user.role === "ATHLETE"
                ? "Click '+ Log Workout / Walk' above or sync your smartwatch .GPX file to log your first session."
                : "No workouts recorded for this squad selection."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-700 bg-[#0F172A] text-[11px] font-bold uppercase tracking-wider text-white">
                <tr>
                  {user.role !== "ATHLETE" && <th className="px-5 py-3.5 text-white font-bold">Athlete</th>}
                  <th className="px-5 py-3.5 text-white font-bold">Date</th>
                  <th className="px-5 py-3.5 text-white font-bold">Workout Type</th>
                  <th className="px-5 py-3.5 text-white font-bold">Distance</th>
                  <th className="px-5 py-3.5 text-white font-bold">Duration</th>
                  <th className="px-5 py-3.5 text-white font-bold">Average Pace</th>
                  <th className="px-5 py-3.5 text-white font-bold">RPE</th>
                  <th className="px-5 py-3.5 text-white font-bold">Splits Recorded</th>
                  <th className="px-5 py-3.5 text-right text-white font-bold">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {activities.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-800/50 transition-colors">
                    {user.role !== "ATHLETE" && (
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/athletes/${a.athleteId}`}
                          className="font-bold text-white hover:text-orange-400"
                        >
                          {a.athlete.firstName} {a.athlete.lastName}
                        </Link>
                        <div className="font-mono text-[10px] text-slate-400">{a.athlete.athleteNumber}</div>
                      </td>
                    )}
                    <td className="px-5 py-3.5 text-slate-300">{new Date(a.date).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-200">
                      {a.workoutType}
                      {a.isLongRun && (
                        <span className="ml-1.5 rounded-md border border-blue-700/80 bg-blue-950/80 px-1.5 py-0.5 text-[10px] font-bold text-blue-300">
                          LONG RUN
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-white">{a.distanceKm} km</td>
                    <td className="px-5 py-3.5 text-slate-200">{formatDuration(a.durationSeconds)}</td>
                    <td className="px-5 py-3.5 font-mono font-bold text-orange-400">
                      {formatPace(a.averagePaceSeconds)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-block rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-200">
                        {a.sessionRpe ? `${a.sessionRpe}/10` : "--/10"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">
                      {a.splits.length > 0 ? (
                        <span className="text-emerald-400 font-semibold">
                          {a.splits.length} splits logged
                        </span>
                      ) : (
                        "Single split"
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/athletes/${a.athleteId}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-orange-500/70 bg-[#F97316] px-3.5 py-1.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:bg-[#FB923C] hover:-translate-y-0.5"
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
