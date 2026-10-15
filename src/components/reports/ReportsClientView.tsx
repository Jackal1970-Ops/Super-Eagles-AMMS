"use client";

import React, { useState } from "react";
import {
  FileText,
  Download,
  Printer,
  Filter,
  CheckCircle2,
  Calendar,
  DollarSign,
  Trophy,
  Activity,
  HeartHandshake,
} from "lucide-react";
import { formatDuration } from "@/lib/analytics/pace";

interface ReportsClientViewProps {
  athletes: any[];
  races: any[];
  coaches: any[];
}

export function ReportsClientView({
  athletes,
  races,
  coaches,
}: ReportsClientViewProps) {
  const [selectedReport, setSelectedReport] = useState<string>("PORTFOLIO");
  const [filterSquad, setFilterSquad] = useState<string>("ALL");
  const [filterCoach, setFilterCoach] = useState<string>("ALL");

  const reportDefinitions = [
    { id: "PORTFOLIO", title: "Sponsorship Portfolio Report", desc: "Consolidated register of all active sponsored athletes, tiers, and allocations." },
    { id: "PERFORMANCE", title: "Athlete Performance Report", desc: "Longitudinal verified times, normalisation scores, and trajectory classification." },
    { id: "SPONSORSHIP_REVIEW", title: "Athlete Sponsorship Review", desc: "Sponsorship score breakdown, reciprocity balance, and committee recommendations." },
    { id: "CONTRIBUTION", title: "Club Contribution & Loyalty Report", desc: "Internal run attendance rates, volunteer service hours, and approved exemptions." },
    { id: "DEVELOPMENT", title: "Athlete Development Report", desc: "High-potential talent candidates displaying accelerated improvement and consistency." },
    { id: "READINESS", title: "Upcoming Race Readiness Report", desc: "Non-medical coaching readiness, ACWR workload status, and target probabilities." },
    { id: "EXPENDITURE", title: "Sponsorship Expenditure Report", desc: "Itemised financial ledger across stipends, travel, flights, gear, and entries." },
    { id: "CONDITIONAL", title: "Conditional Sponsorship Report", desc: "Compliance tracker for athletes with pending covenants and milestone deadlines." },
    { id: "EXCEPTIONS", title: "Management Exception Report", desc: "Reciprocity review flags, performance decline warnings, and decision overrides." },
  ];

  const filteredAthletes = athletes.filter((a) => {
    if (filterSquad !== "ALL" && a.athleteStatus !== filterSquad) return false;
    if (filterCoach !== "ALL" && a.coachAssignments[0]?.coachId !== filterCoach) return false;
    return true;
  });

  const handleExportCsv = () => {
    let headers: string[] = [];
    let rows: string[][] = [];

    if (selectedReport === "PORTFOLIO" || selectedReport === "EXPENDITURE") {
      headers = ["Athlete Number", "Name", "Squad", "Discipline", "Current Tier", "Total Spend (ZAR)"];
      rows = filteredAthletes.map((a) => {
        const spend = a.sponsorships[0]?.transactions?.reduce((acc: number, t: any) => acc + t.amount, 0) || 0;
        return [
          a.athleteNumber,
          `${a.firstName} ${a.lastName}`,
          a.athleteStatus,
          a.primaryDiscipline,
          a.sponsorships[0]?.currentTier || "NON_SPONSORED",
          spend.toString(),
        ];
      });
    } else {
      headers = ["Athlete Number", "Name", "Squad", "Discipline", "Latest Race", "Attendance Count", "Volunteer Sessions"];
      rows = filteredAthletes.map((a) => [
        a.athleteNumber,
        `${a.firstName} ${a.lastName}`,
        a.athleteStatus,
        a.primaryDiscipline,
        a.raceResults[0]?.raceName || "None",
        a.clubAttendances.length.toString(),
        a.volunteerContributions.length.toString(),
      ]);
    }

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SuperEagles_${selectedReport}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Report Template Selector */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 no-print">
        {reportDefinitions.map((rep) => {
          const isSelected = selectedReport === rep.id;
          return (
            <div
              key={rep.id}
              onClick={() => setSelectedReport(rep.id)}
              className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                isSelected
                  ? "border-orange-500 bg-orange-950/20 shadow-md"
                  : "border-slate-700/80 bg-[#1E293B]/85 hover:border-slate-600"
              }`}
            >
              <div className="font-bold text-xs text-white">
                {rep.title}
              </div>
              <div className="mt-1 text-[11px] text-slate-400 line-clamp-2">
                {rep.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter and Export Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between no-print">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-orange-400" />
          <select
            value={filterSquad}
            onChange={(e) => setFilterSquad(e.target.value)}
            className="rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-1.5 text-xs text-white focus:border-orange-500 focus:outline-none"
          >
            <option value="ALL">All Squad Tiers</option>
            <option value="ELITE">Elite Squad</option>
            <option value="PERFORMANCE">Performance Squad</option>
            <option value="DEVELOPMENT">Development Squad</option>
          </select>

          <select
            value={filterCoach}
            onChange={(e) => setFilterCoach(e.target.value)}
            className="rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-1.5 text-xs text-white focus:border-orange-500 focus:outline-none"
          >
            <option value="ALL">All Coaches</option>
            {coaches.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#F97316] px-3.5 py-1.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:bg-[#FB923C] hover:-translate-y-0.5"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-all"
          >
            <Printer className="h-4 w-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Document Sheet (Print Optimized) */}
      <div className="print-page rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 p-8 shadow-xl">
        <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🦅</span>
                <span className="text-base font-black tracking-tight text-white">
                  Super Eagles Athletics Club
                </span>
              </div>
              <h2 className="mt-1 text-lg font-bold text-white">
                {reportDefinitions.find((r) => r.id === selectedReport)?.title}
              </h2>
            </div>
            <div className="text-right text-xs text-slate-400">
              <div>Date Generated: {new Date().toLocaleDateString()}</div>
              <div>Classification: Official Confidential</div>
            </div>
          </div>
        </div>

        {/* Report Data Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-700 bg-[#0F172A] text-[11px] font-bold uppercase tracking-wider text-white">
              <tr>
                <th className="px-4 py-3 text-white font-bold">Athlete</th>
                <th className="px-4 py-3 text-white font-bold">Squad / Discipline</th>
                <th className="px-4 py-3 text-white font-bold">Assigned Coach</th>
                <th className="px-4 py-3 text-white font-bold">Sponsorship Tier</th>
                <th className="px-4 py-3 text-white font-bold">Run Attendance</th>
                <th className="px-4 py-3 text-white font-bold">Volunteering</th>
                <th className="px-4 py-3 text-right text-white font-bold">Support Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredAthletes.map((a) => {
                const spend = a.sponsorships[0]?.transactions?.reduce((acc: number, t: any) => acc + t.amount, 0) || 0;
                return (
                  <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-bold text-white">
                      {a.firstName} {a.lastName}
                      <span className="ml-2 font-mono text-[10px] text-slate-400">{a.athleteNumber}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-200">
                      {a.athleteStatus} • {a.primaryDiscipline.replace("_", " ")}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {a.coachAssignments[0]?.coach?.name || "Unassigned"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-200">
                      {a.sponsorships[0]?.currentTier || "NON_SPONSORED"}
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-400">{a.clubAttendances.length} runs</td>
                    <td className="px-4 py-3 text-slate-200">{a.volunteerContributions.length} sessions</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-white">
                      R{spend.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-between border-t border-slate-800 pt-4 text-[11px] text-slate-400">
          <span>Super Eagles AC Athlete Intelligence System • POPIA Compliant</span>
          <span>Approved by Executive Management Committee</span>
        </div>
      </div>
    </div>
  );
}
