"use client";

import React from "react";
import { HelpCircle, X, Check, AlertTriangle, ShieldCheck } from "lucide-react";

export interface ScoreExplanationData {
  title: string;
  scoreType: "PERFORMANCE_INDEX" | "SPONSORSHIP_SCORE" | "CLUB_CONTRIBUTION" | "PACE_DURABILITY" | "RACE_PREDICTION";
  finalScore: number | string;
  confidencePercent?: number;
  components: Array<{
    name: string;
    value: number | string;
    weightPercent?: number;
    weightedResult?: number | string;
    sourceData: string;
  }>;
  formula: string;
  narrativeExplanation: string;
  missingDataWarnings?: string[];
  governanceNote?: string;
}

interface ExplainScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ScoreExplanationData | null;
}

export function ExplainScoreModal({ isOpen, onClose, data }: ExplainScoreModalProps) {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700/80 bg-[#1E293B] p-6 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-950/80 border border-orange-700/80 text-orange-400">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                How Was This Calculated?
              </h2>
              <p className="text-xs text-slate-400">
                {data.title} — Transparent Calculation & Evidence Audit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Score Highlight */}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-900/90 border border-slate-800 p-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Calculated Value
            </div>
            <div className="text-3xl font-black text-orange-400">
              {data.finalScore}
              {typeof data.finalScore === "number" && (
                <span className="text-sm font-normal text-slate-400"> / 100</span>
              )}
            </div>
          </div>
          {data.confidencePercent !== undefined && (
            <div className="text-right">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Mathematical Confidence
              </div>
              <div className="text-xl font-bold text-white">
                {data.confidencePercent}%
              </div>
            </div>
          )}
        </div>

        {/* Mathematical Formula */}
        <div className="mt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Formulation & Methodology
          </h3>
          <div className="mt-1 rounded-lg border border-slate-700/80 bg-slate-950 p-3 font-mono text-xs text-slate-200">
            {data.formula}
          </div>
        </div>

        {/* Component Breakdown Table */}
        <div className="mt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Component Weights & Evidence Sources
          </h3>
          <div className="mt-2 overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900/90">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0F172A] text-white border-b border-slate-700">
                <tr>
                  <th className="px-3 py-2 text-white font-bold">Component</th>
                  <th className="px-3 py-2 text-white font-bold">Raw Value</th>
                  {data.components.some((c) => c.weightPercent !== undefined) && (
                    <th className="px-3 py-2 text-white font-bold">Weight</th>
                  )}
                  {data.components.some((c) => c.weightedResult !== undefined) && (
                    <th className="px-3 py-2 text-white font-bold">Weighted</th>
                  )}
                  <th className="px-3 py-2 text-white font-bold">Data Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data.components.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-3 py-2.5 font-medium text-white">
                      {c.name}
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-slate-200">
                      {c.value}
                    </td>
                    {c.weightPercent !== undefined && (
                      <td className="px-3 py-2.5 text-slate-400">{c.weightPercent}%</td>
                    )}
                    {c.weightedResult !== undefined && (
                      <td className="px-3 py-2.5 font-bold text-orange-400">
                        {c.weightedResult}
                      </td>
                    )}
                    <td className="px-3 py-2.5 text-[11px] text-slate-400">
                      {c.sourceData}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Narrative */}
        <div className="mt-4 rounded-xl border border-slate-700/80 bg-slate-900/80 p-3 text-xs leading-relaxed text-slate-300">
          <span className="font-bold text-white">Narrative Derivation: </span>
          {data.narrativeExplanation}
        </div>

        {/* Missing Data Warnings */}
        {data.missingDataWarnings && data.missingDataWarnings.length > 0 && (
          <div className="mt-3 rounded-xl border border-amber-900/60 bg-amber-950/40 p-3 text-xs text-amber-300">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Missing Data Warnings
            </div>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-[11px]">
              {data.missingDataWarnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Governance note */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-orange-400" />
            <span>Audited deterministic formula. AI assists; human decision-makers govern.</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-[#F97316] px-4 py-2 text-xs font-bold text-white shadow-md transition-all duration-200 hover:bg-[#FB923C] hover:-translate-y-0.5"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
