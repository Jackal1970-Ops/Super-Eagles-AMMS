"use client";

import React, { useState, useEffect } from "react";
import {
  WifiOff,
  RefreshCw,
  Share2,
  CheckCircle2,
  Cloud,
  AlertTriangle,
  Smartphone,
  Copy,
} from "lucide-react";
import {
  getOfflineQueue,
  syncOfflineQueue,
  generateWhatsAppSummary,
  OfflineEntry,
} from "@/lib/offline/offlineQueue";

export function OfflineSyncManager() {
  const [isOnline, setIsOnline] = useState(true);
  const [serverReachable, setServerReachable] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [copied, setCopied] = useState(false);

  // Monitor network and server status
  useEffect(() => {
    const updateCounts = () => {
      setPendingCount(getOfflineQueue().length);
    };

    updateCounts();

    const handleOnline = () => {
      setIsOnline(true);
      checkServerHealth();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setServerReachable(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("se_offline_queue_updated", updateCounts);

    // Periodic heartbeat to detect if clubhouse computer is running
    const interval = setInterval(async () => {
      checkServerHealth();
      updateCounts();
    }, 15000);

    const handleOpenModal = () => setShowDrawer(true);
    window.addEventListener("open_offline_sync_modal", handleOpenModal);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("se_offline_queue_updated", updateCounts);
      window.removeEventListener("open_offline_sync_modal", handleOpenModal);
      clearInterval(interval);
    };
  }, []);

  const checkServerHealth = async () => {
    try {
      const res = await fetch("/api/auth/me", { method: "GET", cache: "no-store" });
      if (res.ok) {
        setServerReachable(true);
        // If server is back online and we have pending items, auto-sync!
        if (getOfflineQueue().length > 0) {
          handleSync();
        }
      } else {
        setServerReachable(false);
      }
    } catch {
      setServerReachable(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const result = await syncOfflineQueue();
      setPendingCount(result.remainingCount);
      if (result.successCount > 0) {
        setSyncMessage(`✓ Synced ${result.successCount} offline items to club database!`);
        setTimeout(() => setSyncMessage(null), 5000);
      } else if (result.failedCount > 0) {
        setSyncMessage("Clubhouse PC still offline. Items remain safely stored on your phone.");
        setTimeout(() => setSyncMessage(null), 5000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  const handleWhatsAppShare = () => {
    const text = generateWhatsAppSummary("Sipho Sithole");
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  const handleCopySummary = () => {
    const text = generateWhatsAppSummary("Sipho Sithole");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Only render if server is unreachable or if there are pending items
  if (serverReachable && pendingCount === 0) return null;

  return (
    <>
      {/* Floating Offline / Pending Sync Badge */}
      <div className="fixed bottom-20 right-4 z-40 lg:bottom-6">
        <button
          onClick={() => setShowDrawer(true)}
          className="flex items-center gap-2 rounded-full border border-amber-400 bg-amber-500/95 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-xl backdrop-blur-sm transition-all hover:bg-amber-400"
        >
          {!serverReachable ? (
            <WifiOff className="h-4 w-4 animate-pulse text-slate-950" />
          ) : (
            <RefreshCw className="h-4 w-4 text-slate-950" />
          )}
          <span>
            {!serverReachable ? "Clubhouse PC Offline" : "Sync Pending"} ({pendingCount})
          </span>
        </button>
      </div>

      {/* Offline Drawer / Modal */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Mobile Offline Protection Mode
                  </h3>
                  <div className="text-xs text-amber-400 font-semibold">
                    {!serverReachable
                      ? "Clubhouse PC is currently powered down"
                      : "Online - Ready to sync"}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowDrawer(false)}
                className="rounded-full bg-slate-800 p-1.5 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                When the clubhouse computer is turned off (or during load shedding), your race times, event attendance, and workouts are <strong>safely saved locally on your phone</strong>.
              </p>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-400">Locally Stored Records:</span>
                  <span className="rounded-full bg-amber-950 px-2 py-0.5 font-bold text-amber-400">
                    {pendingCount} items queued
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-slate-400">
                  Nothing will be lost. The moment the clubhouse computer restarts, this phone will automatically sync all entries.
                </div>
              </div>

              {syncMessage && (
                <div className="rounded-xl bg-emerald-950/80 p-3 text-xs font-bold text-emerald-300 border border-emerald-800">
                  {syncMessage}
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  disabled={syncing}
                  onClick={handleSync}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-green-700 py-2.5 text-xs font-bold text-white hover:bg-green-600 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
                  <span>{syncing ? "Checking..." : "Sync to PC"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-500"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>WhatsApp Coach</span>
                </button>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 py-2 text-center text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  {copied ? "✓ Copied summary to clipboard!" : "Copy Offline Text Summary"}
                </button>
              </div>

              {/* Permanent Cloud Hosting Callout */}
              <div className="mt-3 rounded-2xl border border-blue-900/40 bg-blue-950/30 p-3 text-[11px] text-blue-200">
                <div className="flex items-center gap-1.5 font-bold text-blue-300">
                  <Cloud className="h-3.5 w-3.5" />
                  <span>Permanent 24/7 Cloud Option:</span>
                </div>
                <div className="mt-1 text-slate-400">
                  To eliminate dependence on the clubhouse PC being powered on, deploy this app to Vercel/Railway with the included <code className="text-blue-300">DEPLOYMENT_CLOUD_GUIDE.md</code>.
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowDrawer(false)}
                className="text-xs font-semibold text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
