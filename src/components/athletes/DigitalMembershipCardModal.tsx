"use client";

import React, { useMemo } from "react";
import {
  Shield,
  X,
  QrCode,
  Download,
  Share2,
  CheckCircle2,
  Calendar,
  Award,
  Sparkles,
  Printer,
} from "lucide-react";
import { generateQrSvg } from "@/lib/qr/qrGenerator";

interface DigitalMembershipCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  athlete: {
    id: string;
    athleteNumber: string;
    firstName: string;
    lastName: string;
    asaLicenseNumber?: string | null;
    membershipCategory: string;
    disciplineCategory: string;
    athleteStatus: string;
    membershipStartDate: string | Date;
  };
}

export function DigitalMembershipCardModal({
  isOpen,
  onClose,
  athlete,
}: DigitalMembershipCardModalProps) {
  if (!isOpen) return null;

  const qrPayload = useMemo(() => {
    return `${athlete.athleteNumber}|${athlete.firstName} ${athlete.lastName}|${athlete.id}`;
  }, [athlete]);

  const qrSvg = useMemo(() => {
    return generateQrSvg(qrPayload, 180, "#0F172A", "#FFFFFF");
  }, [qrPayload]);

  const memberSince = new Date(athlete.membershipStartDate).getFullYear();

  const handleDownload = () => {
    const blob = new Blob([qrSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SuperEagles_Card_${athlete.athleteNumber}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 rounded-full bg-slate-800 p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Digital Membership Card (Luxury Dark & Gold Foil Aesthetic) */}
        <div
          id="membership-card-print-target"
          className="overflow-hidden rounded-3xl border-2 border-amber-500/40 bg-gradient-to-br from-[#0B1120] via-[#111A2E] to-[#0A0E1A] p-6 text-white shadow-2xl shadow-orange-950/40"
        >
          {/* Card Top: Crest & Club Name */}
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
            <div className="flex items-center gap-3">
              <img
                src="/images/emblem.png"
                alt="Super Eagles Emblem"
                className="h-12 w-auto object-contain drop-shadow-md"
              />
              <div>
                <span className="text-xs font-black tracking-wider uppercase text-amber-400">
                  Super Eagles AC
                </span>
                <h3 className="text-sm font-bold text-slate-100">
                  Official Digital Membership Card
                </h3>
              </div>
            </div>
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Active
            </span>
          </div>

          {/* Card Center: Member Details & QR Code */}
          <div className="my-6 flex items-center justify-between gap-4">
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Member Name
                </span>
                <div className="text-lg font-black text-white leading-tight">
                  {athlete.firstName} {athlete.lastName}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Athlete Number
                </span>
                <div className="font-mono text-sm font-bold text-orange-400">
                  {athlete.athleteNumber}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  ASA License Number
                </span>
                <div className="font-mono text-xs font-semibold text-slate-200">
                  {athlete.asaLicenseNumber || "ASA-2026-PROV"}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Discipline & Squad
                </span>
                <div className="text-xs font-semibold text-amber-300 capitalize">
                  {athlete.disciplineCategory.toLowerCase()} • {athlete.athleteStatus.toLowerCase()}
                </div>
              </div>
            </div>

            {/* Live SVG QR Code Box */}
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-2.5 shadow-lg border border-slate-200 shrink-0">
              <div
                dangerouslySetInnerHTML={{ __html: qrSvg }}
                className="h-[140px] w-[140px] flex items-center justify-center overflow-hidden"
              />
              <span className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-800 font-mono">
                Scan for Check-In
              </span>
            </div>
          </div>

          {/* Card Bottom: Validity & Security Footer */}
          <div className="flex items-center justify-between border-t border-amber-500/20 pt-4 text-[11px] text-slate-400">
            <div>
              <span>Member Since: </span>
              <b className="text-slate-200">{memberSince}</b>
            </div>
            <div className="flex items-center gap-1 text-amber-400">
              <Sparkles className="h-3 w-3" />
              <span>Season 2025/2026</span>
            </div>
          </div>
        </div>

        {/* Print Stylesheet for clean PDF export */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              #membership-card-print-target,
              #membership-card-print-target * {
                visibility: visible !important;
              }
              #membership-card-print-target {
                position: fixed !important;
                left: 50% !important;
                top: 50% !important;
                transform: translate(-50%, -50%) !important;
                width: 440px !important;
                max-width: 95% !important;
                margin: 0 !important;
                padding: 24px !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                box-shadow: none !important;
                border: 2px solid #f59e0b !important;
                border-radius: 24px !important;
                background: linear-gradient(135deg, #0B1120 0%, #111A2E 50%, #0A0E1A 100%) !important;
                color: #ffffff !important;
              }
            }
          `
        }} />

        {/* Modal Action Controls */}
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={handlePrintPdf}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-amber-500 transition-colors"
            title="Export card to PDF or send to printer"
          >
            <Printer className="h-4 w-4" />
            <span>Export to PDF / Print</span>
          </button>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-orange-500 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Save Card (SVG)</span>
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

