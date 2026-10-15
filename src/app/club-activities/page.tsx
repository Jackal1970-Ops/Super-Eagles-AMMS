import React from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  CalendarCheck2,
  Users,
  PlusCircle,
  Clock,
  MapPin,
  CheckCircle2,
  HeartHandshake,
  ArrowRight,
} from "lucide-react";
import { ClubActivityClientView } from "@/components/activities/ClubActivityClientView";

export const dynamic = "force-dynamic";

export default async function ClubActivitiesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const activities = await prisma.clubActivity.findMany({
    include: {
      attendances: {
        where: user.role === "ATHLETE" ? { athleteId: user.athleteId || "__unassigned__" } : undefined,
        include: { athlete: true },
      },
      volunteers: {
        where: user.role === "ATHLETE" ? { athleteId: user.athleteId || "__unassigned__" } : undefined,
        include: { athlete: true },
      },
    },
    orderBy: { date: "desc" },
  });

  const athletes = await prisma.athlete.findMany({
    where: user.role === "ATHLETE" ? { id: user.athleteId || "__unassigned__" } : user.role === "COACH" ? { coachAssignments: { some: { coachId: user.userId, status: "ACTIVE" } } } : undefined,
    select: { id: true, athleteNumber: true, firstName: true, lastName: true },
    orderBy: { athleteNumber: "asc" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {user.role === "ATHLETE"
              ? "My Club Events, Runs & Walks Calendar"
              : "Internal Club Activities & Attendance Register"}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {user.role === "ATHLETE"
              ? "View scheduled weekly time trials, pack walks, and claim your attendance points via 1-click self check-in."
              : "Schedule weekly time trials, long runs, volunteering stations, and execute fast bulk attendance capture."}
          </p>
        </div>
      </div>

      <ClubActivityClientView
        activities={activities}
        athletes={athletes}
        userRole={user.role}
        currentUser={{
          id: user.userId,
          name: user.name,
          role: user.role,
          athleteId: user.athleteId,
        }}
      />
    </div>
  );
}
