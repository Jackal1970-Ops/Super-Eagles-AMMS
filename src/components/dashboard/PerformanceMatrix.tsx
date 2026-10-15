"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Info,
  Sparkles,
  AlertTriangle,
  ArrowUpRight,
  Filter,
  Grid,
  List,
  Users,
  Award,
  HeartHandshake,
  TrendingUp,
  ArrowRight,
  SlidersHorizontal,
  RotateCcw,
  Save,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import { ScoringRulesModal } from "./ScoringRulesModal";

export interface MatrixAthlete {
  id: string;
  athleteNumber: string;
  name: string;
  discipline: string;
  performanceScore: number;  // 0 - 100 (Y-axis)
  contributionScore: number; // 0 - 100 (X-axis)
  sponsorshipTier: string;
  athleteStatus?: string;
  annualSupportZar: number;
  avatarInitials: string;
}

interface PerformanceMatrixProps {
  athletes: MatrixAthlete[];
  userRole?: string;
  initialSquad?: string;
  initialQuadrant?: "ALL" | "PRIORITY" | "RECIPROCITY" | "DEVELOPMENT" | "MANAGEMENT";
}

/**
 * Deterministic node dispersion relaxation algorithm with
 * STRICT QUADRANT BOUNDARY CLAMPING.
 * 
 * Prevents multiple athletes with identical or near-identical scores
 * from stacking invisibly on top of each other, WHILE MATHEMATICALLY
 * AND VISUALLY GUARANTEEING that no athlete node is ever pushed across
 * the performance or contribution benchmark crosshair lines.
 */
export function computeDispersedCoordinates(
  athletes: MatrixAthlete[],
  perfThreshold: number = 72,
  contribThreshold: number = 60
) {
  const nodes = athletes.map((a, idx) => ({
    ...a,
    x: Math.min(94, Math.max(6, a.contributionScore)),
    y: Math.min(94, Math.max(6, a.performanceScore)),
    origX: a.contributionScore,
    origY: a.performanceScore,
    idx,
  }));

  const MIN_DIST = 7.2; // generous spacing in % space to eliminate cramming
  const BOUNDARY_BUFFER = 2.2; // visual safety margin away from crosshair lines

  for (let iter = 0; iter < 25; iter++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < MIN_DIST) {
          const angle = dist > 0.01 ? Math.atan2(dy, dx) : (i * 1.618);
          const push = (MIN_DIST - dist) / 2 + 0.35;
          const pushX = Math.cos(angle) * push;
          const pushY = Math.sin(angle) * push;

          nodes[i].x = Math.min(94, Math.max(6, nodes[i].x - pushX));
          nodes[i].y = Math.min(94, Math.max(6, nodes[i].y - pushY));
          nodes[j].x = Math.min(94, Math.max(6, nodes[j].x + pushX));
          nodes[j].y = Math.min(94, Math.max(6, nodes[j].y + pushY));
        }
      }

      // STRICT QUADRANT BOUNDARY ENFORCEMENT PER RELAXATION STEP
      if (nodes[i].origY >= perfThreshold) {
        nodes[i].y = Math.max(perfThreshold + BOUNDARY_BUFFER, nodes[i].y);
      } else {
        nodes[i].y = Math.min(perfThreshold - BOUNDARY_BUFFER, nodes[i].y);
      }

      if (nodes[i].origX >= contribThreshold) {
        nodes[i].x = Math.max(contribThreshold + BOUNDARY_BUFFER, nodes[i].x);
      } else {
        nodes[i].x = Math.min(contribThreshold - BOUNDARY_BUFFER, nodes[i].x);
      }
    }
  }

  // FINAL ENFORCEMENT PASS: Absolute guarantee of quadrant invariant boundary compliance
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].origY >= perfThreshold) {
      nodes[i].y = Math.max(perfThreshold + BOUNDARY_BUFFER, Math.min(94, nodes[i].y));
    } else {
      nodes[i].y = Math.min(perfThreshold - BOUNDARY_BUFFER, Math.max(6, nodes[i].y));
    }

    if (nodes[i].origX >= contribThreshold) {
      nodes[i].x = Math.max(contribThreshold + BOUNDARY_BUFFER, Math.min(94, nodes[i].x));
    } else {
      nodes[i].x = Math.min(contribThreshold - BOUNDARY_BUFFER, Math.max(6, nodes[i].x));
    }
  }

  return nodes;
}

