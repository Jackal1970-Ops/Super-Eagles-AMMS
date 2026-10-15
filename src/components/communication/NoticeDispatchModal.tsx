"use client";

import React, { useState } from "react";
import { MessageSquare, Mail, Copy, Check, ExternalLink, X } from "lucide-react";
import {
  generatePaymentReminderNotice,
  generatePaymentReceiptNotice,
  generateRaceLogisticsNotice,
  generateRenewalNotice,
  type DispatchNotice,
} from "@/lib/communication/noticeEngine";

interface NoticeDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "PAYMENT_REMINDER" | "PAYMENT_RECEIPT" | "RACE_LOGISTICS" | "SEASON_RENEWAL";
  payload: any;
}

export function NoticeDispatchModal({ isOpen, onClose, type, payload }: NoticeDispatchModalProps) {
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen) return null;

  let notice: DispatchNotice;
  try {
    switch (type) {
      case "PAYMENT_REMINDER":
        notice = generatePaymentReminderNotice(payload);
        break;
      case "PAYMENT_RECEIPT":
        notice = generatePaymentReceiptNotice(payload);
        break;
      case "RACE_LOGISTICS":
        notice = generateRaceLogisticsNotice(payload);
        break;
      case "SEASON_RENEWAL":
        notice = generateRenewalNotice(payload);
        break;
      default:
        notice = {
          recipientName: payload.athleteName || "Member",
          recipientPhone: payload.phone || null,
          recipientEmail: payload.email || null,
          title: "Notice",
          subject: "Super Eagles Athletics Notice",
          body: "Please view your account details on the Super Eagles club portal.",
          whatsappUrl: null,
          mailtoUrl: null,
        };
    }
  } catch (err: any) {
    notice = {
      recipientName: "Member",
      recipientPhone: null,
      recipientEmail: null,
      title: "Notice Error",
      subject: "Error generating notice",
      body: `Unable to compile notice: ${err.message}`,
      whatsappUrl: null,
      mailtoUrl: null,
    };
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(notice.body);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-800/60 px-5 py-4">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Direct Notice Dispatch</h3>
              <p className="text-xs text-slate-400">Recipient: {notice.recipientName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Subject</label>
            <div className="mt-1 text-sm font-medium text-slate-200 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              {notice.subject}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Message Content</label>
              <button
                onClick={handleCopy}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 font-medium"
              >
                {copiedText ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedText ? "Copied!" : "Copy text"}</span>
              </button>
            </div>
            <textarea
              readOnly
              rows={8}
              value={notice.body}
              className="w-full bg-slate-950 text-slate-200 p-3 rounded-lg border border-slate-800 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs text-slate-400 bg-slate-800/40 p-3 rounded-lg">
            <div>
              <span className="block text-slate-500">WhatsApp Destination</span>
              <span className="font-mono text-slate-300 font-semibold">{notice.recipientPhone || "No phone on record"}</span>
            </div>
            <div>
              <span className="block text-slate-500">Email Destination</span>
              <span className="font-mono text-slate-300 truncate font-semibold">{notice.recipientEmail || "No email on record"}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-slate-800 bg-slate-800/30 p-4 grid grid-cols-2 gap-3">
          <a
            href={notice.whatsappUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl font-medium text-sm transition shadow-lg ${
              notice.recipientPhone && notice.whatsappUrl
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30"
                : "bg-slate-800 text-slate-500 cursor-not-allowed pointer-events-none"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Launch WhatsApp</span>
            <ExternalLink className="h-3 w-3" />
          </a>

          <a
            href={notice.mailtoUrl || "#"}
            className={`flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl font-medium text-sm transition border ${
              notice.recipientEmail && notice.mailtoUrl
                ? "bg-slate-700 hover:bg-slate-600 text-white border-slate-600 shadow-slate-900/30"
                : "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed pointer-events-none"
            }`}
          >
            <Mail className="h-4 w-4" />
            <span>Launch Email Client</span>
          </a>
        </div>
      </div>
    </div>
  );
}
