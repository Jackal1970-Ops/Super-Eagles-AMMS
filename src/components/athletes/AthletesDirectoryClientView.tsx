"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Users,
  Search,
  PlusCircle,
  Filter,
  Award,
  ChevronRight,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Footprints,
  Sparkles,
  Calendar,
  Download,
  X,
  Edit3,
  Trash2,
  RefreshCw,
  Upload,
  FileSpreadsheet,
  ShieldCheck,
} from "lucide-react";
import { MedallionBadge } from "../medallions/MedallionBadge";
import { MedallionModal, MedallionData } from "../medallions/MedallionModal";
import { EditAthleteModal } from "./EditAthleteModal";
import { DeleteAthleteModal } from "./DeleteAthleteModal";

export interface AthleteData {
  id: string;
  athleteNumber: string;
  firstName: string;
  lastName: string;
  preferredName?: string | null;
  gender: string;
  dateOfBirth: string;
  contactEmail: string;
  contactPhone?: string | null;
  membershipStartDate: string;
  membershipStatus: string;
  membershipCategory: string;
  disciplineCategory: string;
  asaLicenseNumber?: string | null;
  membershipExpiry?: string | null;
  membershipFeeStatus: string;
  athleteStatus: string;
  primaryDiscipline: string;
  coachName: string;
  apiScore: number;
  apiTrend: string;
  ccliScore: number;
  sponsorshipTier: string;
  supportZar: number;
  medallions?: any[];
  // Precomputed flags — match dashboard KPI counts exactly
  isImprovingTrajectory?: boolean;
  isReciprocityReview?: boolean;
}

interface AthletesDirectoryClientViewProps {
  initialAthletes: AthleteData[];
  totalActivitiesCount: number;
  initialSquadFilter?: string;
}

