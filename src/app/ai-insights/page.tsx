import React from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Award,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Activity,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { AIInsightsClientView } from "@/components/ai/AIInsightsClientView";

export const dynamic = "force-dynamic";

export default async function AIInsightsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "ATHLETE") redirect(user.athleteId ? `/athletes/${user.athleteId}` : "/login");
  if (user.role !== "SUPER_ADMIN" && user.role !== "COACH") redirect("/dashboard");

  const recommendations = await prisma.aIRecommendation.findMany({
    where: user.role === "COACH" ? { athlete: { coachAssignments: { some: { coachId: user.userId, status: "ACTIVE" } } } } : undefined,
    include: {
      athlete: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              AI Performance Analysis & Coaching Assistant
            </h1>
            <span className="rounded bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-800 dark:bg-green-950 dark:text-green-300">
              Deterministic + LLM Hybrid
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Factual evidence derivation, pace durability interpretation, and coach-governed recommendation workflows.
          </p>
        </div>
      </div>

      {/* AI Governance Banner */}
      <div className="rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50/60 p-5 shadow-xs dark:border-green-900 dark:from-green-950/40 dark:to-emerald-950/20">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-green-600 p-2 text-white shadow-xs">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-green-950 dark:text-green-200">
              AI Governance & Coach Authority Principle
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-green-900/90 dark:text-green-300/80">
              AI assists with trend identification, split decay analysis, and coaching suggestions. AI <b>never</b> silently modifies an athlete’s training programme, makes medical diagnoses, or executes automated sponsorship withdrawals. The <b>Coach remains the human decision-maker</b>.
            </p>
          </div>
        </div>
      </div>

      <AIInsightsClientView recommendations={recommendations} userRole={user.role} />
    </div>
  );
}
