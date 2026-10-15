"use client";

import React, { useState } from "react";
import { SponsorRoiSummaryView, SponsorRoiData } from "@/components/sponsorship/SponsorRoiSummaryView";
import { DollarSign, BarChart3, ShieldCheck } from "lucide-react";

interface SponsorshipClientTabsProps {
  roiData: SponsorRoiData;
  children: React.ReactNode;
}

export function SponsorshipClientTabs({ roiData, children }: SponsorshipClientTabsProps) {
  const [activeTab, setActiveTab] = useState<"register" | "roi">("register");

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-700/80 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("register")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
            activeTab === "register"
              ? "bg-[#F97316] text-white shadow-md"
              : "border border-slate-700/80 bg-[#1E293B] text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Sponsorship & Reciprocity Register</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("roi")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
            activeTab === "roi"
              ? "bg-[#F97316] text-white shadow-md"
              : "border border-slate-700/80 bg-[#1E293B] text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Sponsor Brand ROI & Exposure Portal</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "register" ? (
        <div>{children}</div>
      ) : (
        <SponsorRoiSummaryView data={roiData} />
      )}
    </div>
  );
}
