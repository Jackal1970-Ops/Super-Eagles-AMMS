"use client";

import React from "react";
import Image from "next/image";
import { Trophy, Award, Heart, Sparkles, Star } from "lucide-react";

export type MedallionVariant = "GOLD_CHAMPION" | "PLATINUM_ELITE" | "EMERALD_WELLNESS";

export interface MedallionBadgeProps {
  variant: MedallionVariant | string;
  awardType: "ATHLETE_OF_THE_MONTH" | "ATHLETE_OF_THE_YEAR" | string;
  trackCategory: "COMPETITIVE" | "HEALTH_WELLNESS" | string;
  period?: string;
  title?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  showLabel?: boolean;
  showRibbon?: boolean;
  className?: string;
  onClick?: () => void;
}

export function MedallionBadge({
  variant,
  awardType,
  trackCategory,
  period,
  title,
  size = "md",
  showLabel = false,
  showRibbon = true,
  className = "",
  onClick,
}: MedallionBadgeProps) {
  const isYearly = awardType === "ATHLETE_OF_THE_YEAR";
  const isCompetitive = trackCategory === "COMPETITIVE";

  // Visual Theme Configuration for 3D Minted Metallic Medallion
  const getTheme = () => {
    switch (variant) {
      case "GOLD_CHAMPION":
        return {
          name: "24K Olympic Gold Laurel",
          outerBezel: "from-amber-300 via-yellow-500 to-amber-700 border-amber-300",
          innerRing: "from-yellow-100 via-amber-400 to-amber-800",
          coinFace: "from-amber-600 via-yellow-500 to-amber-700",
          milledBorder: "border-yellow-200/60 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),inset_0_-2px_4px_rgba(0,0,0,0.6)]",
          glowShadow: "shadow-[0_12px_32px_rgba(245,158,11,0.5),0_0_20px_rgba(251,191,36,0.35)]",
          ribbonGradient: "from-red-800 via-amber-600 to-yellow-500",
          ribbonStripe: "bg-amber-300",
          buckleColor: "bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 border-amber-500",
          accentText: "text-amber-400",
          subText: "text-amber-200/90",
          starColor: "text-yellow-200",
          badgeBg: "bg-gradient-to-r from-amber-950/80 to-slate-900 border-amber-500/50 text-amber-200",
          iconColor: "text-amber-950",
          iconBadgeBg: "bg-gradient-to-br from-yellow-200 to-amber-400 border-amber-600",
        };
      case "PLATINUM_ELITE":
        return {
          name: "Titanium Platinum Elite",
          outerBezel: "from-slate-200 via-sky-300 to-slate-500 border-sky-200",
          innerRing: "from-white via-slate-300 to-sky-700",
          coinFace: "from-slate-700 via-slate-500 to-sky-800",
          milledBorder: "border-sky-100/60 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.6)]",
          glowShadow: "shadow-[0_12px_32px_rgba(56,189,248,0.45),0_0_20px_rgba(186,230,253,0.35)]",
          ribbonGradient: "from-slate-900 via-sky-800 to-blue-600",
          ribbonStripe: "bg-sky-200",
          buckleColor: "bg-gradient-to-r from-slate-200 via-white to-sky-300 border-slate-400",
          accentText: "text-sky-300",
          subText: "text-sky-200/90",
          starColor: "text-sky-100",
          badgeBg: "bg-gradient-to-r from-sky-950/80 to-slate-900 border-sky-500/50 text-sky-200",
          iconColor: "text-slate-950",
          iconBadgeBg: "bg-gradient-to-br from-white to-sky-300 border-sky-400",
        };
      case "EMERALD_WELLNESS":
      default:
        return {
          name: "Emerald Vitality Laurel",
          outerBezel: "from-emerald-300 via-teal-500 to-emerald-800 border-emerald-300",
          innerRing: "from-teal-100 via-emerald-400 to-teal-900",
          coinFace: "from-emerald-800 via-teal-600 to-emerald-900",
          milledBorder: "border-emerald-200/60 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),inset_0_-2px_4px_rgba(0,0,0,0.6)]",
          glowShadow: "shadow-[0_12px_32px_rgba(16,185,129,0.5),0_0_20px_rgba(52,211,153,0.35)]",
          ribbonGradient: "from-emerald-950 via-teal-800 to-emerald-600",
          ribbonStripe: "bg-yellow-300",
          buckleColor: "bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-300 border-emerald-600",
          accentText: "text-emerald-300",
          subText: "text-emerald-200/90",
          starColor: "text-teal-100",
          badgeBg: "bg-gradient-to-r from-emerald-950/80 to-slate-900 border-emerald-500/50 text-emerald-200",
          iconColor: "text-emerald-950",
          iconBadgeBg: "bg-gradient-to-br from-emerald-200 to-teal-400 border-emerald-600",
        };
    }
  };

  const theme = getTheme();

  // Generous, prestigious physical dimensions
  const sizeMap = {
    xs: { outer: "w-8 h-8", emblem: 22, ribbonH: "h-3", ribbonW: "w-5", iconSize: "w-2.5 h-2.5", borderSize: "border-2" },
    sm: { outer: "w-12 h-12", emblem: 32, ribbonH: "h-4", ribbonW: "w-8", iconSize: "w-3 h-3", borderSize: "border-2" },
    md: { outer: "w-20 h-20", emblem: 54, ribbonH: "h-6", ribbonW: "w-12", iconSize: "w-4 h-4", borderSize: "border-[3px]" },
    lg: { outer: "w-28 h-28", emblem: 76, ribbonH: "h-8", ribbonW: "w-16", iconSize: "w-5 h-5", borderSize: "border-4" },
    xl: { outer: "w-36 h-36", emblem: 98, ribbonH: "h-10", ribbonW: "w-20", iconSize: "w-6 h-6", borderSize: "border-4" },
    "2xl": { outer: "w-48 h-48", emblem: 130, ribbonH: "h-14", ribbonW: "w-28", iconSize: "w-8 h-8", borderSize: "border-[5px]" },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // Ultra-compact pill for compact table rows
  if (size === "xs") {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title || theme.name}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-bold transition-all ${theme.badgeBg} ${
          onClick ? "cursor-pointer hover:scale-105 hover:shadow-md" : ""
        } ${className}`}
      >
        <div
          className={`relative flex items-center justify-center rounded-full bg-gradient-to-br ${theme.outerBezel} ${theme.glowShadow} ${currentSize.outer} shrink-0 p-0.5`}
        >
          <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-slate-950 shadow-inner">
            <Image
              src="/images/emblem.png"
              alt="Super Eagles Medal"
              width={currentSize.emblem}
              height={currentSize.emblem}
              className="object-contain drop-shadow"
            />
          </div>
        </div>
        {showLabel && (
          <span className="truncate max-w-[130px]">
            {isYearly ? "AOTY" : "AOTM"} • {isCompetitive ? "Racing" : "Wellness"}
          </span>
        )}
      </button>
    );
  }

  // Championship Heavyweight Minted Medallion
  return (
    <div
      onClick={onClick}
      className={`relative inline-flex flex-col items-center group transition-all duration-300 select-none ${
        onClick ? "cursor-pointer hover:scale-105" : ""
      } ${className}`}
    >
      {/* 1. Folded Silk Chevron Neck Ribbon */}
      {showRibbon && (size === "md" || size === "lg" || size === "xl" || size === "2xl") && (
        <div className="relative flex flex-col items-center -mb-2 z-0">
          {/* Dual Chevron Ribbon Drape */}
          <div className={`flex items-start justify-center gap-1 ${currentSize.ribbonW}`}>
            <div
              className={`w-1/2 ${currentSize.ribbonH} rounded-t-sm bg-gradient-to-b ${theme.ribbonGradient} shadow-md transform -rotate-6 origin-bottom-right border-t border-amber-300/40 relative overflow-hidden`}
            >
              {/* Silk Texture & Center Stripe */}
              <div className="absolute inset-y-0 right-1/3 w-1/4 bg-white/25" />
            </div>
            <div
              className={`w-1/2 ${currentSize.ribbonH} rounded-t-sm bg-gradient-to-b ${theme.ribbonGradient} shadow-md transform rotate-6 origin-bottom-left border-t border-amber-300/40 relative overflow-hidden`}
            >
              <div className="absolute inset-y-0 left-1/3 w-1/4 bg-white/25" />
            </div>
          </div>

          {/* Heavy Brass Ribbon Fastener Buckle */}
          <div
            className={`-mt-1.5 h-2 w-8 rounded-sm border ${theme.buckleColor} shadow-md z-10`}
          />
        </div>
      )}

      {/* 2. Main Minted Championship Coin */}
      <div
        className={`relative flex items-center justify-center rounded-full bg-gradient-to-br ${theme.outerBezel} ${theme.glowShadow} ${currentSize.borderSize} ${currentSize.outer} z-10 transition-transform duration-300 group-hover:rotate-1`}
      >
        {/* Outer Coin Milled Edge Rim */}
        <div className="w-full h-full rounded-full p-1 bg-gradient-to-br from-black/40 via-transparent to-white/40 flex items-center justify-center">
          {/* Concentric Gold Relief Step */}
          <div className="w-full h-full rounded-full p-1 bg-gradient-to-tr from-amber-700/80 via-yellow-400 to-amber-900/90 shadow-inner flex items-center justify-center">
            {/* Medallion Mirror Coin Face */}
            <div
              className={`relative w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br ${theme.coinFace} shadow-[inset_0_4px_12px_rgba(0,0,0,0.6)]`}
            >
              {/* Radial Sunburst Background */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />

              {/* Laurel Wreath SVG Silhouette behind crest */}
              <svg
                viewBox="0 0 100 100"
                className="absolute inset-0 w-full h-full opacity-30 text-amber-100 pointer-events-none p-1"
                fill="currentColor"
              >
                <path d="M 50 10 C 30 10, 15 30, 15 50 C 15 70, 30 90, 50 90 C 70 90, 85 70, 85 50 C 85 30, 70 10, 50 10 Z M 50 82 C 32 82, 22 68, 22 50 C 22 32, 32 18, 50 18 C 68 18, 78 32, 78 50 C 78 68, 68 82, 50 82 Z" />
              </svg>

              {/* High Definition Official Super Eagles Crest */}
              <div className="relative z-10 flex items-center justify-center">
                <Image
                  src="/images/emblem.png"
                  alt="Super Eagles Official Crest"
                  width={currentSize.emblem}
                  height={currentSize.emblem}
                  className="object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] brightness-110 contrast-115 transform group-hover:scale-105 transition-transform duration-300"
                  priority={size === "xl" || size === "2xl"}
                />
              </div>

              {/* Specular Diagonal Light Sweep (Glass Sheen) */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/35 to-transparent pointer-events-none rounded-full" />
            </div>
          </div>
        </div>

        {/* 3. Floating Mini Distinction Seal Badge (Bottom Right) */}
        <div
          className={`absolute -bottom-1 -right-1 rounded-full p-1.5 shadow-xl border ${theme.iconBadgeBg} z-20 flex items-center justify-center`}
        >
          {isYearly ? (
            <Trophy className={`${currentSize.iconSize} ${theme.iconColor}`} />
          ) : isCompetitive ? (
            <Sparkles className={`${currentSize.iconSize} ${theme.iconColor}`} />
          ) : (
            <Heart className={`${currentSize.iconSize} ${theme.iconColor}`} />
          )}
        </div>

        {/* Top Mini Stars for Athlete of the Year */}
        {isYearly && (size === "lg" || size === "xl" || size === "2xl") && (
          <div className="absolute -top-2 flex items-center gap-0.5 z-20 drop-shadow-md">
            <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-400" />
            <Star className="w-4 h-4 fill-amber-200 text-amber-300" />
            <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-400" />
          </div>
        )}
      </div>

      {/* 4. Descriptive Engraved Plate / Typography */}
      {showLabel && (
        <div className="mt-2.5 text-center max-w-[180px]">
          <div
            className={`text-xs font-black uppercase tracking-wider ${theme.accentText} drop-shadow-sm`}
          >
            {isYearly ? "Athlete of the Year" : "Athlete of the Month"}
          </div>
          <div className={`text-[10px] font-bold ${theme.subText} uppercase tracking-tight`}>
            {isCompetitive ? "Competitive Track" : "Health & Wellness"}
          </div>
          {period && (
            <div className="mt-0.5 inline-block rounded-md border border-white/10 bg-slate-900/80 px-2 py-0.5 font-mono text-[10px] text-slate-300 font-semibold shadow-xs">
              {period}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
