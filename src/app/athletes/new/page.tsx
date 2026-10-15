import React from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import AthleteRegistrationForm from "@/components/athletes/AthleteRegistrationForm";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";

export const dynamic = "force-dynamic";

export default async function NewAthletePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "SUPER_ADMIN" && user.role !== "CLUB_ADMIN") redirect("/dashboard");

  // Fetch available coaches
  const coaches = await prisma.user.findMany({
    where: { role: "COACH", isActive: true },
    select: { id: true, name: true, email: true },
  });

  // Calculate next recommended athlete number
  const count = await prisma.athlete.count();
  const nextNumber = `SEA-${(count + 1).toString().padStart(3, "0")}`;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Breadcrumbs
        items={[
          { label: "Members & Athletes", href: "/athletes" },
          { label: "Register New Athlete", current: true },
        ]}
        userRole={user.role}
      />
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Register New Club Athlete
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Create an official athlete master profile, assign coaching squads, and initialize longitudinal tracking.
        </p>
      </div>

      <AthleteRegistrationForm coaches={coaches} defaultAthleteNumber={nextNumber} />
    </div>
  );
}
