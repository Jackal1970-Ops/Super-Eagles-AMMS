"use client";

import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import { Trophy, TrendingUp, Filter } from "lucide-react";
import { formatDuration, formatPace } from "@/lib/analytics/pace";

export interface RaceResultData {
  id: string;
  raceName: string;
  date: string | Date;
  distanceKm: number;
  officialTimeSeconds: number;
  isPersonalBest?: boolean;
  notes?: string | null;
}

interface AthletePerformanceGraphProps {
  raceResults: RaceResultData[];
  athleteName: string;
}

export function AthletePerformanceGraph({
  raceResults,
  athleteName,
}: AthletePerformanceGraphProps) {
  const [distanceFilter, setDistanceFilter] = useState<string>("ALL");
  const [metricMode, setMetricMode] = useState<"PACE" | "TIME" | "SPEED">("PACE");

  // Filter and sort chronologically (oldest to newest for trajectory)
  const chartData = useMemo(() => {
    let filtered = [...raceResults];

    if (distanceFilter === "MARATHON") {
      filtered = filtered.filter((r) => r.distanceKm >= 40);
    } else if (distanceFilter === "HALF") {
      filtered = filtered.filter((r) => r.distanceKm >= 20 && r.distanceKm < 40);
    } else if (distanceFilter === "TEN_KM") {
      filtered = filtered.filter((r) => r.distanceKm >= 9 && r.distanceKm < 20);
    } else if (distanceFilter === "TIME_TRIAL") {
      filtered = filtered.filter((r) => r.distanceKm < 9);
    }

    filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return filtered.map((r) => {
      const d = new Date(r.date);
      const dateLabel = d.toLocaleDateString("en-ZA", { month: "short", year: "2-digit" });
      const paceSeconds = Math.round(r.officialTimeSeconds / r.distanceKm);
      const speedKmh = Number(((r.distanceKm / r.officialTimeSeconds) * 3600).toFixed(2));
      const paceMin = Number((paceSeconds / 60).toFixed(2));

      return {
        id: r.id,
        date: d,
        dateLabel,
        raceName: r.raceName,
        distanceKm: r.distanceKm,
        officialTimeSeconds: r.officialTimeSeconds,
        timeFormatted: formatDuration(r.officialTimeSeconds),
        paceSeconds,
        paceFormatted: formatPace(paceSeconds),
        paceMin, // Decimal minutes for charting (e.g. 4.25 min/km = 4:15)
        speedKmh,
        isPersonalBest: !!r.isPersonalBest,
      };
    });
  }, [raceResults, distanceFilter]);

  // Summary Metrics
  const summaryStats = useMemo(() => {
    if (raceResults.length === 0) return null;

    const marathons = raceResults.filter((r) => r.distanceKm >= 40);
    const halfs = raceResults.filter((r) => r.distanceKm >= 20 && r.distanceKm < 40);
    const tens = raceResults.filter((r) => r.distanceKm >= 9 && r.distanceKm < 20);

    const bestMarathon = marathons.sort((a, b) => a.officialTimeSeconds - b.officialTimeSeconds)[0];
    const bestHalf = halfs.sort((a, b) => a.officialTimeSeconds - b.officialTimeSeconds)[0];
    const bestTen = tens.sort((a, b) => a.officialTimeSeconds - b.officialTimeSeconds)[0];

    // Compute pace trajectory (comparison of first 2 vs last 2 races)
    let trendLabel = "Steady";
    let trendColor = "text-emerald-400";
    if (chartData.length >= 3) {
      const recentPace = chartData.slice(-2).reduce((sum, r) => sum + r.paceSeconds, 0) / 2;
      const initialPace = chartData.slice(0, 2).reduce((sum, r) => sum + r.paceSeconds, 0) / 2;
      const diffPercent = ((initialPace - recentPace) / initialPace) * 100;

      if (diffPercent > 2.5) {
        trendLabel = `+${diffPercent.toFixed(1)}% Faster (Aerobic Peak)`;
        trendColor = "text-emerald-400";
      } else if (diffPercent < -2.5) {
        trendLabel = `${Math.abs(diffPercent).toFixed(1)}% Aerobic Decay`;
        trendColor = "text-amber-400";
      } else {
        trendLabel = "Calibrated & Consistent";
        trendColor = "text-blue-400";
      }
    }

    return {
      totalRaces: raceResults.length,
      bestMarathon: bestMarathon ? formatDuration(bestMarathon.officialTimeSeconds) : null,
      bestHalf: bestHalf ? formatDuration(bestHalf.officialTimeSeconds) : null,
      bestTen: bestTen ? formatDuration(bestTen.officialTimeSeconds) : null,
      trendLabel,
      trendColor,
    };
  }, [raceResults, chartData]);

  if (raceResults.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400">
        <Trophy className="mx-auto h-8 w-8 text-slate-600 mb-2" />
        <p className="text-sm font-semibold">No official race results recorded yet.</p>
        <p className="text-xs text-slate-500 mt-1">
          Add official results from the button above to unlock the longitudinal performance curve.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <TrendingUp className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-black text-white">
              Official Performance & Pace Progression Curve
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            Longitudinal progression across verified competition results for {athleteName}.
          </p>
        </div>

        {/* Metric Mode Switcher */}
        <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950 p-1">
          <button
            type="button"
            onClick={() => setMetricMode("PACE")}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
              metricMode === "PACE"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Pace (min/km)
          </button>
          <button
            type="button"
            onClick={() => setMetricMode("SPEED")}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
              metricMode === "SPEED"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Speed (km/h)
          </button>
          <button
            type="button"
            onClick={() => setMetricMode("TIME")}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
              metricMode === "TIME"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Finish Time
          </button>
        </div>
      </div>

      {/* Distance Filter Chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
          <Filter className="h-3 w-3" /> Distance:
        </span>
        {[
          { id: "ALL", label: `All Races (${raceResults.length})` },
          { id: "MARATHON", label: "Marathons (42.2k)" },
          { id: "HALF", label: "Half Marathons (21.1k)" },
          { id: "TEN_KM", label: "10km Races" },
          { id: "TIME_TRIAL", label: "Time Trials (≤8k)" },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setDistanceFilter(f.id)}
            className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition-all ${
              distanceFilter === f.id
                ? "bg-[#F97316] text-white shadow-xs"
                : "border border-slate-800 bg-slate-950/70 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Quick Personal Bests Bar */}
      {summaryStats && (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Marathon PB
            </div>
            <div className="text-sm font-black text-amber-400">
              {summaryStats.bestMarathon || "--:--"}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Half Marathon PB
            </div>
            <div className="text-sm font-black text-blue-400">
              {summaryStats.bestHalf || "--:--"}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              10km PB
            </div>
            <div className="text-sm font-black text-purple-400">
              {summaryStats.bestTen || "--:--"}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Pace Trajectory
            </div>
            <div className={`text-xs font-black ${summaryStats.trendColor}`}>
              {summaryStats.trendLabel}
            </div>
          </div>
        </div>
      )}

      {/* Recharts Canvas */}
      <div className="h-[280px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 25, left: 25, bottom: 5 }}>
            <defs>
              <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
            <XAxis
              dataKey="dateLabel"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
            />
            <YAxis
              width={80}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
              domain={
                metricMode === "SPEED"
                  ? ["dataMin - 1", "dataMax + 1"]
                  : ["dataMin - 0.2", "dataMax + 0.2"]
              }
              tickFormatter={(val) => {
                if (metricMode === "SPEED") return `${Number(val).toFixed(1)} km/h`;
                if (metricMode === "PACE") {
                  const m = Math.floor(val);
                  const s = Math.round((val - m) * 60);
                  return `${m}:${s < 10 ? "0" : ""}${s}`;
                }
                return `${Math.round(val / 60)}m`;
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-2xl border border-slate-700 bg-slate-950 p-3 text-xs text-white shadow-2xl">
                      <div className="font-black text-green-400">{data.raceName}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(data.date).toLocaleDateString("en-ZA", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        • {data.distanceKm} km
                      </div>
                      <div className="mt-2 space-y-1 border-t border-slate-800 pt-1.5">
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">Official Time:</span>
                          <span className="font-mono font-bold text-white">
                            {data.timeFormatted}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">Average Pace:</span>
                          <span className="font-mono font-bold text-emerald-400">
                            {data.paceFormatted} /km
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">Speed:</span>
                          <span className="font-mono font-bold text-blue-400">
                            {data.speedKmh} km/h
                          </span>
                        </div>
                        {data.isPersonalBest && (
                          <div className="mt-1 rounded-md bg-amber-500/20 px-2 py-0.5 text-center text-[10px] font-black text-amber-300 border border-amber-500/30">
                            ⭐ Official Personal Best
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey={
                metricMode === "SPEED"
                  ? "speedKmh"
                  : metricMode === "PACE"
                  ? "paceMin"
                  : "officialTimeSeconds"
              }
              stroke="#10b981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#emeraldGrad)"
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                if (payload?.isPersonalBest) {
                  return (
                    <circle
                      key={`pb-${payload.id}`}
                      cx={cx}
                      cy={cy}
                      r={6}
                      fill="#f59e0b"
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  );
                }
                return (
                  <circle
                    key={`dot-${payload?.id}`}
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill="#10b981"
                    stroke="#090d16"
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{ r: 7, fill: "#22c55e", stroke: "#ffffff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/60">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
          <span>Gold Dot = Official Personal Best (PB)</span>
        </div>
        <div>Total Verified Results: {chartData.length}</div>
      </div>
    </div>
  );
}
