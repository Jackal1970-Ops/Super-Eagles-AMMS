"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  Award,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  HeartHandshake,
  Target,
  ArrowRight,
} from "lucide-react";

export interface DashboardKpis {
  totalActiveAthletes: number;
  sponsoredAthletesCount: number;
  eliteAthletesCount: number;
  developmentAthletesCount: number;
  athletesImprovingCount: number;
  athletesDecliningCount: number;
  athletesUnderReviewCount: number;
  conditionalSponsorshipsCount: number;
  totalSponsorshipSpendZar: number;
  avgClubContributionScore: number;
  upcomingTargetRacesCount: number;
  athletesLikelyToAchieveTargetsCount: number;
}

interface ExecutiveKpiCardsProps {
  kpis: DashboardKpis;
}

export function ExecutiveKpiCards({ kpis }: ExecutiveKpiCardsProps) {
  const cards = [
    {
      label: "Active Athletes",
      value: kpis.totalActiveAthletes,
      subtext: `${kpis.sponsoredAthletesCount} Sponsored`,
      icon: Users,
      color: "text-blue-300 bg-blue-950/70 border border-blue-800/50",
      href: "/athletes",
    },
    {
      label: "Elite Squad",
      value: kpis.eliteAthletesCount,
      subtext: `${kpis.developmentAthletesCount} in Development`,
      icon: Award,
      color: "text-purple-300 bg-purple-950/70 border border-purple-800/50",
      href: "/athletes?status=ELITE",
    },
    {
      label: "Improving Trajectory",
      value: kpis.athletesImprovingCount,
      subtext: `${kpis.athletesDecliningCount} on Watch/Decline`,
      icon: TrendingUp,
      color: "text-emerald-300 bg-emerald-950/70 border border-emerald-800/50",
      href: "/athletes?status=IMPROVING",
    },
    {
      label: "Reciprocity Reviews",
      value: kpis.athletesUnderReviewCount,
      subtext: `${kpis.conditionalSponsorshipsCount} Conditional`,
      icon: AlertTriangle,
      color: "text-amber-300 bg-amber-950/70 border border-amber-800/50",
      href: "/athletes?status=RECIPROCITY_REVIEW",
    },
    {
      label: "Total Support Invested",
      value: `R${(kpis.totalSponsorshipSpendZar / 1000).toFixed(0)}k`,
      subtext: "YTD Disbursements",
      icon: DollarSign,
      color: "text-green-300 bg-green-950/70 border border-green-800/50",
      href: "/sponsorship",
    },
    {
      label: "Avg Club Contribution",
      value: `${kpis.avgClubContributionScore}/100`,
      subtext: "Attendance & Service",
      icon: HeartHandshake,
      color: "text-teal-300 bg-teal-950/70 border border-teal-800/50",
      href: "/loyalty",
    },
    {
      label: "Upcoming Target Goals",
      value: kpis.upcomingTargetRacesCount,
      subtext: `${kpis.athletesLikelyToAchieveTargetsCount} Projected Achieved`,
      icon: Target,
      color: "text-indigo-300 bg-indigo-950/70 border border-indigo-800/50",
      href: "/races",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7 sm:gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <Link
            key={i}
            href={card.href}
            className="stat-card group relative flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 shadow-md transition-all hover:border-green-600/60 hover:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">
                {card.label}
              </span>
              <div className={`rounded-lg p-1.5 ${card.color}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="mt-2">
              <div className="text-xl font-extrabold tracking-tight text-white">
                {card.value}
              </div>
              <div className="mt-0.5 flex items-center justify-between text-[10px] text-slate-400">
                <span>{card.subtext}</span>
                <ArrowRight className="h-2.5 w-2.5 opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
