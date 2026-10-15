"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CreditCard,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Search,
  Filter,
  Download,
  Building2,
  Copy,
  Check,
  Send,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Clock,
  User,
  X,
  FileSpreadsheet,
} from "lucide-react";

interface PaymentAthlete {
  id: string;
  athleteNumber: string;
  firstName: string;
  lastName: string;
  preferredName?: string | null;
  contactEmail: string;
  contactPhone?: string | null;
  membershipCategory: string;
  disciplineCategory: string;
  primaryDiscipline: string;
  membershipStatus: string;
  membershipFeeStatus: string;
  membershipExpiry?: string | null;
  asaLicenseNumber?: string | null;
  standardDues: number;
  isOverdue: boolean;
}

interface PaymentSummary {
  totalMembers: number;
  paidCount: number;
  pendingCount: number;
  exemptCount: number;
  subsidizedCount: number;
  totalProjectedRevenue: number;
  totalCollectedRevenue: number;
  totalOutstandingArrears: number;
  collectionRatePercent: number;
}

interface BankingDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branchCode: string;
  accountType: string;
  referenceFormat: string;
  snapScanSupported: boolean;
}

export function PaymentsClientView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [athletes, setAthletes] = useState<PaymentAthlete[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [banking, setBanking] = useState<BankingDetails | null>(null);
  const [cycle, setCycle] = useState<{ year: number; label: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [copiedBank, setCopiedBank] = useState(false);

  // Record Payment Modal State
  const [selectedAthlete, setSelectedAthlete] = useState<PaymentAthlete | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(750);
  const [paymentMethod, setPaymentMethod] = useState("EFT");
  const [receiptRef, setReceiptRef] = useState("");
  const [feeStatus, setFeeStatus] = useState("PAID");
  const [notes, setNotes] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/payments?status=${statusFilter}&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (res.ok) {
        setAthletes(data.athletes || []);
        setSummary(data.summary || null);
        setBanking(data.bankingDetails || null);
        setCycle(data.cycle || null);
      } else {
        setError(data.error || "Failed to load payment data");
      }
    } catch (e: any) {
      setError("Network error loading payments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setCurrentUser(d.user);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleCopyBanking = () => {
    if (!banking) return;
    const text = `Super Eagles Athletics Club Official Bank Details:
Bank: ${banking.bankName}
Account Name: ${banking.accountName}
Account Number: ${banking.accountNumber}
Branch Code: ${banking.branchCode}
Account Type: ${banking.accountType}
Payment Reference: ${banking.referenceFormat}`;
    navigator.clipboard.writeText(text);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 3000);
  };

  const openPaymentModal = (athlete: PaymentAthlete) => {
    setSelectedAthlete(athlete);
    setPaymentAmount(athlete.standardDues);
    setReceiptRef(`EFT-${new Date().getFullYear()}-${athlete.athleteNumber.replace("SEA-", "")}`);
    setFeeStatus("PAID");
    setNotes("");
    setModalOpen(true);
  };

  const handleQuickRenew = async (athlete: PaymentAthlete) => {
    try {
      const res = await fetch("/api/athletes/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ athleteId: athlete.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setToastMessage(`✓ ${athlete.firstName} renewed through 31 Dec ${data.renewalYear}!`);
        setTimeout(() => setToastMessage(""), 4000);
        fetchData();
      } else {
        alert(data.error || "Failed to renew member");
      }
    } catch {
      alert("Network error renewing member.");
    }
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAthlete) return;

    setSubmittingPayment(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          athleteId: selectedAthlete.id,
          amount: paymentAmount,
          paymentMethod,
          receiptRef,
          feeStatus,
          notes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setModalOpen(false);
        setToastMessage(`✓ Payment of R${paymentAmount} recorded for ${selectedAthlete.firstName}!`);
        setTimeout(() => setToastMessage(""), 4000);
        fetchData();
      } else {
        alert(data.error || "Failed to record payment");
      }
    } catch {
      alert("Network error recording payment.");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleWhatsAppReminder = (athlete: PaymentAthlete) => {
    const dues = athlete.standardDues;
    const ref = athlete.athleteNumber;
    const msg = `Hi ${athlete.firstName}, greetings from Super Eagles Athletics Club! 🦅

This is a friendly reminder that your ${new Date().getFullYear()} Annual Membership Dues of R${dues} are currently pending.

Official Club Bank Details:
• Bank: Standard Bank South Africa
• Account Name: Super Eagles Athletics Club
• Account No: 023456789 (Branch: 051001)
• Reference: ${ref} ${athlete.lastName.toUpperCase()}

Once paid, send your proof of payment to the club secretary so your digital credential and race submissions remain unlocked through 31 Dec ${new Date().getFullYear()}.

Fly High, Run True! 🏃‍♀️🏃‍♂️`;

    const cleanPhone = (athlete.contactPhone || "").replace(/[^0-9]/g, "");
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone.startsWith("0") ? "27" + cleanPhone.slice(1) : cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  const exportPaymentsCSV = () => {
    const headers = [
      "Athlete Number",
      "First Name",
      "Last Name",
      "Preferred Name",
      "Email",
      "Phone",
      "Category",
      "Discipline",
      "Fee Status",
      "Standard Dues (ZAR)",
      "Expiry Date",
      "ASA License",
    ];

    const rows = athletes.map((a) => [
      a.athleteNumber,
      `"${a.firstName}"`,
      `"${a.lastName}"`,
      `"${a.preferredName || ""}"`,
      `"${a.contactEmail}"`,
      `"${a.contactPhone || ""}"`,
      a.membershipCategory,
      a.primaryDiscipline,
      a.membershipFeeStatus,
      a.standardDues,
      a.membershipExpiry ? a.membershipExpiry.slice(0, 10) : `31/12/${cycle?.year || 2026}`,
      `"${a.asaLicenseNumber || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Super_Eagles_Membership_Dues_${cycle?.year || 2026}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const canManage = ["SUPER_ADMIN", "CLUB_ADMIN", "COACH", "SPONSORSHIP_COMMITTEE"].includes(currentUser?.role);
  const canViewClubTotals = currentUser?.role !== "ATHLETE";

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 rounded-xl border border-emerald-500/40 bg-emerald-950/90 px-5 py-3.5 text-sm font-bold text-emerald-200 shadow-2xl backdrop-blur-md transition-all">
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 shadow-2xl">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute left-1/3 bottom-0 -mb-8 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl" />

        <div className="relative flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <CreditCard className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight sm:text-3xl">
                  Membership Payments & Dues Management
                </h1>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Annual Cycle (1 Jan – 31 Dec) • Arrears Tracking • Banking Reconciliation • 1-Click Renewals
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportPaymentsCSV}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-bold text-slate-200 shadow-sm transition-all hover:bg-slate-700 hover:text-white"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              Export Dues CSV
            </button>
            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white"
              title="Refresh Data"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Operating Cycle Alert Banner */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-2.5 text-xs text-emerald-300">
          <div className="flex items-center gap-2 font-bold">
            <Calendar className="h-4 w-4 text-emerald-400" />
            <span>OPERATING CYCLE:</span>
            <span className="text-white font-mono">{cycle?.label || "Annual Cycle 2026 (1 Jan - 31 Dec)"}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="h-4 w-4 text-amber-400" />
            <span>Policy: All club memberships expire automatically on 31 December per annum.</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      {summary && canViewClubTotals && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Members */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Members</span>
              <span className="rounded-lg bg-blue-500/10 p-2 text-blue-400 border border-blue-500/20">
                <User className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 text-3xl font-black text-white">{summary.totalMembers}</div>
            <div className="mt-1 text-xs text-slate-400">
              Active club roster for {cycle?.year || 2026}
            </div>
          </div>

          {/* Paid Up Members */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Paid Up (Active)</span>
              <span className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 text-3xl font-black text-emerald-400">{summary.paidCount}</div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
              <span>{summary.exemptCount} exempt • {summary.subsidizedCount} subsidized</span>
              <span className="font-bold text-emerald-400">{summary.collectionRatePercent}% Paid</span>
            </div>
          </div>

          {/* In Arrears / Pending */}
          <div className="rounded-2xl border border-rose-900/40 bg-rose-950/10 p-5 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">In Arrears (Pending)</span>
              <span className="rounded-lg bg-rose-500/10 p-2 text-rose-400 border border-rose-500/20">
                <AlertCircle className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 text-3xl font-black text-rose-400">{summary.pendingCount}</div>
            <div className="mt-1 text-xs font-semibold text-rose-300">
              Workouts & race submissions locked
            </div>
          </div>

          {/* Financial Revenue Summary */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Revenue Collected</span>
              <span className="rounded-lg bg-amber-500/10 p-2 text-amber-400 border border-amber-500/20">
                <DollarSign className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 text-3xl font-black text-white">
              R{summary.totalCollectedRevenue.toLocaleString()}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Projected: R{summary.totalProjectedRevenue.toLocaleString()} (Arrears: R{summary.totalOutstandingArrears.toLocaleString()})
            </div>
          </div>
        </div>
      )}

      {/* Official Club Banking Details Card */}
      {banking && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Building2 className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Official Club Bank Account for Membership Dues & EFT
                </h3>
                <p className="text-xs text-slate-400">
                  Share these details with athletes or prospective members to settle their per annum dues.
                </p>
              </div>
            </div>

            <button
              onClick={handleCopyBanking}
              className="flex items-center gap-2 self-start md:self-auto rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-200 transition-all hover:bg-slate-700 hover:text-white"
            >
              {copiedBank ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              {copiedBank ? "Copied to Clipboard!" : "Copy Bank Details"}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-xs">
            <div>
              <span className="text-slate-500 block">Bank</span>
              <span className="font-bold text-slate-200">{banking.bankName}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Account Name</span>
              <span className="font-bold text-slate-200">{banking.accountName}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Account Number</span>
              <span className="font-bold text-emerald-400 font-mono">{banking.accountNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Branch Code</span>
              <span className="font-bold text-slate-200 font-mono">{banking.branchCode}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Account Type</span>
              <span className="font-bold text-slate-200">{banking.accountType}</span>
            </div>
            <div>
              <span className="text-slate-500 block">EFT Reference</span>
              <span className="font-bold text-amber-400">{banking.referenceFormat}</span>
            </div>
          </div>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "ALL", label: "All Members" },
            { id: "PENDING", label: "In Arrears (Pending)", count: summary?.pendingCount },
            { id: "PAID", label: "Paid Up", count: summary?.paidCount },
            { id: "EXEMPT", label: "Exempt / Life", count: summary?.exemptCount },
            { id: "SUBSIDIZED", label: "Subsidized", count: summary?.subsidizedCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                statusFilter === tab.id
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                    statusFilter === tab.id
                      ? "bg-slate-950 text-emerald-400"
                      : tab.id === "PENDING" && tab.count > 0
                      ? "bg-rose-500 text-white"
                      : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search member, ID, ASA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </form>
      </div>

      {/* Main Payment Management Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-black uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Member</th>
                <th className="py-3.5 px-4">Club ID & ASA</th>
                <th className="py-3.5 px-4">Category & Discipline</th>
                <th className="py-3.5 px-4">Annual Dues</th>
                <th className="py-3.5 px-4">Fee Status</th>
                <th className="py-3.5 px-4">Cycle Expiry</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin text-emerald-400" />
                    <span className="mt-2 block font-semibold">Loading membership payment records...</span>
                  </td>
                </tr>
              ) : athletes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <AlertCircle className="mx-auto h-6 w-6 text-slate-500" />
                    <span className="mt-2 block font-semibold">No athletes found matching this filter.</span>
                  </td>
                </tr>
              ) : (
                athletes.map((athlete) => {
                  const isPaid = athlete.membershipFeeStatus === "PAID";
                  const isPending = athlete.membershipFeeStatus === "PENDING";
                  const isExempt = athlete.membershipFeeStatus === "EXEMPT";
                  const isSubsidized = athlete.membershipFeeStatus === "SUBSIDIZED";

                  return (
                    <tr
                      key={athlete.id}
                      className="transition-colors hover:bg-slate-800/40"
                    >
                      {/* Member Info */}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/athletes/${athlete.id}`}
                          className="group flex items-center gap-3"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-600/20 font-black text-emerald-400 border border-emerald-500/30">
                            {athlete.firstName[0]}
                            {athlete.lastName[0]}
                          </div>
                          <div>
                            <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                              {athlete.firstName} {athlete.lastName}
                              {athlete.preferredName && (
                                <span className="ml-1 text-[10px] text-slate-400 font-normal">
                                  ({athlete.preferredName})
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {athlete.contactEmail}
                            </div>
                          </div>
                        </Link>
                      </td>

                      {/* Club ID & ASA License */}
                      <td className="py-3.5 px-4">
                        <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-200 border border-slate-700">
                          {athlete.athleteNumber}
                        </span>
                        {athlete.asaLicenseNumber && (
                          <div className="mt-1 text-[10px] text-slate-400 font-mono">
                            ASA: {athlete.asaLicenseNumber}
                          </div>
                        )}
                      </td>

                      {/* Category & Discipline */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200">
                          {athlete.membershipCategory.replace("_", " ")}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {athlete.disciplineCategory} • {athlete.primaryDiscipline}
                        </div>
                      </td>

                      {/* Annual Dues */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-white">
                          R{athlete.standardDues}
                        </span>
                        <span className="block text-[10px] text-slate-500">per annum</span>
                      </td>

                      {/* Fee Status Badge */}
                      <td className="py-3.5 px-4">
                        {isPaid && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" /> PAID
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-[10px] font-black text-rose-400">
                            <AlertCircle className="h-3 w-3" /> IN ARREARS
                          </span>
                        )}
                        {isExempt && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[10px] font-black text-blue-400">
                            <ShieldCheck className="h-3 w-3" /> EXEMPT
                          </span>
                        )}
                        {isSubsidized && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-[10px] font-black text-purple-400">
                            <DollarSign className="h-3 w-3" /> SUBSIDIZED
                          </span>
                        )}
                      </td>

                      {/* Cycle Expiry */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-[11px] text-slate-300">
                          {athlete.membershipExpiry
                            ? new Date(athlete.membershipExpiry).toLocaleDateString("en-ZA")
                            : `31/12/${cycle?.year || 2026}`}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {isPaid ? "Valid 2026 Season" : isPending ? "Expired / Unpaid" : "Special Standing"}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canManage && (
                            <>
                              {isPending ? (
                                <button
                                  onClick={() => handleQuickRenew(athlete)}
                                  className="rounded-lg bg-emerald-500 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-slate-950 shadow-sm transition-all hover:bg-emerald-400"
                                  title="1-Click Mark Paid & Renew through 31 Dec"
                                >
                                  1-Click Renew
                                </button>
                              ) : (
                                <button
                                  onClick={() => openPaymentModal(athlete)}
                                  className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-bold text-slate-300 hover:bg-slate-700 hover:text-white"
                                  title="Record Payment / Edit Status"
                                >
                                  Record
                                </button>
                              )}

                              {isPending && (
                                <button
                                  onClick={() => handleWhatsAppReminder(athlete)}
                                  className="flex items-center gap-1 rounded-lg border border-green-500/40 bg-green-950/40 px-2 py-1 text-[11px] font-bold text-green-300 hover:bg-green-900/50"
                                  title="Send WhatsApp Payment Reminder"
                                >
                                  <Send className="h-3 w-3 text-green-400" />
                                  Reminder
                                </button>
                              )}
                            </>
                          )}

                          <Link
                            href={`/athletes/${athlete.id}`}
                            className="rounded-lg border border-slate-800 bg-slate-900/80 p-1.5 text-slate-400 hover:border-slate-700 hover:text-white"
                            title="View Profile"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {modalOpen && selectedAthlete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CreditCard className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Record Membership Payment
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedAthlete.firstName} {selectedAthlete.lastName} ({selectedAthlete.athleteNumber})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Amount (ZAR)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 py-2 px-3 text-sm text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 py-2 px-3 text-sm text-white"
                  >
                    <option value="EFT">EFT / Direct Deposit</option>
                    <option value="CASH">Cash at Clubhouse</option>
                    <option value="SNAPSCAN">SnapScan QR</option>
                    <option value="CARD">Debit / Credit Card</option>
                    <option value="SPONSORSHIP">Sponsorship Subsidy</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Fee Status After Recording
                  </label>
                  <select
                    value={feeStatus}
                    onChange={(e) => setFeeStatus(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 py-2 px-3 text-sm text-white"
                  >
                    <option value="PAID">PAID (Full Active Status)</option>
                    <option value="EXEMPT">EXEMPT (Life / Official)</option>
                    <option value="SUBSIDIZED">SUBSIDIZED (50% Supported)</option>
                    <option value="PENDING">PENDING (Keep in Arrears)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Receipt / Transaction Ref
                  </label>
                  <input
                    type="text"
                    value={receiptRef}
                    onChange={(e) => setReceiptRef(e.target.value)}
                    placeholder="e.g. EFT-2026-001"
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 py-2 px-3 text-sm text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Notes / Reference Details
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Optional payment notes, bank statement date, or payer name..."
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 py-2 px-3 text-xs text-white"
                />
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3 text-xs text-emerald-300">
                ✓ Recording this payment will automatically advance the membership expiration date to <strong>31 December {cycle?.year || 2026}</strong> and log an immutable audit trail entry.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="rounded-xl bg-emerald-500 px-5 py-2 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400"
                >
                  {submittingPayment ? "Saving..." : "Confirm & Save Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
