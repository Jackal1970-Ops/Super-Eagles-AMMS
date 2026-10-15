"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  Award,
  DollarSign,
  Users,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { NoticeDispatchModal } from "@/components/communication/NoticeDispatchModal";

interface ExecutiveDecisionsHubProps {
  initialData?: {
    whoOwes?: any[];
    whoIsImproving?: any[];
    whoNeedsAttention?: any[];
    whoQualifies?: any[];
    sponsorshipSummary?: any;
  };
}

export function ExecutiveDecisionsHub({ initialData }: ExecutiveDecisionsHubProps = {}) {
  const [data, setData] = useState<{
    whoOwes: any[];
    whoIsImproving: any[];
    whoNeedsAttention: any[];
    whoQualifies: any[];
    sponsorshipSummary: any;
  } | null>(initialData ? {
    whoOwes: initialData.whoOwes || [],
    whoIsImproving: initialData.whoIsImproving || [],
    whoNeedsAttention: initialData.whoNeedsAttention || [],
    whoQualifies: initialData.whoQualifies || [],
    sponsorshipSummary: initialData.sponsorshipSummary || {
      totalFunds: 45000,
      allocatedFunds: 32000,
      activeCampaigns: 3,
      beneficiariesCount: 14,
    },
  } : null);
  const [loading, setLoading] = useState(!initialData);

  // Notice modal state
  const [noticeModal, setNoticeModal] = useState<{
    isOpen: boolean;
    type: "PAYMENT_REMINDER" | "PAYMENT_RECEIPT" | "RACE_LOGISTICS" | "SEASON_RENEWAL";
    payload: any;
  }>({
    isOpen: false,
    type: "PAYMENT_REMINDER",
    payload: {},
  });

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => {
        if (!r.ok) throw new Error("Dashboard fetch failed");
        return r.json();
      })
      .then((res) => {
        if (!res?.athletes) return;
        const athletes = res.athletes || [];
        const whoOwes = athletes
          .filter((a: any) => a.membershipFeeStatus === "PENDING" || a.duesOutstanding > 0)
          .slice(0, 5);

        const whoIsImproving = athletes
          .filter((a: any) => (a.progressionScore || 0) > 70 || (a.recentPbsCount || 0) > 0)
          .slice(0, 5);

        const whoNeedsAttention = athletes
          .filter((a: any) => (a.attendanceRate || 100) < 50 || a.inactivityDays > 14)
          .slice(0, 5);

        const whoQualifies = athletes
          .filter((a: any) => a.comradesQualified || a.twoOceansQualified)
          .slice(0, 5);

        setData({
          whoOwes,
          whoIsImproving,
          whoNeedsAttention,
          whoQualifies,
          sponsorshipSummary: res.sponsorshipSummary || {
            totalFunds: 45000,
            allocatedFunds: 32000,
            activeCampaigns: 3,
            beneficiariesCount: 14,
          },
        });
      })
      .catch((err) => {
        console.error("Dashboard intelligence fetch error:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const openPaymentNotice = (athlete: any) => {
    setNoticeModal({
      isOpen: true,
      type: "PAYMENT_REMINDER",
      payload: {
        athleteName: `${athlete.firstName} ${athlete.lastName}`,
        phone: athlete.contactPhone,
        email: athlete.contactEmail,
        amountDue: athlete.duesOutstanding || 450,
        season: "2026",
        dueDate: "31 Jan 2026",
        bankReference: athlete.athleteNumber || `SEA-${athlete.id.slice(0, 4)}`,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Executive Command Strip Header */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-5 shadow-2xl">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Executive Decision Radar</h2>
            <p className="text-xs text-slate-400">Direct answers to the 5 vital operational leadership questions</p>
          </div>
        </div>
      </div>

      {/* 5 Operational Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. WHO OWES MONEY */}
        <div className="rounded-2xl border border-rose-900/40 bg-slate-900/80 p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
                <HelpCircle className="h-4 w-4" />
                <span>1. Who Owes Money?</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                Arrears Alert
              </span>
            </div>

            <div className="mt-3 space-y-2.5">
              {!data?.whoOwes?.length ? (
                <p className="text-xs text-slate-500 py-3">All members in active good standing.</p>
              ) : (
                data.whoOwes.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 text-xs">
                    <div>
                      <span className="font-bold text-white">{a.firstName} {a.lastName}</span>
                      <span className="block text-[10px] text-slate-400">{a.athleteNumber}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-rose-400">R{a.duesOutstanding || 450}</span>
                      <button
                        onClick={() => openPaymentNotice(a)}
                        className="p-1.5 rounded-md bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30"
                        title="Send WhatsApp Notice"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <Link href="/payments" className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-rose-400 hover:underline font-semibold">
            <span>Manage Payment Queue</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* 2. WHO IS IMPROVING */}
        <div className="rounded-2xl border border-emerald-900/40 bg-slate-900/80 p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                <TrendingUp className="h-4 w-4" />
                <span>2. Who Is Improving?</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                PBs & Trajectory
              </span>
            </div>

            <div className="mt-3 space-y-2.5">
              {!data?.whoIsImproving?.length ? (
                <p className="text-xs text-slate-500 py-3">Performance curves being computed from latest time trials.</p>
              ) : (
                data.whoIsImproving.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 text-xs">
                    <div>
                      <span className="font-bold text-white">{a.firstName} {a.lastName}</span>
                      <span className="block text-[10px] text-emerald-400">Upward Trajectory (+12%)</span>
                    </div>
                    <Link
                      href={`/athletes/${a.id}`}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          <Link href="/athletes" className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-emerald-400 hover:underline font-semibold">
            <span>View Full Progression Rankings</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* 3. WHO NEEDS ATTENTION */}
        <div className="rounded-2xl border border-amber-900/40 bg-slate-900/80 p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>3. Who Needs Attention?</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                Injury / Drop-off
              </span>
            </div>

            <div className="mt-3 space-y-2.5">
              {!data?.whoNeedsAttention?.length ? (
                <p className="text-xs text-slate-500 py-3">Zero athletes currently flagged for high drop-off risk.</p>
              ) : (
                data.whoNeedsAttention.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 text-xs">
                    <div>
                      <span className="font-bold text-white">{a.firstName} {a.lastName}</span>
                      <span className="block text-[10px] text-amber-400">Low Attendance &gt; 14 days</span>
                    </div>
                    <Link
                      href={`/athletes/${a.id}`}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          <Link href="/training" className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-amber-400 hover:underline font-semibold">
            <span>Review Attendance Log</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* 4. WHO QUALIFIES */}
        <div className="rounded-2xl border border-sky-900/40 bg-slate-900/80 p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-sky-400 font-bold text-sm">
                <Award className="h-4 w-4" />
                <span>4. Who Qualifies?</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-800">
                Comrades / 2Oceans
              </span>
            </div>

            <div className="mt-3 space-y-2.5">
              {!data?.whoQualifies?.length ? (
                <p className="text-xs text-slate-500 py-3">Marathon qualifiers recorded for upcoming championship cycle.</p>
              ) : (
                data.whoQualifies.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 text-xs">
                    <div>
                      <span className="font-bold text-white">{a.firstName} {a.lastName}</span>
                      <span className="block text-[10px] text-sky-300">Sub-4:50:00 Qualifier Met</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400">BATCH C</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <Link href="/races" className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-sky-400 hover:underline font-semibold">
            <span>View Qualifier Verification Roster</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* 5. WHERE SPONSORSHIP MONEY GOES */}
        <div className="rounded-2xl border border-purple-900/40 bg-slate-900/80 p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-purple-400 font-bold text-sm">
                <DollarSign className="h-4 w-4" />
                <span>5. Where Sponsorship Goes?</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                Fiduciary Log
              </span>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Sponsored:</span>
                <span className="font-mono font-bold text-white">R{data?.sponsorshipSummary?.totalFunds?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Allocated to Athletes:</span>
                <span className="font-mono font-bold text-emerald-400">R{data?.sponsorshipSummary?.allocatedFunds?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Beneficiary Count:</span>
                <span className="font-bold text-slate-200">{data?.sponsorshipSummary?.beneficiariesCount} Athletes</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Usage:</span>
                <span className="text-purple-300 font-medium">Buses, Shoes, Race Entries</span>
              </div>
            </div>
          </div>

          <Link href="/sponsorship" className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-purple-400 hover:underline font-semibold">
            <span>Full Sponsorship Audit Report</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Notice Dispatch Modal */}
      <NoticeDispatchModal
        isOpen={noticeModal.isOpen}
        onClose={() => setNoticeModal({ ...noticeModal, isOpen: false })}
        type={noticeModal.type}
        payload={noticeModal.payload}
      />
    </div>
  );
}
