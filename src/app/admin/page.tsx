import React from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ShieldAlert,
  Users,
  FileSpreadsheet,
  Clock,
  History,
  Lock,
  ArrowRight,
} from "lucide-react";
import { SystemHealthAndBackupView } from "@/components/admin/SystemHealthAndBackupView";

export const dynamic = "force-dynamic";

function renderAuditDelta(rawJson: string | null) {
  if (!rawJson || rawJson === "{}") return <span className="text-slate-500">No delta recorded</span>;
  try {
    const data = JSON.parse(rawJson);
    return (
      <div className="flex flex-wrap gap-1.5 items-center">
        {Object.entries(data).map(([key, val]) => {
          const isTime = typeof val === "number" && val > 1000000000000;
          const displayVal = isTime ? new Date(val).toLocaleTimeString() : String(val);
          const isSuccess = val === "SUCCESS";
          return (
            <span
              key={key}
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-950 border border-slate-700/80 px-2 py-0.5 text-[11px]"
            >
              <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, " $1")}:</span>
              <span className={`font-bold ${isSuccess ? "text-emerald-400" : "text-white"}`}>
                {displayVal}
              </span>
            </span>
          );
        })}
      </div>
    );
  } catch {
    return <span className="text-slate-300 text-xs font-mono">{rawJson}</span>;
  }
}

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user.role === "ATHLETE") redirect(user.athleteId ? `/athletes/${user.athleteId}` : "/login");
  if (user.role !== "SUPER_ADMIN" && user.role !== "CLUB_ADMIN") {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });

  const auditLogs = await prisma.auditLog.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { timestamp: "desc" },
    take: 25,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white">
              System Administration & Compliance Audit
            </h1>
            <span className="rounded-md bg-rose-950/80 border border-rose-800 px-2.5 py-0.5 text-xs font-bold text-rose-300">
              Executive Only
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            User access provisioning, POPIA data governance, immutable audit logging, and CSV data ingestion.
          </p>
        </div>

        <Link
          href="/admin/csv-import"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#F97316] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:bg-[#FB923C] hover:-translate-y-0.5"
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>CSV Import Center</span>
        </Link>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/admin/csv-import"
          className="rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 p-5 shadow-lg backdrop-blur-md hover:border-orange-500/60 transition-all duration-200"
        >
          <FileSpreadsheet className="h-6 w-6 text-orange-400" />
          <h3 className="mt-3 text-sm font-bold text-white">
            Bulk CSV Ingestion Center
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Upload CSV files for Athletes, Race Results, Training Mileage, Attendance, and Sponsorships.
          </p>
        </Link>

        <Link
          href="/settings"
          className="rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 p-5 shadow-lg backdrop-blur-md hover:border-orange-500/60 transition-all duration-200"
        >
          <ShieldAlert className="h-6 w-6 text-purple-400" />
          <h3 className="mt-3 text-sm font-bold text-white">
            Scoring Rules & Weight Engine
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Modify API, CSS, and CCLI formula weights and thresholds with live automatic recalculation.
          </p>
        </Link>

        <div className="rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 p-5 shadow-lg backdrop-blur-md">
          <Users className="h-6 w-6 text-blue-400" />
          <h3 className="mt-3 text-sm font-bold text-white">
            Active System Accounts ({users.length})
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Role-isolated access accounts across 5 security tiers with encrypted credentials.
          </p>
        </div>
      </div>

      {/* Real-time Nervous System Health Diagnostics, Autonomous Self-Healing & Drive Backup Console */}
      <SystemHealthAndBackupView userRole={user.role} />

      {/* Immutable Application Audit Trail */}
      <div className="overflow-hidden rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 shadow-xl backdrop-blur-md">
        <div className="border-b border-slate-700 bg-slate-950/90 px-5 py-3.5 text-xs font-bold text-white">
          Immutable System Audit Trail (POPIA & Financial Governance)
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-700 bg-[#0F172A] text-[11px] font-bold uppercase tracking-wider text-white">
              <tr>
                <th className="px-4 py-3 text-white font-bold">Timestamp</th>
                <th className="px-4 py-3 text-white font-bold">User</th>
                <th className="px-4 py-3 text-white font-bold">Action</th>
                <th className="px-4 py-3 text-white font-bold">Entity Type</th>
                <th className="px-4 py-3 text-white font-bold">Details / Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-300">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-bold text-white">
                    {log.user?.name || "System"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-lg px-2.5 py-1 text-[10px] font-bold border shadow-xs ${
                        log.action === "OVERRIDE"
                          ? "bg-amber-950/80 text-amber-300 border-amber-700/80"
                          : log.action === "CREATE"
                          ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/80"
                          : log.action === "UPDATE"
                          ? "bg-blue-950/80 text-blue-300 border-blue-700/80"
                          : "bg-slate-800 text-slate-200 border-slate-600"
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-200">
                    {log.entityType}
                  </td>
                  <td className="px-4 py-3">
                    {renderAuditDelta(log.newValuesJson)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