export function AthletesDirectoryClientView({
  initialAthletes,
  totalActivitiesCount,
  initialSquadFilter,
}: AthletesDirectoryClientViewProps) {
  const searchParams = useSearchParams();

  // Server always resolves the correct initialSquadFilter from URL params.
  // Use it directly as the initial state — no hydration race condition.
  const resolvedInitialSquad =
    initialSquadFilter && initialSquadFilter !== "ALL"
      ? initialSquadFilter
      : "ALL";

  const [viewMode, setViewMode] = useState<"PERFORMANCE" | "MEMBERSHIP">("PERFORMANCE");
  const [search, setSearch] = useState("");
  const [disciplineCategoryFilter, setDisciplineCategoryFilter] = useState("ALL");
  const [squadFilter, setSquadFilter] = useState(resolvedInitialSquad);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeCardAthlete, setActiveCardAthlete] = useState<AthleteData | null>(null);
  const [selectedMedallion, setSelectedMedallion] = useState<MedallionData | null>(null);

  const [athletesList, setAthletesList] = useState<AthleteData[]>(initialAthletes);
  const [editingAthlete, setEditingAthlete] = useState<AthleteData | null>(null);
  const [deletingAthlete, setDeletingAthlete] = useState<AthleteData | null>(null);
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Also sync if user navigates to /athletes?status=X client-side without a full page reload
  useEffect(() => {
    const p = searchParams?.get("status") || searchParams?.get("squad");
    if (p && p !== "ALL") {
      setSquadFilter(p);
    } else if (!p) {
      // Only reset if server prop also says ALL
      if (!initialSquadFilter || initialSquadFilter === "ALL") {
        setSquadFilter("ALL");
      }
    }
  }, [searchParams, initialSquadFilter]);

  const handleRenewAthlete = async (athlete: AthleteData) => {
    setRenewingId(athlete.id);
    try {
      const res = await fetch("/api/athletes/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ athleteIds: [athlete.id] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to renew annual dues.");
      setAthletesList((prev) =>
        prev.map((a) =>
          a.id === athlete.id
            ? {
                ...a,
                membershipFeeStatus: "PAID",
                membershipStatus: "ACTIVE",
                membershipExpiry: data.renewalExpiry,
              }
            : a
        )
      );
      setStatusNotification(`Annual dues renewed for ${athlete.firstName} ${athlete.lastName} through 31 Dec ${data.cycleYear}!`);
      setTimeout(() => setStatusNotification(null), 5000);
    } catch (err: any) {
      alert(err.message || "Failed to renew dues.");
    } finally {
      setRenewingId(null);
    }
  };

  const handleExportBlankCsv = () => {
    window.location.href = "/api/admin/csv-template?type=ATHLETES&samples=false";
  };

  // Filter athletes
  const filteredAthletes = athletesList.filter((a) => {
    const fullName = `${a.firstName} ${a.lastName}`.toLowerCase();
    const query = search.toLowerCase().trim();
    const matchSearch =
      !query ||
      fullName.includes(query) ||
      a.athleteNumber.toLowerCase().includes(query) ||
      a.contactEmail.toLowerCase().includes(query) ||
      (a.asaLicenseNumber && a.asaLicenseNumber.toLowerCase().includes(query));

    const matchDiscipline =
      disciplineCategoryFilter === "ALL" ||
      a.disciplineCategory === disciplineCategoryFilter ||
      (disciplineCategoryFilter === "WALKER" &&
        (a.primaryDiscipline.includes("WALK") || a.disciplineCategory === "WALKER")) ||
      (disciplineCategoryFilter === "RUNNER" && a.disciplineCategory === "RUNNER");

    const matchSquad =
      squadFilter === "ALL" ||
      a.athleteStatus === squadFilter ||
      (squadFilter === "MEDALLION" && !!(a.medallions && a.medallions.length > 0)) ||
      // Uses server-precomputed flag — identical to dashboard KPI calculation
      (squadFilter === "IMPROVING" && a.isImprovingTrajectory === true) ||
      (squadFilter === "RECIPROCITY_REVIEW" && a.isReciprocityReview === true);

    const matchStatus =
      statusFilter === "ALL" ||
      a.membershipStatus === statusFilter ||
      (statusFilter === "PENDING_RENEWAL" && a.membershipFeeStatus === "PENDING");

    return matchSearch && matchDiscipline && matchSquad && matchStatus;
  });

  // KPI calculations
  const totalMembers = athletesList.length;
  const runnerCount = athletesList.filter(
    (a) => a.disciplineCategory === "RUNNER" || a.disciplineCategory === "DUAL"
  ).length;
  const walkerCount = athletesList.filter(
    (a) => a.disciplineCategory === "WALKER" || a.disciplineCategory === "DUAL" || a.primaryDiscipline.includes("WALK")
  ).length;
  const asaLicensedCount = athletesList.filter((a) => !!a.asaLicenseNumber).length;
  const pendingRenewals = athletesList.filter(
    (a) => a.membershipStatus === "PENDING_RENEWAL" || a.membershipFeeStatus === "PENDING"
  ).length;
  const lifeMembers = athletesList.filter((a) => a.membershipStatus === "LIFE_MEMBER").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Members & Athletes Directory
            </h1>
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-800 dark:bg-green-950 dark:text-green-300">
              {filteredAthletes.length} / {totalMembers} Registered
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Official club register for Road Runners, Race Walkers, Fit Walkers, and Athletics South Africa (ASA) Licensees.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/payments"
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/80 bg-emerald-950/60 px-3.5 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-900/60 transition-colors shadow-xs"
            title="Membership Payments, Annual Dues & Arrears Reconciliation"
          >
            <CreditCard className="h-4 w-4 text-emerald-400" />
            <span>Payments & Dues</span>
          </Link>

          <button
            onClick={handleExportBlankCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors shadow-xs"
            title="Export standardized blank CSV ready to populate and upload"
          >
            <Download className="h-4 w-4 text-emerald-400" />
            <span>Export Blank CSV</span>
          </button>

          <Link
            href="/admin/csv-import"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
            title="Bulk CSV ingestion center"
          >
            <Upload className="h-4 w-4 text-orange-400" />
            <span>Upload CSV</span>
          </Link>

          <Link
            href="/athletes/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#F97316] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:bg-[#FB923C] hover:-translate-y-0.5"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Register New Member</span>
          </Link>
        </div>
      </div>

      {/* Action Notification Alert */}
      {statusNotification && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-800 bg-emerald-950/80 p-3.5 text-xs font-bold text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{statusNotification}</span>
        </div>
      )}

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 p-3.5 shadow-lg backdrop-blur-md">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Members</div>
          <div className="mt-1 text-2xl font-black text-white">{totalMembers}</div>
          <div className="mt-0.5 text-[10px] text-orange-400 font-medium">100% Registered</div>
        </div>

        <div className="rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 p-3.5 shadow-lg backdrop-blur-md">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <span>🏃</span> Runners
          </div>
          <div className="mt-1 text-2xl font-black text-blue-400">{runnerCount}</div>
          <div className="mt-0.5 text-[10px] text-slate-400">Road, Trail & Track</div>
        </div>

        <div className="rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 p-3.5 shadow-lg backdrop-blur-md">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <span>🚶</span> Walkers
          </div>
          <div className="mt-1 text-2xl font-black text-emerald-400">{walkerCount}</div>
          <div className="mt-0.5 text-[10px] text-slate-400">Race & Fitness Walk</div>
        </div>

        <div className="rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 p-3.5 shadow-lg backdrop-blur-md">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-orange-400" /> ASA Licensed
          </div>
          <div className="mt-1 text-2xl font-black text-orange-400">{asaLicensedCount}</div>
          <div className="mt-0.5 text-[10px] text-slate-400">Season 2026 Compliant</div>
        </div>

        <div className="rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 p-3.5 shadow-lg backdrop-blur-md">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Renewal</div>
          <div className="mt-1 text-2xl font-black text-amber-400">{pendingRenewals}</div>
          <div className="mt-0.5 text-[10px] text-amber-400 font-medium">Follow-up needed</div>
        </div>

        <div className="rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 p-3.5 shadow-lg backdrop-blur-md">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Life Members</div>
          <div className="mt-1 text-2xl font-black text-purple-400">{lifeMembers}</div>
          <div className="mt-0.5 text-[10px] text-purple-400 font-medium">Honorary Standing</div>
        </div>
      </div>

      {/* View Switcher & Filter Bar */}
      <div className="rounded-3xl border border-slate-700/80 bg-[#1E293B]/85 p-5 shadow-xl backdrop-blur-md space-y-4">
        {/* Toggle Mode */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/70 pb-3">
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-900/90 p-1.5 border border-slate-700/70">
            <button
              onClick={() => setViewMode("PERFORMANCE")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all duration-200 ${
                viewMode === "PERFORMANCE"
                  ? "bg-[#F97316] text-white shadow-md shadow-orange-950/40 -translate-y-0.5"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Award className="h-4 w-4" />
              <span>Coaching & Dual-Index Performance View</span>
            </button>

            <button
              onClick={() => setViewMode("MEMBERSHIP")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all duration-200 ${
                viewMode === "MEMBERSHIP"
                  ? "bg-[#F97316] text-white shadow-md shadow-orange-950/40 -translate-y-0.5"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <CreditCard className="h-4 w-4" />
              <span>Membership, ASA License & Dues View</span>
            </button>
          </div>

          <div className="text-xs text-slate-300">
            Showing <strong className="text-white">{filteredAthletes.length}</strong> active members
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by member name, SEA number, ASA license, or email..."
              className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-400 focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Discipline Category Filter */}
            <select
              value={disciplineCategoryFilter}
              onChange={(e) => setDisciplineCategoryFilter(e.target.value)}
              className="rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="ALL">🏃🚶 All Disciplines</option>
              <option value="RUNNER">🏃 Runners Only</option>
              <option value="WALKER">🚶 Walkers Only</option>
              <option value="DUAL">🏃🚶 Dual Athletes</option>
            </select>

            {/* Squad Filter */}
            <select
              value={squadFilter}
              onChange={(e) => setSquadFilter(e.target.value)}
              className="rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="ALL">All Squad Tiers</option>
              <option value="ELITE">Elite Squad</option>
              <option value="PERFORMANCE">Performance Squad</option>
              <option value="DEVELOPMENT">Development Squad</option>
              <option value="MEDALLION">🏅 Conferred Medallion Winners</option>
              <option value="IMPROVING">📈 Improving Trajectory</option>
              <option value="RECIPROCITY_REVIEW">⚠️ Reciprocity Review</option>
            </select>

            {/* Membership Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="ALL">All Membership Statuses</option>
              <option value="ACTIVE">Active Season 2026</option>
              <option value="PENDING_RENEWAL">Pending Renewal</option>
              <option value="LIFE_MEMBER">Life Members</option>
            </select>

            {(search || disciplineCategoryFilter !== "ALL" || squadFilter !== "ALL" || statusFilter !== "ALL") && (
              <button
                onClick={() => {
                  setSearch("");
                  setDisciplineCategoryFilter("ALL");
                  setSquadFilter("ALL");
                  setStatusFilter("ALL");
                }}
                className="rounded-xl border border-slate-700/80 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 shadow-xl backdrop-blur-md">
        <div className="overflow-x-auto">
          {viewMode === "PERFORMANCE" ? (
            /* PERFORMANCE VIEW */
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-700 bg-[#0F172A] text-[11px] font-bold uppercase tracking-wider text-white">
                <tr>
                  <th className="px-4 py-3.5 text-white font-bold">Athlete / Member</th>
                  <th className="px-4 py-3.5 text-white font-bold">Discipline & Squad</th>
                  <th className="px-4 py-3.5 text-white font-bold">Assigned Coach</th>
                  <th className="px-4 py-3.5 text-center text-white font-bold">Performance Index</th>
                  <th className="px-4 py-3.5 text-center text-white font-bold">Club Loyalty (CCLI)</th>
                  <th className="px-4 py-3.5 text-white font-bold">Sponsorship Tier</th>
                  <th className="px-4 py-3.5 text-white font-bold">Support YTD</th>
                  <th className="px-4 py-3.5 text-right text-white font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredAthletes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      No athletes found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredAthletes.map((athlete) => {
                    const isWalker =
                      athlete.disciplineCategory === "WALKER" ||
                      athlete.primaryDiscipline.includes("WALK");

                    return (
                      <tr
                        key={athlete.id}
                        className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-200 to-slate-100 font-bold text-slate-700 dark:from-slate-800 dark:to-slate-700 dark:text-slate-200">
                              {athlete.firstName[0]}
                              {athlete.lastName[0]}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/athletes/${athlete.id}`}
                                  className="font-bold text-slate-900 group-hover:text-green-700 dark:text-white dark:group-hover:text-green-400"
                                >
                                  {athlete.firstName} {athlete.lastName}
                                </Link>
                                {athlete.medallions && athlete.medallions.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    {athlete.medallions.map((m: any) => (
                                      <MedallionBadge
                                        key={m.id}
                                        variant={m.badgeVariant}
                                        awardType={m.awardType}
                                        trackCategory={m.trackCategory}
                                        size="xs"
                                        onClick={() => setSelectedMedallion({ ...m, athlete })}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                <span className="font-mono">{athlete.athleteNumber}</span>
                                <span>•</span>
                                <span>{athlete.gender}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">
                              {isWalker ? "🚶" : "🏃"}
                            </span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {athlete.primaryDiscipline.replace("_", " ")}
                            </span>
                          </div>
                          <span
                            className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              athlete.athleteStatus === "ELITE"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                                : athlete.athleteStatus === "PERFORMANCE"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                : "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300"
                            }`}
                          >
                            {athlete.athleteStatus}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300">
                          {athlete.coachName}
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-extrabold text-green-700 dark:text-green-400">
                              {athlete.apiScore}
                            </span>
                            <span className="text-[10px] text-slate-400">API / 100</span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-extrabold text-blue-700 dark:text-blue-400">
                              {athlete.ccliScore}
                            </span>
                            <span className="text-[10px] text-slate-400">CCLI / 100</span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="rounded-lg border border-slate-700/80 bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-200">
                            {athlete.sponsorshipTier}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 font-bold text-white">
                          R{athlete.supportZar.toLocaleString()}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingAthlete(athlete)}
                              className="inline-flex items-center gap-1 rounded-xl border border-orange-500/50 bg-orange-950/40 p-2 text-orange-300 shadow-xs hover:bg-orange-900/60 transition-colors"
                              title="Edit Member Details"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setActiveCardAthlete(athlete)}
                              className="inline-flex items-center gap-1 rounded-xl border border-amber-500/50 bg-amber-950/40 p-2 text-amber-300 shadow-xs transition-colors hover:bg-amber-900/60"
                              title="View Digital Membership Card"
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                            </button>
                            <Link
                              href={`/athletes/${athlete.id}`}
                              className="inline-flex items-center gap-1 rounded-xl border border-orange-500/70 bg-[#F97316] px-3 py-1.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:bg-[#FB923C] hover:-translate-y-0.5"
                            >
                              <span>360° Profile</span>
                              <ChevronRight className="h-3 w-3" />
                            </Link>
                            <button
                              onClick={() => setDeletingAthlete(athlete)}
                              className="inline-flex items-center gap-1 rounded-xl border border-rose-700/60 bg-rose-950/40 p-2 text-rose-300 shadow-xs hover:bg-rose-900/60 transition-colors"
                              title="Archive or Delete Member"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            /* MEMBERSHIP & ASA LICENSE REGISTRY VIEW */
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-700 bg-[#0F172A] text-[11px] font-bold uppercase tracking-wider text-white">
                <tr>
                  <th className="px-4 py-3.5 text-white font-bold">Member Name</th>
                  <th className="px-4 py-3.5 text-white font-bold">Club Number</th>
                  <th className="px-4 py-3.5 text-white font-bold">ASA License #</th>
                  <th className="px-4 py-3.5 text-white font-bold">Discipline</th>
                  <th className="px-4 py-3.5 text-white font-bold">Membership Category</th>
                  <th className="px-4 py-3.5 text-white font-bold">Standing & Status</th>
                  <th className="px-4 py-3.5 text-white font-bold">Fee Status</th>
                  <th className="px-4 py-3.5 text-right text-white font-bold">Digital Credential</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredAthletes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      No members found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredAthletes.map((athlete) => {
                    const isWalker =
                      athlete.disciplineCategory === "WALKER" ||
                      athlete.primaryDiscipline.includes("WALK");

                    return (
                      <tr
                        key={athlete.id}
                        className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-green-100 to-green-50 font-bold text-green-800 dark:from-green-950 dark:to-slate-800 dark:text-green-300">
                              {athlete.firstName[0]}
                              {athlete.lastName[0]}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/athletes/${athlete.id}`}
                                  className="font-bold text-slate-900 group-hover:text-green-700 dark:text-white dark:group-hover:text-green-400"
                                >
                                  {athlete.firstName} {athlete.lastName}
                                </Link>
                                {athlete.medallions && athlete.medallions.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    {athlete.medallions.map((m: any) => (
                                      <MedallionBadge
                                        key={m.id}
                                        variant={m.badgeVariant}
                                        awardType={m.awardType}
                                        trackCategory={m.trackCategory}
                                        size="xs"
                                        onClick={() => setSelectedMedallion({ ...m, athlete })}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {athlete.contactEmail}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {athlete.athleteNumber}
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                            🇿🇦 {athlete.asaLicenseNumber || "PENDING"}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              isWalker
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            }`}
                          >
                            <span>{isWalker ? "🚶 Walker" : "🏃 Runner"}</span>
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {athlete.membershipCategory.replace("_", " ")}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Member since {new Date(athlete.membershipStartDate).getFullYear()}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold ${
                              athlete.membershipStatus === "ACTIVE"
                                ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                                : athlete.membershipStatus === "LIFE_MEMBER"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            }`}
                          >
                            {athlete.membershipStatus === "ACTIVE" && <CheckCircle2 className="h-3 w-3" />}
                            {athlete.membershipStatus === "PENDING_RENEWAL" && <AlertCircle className="h-3 w-3" />}
                            <span>{athlete.membershipStatus.replace("_", " ")}</span>
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-block rounded-lg px-2.5 py-1 text-[10px] font-bold border shadow-xs ${
                              athlete.membershipFeeStatus === "PAID"
                                ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/80"
                                : "bg-rose-950/80 text-rose-300 border-rose-700/80"
                            }`}
                          >
                            {athlete.membershipFeeStatus}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Fast Renew button if pending or lapsed */}
                            {(athlete.membershipFeeStatus === "PENDING" || athlete.membershipStatus === "PENDING_RENEWAL" || athlete.membershipStatus === "LAPSED") && (
                              <button
                                onClick={() => handleRenewAthlete(athlete)}
                                disabled={renewingId === athlete.id}
                                className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1.5 text-xs font-bold text-white shadow-xs transition-colors disabled:opacity-50"
                                title="Renew membership dues for 1 annual cycle"
                              >
                                <RefreshCw className={`h-3.5 w-3.5 ${renewingId === athlete.id ? "animate-spin" : ""}`} />
                                <span className="hidden sm:inline">Renew</span>
                              </button>
                            )}

                            <button
                              onClick={() => setEditingAthlete(athlete)}
                              className="inline-flex items-center gap-1 rounded-xl border border-orange-500/50 bg-orange-950/40 p-2 text-orange-300 shadow-xs hover:bg-orange-900/60 transition-colors"
                              title="Edit Member Details"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => setActiveCardAthlete(athlete)}
                              className="inline-flex items-center gap-1 rounded-xl border border-orange-500/70 bg-[#F97316] p-2 text-white shadow-md transition-all duration-200 hover:bg-[#FB923C] hover:-translate-y-0.5"
                              title="View Digital Pass"
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => setDeletingAthlete(athlete)}
                              className="inline-flex items-center gap-1 rounded-xl border border-rose-700/60 bg-rose-950/40 p-2 text-rose-300 shadow-xs hover:bg-rose-900/60 transition-colors"
                              title="Archive or Delete Member"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* DIGITAL MEMBERSHIP CARD MODAL */}
      {activeCardAthlete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-700/80 bg-[#0F172A] p-6 text-white shadow-2xl">
            {/* Close Button */}
            <button
              onClick={() => setActiveCardAthlete(null)}
              className="absolute right-4 top-4 rounded-full bg-slate-800 p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Official Card Surface */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-[#1E293B] to-slate-950 p-6 border border-orange-500/40 shadow-xl">
              {/* Emblem & Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src="/images/emblem.png"
                    alt="Super Eagles Crest"
                    className="h-14 w-auto object-contain drop-shadow-md shrink-0"
                  />
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider text-orange-400">
                      Super Eagles Athletics Club
                    </div>
                    <div className="text-[10px] text-slate-300">
                      Official Athletics & Walking Member Card
                    </div>
                  </div>
                </div>

                <span className="rounded-full bg-orange-500/20 px-2.5 py-0.5 text-[10px] font-bold text-orange-300 border border-orange-500/40">
                  2026 SEASON
                </span>
              </div>

              {/* Member Details */}
              <div className="mt-6 space-y-1">
                <div className="text-xl font-black tracking-tight text-white">
                  {activeCardAthlete.firstName} {activeCardAthlete.lastName}
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-orange-300">
                  <span>{activeCardAthlete.disciplineCategory === "WALKER" ? "🚶 Official Club Walker" : "🏃 Official Club Runner"}</span>
                  <span>•</span>
                  <span>{activeCardAthlete.membershipCategory.replace(/_/g, " ")}</span>
                </div>
              </div>

              {/* Numbers Grid */}
              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-700/60 pt-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Club Number</div>
                  <div className="mt-0.5 font-mono text-sm font-black text-white">
                    {activeCardAthlete.athleteNumber}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ASA License #</div>
                  <div className="mt-0.5 font-mono text-sm font-black text-orange-400">
                    {activeCardAthlete.asaLicenseNumber || "REGISTERED"}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Membership Status</div>
                  <div className="mt-0.5 text-xs font-bold text-emerald-400">
                    {activeCardAthlete.membershipStatus.replace(/_/g, " ")}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Expiry Date</div>
                  <div className="mt-0.5 text-xs font-medium text-slate-300">
                    31 December 2026
                  </div>
                </div>
              </div>

              {/* Deterministic SVG Barcode Scanner Container - Zero Overlap */}
              <div className="mt-6 flex flex-col items-center justify-center rounded-xl bg-slate-950/90 border border-slate-800 p-3 text-center">
                <svg className="h-10 w-48 text-white" viewBox="0 0 160 36" fill="currentColor">
                  {/* High density vector barcode stripes */}
                  <rect x="0" y="0" width="3" height="36" />
                  <rect x="5" y="0" width="1.5" height="36" />
                  <rect x="9" y="0" width="4" height="36" />
                  <rect x="15" y="0" width="2" height="36" />
                  <rect x="19" y="0" width="1.5" height="36" />
                  <rect x="23" y="0" width="5" height="36" />
                  <rect x="30" y="0" width="2" height="36" />
                  <rect x="34" y="0" width="3" height="36" />
                  <rect x="39" y="0" width="1.5" height="36" />
                  <rect x="43" y="0" width="4" height="36" />
                  <rect x="49" y="0" width="2" height="36" />
                  <rect x="53" y="0" width="5" height="36" />
                  <rect x="60" y="0" width="1.5" height="36" />
                  <rect x="64" y="0" width="3" height="36" />
                  <rect x="69" y="0" width="4" height="36" />
                  <rect x="75" y="0" width="2" height="36" />
                  <rect x="79" y="0" width="5" height="36" />
                  <rect x="86" y="0" width="1.5" height="36" />
                  <rect x="90" y="0" width="3" height="36" />
                  <rect x="95" y="0" width="4" height="36" />
                  <rect x="101" y="0" width="2" height="36" />
                  <rect x="105" y="0" width="5" height="36" />
                  <rect x="112" y="0" width="2" height="36" />
                  <rect x="116" y="0" width="4" height="36" />
                  <rect x="122" y="0" width="1.5" height="36" />
                  <rect x="126" y="0" width="3" height="36" />
                  <rect x="131" y="0" width="5" height="36" />
                  <rect x="138" y="0" width="2" height="36" />
                  <rect x="142" y="0" width="4" height="36" />
                  <rect x="148" y="0" width="2" height="36" />
                  <rect x="152" y="0" width="4" height="36" />
                  <rect x="158" y="0" width="2" height="36" />
                </svg>
                <div className="mt-2 text-[10px] font-mono uppercase tracking-widest text-slate-300 font-bold">
                  {activeCardAthlete.athleteNumber} • SE-AMMS-ZA
                </div>
              </div>

              {/* Motto Footer */}
              <div className="mt-4 text-center text-[10px] italic text-slate-400">
                Fly High, Run True, Serve the Club
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setActiveCardAthlete(null)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors"
              >
                Close Pass
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conferred Medallion Inspection & WhatsApp Broadcast Modal */}
      <MedallionModal
        medallion={selectedMedallion}
        isOpen={!!selectedMedallion}
        onClose={() => setSelectedMedallion(null)}
      />

      {/* Edit Member Details Modal */}
      {editingAthlete && (
        <EditAthleteModal
          athlete={editingAthlete}
          isOpen={!!editingAthlete}
          currentUserRole="SUPER_ADMIN"
          onClose={() => setEditingAthlete(null)}
          onSaved={(updated) => {
            setAthletesList((prev) =>
              prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a))
            );
            setStatusNotification(`Member #${updated.athleteNumber} details updated successfully.`);
            setTimeout(() => setStatusNotification(null), 5000);
          }}
        />
      )}

      {/* Delete / Archive Member Modal */}
      {deletingAthlete && (
        <DeleteAthleteModal
          athlete={deletingAthlete}
          isOpen={!!deletingAthlete}
          onClose={() => setDeletingAthlete(null)}
          onDeleted={(athleteId, isPermanent) => {
            if (isPermanent) {
              setAthletesList((prev) => prev.filter((a) => a.id !== athleteId));
              setStatusNotification(`Member record permanently deleted.`);
            } else {
              setAthletesList((prev) =>
                prev.map((a) =>
                  a.id === athleteId
                    ? { ...a, membershipStatus: "LAPSED", membershipFeeStatus: "PENDING" }
                    : a
                )
              );
              setStatusNotification(`Member safely archived with LAPSED standing.`);
            }
            setTimeout(() => setStatusNotification(null), 5000);
          }}
        />
      )}
    </div>
  );
}