export function PerformanceMatrix({
  athletes,
  userRole,
  initialSquad,
  initialQuadrant = "ALL",
}: PerformanceMatrixProps) {
  const router = useRouter();
  const [selectedAthlete, setSelectedAthlete] = useState<MatrixAthlete | null>(null);
  const [hoveredAthlete, setHoveredAthlete] = useState<MatrixAthlete | null>(null);
  const [filterTier, setFilterTier] = useState<string>("ALL");
  const [squadFilter, setSquadFilter] = useState<string>(initialSquad || "ALL");
  const [selectedQuadrant, setSelectedQuadrant] = useState<"ALL" | "PRIORITY" | "RECIPROCITY" | "DEVELOPMENT" | "MANAGEMENT">(initialQuadrant);
  const [viewMode, setViewMode] = useState<"MATRIX" | "ROSTER">("MATRIX");

  // Dynamic Policy Crosshair Thresholds
  const [perfThreshold, setPerfThreshold] = useState<number>(72);
  const [contribThreshold, setContribThreshold] = useState<number>(60);
  const [showCalibrator, setShowCalibrator] = useState<boolean>(false);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [policySavedMsg, setPolicySavedMsg] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPerf = localStorage.getItem("AMMS_PERF_THRESHOLD");
      const savedContrib = localStorage.getItem("AMMS_CONTRIB_THRESHOLD");
      if (savedPerf && !isNaN(Number(savedPerf))) setPerfThreshold(Number(savedPerf));
      if (savedContrib && !isNaN(Number(savedContrib))) setContribThreshold(Number(savedContrib));
    }
  }, []);

  const handleSavePolicy = async () => {
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          configKey: "POLICY_MATRIX_THRESHOLDS",
          configValueJson: JSON.stringify({ perfThreshold, contribThreshold }),
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Unable to save policy thresholds.");
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("AMMS_PERF_THRESHOLD", String(perfThreshold));
        localStorage.setItem("AMMS_CONTRIB_THRESHOLD", String(contribThreshold));
      }
      setPolicySavedMsg("Policy crosshairs calibrated & saved as active standard!");
    } catch (error) {
      setPolicySavedMsg(error instanceof Error ? error.message : "Unable to save policy thresholds.");
    }
    setTimeout(() => setPolicySavedMsg(""), 4000);
  };

  const handleResetPolicy = () => {
    setPerfThreshold(72);
    setContribThreshold(60);
    if (typeof window !== "undefined") {
      localStorage.setItem("AMMS_PERF_THRESHOLD", "72");
      localStorage.setItem("AMMS_CONTRIB_THRESHOLD", "60");
    }
    setPolicySavedMsg("Reset to Club Standard defaults (Performance 72, Contribution 60).");
    setTimeout(() => setPolicySavedMsg(""), 4000);
  };

  const tierFilteredAthletes = useMemo(() => {
    return athletes.filter((a) => {
      const matchTier = filterTier === "ALL" || a.sponsorshipTier === filterTier;
      const matchSquad = squadFilter === "ALL" || a.athleteStatus === squadFilter;
      return matchTier && matchSquad;
    });
  }, [athletes, filterTier, squadFilter]);

  // Group athletes into 4 quadrants using calibrated dynamic benchmarks
  const quadrants = useMemo(() => {
    const priority = tierFilteredAthletes.filter((a) => a.performanceScore >= perfThreshold && a.contributionScore >= contribThreshold);
    const reciprocity = tierFilteredAthletes.filter((a) => a.performanceScore >= perfThreshold && a.contributionScore < contribThreshold);
    const development = tierFilteredAthletes.filter((a) => a.performanceScore < perfThreshold && a.contributionScore >= contribThreshold);
    const management = tierFilteredAthletes.filter((a) => a.performanceScore < perfThreshold && a.contributionScore < contribThreshold);
    return { priority, reciprocity, development, management };
  }, [tierFilteredAthletes, perfThreshold, contribThreshold]);

  const filteredAthletes = useMemo(() => {
    if (selectedQuadrant === "PRIORITY") return quadrants.priority;
    if (selectedQuadrant === "RECIPROCITY") return quadrants.reciprocity;
    if (selectedQuadrant === "DEVELOPMENT") return quadrants.development;
    if (selectedQuadrant === "MANAGEMENT") return quadrants.management;
    return tierFilteredAthletes;
  }, [selectedQuadrant, quadrants, tierFilteredAthletes]);

  const positionedNodes = useMemo(() => {
    return computeDispersedCoordinates(filteredAthletes, perfThreshold, contribThreshold);
  }, [filteredAthletes, perfThreshold, contribThreshold]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
      {/* Rules & Policy Guide Modal */}
      <ScoringRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        perfThreshold={perfThreshold}
        contribThreshold={contribThreshold}
      />

      {/* Header with Title, View Switcher & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-white">
              Performance vs. Club Contribution Matrix
            </h2>
            <span className="rounded-full bg-green-950/70 border border-green-800/60 px-2.5 py-0.5 text-[10px] font-bold text-green-300">
              Interactive 4-Quadrant
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            2D Multi-Axis Talent &amp; Reciprocity Intelligence (Cutoffs: Perf ≥ {perfThreshold}, Loyalty ≥ {contribThreshold})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Rules Guide Button */}
          {(userRole === "SUPER_ADMIN" || userRole === "CLUB_ADMIN") && <button
            onClick={() => setShowRulesModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-blue-500/40 bg-blue-950/40 px-3 py-1.5 text-xs font-bold text-blue-300 hover:bg-blue-900/60 hover:text-white transition-all shadow-sm cursor-pointer"
            title="Read how Elite athletes and the 4 quadrants are defined"
          >
            <BookOpen className="h-3.5 w-3.5 text-blue-400" />
            <span>Rules &amp; Policy Guide</span>
          </button>}

          {/* Calibrate Crosshairs Toggle */}
          <button
            onClick={() => setShowCalibrator(!showCalibrator)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all shadow-sm cursor-pointer ${
              showCalibrator
                ? "border-purple-500 bg-purple-950 text-white ring-2 ring-purple-500/50"
                : "border-slate-700 bg-slate-800 text-slate-200 hover:border-purple-500 hover:text-white"
            }`}
            title="Adjust horizontal and vertical crosshair policy thresholds"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-purple-400" />
            <span>Calibrate Crosshairs</span>
          </button>

          {/* View Mode Toggle: Matrix vs Roster */}
          <div className="flex rounded-xl border border-slate-800 bg-slate-950 p-0.5">
            <button
              onClick={() => setViewMode("MATRIX")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                viewMode === "MATRIX"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Grid className="h-3.5 w-3.5" />
              <span>Matrix</span>
            </button>
            <button
              onClick={() => setViewMode("ROSTER")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                viewMode === "ROSTER"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Roster ({filteredAthletes.length})</span>
            </button>
          </div>

          {/* Squad Status Filter */}
          <div className="flex items-center gap-1.5">
            <select
              value={squadFilter}
              onChange={(e) => setSquadFilter(e.target.value)}
              className="rounded-xl border border-purple-700/60 bg-purple-950/40 px-2.5 py-1.5 text-xs font-bold text-purple-200 focus:border-purple-500 focus:outline-none"
            >
              <option value="ALL">All Squads</option>
              <option value="ELITE">Elite Squad Only</option>
              <option value="PERFORMANCE">Performance Squad Only</option>
              <option value="DEVELOPMENT">Development Squad Only</option>
            </select>
          </div>

          {/* Tier Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-200 focus:border-green-500 focus:outline-none"
            >
              <option value="ALL">All Support Tiers ({athletes.length})</option>
              <option value="ELITE">Elite Tier</option>
              <option value="PERFORMANCE">Performance Tier</option>
              <option value="DEVELOPMENT">Development Tier</option>
              <option value="CONDITIONAL">Conditional</option>
            </select>
          </div>
        </div>
      </div>

      {/* Collapsible Policy Crosshair Calibration Drawer */}
      {showCalibrator && (
        <div className="mt-3.5 rounded-2xl border-2 border-purple-500/40 bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-950 p-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-purple-900/40 pb-3 gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-purple-600 text-white font-black text-xs shadow-sm">
                ⚙️
              </span>
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider">
                  Executive Crosshair Calibration & Sensitivity Controls
                </h4>
                <p className="text-[11px] text-slate-300">
                  Slide or enter values to test policy changes in real time. Crosshairs and classifications update dynamically.
                </p>
              </div>
            </div>
            {policySavedMsg && (
              <div className="flex items-center gap-1.5 rounded-lg bg-emerald-950 border border-emerald-500 px-2.5 py-1 text-xs font-bold text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>{policySavedMsg}</span>
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Performance Threshold Slider */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-green-300 flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500"></span>
                  Performance Index Cutoff (Y-Axis)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={50}
                    max={95}
                    value={perfThreshold}
                    onChange={(e) => setPerfThreshold(Math.min(95, Math.max(50, Number(e.target.value))))}
                    className="w-14 rounded-lg border border-slate-700 bg-slate-950 px-2 py-0.5 text-center font-mono text-xs font-black text-green-400 focus:border-green-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 font-semibold">/ 100</span>
                </div>
              </div>
              <input
                type="range"
                min={50}
                max={95}
                value={perfThreshold}
                onChange={(e) => setPerfThreshold(Number(e.target.value))}
                className="mt-3 w-full accent-green-500 cursor-pointer"
              />
              <div className="mt-1 flex justify-between text-[10px] text-slate-500 font-mono">
                <span>50 (Broad Elite)</span>
                <span className="text-green-400 font-bold">Current: {perfThreshold}</span>
                <span>95 (Olympian)</span>
              </div>
            </div>

            {/* Contribution Threshold Slider */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500"></span>
                  Club Loyalty / CCLI Cutoff (X-Axis)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={30}
                    max={90}
                    value={contribThreshold}
                    onChange={(e) => setContribThreshold(Math.min(90, Math.max(30, Number(e.target.value))))}
                    className="w-14 rounded-lg border border-slate-700 bg-slate-950 px-2 py-0.5 text-center font-mono text-xs font-black text-blue-400 focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 font-semibold">/ 100</span>
                </div>
              </div>
              <input
                type="range"
                min={30}
                max={90}
                value={contribThreshold}
                onChange={(e) => setContribThreshold(Number(e.target.value))}
                className="mt-3 w-full accent-blue-500 cursor-pointer"
              />
              <div className="mt-1 flex justify-between text-[10px] text-slate-500 font-mono">
                <span>30 (Relaxed)</span>
                <span className="text-blue-400 font-bold">Current: {contribThreshold}</span>
                <span>90 (Strict Core)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-3">
            <div className="text-[11px] text-slate-400">
              * Active Simulation: <strong className="text-emerald-400">{quadrants.priority.length} Priority</strong>,{" "}
              <strong className="text-amber-400">{quadrants.reciprocity.length} Reciprocity</strong>,{" "}
              <strong className="text-teal-400">{quadrants.development.length} Development</strong>,{" "}
              <strong className="text-slate-300">{quadrants.management.length} Management</strong>.
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetPolicy}
                className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Default (72 / 60)</span>
              </button>
              <button
                onClick={handleSavePolicy}
                className="flex items-center gap-1 rounded-xl bg-purple-600 px-4 py-1.5 text-xs font-black text-white hover:bg-purple-500 transition-all shadow-md shadow-purple-900/30 cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save as Club Policy</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quadrant KPI Quick Badges (Click to Filter View) */}
      <div className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => setSelectedQuadrant(selectedQuadrant === "PRIORITY" ? "ALL" : "PRIORITY")}
          className={`flex items-center justify-between rounded-xl px-3 py-2 transition-all cursor-pointer text-left ${
            selectedQuadrant === "PRIORITY"
              ? "border-2 border-emerald-500 bg-emerald-950/80 shadow-md ring-2 ring-emerald-500/50"
              : "border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 shadow-xs"
          }`}
          title="Click to view only Priority Elite Squad athletes"
        >
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              ★ Priority Talent
            </div>
            <div className="text-[9px] text-emerald-600 dark:text-emerald-400">High Perf &amp; High Loyalty</div>
          </div>
          <span className="rounded-full bg-emerald-700 px-2.5 py-0.5 text-xs font-black text-white">
            {quadrants.priority.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedQuadrant(selectedQuadrant === "RECIPROCITY" ? "ALL" : "RECIPROCITY")}
          className={`flex items-center justify-between rounded-xl px-3 py-2 transition-all cursor-pointer text-left ${
            selectedQuadrant === "RECIPROCITY"
              ? "border-2 border-amber-500 bg-amber-950/80 shadow-md ring-2 ring-amber-500/50"
              : "border border-amber-300 bg-amber-50/80 hover:bg-amber-100 dark:border-amber-800/50 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 shadow-xs"
          }`}
          title="Click to view only Reciprocity Review athletes"
        >
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
              ⚠️ Reciprocity Review
            </div>
            <div className="text-[9px] text-amber-600 dark:text-amber-400">High Speed / Low Service</div>
          </div>
          <span className="rounded-full bg-amber-600 px-2.5 py-0.5 text-xs font-black text-white">
            {quadrants.reciprocity.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedQuadrant(selectedQuadrant === "DEVELOPMENT" ? "ALL" : "DEVELOPMENT")}
          className={`flex items-center justify-between rounded-xl px-3 py-2 transition-all cursor-pointer text-left ${
            selectedQuadrant === "DEVELOPMENT"
              ? "border-2 border-teal-500 bg-teal-950/80 shadow-md ring-2 ring-teal-500/50"
              : "border border-teal-300 bg-teal-50/80 hover:bg-teal-100 dark:border-teal-800/50 dark:bg-teal-950/40 dark:hover:bg-teal-950/60 shadow-xs"
          }`}
          title="Click to view only Development Talent athletes"
        >
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-teal-800 dark:text-teal-300">
              🌱 Development Talent
            </div>
            <div className="text-[9px] text-teal-600 dark:text-teal-400">High Loyalty / Rising Perf</div>
          </div>
          <span className="rounded-full bg-teal-700 px-2.5 py-0.5 text-xs font-black text-white">
            {quadrants.development.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedQuadrant(selectedQuadrant === "MANAGEMENT" ? "ALL" : "MANAGEMENT")}
          className={`flex items-center justify-between rounded-xl px-3 py-2 transition-all cursor-pointer text-left ${
            selectedQuadrant === "MANAGEMENT"
              ? "border-2 border-slate-400 bg-slate-800 shadow-md ring-2 ring-slate-400/50"
              : "border border-slate-300 bg-slate-100/90 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:bg-slate-800 shadow-xs"
          }`}
          title="Click to view only Management Review athletes"
        >
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              📋 Management Review
            </div>
            <div className="text-[9px] text-slate-500 dark:text-slate-400">Lower Score / Watchlist</div>
          </div>
          <span className="rounded-full bg-slate-600 px-2.5 py-0.5 text-xs font-black text-white">
            {quadrants.management.length}
          </span>
        </button>
      </div>

      {selectedQuadrant !== "ALL" && (
        <div className="mt-2.5 flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2 text-xs">
          <span className="text-slate-300">
            Filtering by <strong className="text-white">{selectedQuadrant}</strong> quadrant ({filteredAthletes.length} athletes)
          </span>
          <button
            type="button"
            onClick={() => setSelectedQuadrant("ALL")}
            className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] font-bold text-orange-400 hover:bg-slate-700 transition-colors"
          >
            ✕ Reset to All ({tierFilteredAthletes.length})
          </button>
        </div>
      )}

      {viewMode === "MATRIX" ? (
        /* ================= GUARANTEED HEIGHT MATRIX VIEW ================= */
        <div className="mt-4 flex flex-col select-none">
          {/* Top Axis Label Indicator */}
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pb-1 px-14">
            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
              ← Low Club Contribution (&lt; {contribThreshold})
            </span>
            <span className="text-slate-400 uppercase tracking-widest text-[10px]">
              Performance Index vs. Club Contribution &amp; Loyalty Score
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              High Club Contribution (≥ {contribThreshold}) →
            </span>
          </div>

          <div className="flex w-full">
            {/* Dedicated Left Y-Axis Rail with Exact Proportional Tick Positioning */}
            <div className="relative w-14 shrink-0 h-[560px] lg:h-[620px] select-none border-t-2 border-b-2 border-transparent">
              {/* Static Y-Axis Ticks (100, 75, 50, 25, 0) - suppressed if threshold tick is adjacent */}
              {[
                { val: 100, label: "100", sub: "Max" },
                { val: 75, label: "75", sub: "" },
                { val: 50, label: "50", sub: "" },
                { val: 25, label: "25", sub: "" },
                { val: 0, label: "0", sub: "Min" },
              ]
                .filter((tick) => Math.abs(tick.val - perfThreshold) >= 5)
                .map((tick) => (
                  <div
                    key={tick.val}
                    style={{ top: `${100 - tick.val}%` }}
                    className="absolute right-0 flex items-center gap-1.5 -translate-y-1/2"
                  >
                    <div className="flex flex-col items-end leading-none">
                      <span className="text-[11px] font-mono font-bold text-slate-400">
                        {tick.label}
                      </span>
                      {tick.sub && (
                        <span className="text-[8px] font-extrabold text-slate-500 uppercase">
                          {tick.sub}
                        </span>
                      )}
                    </div>
                    {/* Tick Notch */}
                    <div className="h-[1px] w-2 bg-slate-700" />
                  </div>
                ))}

              {/* Dynamic Calibrated Policy Threshold Tick (Elite Standard) - Collinear with Canvas Crosshair */}
              <div
                style={{ top: `${100 - perfThreshold}%` }}
                className="absolute right-0 flex items-center gap-1.5 -translate-y-1/2 z-20 transition-all duration-300"
              >
                <div className="flex flex-col items-end leading-none bg-slate-900/90 rounded px-1 py-0.5 border border-green-500/40 shadow-sm">
                  <span className="text-[11px] font-mono font-black text-green-400">
                    {perfThreshold}
                  </span>
                  <span className="text-[8px] font-extrabold text-green-400 uppercase tracking-tighter">
                    Elite
                  </span>
                </div>
                {/* Active Indicator Notch */}
                <div className="h-[2px] w-2.5 bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]" />
              </div>
            </div>

            {/* Matrix Plot Canvas Area (EXPANDED TO 620px HEIGHT) */}
            <div className="relative h-[560px] lg:h-[620px] flex-1 rounded-2xl border-2 border-slate-800 bg-slate-950/90 shadow-2xl overflow-hidden">
              {/* Subtle Grid Lines at 25, 50, 75% */}
              <div className="pointer-events-none absolute inset-x-0 bottom-1/4 border-b border-dashed border-slate-800/60" />
              <div className="pointer-events-none absolute inset-x-0 bottom-2/4 border-b border-dashed border-slate-800/60" />
              <div className="pointer-events-none absolute inset-x-0 bottom-3/4 border-b border-dashed border-slate-800/60" />
              <div className="pointer-events-none absolute inset-y-0 left-1/4 border-r border-dashed border-slate-800/60" />
              <div className="pointer-events-none absolute inset-y-0 left-2/4 border-r border-dashed border-slate-200 dark:border-slate-800/60" />
              <div className="pointer-events-none absolute inset-y-0 left-3/4 border-r border-dashed border-slate-200 dark:border-slate-800/60" />

              {/* 4 Quadrant Background Tints */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Quadrant 1: Top-Right (Priority Elite) */}
                <div
                  style={{
                    left: `${contribThreshold}%`,
                    bottom: `${perfThreshold}%`,
                    top: 0,
                    right: 0,
                  }}
                  className="absolute bg-emerald-500/8 border-l-2 border-b-2 border-dashed border-emerald-500/30 p-3 transition-all duration-300"
                >
                  <span className="rounded-lg bg-emerald-100/90 px-2 py-0.5 text-[11px] font-black text-emerald-900 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                    ★ Priority Talent (High Perf &amp; Loyalty)
                  </span>
                </div>

                {/* Quadrant 2: Top-Left (Reciprocity Review) */}
                <div
                  style={{
                    left: 0,
                    right: `${100 - contribThreshold}%`,
                    bottom: `${perfThreshold}%`,
                    top: 0,
                  }}
                  className="absolute bg-amber-500/8 border-r-2 border-b-2 border-dashed border-amber-500/30 p-3 transition-all duration-300"
                >
                  <span className="rounded-lg bg-amber-100/90 px-2 py-0.5 text-[11px] font-black text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                    ⚠️ Sponsorship Reciprocity Review
                  </span>
                </div>

                {/* Quadrant 3: Bottom-Right (Development) */}
                <div
                  style={{
                    left: `${contribThreshold}%`,
                    top: `${100 - perfThreshold}%`,
                    bottom: 0,
                    right: 0,
                  }}
                  className="absolute bg-teal-500/8 border-l-2 border-t-2 border-dashed border-teal-500/30 p-3 flex flex-col justify-end transition-all duration-300"
                >
                  <span className="self-start rounded-lg bg-teal-100/90 px-2 py-0.5 text-[11px] font-black text-teal-900 border border-teal-300 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800">
                    🌱 Development Opportunity
                  </span>
                </div>

                {/* Quadrant 4: Bottom-Left (Management Review) */}
                <div
                  style={{
                    left: 0,
                    right: `${100 - contribThreshold}%`,
                    top: `${100 - perfThreshold}%`,
                    bottom: 0,
                  }}
                  className="absolute bg-slate-500/8 border-r-2 border-t-2 border-dashed border-slate-400/30 p-3 flex flex-col justify-end transition-all duration-300"
                >
                  <span className="self-start rounded-lg bg-slate-200/90 px-2 py-0.5 text-[11px] font-black text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                    📋 Management Review
                  </span>
                </div>
              </div>

              {/* Threshold Crosshair Benchmark Lines with High Precision Glow */}
              <div
                style={{ top: `${100 - perfThreshold}%` }}
                className="pointer-events-none absolute inset-x-0 h-[2px] -translate-y-1/2 bg-green-500/80 dark:bg-green-400/80 z-10 shadow-[0_0_8px_rgba(34,197,94,0.6)] transition-all duration-300"
              />
              <div
                style={{ left: `${contribThreshold}%` }}
                className="pointer-events-none absolute inset-y-0 w-[2px] -translate-x-1/2 bg-blue-500/80 dark:bg-blue-400/80 z-10 shadow-[0_0_8px_rgba(59,130,246,0.6)] transition-all duration-300"
              />

              {/* Athletes Plot Points (Dispersed Collision-Free with Strict Quadrant Boundary Lock) */}
              <div className="absolute inset-0">
                {positionedNodes.map((a) => {
                  const isReciprocityAlert = a.performanceScore >= perfThreshold && a.contributionScore < contribThreshold;
                  const isPriority = a.performanceScore >= perfThreshold && a.contributionScore >= contribThreshold;
                  const isDevelopment = a.performanceScore < perfThreshold && a.contributionScore >= contribThreshold;
                  const isSelected = selectedAthlete?.id === a.id;
                  const isHovered = hoveredAthlete?.id === a.id;

                  return (
                    <div
                      key={a.id}
                      style={{
                        left: `${a.x}%`,
                        bottom: `${a.y}%`,
                      }}
                      className={`absolute -translate-x-1/2 translate-y-1/2 cursor-pointer transition-all duration-200 ${
                        isSelected || isHovered ? "z-30 scale-125" : "z-20 hover:scale-115"
                      }`}
                      onClick={() => setSelectedAthlete(a)}
                      onMouseEnter={() => setHoveredAthlete(a)}
                      onMouseLeave={() => setHoveredAthlete(null)}
                      onDoubleClick={() => router.push(`/athletes/${a.id}`)}
                    >
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-black shadow-lg border-2 border-white dark:border-slate-900 transition-all ${
                          isSelected
                            ? "ring-4 ring-amber-400 ring-offset-2 scale-110"
                            : ""
                        } ${
                          isPriority
                            ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-900/30"
                            : isReciprocityAlert
                            ? "bg-amber-500 text-white hover:bg-amber-400 ring-2 ring-amber-400 animate-pulse shadow-amber-900/30"
                            : isDevelopment
                            ? "bg-teal-600 text-white hover:bg-teal-500 shadow-teal-900/30"
                            : "bg-slate-700 text-white hover:bg-slate-600"
                        }`}
                        title={`${a.name} (${a.athleteNumber})`}
                      >
                        {a.avatarInitials}
                      </div>

                      {/* Tooltip on Hover - Guaranteed zero text overlap & zero clipping */}
                      {isHovered && (
                        <div className={`pointer-events-none absolute z-50 min-w-[260px] w-max rounded-2xl border border-slate-700 bg-slate-950/98 p-3.5 text-white shadow-2xl backdrop-blur-md text-left ${
                          a.y > 55 ? "top-full mt-3" : "bottom-full mb-3"
                        } ${
                          a.x > 65 ? "right-0" : a.x < 35 ? "left-0" : "left-1/2 -translate-x-1/2"
                        }`}>
                          <div className="text-xs font-black text-white flex items-center justify-between gap-2">
                            <span className="truncate">{a.name}</span>
                            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono font-bold text-green-300 shrink-0">
                              {a.athleteNumber}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            Discipline: <strong className="text-white">{a.discipline}</strong>
                          </div>
                          <div className="mt-2.5 space-y-1.5 border-t border-slate-800 pt-2 text-[11px]">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-slate-400">Perf Index:</span>
                              <span className="font-mono font-bold text-green-400">{a.performanceScore} / 100</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-slate-400">Club Loyalty:</span>
                              <span className="font-mono font-bold text-blue-400">{a.contributionScore} / 100</span>
                            </div>
                            <div className="flex items-center justify-between gap-3 border-t border-slate-800/60 pt-1.5 text-slate-300">
                              <span className="text-slate-400">Contract Squad:</span>
                              <span className="font-bold text-purple-300 uppercase">{a.athleteStatus || "PERFORMANCE"}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3 text-slate-300">
                              <span className="text-slate-400">Sponsorship Tier:</span>
                              <span className="font-bold text-amber-300 uppercase">{a.sponsorshipTier} (R{a.annualSupportZar.toLocaleString()})</span>
                            </div>
                            <div className="flex items-center justify-between gap-3 border-t border-slate-800/60 pt-1.5">
                              <span className="text-slate-400 text-[10px]">Matrix Placement:</span>
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                isPriority
                                  ? "bg-emerald-950 text-emerald-300 border border-emerald-700/60"
                                  : isReciprocityAlert
                                  ? "bg-amber-950 text-amber-300 border border-amber-700/60"
                                  : isDevelopment
                                  ? "bg-teal-950 text-teal-300 border border-teal-700/60"
                                  : "bg-slate-800 text-slate-300 border border-slate-700"
                              }`}>
                                {isPriority
                                  ? "Priority (High Perf + Loyalty)"
                                  : isReciprocityAlert
                                  ? "Reciprocity Review (Low Loyalty)"
                                  : isDevelopment
                                  ? "Development Opportunity"
                                  : "Management Watchlist"}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom X-Axis Rail with Exact Proportional Tick Alignment */}
          <div className="flex w-full select-none pt-2">
            {/* Spacer matching left Y-Axis width */}
            <div className="w-14 shrink-0" />

            {/* Ticks container exactly matching the canvas width */}
            <div className="relative h-12 flex-1 border-l-2 border-r-2 border-transparent">
              {/* Static X-Axis Ticks (0, 25, 50, 75, 100) - suppressed if adjacent to threshold */}
              {[
                { val: 0, label: "0", sub: "Min" },
                { val: 25, label: "25", sub: "" },
                { val: 50, label: "50", sub: "" },
                { val: 75, label: "75", sub: "" },
                { val: 100, label: "100", sub: "Max" },
              ]
                .filter((tick) => Math.abs(tick.val - contribThreshold) >= 6)
                .map((tick) => (
                  <div
                    key={tick.val}
                    style={{ left: `${tick.val}%` }}
                    className="absolute top-0 flex flex-col items-center -translate-x-1/2"
                  >
                    {/* Tick Notch */}
                    <div className="h-2 w-[1px] bg-slate-700" />
                    <span className="mt-1 font-mono text-[11px] font-bold text-slate-400 leading-none">
                      {tick.label}
                    </span>
                    {tick.sub && (
                      <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-tighter">
                        {tick.sub}
                      </span>
                    )}
                  </div>
                ))}

              {/* Dynamic Calibrated Policy Threshold Tick (Loyalty Cutoff) */}
              <div
                style={{ left: `${contribThreshold}%` }}
                className="absolute top-0 flex flex-col items-center -translate-x-1/2 z-20 transition-all duration-300"
              >
                {/* Active Indicator Notch */}
                <div className="h-2.5 w-[2px] bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]" />
                <div className="mt-1 flex flex-col items-center leading-none bg-slate-900/90 rounded px-1.5 py-0.5 border border-blue-500/40 shadow-sm whitespace-nowrap">
                  <span className="font-mono text-[11px] font-black text-blue-400">
                    {contribThreshold}
                  </span>
                  <span className="text-[8px] font-extrabold text-blue-400 uppercase tracking-tighter">
                    Loyalty Cutoff
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2 text-center text-xs font-black uppercase tracking-wider text-slate-400 pl-14">
            Club Contribution &amp; Loyalty Index (CCLI) Score (0 → 100)
          </div>
        </div>
      ) : (
        /* ================= QUADRANT ROSTER VIEW ================= */
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Card 1: Priority Elite */}
          {(selectedQuadrant === "ALL" || selectedQuadrant === "PRIORITY") && (
          <div className={`rounded-2xl border border-emerald-300 bg-emerald-50/50 p-4 dark:border-emerald-800/50 dark:bg-emerald-950/20 shadow-xs ${selectedQuadrant === "PRIORITY" ? "lg:col-span-2 ring-2 ring-emerald-500" : ""}`}>
            <div className="flex items-center justify-between border-b border-emerald-200 pb-2.5 dark:border-emerald-800/40">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-600 text-xs font-black text-white shadow-sm">
                  ★
                </span>
                <div>
                  <h3 className="text-xs font-black text-emerald-950 dark:text-emerald-300">
                    Priority Talent (High Performance &amp; Loyalty)
                  </h3>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400">
                    High Performance (≥ {perfThreshold}) &amp; High Club Loyalty (≥ {contribThreshold})
                  </div>
                </div>
              </div>
              <span className="rounded-full bg-emerald-200 px-2.5 py-0.5 text-xs font-black text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200">
                {quadrants.priority.length} Athletes
              </span>
            </div>

            <div className="mt-3 divide-y divide-emerald-100 dark:divide-emerald-900/30 max-h-[300px] overflow-y-auto pr-1">
              {quadrants.priority.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-700 text-[10px] font-black text-white shadow-xs">
                      {a.avatarInitials}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{a.name}</div>
                      <div className="text-[10px] text-slate-500">{a.athleteNumber} • {a.discipline}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                        Perf: {a.performanceScore} | CCLI: {a.contributionScore}
                      </div>
                      <div className="text-[9px] text-slate-400">R{a.annualSupportZar.toLocaleString()} / yr</div>
                    </div>
                    <Link
                      href={`/athletes/${a.id}`}
                      className="rounded-lg bg-emerald-700 p-1.5 text-white hover:bg-emerald-600 transition-all"
                      title="Open 360 Profile"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Card 2: Reciprocity Review */}
          {(selectedQuadrant === "ALL" || selectedQuadrant === "RECIPROCITY") && (
          <div className={`rounded-2xl border border-amber-300 bg-amber-50/50 p-4 dark:border-amber-800/50 dark:bg-amber-950/20 shadow-xs ${selectedQuadrant === "RECIPROCITY" ? "lg:col-span-2 ring-2 ring-amber-500" : ""}`}>
            <div className="flex items-center justify-between border-b border-amber-200 pb-2.5 dark:border-amber-800/40">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500 text-xs font-black text-white shadow-sm">
                  ⚠️
                </span>
                <div>
                  <h3 className="text-xs font-black text-amber-950 dark:text-amber-300">
                    Sponsorship Reciprocity Review
                  </h3>
                  <div className="text-[10px] text-amber-700 dark:text-amber-400">
                    High Speed (≥ {perfThreshold}) / Low Club Loyalty (&lt; {contribThreshold})
                  </div>
                </div>
              </div>
              <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-black text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                {quadrants.reciprocity.length} Athletes
              </span>
            </div>

            <div className="mt-3 divide-y divide-amber-100 dark:divide-amber-900/30 max-h-[300px] overflow-y-auto pr-1">
              {quadrants.reciprocity.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">No athletes under review</div>
              ) : (
                quadrants.reciprocity.map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-2 text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-600 text-[10px] font-black text-white shadow-xs">
                        {a.avatarInitials}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{a.name}</div>
                        <div className="text-[10px] text-slate-500">{a.athleteNumber} • {a.discipline}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                          Perf: {a.performanceScore} | CCLI: {a.contributionScore}
                        </div>
                        <div className="text-[9px] text-slate-400">R{a.annualSupportZar.toLocaleString()} / yr</div>
                      </div>
                      <Link
                        href={`/athletes/${a.id}`}
                        className="rounded-lg bg-amber-600 p-1.5 text-white hover:bg-amber-500 transition-all"
                        title="Open 360 Profile"
                      >
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          )}

          {/* Card 3: Development Opportunity */}
          {(selectedQuadrant === "ALL" || selectedQuadrant === "DEVELOPMENT") && (
          <div className={`rounded-2xl border border-teal-300 bg-teal-50/50 p-4 dark:border-teal-800/50 dark:bg-teal-950/20 shadow-xs ${selectedQuadrant === "DEVELOPMENT" ? "lg:col-span-2 ring-2 ring-teal-500" : ""}`}>
            <div className="flex items-center justify-between border-b border-teal-200 pb-2.5 dark:border-teal-800/40">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-teal-600 text-xs font-black text-white shadow-sm">
                  🌱
                </span>
                <div>
                  <h3 className="text-xs font-black text-teal-950 dark:text-teal-300">
                    Development Opportunity
                  </h3>
                  <div className="text-[10px] text-teal-700 dark:text-teal-400">
                    High Club Loyalty (≥ {contribThreshold}) / Rising Talent (&lt; {perfThreshold})
                  </div>
                </div>
              </div>
              <span className="rounded-full bg-teal-200 px-2.5 py-0.5 text-xs font-black text-teal-900 dark:bg-teal-900 dark:text-teal-200">
                {quadrants.development.length} Athletes
              </span>
            </div>

            <div className="mt-3 divide-y divide-teal-100 dark:divide-teal-900/30 max-h-[300px] overflow-y-auto pr-1">
              {quadrants.development.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-700 text-[10px] font-black text-white shadow-xs">
                      {a.avatarInitials}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{a.name}</div>
                      <div className="text-[10px] text-slate-500">{a.athleteNumber} • {a.discipline}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <div className="text-[10px] font-bold text-teal-700 dark:text-teal-400">
                        Perf: {a.performanceScore} | CCLI: {a.contributionScore}
                      </div>
                      <div className="text-[9px] text-slate-400">R{a.annualSupportZar.toLocaleString()} / yr</div>
                    </div>
                    <Link
                      href={`/athletes/${a.id}`}
                      className="rounded-lg bg-teal-700 p-1.5 text-white hover:bg-teal-600 transition-all"
                      title="Open 360 Profile"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Card 4: Management Review */}
          {(selectedQuadrant === "ALL" || selectedQuadrant === "MANAGEMENT") && (
          <div className={`rounded-2xl border border-slate-300 bg-slate-100/60 p-4 dark:border-slate-700 dark:bg-slate-800/40 shadow-xs ${selectedQuadrant === "MANAGEMENT" ? "lg:col-span-2 ring-2 ring-slate-400" : ""}`}>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-600 text-xs font-black text-white shadow-sm">
                  📋
                </span>
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white">
                    Management Review
                  </h3>
                  <div className="text-[10px] text-slate-500">
                    Lower Performance (&lt; {perfThreshold}) &amp; Lower Participation (&lt; {contribThreshold})
                  </div>
                </div>
              </div>
              <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-black text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                {quadrants.management.length} Athletes
              </span>
            </div>

            <div className="mt-3 divide-y divide-slate-200 dark:divide-slate-700 max-h-[300px] overflow-y-auto pr-1">
              {quadrants.management.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-[10px] font-black text-white shadow-xs">
                      {a.avatarInitials}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{a.name}</div>
                      <div className="text-[10px] text-slate-500">{a.athleteNumber} • {a.discipline}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                        Perf: {a.performanceScore} | CCLI: {a.contributionScore}
                      </div>
                      <div className="text-[9px] text-slate-400">R{a.annualSupportZar.toLocaleString()} / yr</div>
                    </div>
                    <Link
                      href={`/athletes/${a.id}`}
                      className="rounded-lg bg-slate-700 p-1.5 text-white hover:bg-slate-600 transition-all"
                      title="Open 360 Profile"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}
        </div>
      )}

      {/* Selected Athlete Drilldown Detail Card */}
      {selectedAthlete ? (
        <div className="mt-4 flex flex-col justify-between gap-3 rounded-2xl border border-green-700/40 bg-gradient-to-r from-green-950/50 via-slate-900 to-slate-900 p-4 text-white sm:flex-row sm:items-center shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-600 text-sm font-black text-white shadow-md border-2 border-green-400/50">
              {selectedAthlete.avatarInitials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-white">
                  {selectedAthlete.name}
                </span>
                <span className="rounded-lg bg-slate-800 px-2 py-0.5 text-xs font-mono font-bold text-green-300 border border-slate-700">
                  {selectedAthlete.athleteNumber}
                </span>
                <span className="rounded-full bg-green-900/80 px-2.5 py-0.5 text-xs font-bold text-green-300 border border-green-700/60">
                  {selectedAthlete.sponsorshipTier}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-slate-300">
                <div>
                  Performance Index:{" "}
                  <strong className="text-green-400 text-sm">{selectedAthlete.performanceScore}/100</strong>
                </div>
                <div>
                  Club Loyalty (CCLI):{" "}
                  <strong className="text-blue-400 text-sm">{selectedAthlete.contributionScore}/100</strong>
                </div>
                <div>
                  Annual Support:{" "}
                  <strong className="text-amber-300 text-sm">R{selectedAthlete.annualSupportZar.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          </div>

          <Link
            href={`/athletes/${selectedAthlete.id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#FB923C] transition-all shrink-0 hover:-translate-y-0.5"
          >
            <span>Open 360° Profile</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-slate-700/80 bg-slate-900/60 p-3 text-center text-xs text-slate-300">
          Click any athlete node on the matrix to view quick metrics or double-click to navigate directly to their 360° profile.
        </div>
      )}
    </div>
  );
}
