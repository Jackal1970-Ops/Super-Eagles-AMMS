"use client";

import React, { useState } from "react";
import {
  DollarSign,
  Trophy,
  Award,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Download,
  Printer,
  Users,
  Heart,
  Flame,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Target,
  BarChart3,
} from "lucide-react";

export interface SponsorRoiData {
  totalDisbursementsZar: number;
  totalAthletesCount: number;
  sponsoredAthletesCount: number;
  eliteCount: number;
  developmentCount: number;
  totalVerifiedRaces: number;
  totalPodiumsCount: number;
  totalTopTenCount: number;
  totalCompetitionKm: number;
  totalTrainingKm: number;
  totalVolunteerHours: number;
  averageReciprocityRate: number;
  topPerformingAthletes: Array<{
    name: string;
    athleteNumber: string;
    discipline: string;
    podiums: number;
    annualSpend: number;
    performanceScore: number;
  }>;
}

export function SponsorRoiSummaryView({ data }: { data: SponsorRoiData }) {
  const [selectedPartner, setSelectedPartner] = useState<string>("ALL");

  // Calculated ROI indicators
  const costPerCompKm =
    data.totalCompetitionKm > 0
      ? Math.round(data.totalDisbursementsZar / data.totalCompetitionKm)
      : 0;

  const costPerPodium =
    data.totalPodiumsCount > 0
      ? Math.round(data.totalDisbursementsZar / data.totalPodiumsCount)
      : 0;

  const csiDevelopmentRatio =
    data.sponsoredAthletesCount > 0
      ? Math.round((data.developmentCount / data.sponsoredAthletesCount) * 100)
      : 0;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = [
      "Metric",
      "Value",
      "Benchmark / Context",
    ];
    const rows = [
      ["Total Corporate Sponsorship Investment", `R ${data.totalDisbursementsZar.toLocaleString()}`, "Season 2025/2026"],
      ["Total Sponsored Athletes Supported", `${data.sponsoredAthletesCount}`, "Across Elite & Development Squads"],
      ["Grassroots Development Ratio", `${csiDevelopmentRatio}%`, "Corporate Social Investment (CSI) Target"],
      ["Official Verified Race Starts", `${data.totalVerifiedRaces}`, "National & Provincial Championship Events"],
      ["Championship Podium Finishes (1st-3rd)", `${data.totalPodiumsCount}`, "Gold, Silver, Bronze Club Finishes"],
      ["Top-10 Championship Finishes", `${data.totalTopTenCount}`, "Premier Exposure Wave Finishes"],
      ["Aggregate Competition Kilometers", `${data.totalCompetitionKm.toLocaleString()} km`, "In Full Official Club Apparel"],
      ["Aggregate Training & Walk Mileage", `${data.totalTrainingKm.toLocaleString()} km`, "Community Brand Presence"],
      ["Total Community Volunteer Hours", `${data.totalVolunteerHours} hrs`, "Water Points & Road Marshalling"],
      ["Average Member Reciprocity Compliance", `${data.averageReciprocityRate}%`, "High Covenant Reliability"],
      ["Cost Per Verified Competition Km", `R ${costPerCompKm}/km`, "Direct Brand Exposure Efficiency"],
      ["Cost Per Podium Achievement", `R ${costPerPodium.toLocaleString()}`, "Elite High-Performance Yield"],
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SuperEagles_Sponsor_ROI_Brief_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Executive Sponsor Portal Banner */}
      <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-lg">
              <Award className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-white">
                  Corporate Sponsor Brand ROI & Exposure Portal
                </h2>
                <span className="rounded-md bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-xs font-bold text-amber-300">
                  Audit Verified
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-300 max-w-2xl leading-relaxed">
                Aggregated club performance yields, media branding metrics, and Corporate Social Investment (CSI) returns across all sponsored athletes and community walking initiatives.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors shadow-sm"
            >
              <Download className="h-4 w-4 text-amber-400" />
              <span>Export ROI Data</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-500 transition-colors shadow-md"
            >
              <Printer className="h-4 w-4" />
              <span>Print Executive Brief</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 High-Yield Impact Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Total Disbursements */}
        <div className="rounded-2xl border border-slate-800 bg-[#1E293B]/80 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Corporate Investment
            </span>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white">
              R {data.totalDisbursementsZar.toLocaleString()}
            </span>
            <div className="mt-1 text-xs text-slate-400">
              Across <b className="text-slate-200">{data.sponsoredAthletesCount}</b> sponsored athletes
            </div>
          </div>
        </div>

        {/* Metric 2: Podiums & Top-10s */}
        <div className="rounded-2xl border border-slate-800 bg-[#1E293B]/80 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Championship Podiums
            </span>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
              <Trophy className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-400">
                {data.totalPodiumsCount}
              </span>
              <span className="text-xs font-bold text-slate-400">
                ({data.totalTopTenCount} Top-10 Finishes)
              </span>
            </div>
            <div className="mt-1 text-xs text-slate-400">
              In official club branded competition apparel
            </div>
          </div>
        </div>

        {/* Metric 3: Brand Exposure Kilometers */}
        <div className="rounded-2xl border border-slate-800 bg-[#1E293B]/80 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Brand Presence Mileage
            </span>
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
              <Flame className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white">
              {data.totalCompetitionKm.toLocaleString()} <span className="text-sm font-semibold text-slate-400">km</span>
            </span>
            <div className="mt-1 text-xs text-slate-400">
              + {data.totalTrainingKm.toLocaleString()} km training community exposure
            </div>
          </div>
        </div>

        {/* Metric 4: CSI Community Impact */}
        <div className="rounded-2xl border border-slate-800 bg-[#1E293B]/80 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              CSI Development Ratio
            </span>
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
              <Heart className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-purple-300">
              {csiDevelopmentRatio}%
            </span>
            <div className="mt-1 text-xs text-slate-400">
              {data.totalVolunteerHours} volunteer service hours delivered
            </div>
          </div>
        </div>
      </div>

      {/* Exposure Efficiency & Yield Matrix */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Brand Efficiency Indicators */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-amber-400" />
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              Sponsorship Brand Efficiency & Yield
            </h3>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/80 p-3.5">
              <div>
                <span className="font-bold text-white text-xs block">
                  Cost per Verified Race Kilometer
                </span>
                <span className="text-[11px] text-slate-400">
                  Direct brand exposure at major sanctioned road races and walks
                </span>
              </div>
              <span className="text-base font-black text-emerald-400">
                R {costPerCompKm} <span className="text-xs font-semibold text-slate-400">/ km</span>
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/80 p-3.5">
              <div>
                <span className="font-bold text-white text-xs block">
                  Cost per Championship Podium Finish
                </span>
                <span className="text-[11px] text-slate-400">
                  High-profile medal ceremony and media backdrop exposure
                </span>
              </div>
              <span className="text-base font-black text-amber-400">
                R {costPerPodium.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/80 p-3.5">
              <div>
                <span className="font-bold text-white text-xs block">
                  Sponsorship Reciprocity Compliance
                </span>
                <span className="text-[11px] text-slate-400">
                  Athletes actively fulfilling water-point and internal run covenants
                </span>
              </div>
              <span className="text-base font-black text-purple-300">
                {data.averageReciprocityRate}% <span className="text-xs font-semibold text-slate-400">Compliant</span>
              </span>
            </div>
          </div>
        </div>

        {/* Top Brand Ambassadors Dossier */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Top Brand Ambassador Yield
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-semibold">High Performance & High Reciprocity</span>
          </div>

          <div className="space-y-2.5">
            {data.topPerformingAthletes.slice(0, 4).map((athlete) => (
              <div
                key={athlete.athleteNumber}
                className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/80 p-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{athlete.name}</span>
                    <span className="font-mono text-[10px] text-orange-400 bg-orange-950/80 border border-orange-800/60 px-1.5 py-0.2 rounded">
                      {athlete.athleteNumber}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {athlete.discipline} • API Score: <b className="text-emerald-400">{athlete.performanceScore}</b>
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-amber-400 block">
                    {athlete.podiums} Podiums
                  </span>
                  <span className="text-[10px] text-slate-400">
                    R {athlete.annualSpend.toLocaleString()} allocation
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

