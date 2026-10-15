import React from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { ReportsClientView } from "@/components/reports/ReportsClientView";
import { ComplianceReportExportView } from "@/components/reports/ComplianceReportExportView";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "ATHLETE") redirect(user.athleteId ? `/athletes/${user.athleteId}` : "/login");
  if (user.role !== "SUPER_ADMIN" && user.role !== "CLUB_ADMIN" && user.role !== "SPONSORSHIP_COMMITTEE") redirect("/dashboard");

  const athletes = await prisma.athlete.findMany({
    include: {
      sponsorships: {
        include: {
          transactions: true,
          conditions: true,
          decisions: true,
        },
      },
      coachAssignments: {
        include: { coach: { select: { id: true, name: true } } },
      },
      raceResults: {
        orderBy: { date: "desc" },
      },
      clubAttendances: true,
      volunteerContributions: true,
      loyaltyExemptions: true,
      wellnessEntries: {
        orderBy: { date: "desc" },
        take: 1,
      },
    },
    orderBy: { athleteNumber: "asc" },
  });

  const races = await prisma.race.findMany();
  const coaches = await prisma.user.findMany({
    where: { role: "COACH", isActive: true },
    select: { id: true, name: true, email: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between no-print">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Club Executive Reports & Compliance Exports
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Generate official athletics club reports, POPIA audits, ASA provincial lists, and print-ready layouts.
          </p>
        </div>
      </div>

      {/* Statutory & Provincial Compliance Export Module */}
      <ComplianceReportExportView />

      <ReportsClientView athletes={athletes} races={races} coaches={coaches} />
    </div>
  );
}
