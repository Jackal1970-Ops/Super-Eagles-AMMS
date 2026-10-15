"use client";

import React, { useState } from "react";
import { X, Trash2, Archive, AlertTriangle, ShieldAlert } from "lucide-react";

interface DeleteAthleteModalProps {
  athlete: any;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: (athleteId: string, isPermanent: boolean) => void;
}

export function DeleteAthleteModal({
  athlete,
  isOpen,
  onClose,
  onDeleted,
}: DeleteAthleteModalProps) {
  const [deleteType, setDeleteType] = useState<"SOFT" | "HARD">("SOFT");
  const [confirmText, setConfirmText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsProcessing(true);
    setErrorMessage("");

    try {
      const isHard = deleteType === "HARD";
      const res = await fetch(`/api/athletes/${athlete.id}${isHard ? "?hard=true" : ""}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to remove member.");
      }

      onDeleted(athlete.id, isHard);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  const isConfirmed =
    deleteType === "SOFT" ||
    (deleteType === "HARD" && confirmText.trim().toUpperCase() === "DELETE");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-rose-800/80 bg-[#0F172A] p-6 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-rose-500/20 p-2 text-rose-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">
                Member Removal & Deletion
              </h2>
              <p className="text-xs text-slate-400">
                Member #{athlete.athleteNumber} — {athlete.firstName} {athlete.lastName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-800 p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-800/80 bg-rose-950/60 p-3 text-xs text-rose-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="mt-4 space-y-4 text-xs">
          <p className="text-slate-300">
            Choose how you would like to handle this member record. For audit compliance, soft archival is the recommended standard.
          </p>

          {/* Option 1: Soft Archive (Recommended) */}
          <div
            onClick={() => setDeleteType("SOFT")}
            className={`cursor-pointer rounded-2xl border p-4 transition-all ${
              deleteType === "SOFT"
                ? "border-amber-500 bg-amber-950/30 text-amber-200"
                : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                checked={deleteType === "SOFT"}
                onChange={() => setDeleteType("SOFT")}
                className="mt-1"
              />
              <div>
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <Archive className="h-4 w-4 text-amber-400" />
                  <span>Soft Archive / Deactivate (Recommended)</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Sets membership status to <span className="font-semibold text-amber-300">LAPSED</span> and deactivates linked login credentials. Preserves all race results, training history, and audit trails.
                </p>
              </div>
            </div>
          </div>

          {/* Option 2: Hard Delete */}
          <div
            onClick={() => setDeleteType("HARD")}
            className={`cursor-pointer rounded-2xl border p-4 transition-all ${
              deleteType === "HARD"
                ? "border-rose-600 bg-rose-950/30 text-rose-200"
                : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                checked={deleteType === "HARD"}
                onChange={() => setDeleteType("HARD")}
                className="mt-1"
              />
              <div>
                <div className="flex items-center gap-1.5 font-bold text-rose-300">
                  <Trash2 className="h-4 w-4 text-rose-400" />
                  <span>Permanent Hard Delete (Irreversible)</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Permanently deletes the athlete record, training activities, and wellness entries from the database.
                </p>
              </div>
            </div>
          </div>

          {deleteType === "HARD" && (
            <div className="rounded-xl border border-rose-900 bg-rose-950/50 p-3">
              <label className="block text-[11px] font-bold text-rose-300 mb-1">
                Type <span className="underline font-mono">DELETE</span> to confirm permanent erasure:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full rounded-lg border border-rose-700 bg-slate-950 px-3 py-1.5 font-mono text-xs text-white placeholder-slate-600 focus:outline-hidden"
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isConfirmed || isProcessing}
            onClick={handleConfirm}
            className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-md transition-all disabled:opacity-50 ${
              deleteType === "HARD"
                ? "bg-rose-600 hover:bg-rose-500"
                : "bg-amber-600 hover:bg-amber-500"
            }`}
          >
            {deleteType === "HARD" ? <Trash2 className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
            <span>
              {isProcessing
                ? "Processing..."
                : deleteType === "HARD"
                ? "Permanently Delete Member"
                : "Archive Member"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
