"use client";

import React, { useState } from "react";
import { X, DollarSign, Calendar, Tag, FileText, CheckCircle2, AlertTriangle, Building } from "lucide-react";

interface RecordDisbursementModalProps {
  athleteId: string;
  athleteName: string;
  athleteNumber: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTransaction: any, updatedTotalZar: number) => void;
}

const SUPPORT_TYPES = [
  { value: "CASH_STIPEND", label: "Monthly Cash Stipend", desc: "Direct athlete living / training allowance" },
  { value: "RACE_ENTRY", label: "Race Entry Subsidy", desc: "Marathon / Ultra entry fee allocation" },
  { value: "EQUIPMENT", label: "Footwear & Kit Package", desc: "Running shoes, race singlet, apparel" },
  { value: "TRAVEL", label: "Travel & Logistics", desc: "Flights, fuel, accommodation for away races" },
  { value: "PHYSIO_MEDICAL", label: "Medical & Physio Support", desc: "Biokinetics, physiotherapy, recovery" },
  { value: "COACHING_SUBSIDY", label: "Coaching Subsidy", desc: "Private coaching & conditioning retainer" },
  { value: "OTHER", label: "Other Club Grant", desc: "Discretionary development grant" },
];

const FUNDING_SOURCES = [
  { value: "CLUB_CORE_BUDGET", label: "Super Eagles Core Budget" },
  { value: "TITLE_SPONSOR", label: "Corporate Title Sponsor Fund" },
  { value: "DONOR", label: "Private Patron / Donor Grant" },
  { value: "EVENT_SUBSIDY", label: "Special Event Subsidy" },
];

export function RecordDisbursementModal({
  athleteId,
  athleteName,
  athleteNumber,
  isOpen,
  onClose,
  onSuccess,
}: RecordDisbursementModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [supportType, setSupportType] = useState<string>("CASH_STIPEND");
  const [fundingSource, setFundingSource] = useState<string>("CLUB_CORE_BUDGET");
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const parsedAmount = parseFloat(amount.replace(/,/g, ""));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg("Please enter a valid disbursement amount in ZAR.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/sponsorship/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          athleteId,
          amount: parsedAmount,
          supportType,
          fundingSource,
          transactionDate,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record disbursement.");
      }

      onSuccess(data.transaction, data.updatedTotalZar);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error saving transaction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700/90 bg-[#1E293B] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-700/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Record Sponsorship Disbursement</h3>
              <p className="text-xs text-slate-300">
                Member: <strong className="text-white">{athleteName}</strong> ({athleteNumber})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-800/60 bg-rose-950/50 p-3 text-xs text-rose-200">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {/* Amount & Date Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Disbursement Amount (ZAR) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">
                  R
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/90 py-2.5 pl-8 pr-3 font-mono font-bold text-emerald-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Transaction Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/90 py-2.5 px-3 font-mono text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Support Category */}
          <div>
            <label className="block font-bold text-slate-300 mb-1">
              Support Category *
            </label>
            <select
              value={supportType}
              onChange={(e) => setSupportType(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/90 py-2.5 px-3 text-white focus:border-emerald-500 focus:outline-none text-xs"
            >
              {SUPPORT_TYPES.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label} — {st.desc}
                </option>
              ))}
            </select>
          </div>

          {/* Funding Source */}
          <div>
            <label className="block font-bold text-slate-300 mb-1">
              Funding Source *
            </label>
            <select
              value={fundingSource}
              onChange={(e) => setFundingSource(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/90 py-2.5 px-3 text-white focus:border-emerald-500 focus:outline-none text-xs"
            >
              {FUNDING_SOURCES.map((fs) => (
                <option key={fs.value} value={fs.value}>
                  {fs.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reference Notes */}
          <div>
            <label className="block font-bold text-slate-300 mb-1">
              Purpose &amp; Authorization Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Monthly stipend approved per committee meeting minute #4..."
              className="w-full rounded-xl border border-slate-700 bg-slate-900/90 p-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none text-xs"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700/80">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-md transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{isSubmitting ? "Recording..." : "Record Disbursement"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
