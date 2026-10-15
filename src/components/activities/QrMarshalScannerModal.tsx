"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  X,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Zap,
  Users,
  Search,
  Check,
  Flame,
  Smartphone,
  Wifi,
} from "lucide-react";

interface QrMarshalScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: any;
  allActivities?: any[];
  athletes: any[];
  onAttendanceUpdated: (athleteId: string, activityId?: string) => void;
}

export function QrMarshalScannerModal({
  isOpen,
  onClose,
  activity,
  allActivities = [],
  athletes,
  onAttendanceUpdated,
}: QrMarshalScannerModalProps) {
  const [currentActivity, setCurrentActivity] = useState<any>(activity);
  const [scanInput, setScanInput] = useState("");

  useEffect(() => {
    if (activity) setCurrentActivity(activity);
  }, [activity]);
  const [lastScanned, setLastScanned] = useState<{
    athlete: any;
    timestamp: Date;
    success: boolean;
    message: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentCheckedIn, setRecentCheckedIn] = useState<any[]>([]);
  const [showPhoneGuide, setShowPhoneGuide] = useState(false);
  const [networkInfo, setNetworkInfo] = useState<{ primaryUrl: string; primaryIp: string; remoteTunnelUrl?: string | null } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
      fetch("/api/network-info")
        .then((r) => r.json())
        .then((data) => {
          if (data && data.primaryUrl) setNetworkInfo(data);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen || !activity) return null;

  const processQrPayload = async (rawCode: string) => {
    if (!rawCode.trim() || isProcessing) return;
    setIsProcessing(true);

    try {
      // QR payload format: "SEA-001|Name|id" or simply "SEA-001" or ID
      const parts = rawCode.trim().split("|");
      const searchKey = parts[0].trim().toUpperCase();

      const matchedAthlete = athletes.find(
        (a) =>
          a.athleteNumber?.toUpperCase() === searchKey ||
          a.id === searchKey ||
          `${a.firstName} ${a.lastName}`.toLowerCase() === rawCode.trim().toLowerCase()
      );

      if (!matchedAthlete) {
        setLastScanned({
          athlete: null,
          timestamp: new Date(),
          success: false,
          message: `Unknown barcode/QR code: "${rawCode}". No member found.`,
        });
        setScanInput("");
        return;
      }

      const activeEvent = currentActivity || activity;
      // Execute live check-in via API
      const res = await fetch("/api/club-activities/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId: activeEvent.id,
          athleteIds: [matchedAthlete.id],
        }),
      });

      if (!res.ok) {
        throw new Error("Check-in request failed on server.");
      }

      setLastScanned({
        athlete: matchedAthlete,
        timestamp: new Date(),
        success: true,
        message: `Verified & Checked In for ${activeEvent.title}! +${activeEvent.pointsValue || 15} CCLI Points awarded.`,
      });

      setRecentCheckedIn((prev) => [
        { athlete: matchedAthlete, time: new Date(), activityTitle: activeEvent.title },
        ...prev.slice(0, 4),
      ]);

      onAttendanceUpdated(matchedAthlete.id, activeEvent.id);
      setScanInput("");
    } catch (err: any) {
      setLastScanned({
        athlete: null,
        timestamp: new Date(),
        success: false,
        message: err.message || "Failed to record attendance.",
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      processQrPayload(scanInput);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-700/80 bg-[#0F172A] p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-md">
            <QrCode className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">
                Marshal QR Rapid Scanner
              </h2>
              <span className="rounded-full bg-orange-950 px-2 py-0.5 text-[10px] font-bold text-orange-400 border border-orange-800 animate-pulse">
                Live Scanner
              </span>
            </div>
            {allActivities && allActivities.length > 0 ? (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-slate-400 shrink-0">Active Event:</span>
                <select
                  value={currentActivity?.id || activity?.id}
                  onChange={(e) => {
                    const found = allActivities.find((a) => a.id === e.target.value);
                    if (found) setCurrentActivity(found);
                  }}
                  className="rounded-lg border border-orange-500/60 bg-slate-900 px-2.5 py-1 text-xs font-bold text-orange-300 focus:outline-none focus:ring-1 focus:ring-orange-400 max-w-[280px] truncate"
                >
                  {allActivities.map((act) => (
                    <option key={act.id} value={act.id} className="bg-slate-900 text-white">
                      {act.title} ({act.activityType.replace(/_/g, " ")}) — {new Date(act.date).toLocaleDateString("en-ZA", { month: "short", day: "numeric" })}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-xs text-slate-400 truncate max-w-xs mt-0.5">
                Event: <b className="text-white">{currentActivity?.title || activity.title}</b>
              </p>
            )}
          </div>
        </div>

        {/* Scanner Viewport Simulation & Direct Input Box */}
        <div className="mt-5 space-y-4">
          <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-orange-500/50 bg-slate-900/80 p-6 text-center overflow-hidden">
            {/* Target Reticle Crosshairs */}
            <div className="relative flex h-32 w-32 items-center justify-center rounded-2xl border-2 border-orange-400 bg-orange-500/10 shadow-lg shadow-orange-950/50">
              <Camera className="h-10 w-10 text-orange-400 opacity-60 animate-pulse" />
              {/* Corner Accents */}
              <div className="absolute -top-1 -left-1 h-3 w-3 border-t-2 border-l-2 border-orange-300" />
              <div className="absolute -top-1 -right-1 h-3 w-3 border-t-2 border-r-2 border-orange-300" />
              <div className="absolute -bottom-1 -left-1 h-3 w-3 border-b-2 border-l-2 border-orange-300" />
              <div className="absolute -bottom-1 -right-1 h-3 w-3 border-b-2 border-r-2 border-orange-300" />
            </div>

            <span className="mt-3 text-xs font-bold text-slate-300">
              Point handheld barcode scanner or camera at athlete's Digital Card
            </span>
            <span className="text-[11px] text-slate-500">
              Supports hardware USB scanners, optical QR codes, and manual SEA number entry
            </span>

            {/* Phone Scanner Helper */}
            <div className="mt-3 w-full text-center">
              <button
                type="button"
                onClick={() => setShowPhoneGuide(!showPhoneGuide)}
                className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-semibold transition-colors"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{showPhoneGuide ? "Hide Phone Connection Guide" : "Want to use your smartphone's camera to scan?"}</span>
              </button>

              {showPhoneGuide && (
                <div className="mt-2.5 rounded-xl border border-sky-800/80 bg-sky-950/70 p-3 text-left text-xs text-sky-200 shadow-inner">
                  <div className="flex items-center gap-1.5 font-bold text-white mb-1">
                    <Wifi className="w-3.5 h-3.5 text-sky-400" />
                    <span>How to use your phone as the scanner:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300">
                    <li>Connect your smartphone to the same Wi-Fi as this club computer (or connect this computer to your phone's Wi-Fi hotspot).</li>
                    <li>
                      Open <b>Chrome or Safari</b> on your phone and go to:
                      <div className="mt-1 font-mono font-bold text-cyan-300 bg-slate-900 px-2 py-1 rounded border border-slate-700 select-all">
                        {networkInfo?.primaryUrl ? `${networkInfo.primaryUrl}/club-activities` : "http://<club-computer-ip>:3000/club-activities"}
                      </div>
                    </li>
                    {networkInfo?.remoteTunnelUrl && (
                      <li className="mt-1">
                        <span className="text-emerald-400 font-bold">Or from anywhere across South Africa (Cloudflare Tunnel):</span>
                        <div className="mt-1 font-mono font-bold text-emerald-400 bg-slate-900 px-2 py-1 rounded border border-emerald-800 select-all">
                          {networkInfo.remoteTunnelUrl}/club-activities
                        </div>
                      </li>
                    )}
                    <li>Log in with your Coach or Admin account.</li>
                    <li>Tap <b>Open QR Marshal Scanner</b> on your phone. Your phone camera will open in the browser to scan runners!</li>
                  </ol>
                  <p className="mt-2 text-[10px] text-slate-400 italic">
                    Note: All scans taken from your phone save instantly to this club computer's database. No app store installation needed.
                  </p>
                </div>
              )}
            </div>

            {/* Hidden/Active input for keyboard/barcode scanner emulation */}
            <div className="mt-4 w-full flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Scan QR or type athlete # (e.g. SEA-001)..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 pl-9 text-xs font-mono font-bold text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                  autoFocus
                />
                <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-500" />
              </div>
              <button
                onClick={() => processQrPayload(scanInput)}
                disabled={!scanInput.trim() || isProcessing}
                className="rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-orange-500 disabled:opacity-40 transition-colors shrink-0"
              >
                Enter
              </button>
            </div>
          </div>

          {/* Verification Status Result Flash */}
          {lastScanned && (
            <div
              className={`flex items-center gap-3 rounded-2xl p-4 border transition-all ${
                lastScanned.success
                  ? "border-emerald-700/80 bg-gradient-to-r from-emerald-950/60 to-slate-900 text-emerald-200"
                  : "border-rose-800/80 bg-rose-950/50 text-rose-300"
              }`}
            >
              {lastScanned.success ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-rose-400 shrink-0" />
              )}
              <div className="text-xs">
                {lastScanned.athlete && (
                  <div className="font-black text-white text-sm">
                    {lastScanned.athlete.firstName} {lastScanned.athlete.lastName} ({lastScanned.athlete.athleteNumber})
                  </div>
                )}
                <div className="font-semibold text-[11px]">{lastScanned.message}</div>
              </div>
            </div>
          )}

          {/* Quick Demo Test Buttons (Instant Tap for Real Athletes) */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Quick Test Tap (Sample Club Members):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {athletes.slice(0, 5).map((ath) => (
                <button
                  key={ath.id}
                  onClick={() => processQrPayload(ath.athleteNumber)}
                  className="rounded-lg border border-slate-700 bg-slate-900/90 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:border-orange-500 hover:text-white transition-colors"
                >
                  {ath.athleteNumber}: {ath.firstName}
                </button>
              ))}
            </div>
          </div>

          {/* Recent Scanned Log in this Session */}
          {recentCheckedIn.length > 0 && (
            <div className="border-t border-slate-800/80 pt-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Recently Checked In ({recentCheckedIn.length}):
              </span>
              <div className="space-y-1">
                {recentCheckedIn.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-slate-900/50 px-2.5 py-1 text-[11px] text-slate-300"
                  >
                    <span>
                      {item.athlete.firstName} {item.athlete.lastName} ({item.athlete.athleteNumber})
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">
                      {item.time.toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-5 flex justify-end border-t border-slate-800 pt-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Done Scanning
          </button>
        </div>
      </div>
    </div>
  );
}

