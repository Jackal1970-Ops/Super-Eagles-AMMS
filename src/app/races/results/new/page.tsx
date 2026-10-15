import React from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy, FileCheck } from "lucide-react";
import { RecordResultForm } from "./RecordResultForm";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";

export const dynamic = "force-dynamic";

export default async function RecordResultPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "SUPER_ADMIN" && user.role !== "CLUB_ADMIN") redirect("/races");

  const athletes = await prisma.athlete.findMany({
    orderBy: { lastName: "asc" },
    select: {
      id: true,
      athleteNumber: true,
      firstName: true,
      lastName: true,
      primaryDiscipline: true,
      disciplineCategory: true,
    },
  });

  const races = await prisma.race.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      defaultDistanceKm: true,
      raceCategory: true,
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Breadcrumbs
        items={[
          { label: "Competitions & Races", href: "/races" },
          { label: "Record Official Result", current: true },
        ]}
        userRole={user.role}
      />
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="rounded-xl border border-slate-800 bg-slate-900/80 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white">
              Record Official Race Result
            </h1>
            <span className="rounded bg-green-900/40 px-2 py-0.5 text-xs font-bold text-green-300 border border-green-700/50">
              Verified Timing
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Submit official championship time trials, road races, or ASA walking events directly into athlete performance histories.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-md">
        <RecordResultForm athletes={athletes} races={races} />
      </div>
    </div>
  );
}
