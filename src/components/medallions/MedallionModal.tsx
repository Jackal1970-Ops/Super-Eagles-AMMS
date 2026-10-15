"use client";

import React, { useState } from "react";
import Image from "next/image";
import { X, Share2, Check, ShieldCheck, Award, Calendar, User, FileText } from "lucide-react";
import { MedallionBadge, MedallionVariant } from "./MedallionBadge";
import { openWhatsAppMedallionBroadcast, formatWhatsAppMedallionMessage } from "@/lib/sharing/whatsappMedallionShare";

export interface MedallionData {
  id: string;
  awardType: "ATHLETE_OF_THE_MONTH" | "ATHLETE_OF_THE_YEAR" | string;
  trackCategory: "COMPETITIVE" | "HEALTH_WELLNESS" | string;
  period: string;
  title: string;
  citation: string;
  conferredBy: string;
  criteriaMetricsJson?: string;
  badgeVariant: MedallionVariant | string;
  createdAt?: string | Date;
  athlete?: {
    id: string;
    athleteNumber: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
    primaryDiscipline?: string;
    membershipCategory?: string;
  };
}

export interface MedallionModalProps {
  medallion: MedallionData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MedallionModal({ medallion, isOpen, onClose }: MedallionModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !medallion) return null;

  const athleteName = medallion.athlete
    ? `${medallion.athlete.firstName} ${medallion.athlete.lastName}`
    : "Super Eagles Athlete";
  const athleteNumber = medallion.athlete?.athleteNumber || "SEA-MEMBER";

  let metrics: Record<string, any> = {};
  try {
    if (medallion.criteriaMetricsJson) {
      metrics = JSON.parse(medallion.criteriaMetricsJson);
    }
  } catch (e) {
    console.error("Could not parse criteria metrics JSON", e);
  }

  const handleShareWhatsApp = () => {
    openWhatsAppMedallionBroadcast({
      awardTitle: medallion.title,
      awardType: medallion.awardType,
      trackCategory: medallion.trackCategory,
      period: medallion.period,
      athleteName,
      athleteNumber,
      citation: medallion.citation,
      conferredBy: medallion.conferredBy,
      metrics,
    });
  };

  const handleCopyCitation = () => {
    const text = formatWhatsAppMedallionMessage({
      awardTitle: medallion.title,
      awardType: medallion.awardType,
      trackCategory: medallion.trackCategory,
      period: medallion.period,
      athleteName,
      athleteNumber,
      citation: medallion.citation,
      conferredBy: medallion.conferredBy,
      metrics,
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const isYearly = medallion.awardType === "ATHLETE_OF_THE_YEAR";
  const isCompetitive = medallion.trackCategory === "COMPETITIVE";

  const themeClasses =
    medallion.badgeVariant === "GOLD_CHAMPION"
      ? {
          cardBorder: "border-amber-400/60 dark:border-amber-500/40",
          glow: "shadow-[0_0_50px_rgba(245,158,11,0.25)]",
          headerBg: "from-amber-500/20 via-yellow-500/10 to-transparent",
          accentColor: "text-amber-600 dark:text-amber-400",
          pill: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700",
        }
      : medallion.badgeVariant === "PLATINUM_ELITE"
      ? {
          cardBorder: "border-sky-400/60 dark:border-sky-500/40",
          glow: "shadow-[0_0_50px_rgba(56,189,248,0.25)]",
          headerBg: "from-sky-500/20 via-blue-500/10 to-transparent",
          accentColor: "text-sky-600 dark:text-sky-400",
          pill: "bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-700",
        }
      : {
          cardBorder: "border-emerald-400/60 dark:border-emerald-500/40",
          glow: "shadow-[0_0_50px_rgba(16,185,129,0.25)]",
          headerBg: "from-emerald-500/20 via-teal-500/10 to-transparent",
          accentColor: "text-emerald-600 dark:text-emerald-400",
          pill: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700",
        };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border-2 ${themeClasses.cardBorder} ${themeClasses.glow} shadow-2xl`}
      >
        {/* Certificate Header Banner */}
        <div className={`relative px-6 pt-8 pb-6 bg-gradient-to-b ${themeClasses.headerBg} border-b border-slate-200 dark:border-slate-800 text-center`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Large Medallion */}
          <div className="flex justify-center mb-4">
            <MedallionBadge
              variant={medallion.badgeVariant}
              awardType={medallion.awardType}
              trackCategory={medallion.trackCategory}
              size="xl"
            />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border mb-2 border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Official Club Conferred Distinction
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            {medallion.title}
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${themeClasses.pill}`}>
              <Calendar className="w-3 h-3" />
              {medallion.period}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700">
              <User className="w-3 h-3" />
              {athleteName} ({athleteNumber})
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700">
              {isCompetitive ? "⚡ Competitive Track" : "🌱 Health & Wellness Track"}
            </span>
          </div>
        </div>

        {/* Certificate Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Citation Box */}
          <div className="relative p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-500" />
              Official Citation of Merit
            </div>
            <p className="text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed italic font-serif">
              "{medallion.citation}"
            </p>
            <div className="mt-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400">
              Conferred by: <strong className="text-slate-700 dark:text-slate-300">{medallion.conferredBy}</strong>
            </div>
          </div>

          {/* Verified Criteria & Factual Metrics Proof */}
          {Object.keys(metrics).length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Verified Objective Criteria & Evidence
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(metrics).map(([key, val]) => {
                  const label = key
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (str) => str.toUpperCase())
                    .trim();
                  return (
                    <div
                      key={key}
                      className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex flex-col"
                    >
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                        {label}
                      </span>
                      <span className="text-base font-bold text-slate-900 dark:text-white mt-1">
                        {String(val)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Bar: WhatsApp Group Share & Copy Citation */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50 transition-all duration-200 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Send to Group WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleCopyCitation}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-medium text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Copy formatted announcement text"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
