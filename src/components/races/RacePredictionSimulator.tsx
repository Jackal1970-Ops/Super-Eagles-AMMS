"use client";

import React, { useState } from "react";
import { Sparkles, ArrowRight, Trophy, Calculator, ShieldCheck } from "lucide-react";
import { predictRacePerformance } from "@/lib/analytics/predictions";
import { formatDuration } from "@/lib/analytics/pace";

export function RacePredictionSimulator() {
  const [baselineDistanceKm, setBaselineDistanceKm] = useState(21.0975);
  const [baselineTimeFormatted, setBaselineTimeFormatted] = useState("1:22:00");
  const [targetDistanceKm, setTargetDistanceKm] = useState(42.195);
  const [targetGoalFormatted, setTargetGoalFormatted] = useState("2:55:00");
  const [durabilityFadePct, setDurabilityFadePct] = useState(3.5);
  const [longestRunKm, setLongestRunKm] = useState(35);

  // Parse baseline time
  const parseSeconds = (str: string) => {
    const parts = str.split(":");
    if (parts.length === 3) {
      return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
    }
    if (parts.length === 2) {
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
    return 4920;
  };

  const baselineSeconds = parseSeconds(baselineTimeFormatted);
  const targetGoalSeconds = parseSeconds(targetGoalFormatted);

  const prediction = predictRacePerformance({
    recentRaceDistanceKm: baselineDistanceKm,
    recentRaceTimeSeconds: baselineSeconds,
    targetDistanceKm: targetDistanceKm,
    targetGoalTimeSeconds: targetGoalSeconds,
    longestRunKm: longestRunKm,
    paceDurabilityDeteriorationPct: durabilityFadePct,
    trainingConsistencyRatio: 0.90,
  });

  return (
    <div className="rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 p-6 shadow-xl backdrop-blur-md">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F97316] text-white shadow-md">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Deterministic Race Capability Prediction Engine
            </h2>
            <p className="text-xs text-slate-400">
              Transparent mathematical projection using modified Riegel power curves, durability drift, and training volume.
            </p>
          </div>
        </div>
        <span className="rounded-full bg-orange-950/80 border border-orange-700/80 px-3 py-1 text-xs font-bold text-orange-300">
          Deterministic Mathematical Model
        </span>
      </div>

      {/* Simulator Inputs */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label className="block text-xs font-bold text-slate-300">
            Baseline Race Distance
          </label>
          <select
            value={baselineDistanceKm}
            onChange={(e) => setBaselineDistanceKm(parseFloat(e.target.value))}
            className="mt-1 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs font-semibold text-white focus:border-orange-500 focus:outline-none"
          >
            <option value="10">10 km Road</option>
            <option value="21.0975">Half Marathon (21.1 km)</option>
            <option value="42.195">Marathon (42.2 km)</option>
            <option value="56">Two Oceans (56 km)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300">
            Baseline Race Time (hh:mm:ss)
          </label>
          <input
            type="text"
            value={baselineTimeFormatted}
            onChange={(e) => setBaselineTimeFormatted(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs font-mono font-bold text-white focus:border-orange-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300">
            Target Race Distance
          </label>
          <select
            value={targetDistanceKm}
            onChange={(e) => setTargetDistanceKm(parseFloat(e.target.value))}
            className="mt-1 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs font-semibold text-white focus:border-orange-500 focus:outline-none"
          >
            <option value="42.195">Marathon (42.2 km)</option>
            <option value="56">Two Oceans Ultra (56 km)</option>
            <option value="89">Comrades Marathon (89 km)</option>
            <option value="21.0975">Half Marathon (21.1 km)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300">
            Target Goal Time (hh:mm:ss)
          </label>
          <input
            type="text"
            value={targetGoalFormatted}
            onChange={(e) => setTargetGoalFormatted(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs font-mono font-bold text-white focus:border-orange-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300">
            Pace Deterioration Drift (%)
          </label>
          <input
            type="number"
            step="0.5"
            value={durabilityFadePct}
            onChange={(e) => setDurabilityFadePct(parseFloat(e.target.value))}
            className="mt-1 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs font-bold text-white focus:border-orange-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Projection Results Strip */}
      <div className="mt-5 grid grid-cols-1 gap-4 rounded-xl border border-slate-700/80 bg-slate-900/90 p-5 shadow-lg sm:grid-cols-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Predicted Finish Range
          </span>
          <div className="mt-1 font-mono text-xl font-black text-white">
            {prediction.predictedRangeSeconds.minFormatted} – {prediction.predictedRangeSeconds.maxFormatted}
          </div>
          <span className="text-[10px] text-slate-400">Never presents false single-point precision</span>
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Central Estimate
          </span>
          <div className="mt-1 font-mono text-xl font-black text-emerald-400">
            {prediction.centralEstimateFormatted}
          </div>
          <span className="text-[10px] text-slate-400">
            Mathematical mean based on fatigue factor {prediction.fatigueFactorApplied}
          </span>
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Confidence Index
          </span>
          <div className="mt-1 text-xl font-black text-white">
            {prediction.confidencePercent}%
          </div>
          <span className="text-[10px] text-slate-400">Calculated from distance leap and history</span>
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Probability of Target Goal ({targetGoalFormatted})
          </span>
          <div className="mt-1 text-xl font-black text-blue-400">
            {prediction.probabilityOfTargetPercent !== undefined
              ? `${prediction.probabilityOfTargetPercent}% Chance`
              : "--"}
          </div>
          <span className="text-[10px] text-slate-400">Cumulative Gaussian probability distribution</span>
        </div>
      </div>

      {/* Model Assumptions Traceability */}
      {prediction.assumptions.length > 0 && (
        <div className="mt-4 rounded-xl bg-slate-900/80 border border-slate-800 p-3 text-xs text-slate-300">
          <div className="flex items-center gap-1.5 font-bold text-white">
            <ShieldCheck className="h-4 w-4 text-orange-400" />
            Transparent Prediction Factors Applied:
          </div>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-[11px] text-slate-300">
            {prediction.assumptions.map((ass, i) => (
              <li key={i}>{ass}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
