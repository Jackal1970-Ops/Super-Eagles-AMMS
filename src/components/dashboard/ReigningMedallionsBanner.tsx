"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trophy, Award, Sparkles, Heart, Share2, ExternalLink, ShieldCheck, ChevronRight, Star } from "lucide-react";
import { MedallionBadge } from "../medallions/MedallionBadge";
import { MedallionModal, MedallionData } from "../medallions/MedallionModal";
import { openWhatsAppMedallionBroadcast } from "@/lib/sharing/whatsappMedallionShare";

interface ReigningMedallionsBannerProps {
  medallions: MedallionData[];
}

export function ReigningMedallionsBanner({ medallions }: ReigningMedallionsBannerProps) {
  const [selectedMedallion, setSelectedMedallion] = useState<MedallionData | null>(null);

  if (!medallions || medallions.length === 0) return null;

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-amber-500/40 shadow-2xl p-6 sm:p-8 mb-8 text-white">
      {/* Background Radiant Championship Glows */}
      <div className="absolute -top-12 right-1/4 w-[500px] h-[500px] bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 left-1/4 w-[400px] h-[400px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header Strip */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10 mb-6">
        <div className="flex items-center gap-3.5">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 shadow-xl shadow-amber-500/30 border border-amber-300">
            <Trophy className="w-6 h-6 text-slate-950 font-black" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                Reigning Club Medallions & Honors
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/30 to-yellow-500/20 text-amber-300 border border-amber-400/40 shadow-sm">
                <Star className="w-3 h-3 fill-amber-300" />
                Official Hall of Fame
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Conferred by Super Eagles Executive Committee across Competitive Racing and Health & Wellness tracks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 self-end sm:self-auto bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Active Season Conferred Honors</span>
        </div>
      </div>

      {/* Grid of Conferred 3D Championship Medallions */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {medallions.map((medallion) => {
          const isYearly = medallion.awardType === "ATHLETE_OF_THE_YEAR";
          const isCompetitive = medallion.trackCategory === "COMPETITIVE";
          const athleteName = medallion.athlete
            ? `${medallion.athlete.firstName} ${medallion.athlete.lastName}`
            : "Super Eagles Athlete";

          let metrics: Record<string, any> = {};
          try {
            if (medallion.criteriaMetricsJson) {
              metrics = JSON.parse(medallion.criteriaMetricsJson);
            }
          } catch (e) {
            // silent fallback
          }

          const cardTheme =
            medallion.badgeVariant === "GOLD_CHAMPION"
              ? "border-amber-400/40 bg-gradient-to-b from-amber-950/40 via-slate-900/90 to-slate-950 shadow-amber-950/50 hover:border-amber-400/80 hover:shadow-amber-500/20"
              : medallion.badgeVariant === "PLATINUM_ELITE"
              ? "border-sky-400/40 bg-gradient-to-b from-sky-950/40 via-slate-900/90 to-slate-950 shadow-sky-950/50 hover:border-sky-400/80 hover:shadow-sky-500/20"
              : "border-emerald-400/40 bg-gradient-to-b from-emerald-950/40 via-slate-900/90 to-slate-950 shadow-emerald-950/50 hover:border-emerald-400/80 hover:shadow-emerald-500/20";

          return (
            <div
              key={medallion.id}
              className={`relative flex flex-col justify-between rounded-2xl border-2 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl backdrop-blur-md ${cardTheme} group`}
            >
              <div>
                {/* Period Badge Header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`inline-block text-[10px] font-black uppercase tracking-wider ${
                      isCompetitive ? "text-amber-400" : "text-emerald-400"
                    }`}
                  >
                    {isYearly ? "Athlete of the Year" : "Athlete of the Month"}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border border-white/15 bg-white/5 text-slate-200">
                    {medallion.period}
                  </span>
                </div>

                {/* Substantial, Centered 3D Medallion Coin with Silk Ribbon */}
                <div className="my-4 flex flex-col items-center justify-center">
                  <div
                    onClick={() => setSelectedMedallion(medallion)}
                    className="cursor-pointer transition-transform duration-300 group-hover:scale-110"
                    title="Click to view official certificate & award ceremony citation"
                  >
                    <MedallionBadge
                      variant={medallion.badgeVariant}
                      awardType={medallion.awardType}
                      trackCategory={medallion.trackCategory}
                      size="md"
                      showRibbon={true}
                    />
                  </div>

                  {/* Distinction Pill under medal */}
                  <div className="mt-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border shadow-xs ${
                        isCompetitive
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                          : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      }`}
                    >
                      {isCompetitive ? <Trophy className="w-3 h-3 text-amber-400" /> : <Heart className="w-3 h-3 text-emerald-400" />}
                      <span>{isCompetitive ? "Racing Honors" : "Wellness Honors"}</span>
                    </span>
                  </div>
                </div>

                {/* Athlete Name & Profile Link */}
                <div className="text-center mt-2 mb-3">
                  <Link
                    href={medallion.athlete ? `/athletes/${medallion.athlete.id}` : "#"}
                    className="group/link inline-flex items-center justify-center gap-1 text-base font-black text-white hover:text-amber-300 transition-colors"
                  >
                    <span>{athleteName}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover/link:text-amber-300 transition-colors" />
                  </Link>
                  <div className="text-xs font-mono font-bold text-slate-400">
                    {medallion.athlete?.athleteNumber || "SEA-CLUB"}
                  </div>
                </div>

                {/* Citation Excerpt */}
                <p className="text-xs text-slate-300/90 line-clamp-3 italic mb-4 text-center px-1">
                  "{medallion.citation}"
                </p>
              </div>

              {/* Action Buttons: Certificate + 1-Click WhatsApp Share */}
              <div className="pt-3.5 border-t border-white/10 flex items-center justify-between gap-2 mt-auto">
                <button
                  type="button"
                  onClick={() => setSelectedMedallion(medallion)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Inspect Certificate</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    openWhatsAppMedallionBroadcast({
                      awardTitle: medallion.title,
                      awardType: medallion.awardType,
                      trackCategory: medallion.trackCategory,
                      period: medallion.period,
                      athleteName,
                      athleteNumber: medallion.athlete?.athleteNumber || "SEA",
                      citation: medallion.citation,
                      conferredBy: medallion.conferredBy,
                      metrics,
                    })
                  }
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer hover:scale-105"
                  title="Send official celebratory announcement to Club WhatsApp"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Certificate Modal */}
      <MedallionModal
        medallion={selectedMedallion}
        isOpen={!!selectedMedallion}
        onClose={() => setSelectedMedallion(null)}
      />
    </section>
  );
}
