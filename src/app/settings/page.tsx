import React from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { SettingsClientView } from "@/components/settings/SettingsClientView";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "ATHLETE") redirect(user.athleteId ? `/athletes/${user.athleteId}` : "/login");
  if (user.role !== "SUPER_ADMIN") redirect("/dashboard");

  const configs = await prisma.systemConfiguration.findMany();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          System Rules, Scoring Weights & Club Configuration
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Govern scoring weights, decision thresholds, and club branding rules. Modifying weights updates score calculation dynamically.
        </p>
      </div>

      <SettingsClientView initialConfigs={configs} userRole={user.role} />
    </div>
  );
}
