"use client";

import React, { useState } from "react";
import {
  Smartphone,
  Wifi,
  Globe,
  Cloud,
  CheckCircle2,
  Copy,
  ExternalLink,
  Shield,
  X,
  Share2,
} from "lucide-react";

interface RemoteAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  localIp?: string;
}

export function RemoteAccessModal({
  isOpen,
  onClose,
  localIp = "172.25.8.121",
}: RemoteAccessModalProps) {
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 3000);
  };

  const localWifiUrl = `http://${localIp}:3000`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-slate-800 p-1.5 text-slate-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-600/20 text-green-400 border border-green-500/30">
            <Smartphone className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">
              Athlete Remote & Mobile Access Guide
            </h2>
            <p className="text-xs text-slate-400">
              How athletes access their profiles, log workouts, and check predictions when away from the clubhouse.
            </p>
          </div>
        </div>

        {/* Access Pathways */}
        <div className="mt-5 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Pathway 1: Production 24/7 Cloud Deployment (No Laptop Needed) */}
          <div className="rounded-2xl border border-green-700/50 bg-gradient-to-br from-green-950/40 via-slate-900 to-slate-900 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-green-400">
                <Globe className="h-4 w-4 text-green-400" />
                <span>Permanent 24/7 Cloud Hosting (Zero Laptops Needed)</span>
              </div>
              <span className="rounded-full bg-green-900/60 px-2.5 py-0.5 text-[10px] font-bold text-green-300 border border-green-700/50">
                Recommended Production Setup
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              When deployed to a cloud server (such as <strong>Vercel, Railway, Render, or an AWS VPS</strong>), the system runs <strong>24 hours a day, 365 days a year</strong>. Athletes access it anytime from their mobile phones at race events (e.g. Comrades, Two Oceans, track meets) over 4G/5G mobile data. No club manager or coach needs to have a laptop turned on.
            </p>

            <div className="mt-3 rounded-xl bg-slate-950 p-3 border border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400">
                Club Public Web Address:
              </div>
              <div className="mt-1 flex items-center justify-between gap-2 font-mono text-xs text-green-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                <code>https://supereagles-ams.vercel.app</code>
                <button
                  onClick={() =>
                    copyToClipboard(
                      "https://supereagles-ams.vercel.app",
                      "cloud-url"
                    )
                  }
                  className="text-slate-400 hover:text-white"
                  title="Copy web address"
                >
                  {copied === "cloud-url" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                Athletes bookmark this URL or install it on their phones. They can view race predictions, self check-in at club runs, and view training targets straight from their pockets.
              </p>
            </div>
          </div>

          {/* Pathway 2: Mobile Home Screen App (PWA - 1 Tap Install) */}
          <div className="rounded-2xl border border-purple-700/40 bg-purple-950/20 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-purple-400">
                <Smartphone className="h-4 w-4 text-purple-400" />
                <span>Add App to Phone Home Screen (iPhone & Android)</span>
              </div>
              <span className="rounded-full bg-purple-900/60 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                Native App Experience
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Athletes do not need to open a browser every time. They can pin the app directly to their smartphone home screen with the official Super Eagles emblem icon:
            </p>

            <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-xs text-slate-300">
              <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                <strong className="text-white flex items-center gap-1.5">
                  <span>📱 Apple iPhone (iOS Safari):</span>
                </strong>
                <ol className="mt-1.5 list-decimal list-inside space-y-1 text-[11px] text-slate-400">
                  <li>Open the club URL in Safari</li>
                  <li>Tap the <strong>Share</strong> button (box with upward arrow)</li>
                  <li>Select <strong>"Add to Home Screen"</strong></li>
                  <li>Tap <strong>Add</strong> — Super Eagles icon appears on home screen!</li>
                </ol>
              </div>

              <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                <strong className="text-white flex items-center gap-1.5">
                  <span>🤖 Android (Google Chrome):</span>
                </strong>
                <ol className="mt-1.5 list-decimal list-inside space-y-1 text-[11px] text-slate-400">
                  <li>Open the club URL in Chrome</li>
                  <li>Tap the <strong>three dots (⋮)</strong> menu at top right</li>
                  <li>Tap <strong>"Install app"</strong> or "Add to Home Screen"</li>
                  <li>Launches full-screen with no browser address bar!</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Pathway 3: Offline Trail & Mountain Mode */}
          <div className="rounded-2xl border border-amber-700/40 bg-amber-950/20 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-400">
                <Wifi className="h-4 w-4 text-amber-400" />
                <span>Offline Trail & Race Day Mode (Zero Cellular Signal)</span>
              </div>
              <span className="rounded-full bg-amber-900/60 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                Built-in Resilience
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              If an athlete is running in a valley or mountain trail with zero cell reception:
            </p>
            <ul className="mt-2 space-y-1 text-[11px] text-slate-400 list-disc list-inside">
              <li>Athlete profile and recent training data remain cached on the phone.</li>
              <li>Attendance self-check-in is stored in the local phone queue.</li>
              <li>When cell reception is re-established, the phone automatically synchronizes with the club database.</li>
              <li>Athletes can also tap <strong>"Share via WhatsApp"</strong> to dispatch a 1-tap summary directly to the club captain.</li>
            </ul>
          </div>

          {/* Pathway 4: Local Developer Testing (Only for PC Development) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3.5 opacity-75 hover:opacity-100 transition-opacity">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-400">
                <Cloud className="h-3.5 w-3.5 text-slate-500" />
                <span>Developer Note: Local PC Testing Only</span>
              </div>
              <span className="text-[10px] text-slate-500">Development Debugging</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Running a temporary tunnel (like <code className="text-slate-300">cloudflared tunnel --url http://localhost:3000</code> or local clubhouse Wi-Fi <code className="text-slate-300">{localWifiUrl}</code>) is strictly for developer debugging while sitting at your laptop. For athletes out in the field, use Pathway 1 (24/7 Cloud Hosting).
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Shield className="h-3.5 w-3.5 text-green-400" />
            <span>Encrypted with POPIA Role-Based Authorization</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-green-700 px-4 py-2 text-xs font-bold text-white hover:bg-green-600 transition-all"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
