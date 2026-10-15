"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CalendarCheck2,
  Users,
  PlusCircle,
  Clock,
  MapPin,
  CheckCircle2,
  HeartHandshake,
  Check,
  X,
  Search,
  Sparkles,
  Award,
  Zap,
  WifiOff,
  Share2,
  Upload,
  Calendar as CalendarIcon,
  QrCode,
} from "lucide-react";
import { saveOfflineEntry, generateWhatsAppSummary } from "@/lib/offline/offlineQueue";
import { ClubActivityCalendarView } from "./ClubActivityCalendarView";
import { QrMarshalScannerModal } from "./QrMarshalScannerModal";

interface ClubActivityClientViewProps {
  activities: any[];
  athletes: any[];
  userRole: string;
  currentUser?: {
    id: string;
    name: string;
    role: string;
    athleteId?: string;
  };
}

export function ClubActivityClientView({
  activities: initialActivities,
  athletes,
  userRole,
  currentUser,
}: ClubActivityClientViewProps) {
  const [activities, setActivities] = useState<any[]>(initialActivities);
  const [selectedActivity, setSelectedActivity] = useState<any>(activities[0] || null);
  const [attendedIds, setAttendedIds] = useState<string[]>(
    activities[0]?.attendances?.map((a: any) => a.athleteId) || []
  );
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [activityTypeFilter, setActivityTypeFilter] = useState("ALL");
  const [checkInMessage, setCheckInMessage] = useState<{ id: string; text: string } | null>(null);
  const [viewMode, setViewMode] = useState<"calendar" | "register">("calendar");
  const effectiveViewMode = userRole === "ATHLETE" ? "calendar" : viewMode;
  const [showScannerModal, setShowScannerModal] = useState(false);

  // Self check-in for current athlete
  const currentAthleteId = currentUser?.athleteId || athletes[0]?.id; // default to first athlete for testing if not assigned

  const handleSelectActivity = (act: any) => {
    setSelectedActivity(act);
    setAttendedIds(act.attendances?.map((a: any) => a.athleteId) || []);
    setSaveSuccess(false);
  };

  const toggleAthlete = (athId: string) => {
    if (attendedIds.includes(athId)) {
      setAttendedIds(attendedIds.filter((id) => id !== athId));
    } else {
      setAttendedIds([...attendedIds, athId]);
    }
  };

  const handleSelectAll = () => {
    if (attendedIds.length === athletes.length) {
      setAttendedIds([]);
    } else {
      setAttendedIds(athletes.map((a) => a.id));
    }
  };

  // Member 1-Click Self Check-In
  const handleMemberSelfCheckIn = async (act: any) => {
    if (!currentAthleteId) return;

    try {
      const res = await fetch("/api/club-activities/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId: act.id,
          athleteId: currentAthleteId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setCheckInMessage({
          id: act.id,
          text: data.message || "✓ Attendance successfully confirmed!",
        });

        // Update local state
        setActivities((prev) =>
          prev.map((item) => {
            if (item.id === act.id) {
              const alreadyHas = item.attendances?.some(
                (att: any) => att.athleteId === currentAthleteId
              );
              if (!alreadyHas) {
                return {
                  ...item,
                  attendances: [
                    ...(item.attendances || []),
                    { athleteId: currentAthleteId, attended: true },
                  ],
                };
              }
            }
            return item;
          })
        );

        if (selectedActivity?.id === act.id && !attendedIds.includes(currentAthleteId)) {
          setAttendedIds([...attendedIds, currentAthleteId]);
        }

        setTimeout(() => setCheckInMessage(null), 5000);
      } else {
        throw new Error(data.error || "Failed to confirm attendance on server");
      }
    } catch (e) {
      // Clubhouse PC is offline or connection lost! Save locally into offline queue
      console.warn("Clubhouse PC offline or unreachable. Saving check-in to offline queue:", e);
      saveOfflineEntry("ATTENDANCE", {
        activityId: act.id,
        activityTitle: act.title,
        athleteId: currentAthleteId,
      }, currentUser?.name || "Athlete");

      setCheckInMessage({
        id: act.id,
        text: "⚡ Clubhouse PC offline. Check-in saved safely to your phone! Tap the bottom offline badge to WhatsApp coach or sync later.",
      });

      // Optimistically update UI so athlete sees they attended
      setActivities((prev) =>
        prev.map((item) => {
          if (item.id === act.id) {
            return {
              ...item,
              attendances: [
                ...(item.attendances || []),
                { athleteId: currentAthleteId, attended: true },
              ],
            };
          }
          return item;
        })
      );

      setTimeout(() => setCheckInMessage(null), 8000);
    }
  };

  const handleSaveBulkAttendance = async () => {
    if (!selectedActivity) return;
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/club-activities/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId: selectedActivity.id,
          attendedAthleteIds: attendedIds,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        // Update local activity attendance count
        setActivities((prev) =>
          prev.map((item) => {
            if (item.id === selectedActivity.id) {
              return {
                ...item,
                attendances: attendedIds.map((id) => ({ athleteId: id, attended: true })),
              };
            }
            return item;
          })
        );
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const filteredActivities = activities.filter((act) => {
    if (activityTypeFilter === "ALL") return true;
    if (activityTypeFilter === "WALKS")
      return act.activityType.includes("WALK") || act.title.toLowerCase().includes("walk");
    if (activityTypeFilter === "RUNS")
      return (
        act.activityType === "WEEKLY_RUN" ||
        act.activityType === "TIME_TRIAL" ||
        act.activityType === "LONG_RUN"
      );
    if (activityTypeFilter === "VOLUNTEER")
      return (
        act.activityType === "VOLUNTEER_EVENT" ||
        act.activityType === "WATER_POINT" ||
        act.activityType === "CLUB_MEETING"
      );
    return true;
  });

  const filteredAthletes = athletes.filter((a) => {
    const term = searchFilter.toLowerCase();
    return (
      a.firstName.toLowerCase().includes(term) ||
      a.lastName.toLowerCase().includes(term) ||
      a.athleteNumber.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Member Self Check-In Banner */}
      <div className="rounded-2xl border border-green-700/40 bg-gradient-to-r from-green-950/70 via-slate-900 to-slate-900 p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-600/20 text-green-400 border border-green-500/30">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">
                Member Event Self-Check-In & CCLI Participation Recording
              </h2>
              <p className="mt-0.5 text-xs text-slate-300">
                Log in and tap <strong className="text-green-300">Confirm My Attendance</strong> on any scheduled club run, pack walk, time trial, or volunteer station to automatically earn loyalty points.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-green-900/60 px-3 py-1 text-xs font-bold text-green-300 border border-green-700/50">
              Active Member: {currentUser?.name || "Sipho Sithole"}
            </span>

            {/* Direct WhatsApp Share button for offline attendance reporting */}
            <button
              type="button"
              onClick={() => {
                const text = generateWhatsAppSummary(currentUser?.name || "Sipho Sithole");
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
              }}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition-all"
              title="If clubhouse PC is offline, tap to WhatsApp your coach/captain directly"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Share via WhatsApp</span>
            </button>

            {/* Open Offline Queue Drawer */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("open_offline_sync_modal"))}
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-all"
              title="View saved offline items and synchronization status"
            >
              <WifiOff className="h-3.5 w-3.5 text-amber-400" />
              <span>Offline Queue</span>
            </button>
          </div>
        </div>
      </div>

      {/* View Switcher: Interactive Calendar vs Attendance Capture Register */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/90 p-1">
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
              effectiveViewMode === "calendar"
                ? "bg-green-700 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <CalendarIcon className="h-4 w-4" />
            <span>📅 {userRole === "ATHLETE" ? "Club Schedule & My Check-Ins" : "Added-Value Schedule Calendar"}</span>
          </button>
          {userRole !== "ATHLETE" && (
            <button
              type="button"
              onClick={() => setViewMode("register")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
                effectiveViewMode === "register"
                  ? "bg-green-700 text-white shadow-md"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>📋 Attendance Register & Capture</span>
            </button>
          )}
        </div>

        {userRole !== "ATHLETE" && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowScannerModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-500/50 bg-amber-500/20 hover:bg-amber-500/30 px-4 py-2 text-xs font-black text-amber-300 transition-all shadow-md"
            >
              <QrCode className="h-4 w-4 text-amber-400" />
              <span>📷 Marshal QR Scanner</span>
            </button>

            <Link
              href="/admin/csv-import"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-500/40 bg-green-500/10 hover:bg-green-500/20 px-4 py-2 text-xs font-bold text-green-300 transition-all shadow-xs"
            >
              <Upload className="h-4 w-4 text-green-400" />
              <span>Upload Schedule (CSV)</span>
            </Link>
          </div>
        )}
      </div>

      {effectiveViewMode === "calendar" ? (
        <ClubActivityCalendarView
          activities={activities}
          currentUser={currentUser}
          onSelfCheckIn={handleMemberSelfCheckIn}
          checkInMessage={checkInMessage}
        />
      ) : (
        <>
          {/* Activity Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActivityTypeFilter("ALL")}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
            activityTypeFilter === "ALL"
              ? "bg-[#F97316] text-white shadow-md"
              : "border border-slate-700/80 bg-[#1E293B] text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
        >
          All Club Events ({activities.length})
        </button>

        <button
          onClick={() => setActivityTypeFilter("RUNS")}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
            activityTypeFilter === "RUNS"
              ? "bg-[#F97316] text-white shadow-md"
              : "border border-slate-700/80 bg-[#1E293B] text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
        >
          🏃 Club Runs & Time Trials
        </button>

        <button
          onClick={() => setActivityTypeFilter("WALKS")}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
            activityTypeFilter === "WALKS"
              ? "bg-[#F97316] text-white shadow-md"
              : "border border-slate-700/80 bg-[#1E293B] text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
        >
          🚶 Pack Walks & Clinics
        </button>

        <button
          onClick={() => setActivityTypeFilter("VOLUNTEER")}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
            activityTypeFilter === "VOLUNTEER"
              ? "bg-[#F97316] text-white shadow-md"
              : "border border-slate-700/80 bg-[#1E293B] text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
        >
          🤝 Marshalling, AGMs & Socials
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 1 Col: Activities List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">
              Scheduled Club Events ({filteredActivities.length})
            </h2>
          </div>

          <div className="space-y-2.5">
            {filteredActivities.map((act) => {
              const isSelected = selectedActivity?.id === act.id;
              const hasCheckedIn = act.attendances?.some(
                (att: any) => att.athleteId === currentAthleteId
              );

              return (
                <div
                  key={act.id}
                  onClick={() => handleSelectActivity(act)}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                    isSelected
                      ? "border-orange-500 bg-orange-950/20 shadow-md"
                      : "border-slate-700/80 bg-[#1E293B]/85 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300 border border-slate-700">
                      {act.activityType.replace(/_/g, " ")}
                    </span>
                    <span className="text-[11px] font-bold text-orange-400">
                      +{act.pointsValue} pts
                    </span>
                  </div>

                  <h3 className="mt-2 text-xs font-bold text-white">
                    {act.title}
                  </h3>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{new Date(act.date).toLocaleDateString()}</span>
                    <span>{act.attendances?.length || 0} Attended</span>
                  </div>

                  {/* 1-Click Member Self Check-In Button */}
                  <div className="mt-3 border-t border-slate-800 pt-2.5">
                    {hasCheckedIn ? (
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>You Attended</span>
                        </span>
                        <span className="text-[10px] text-slate-400">Recorded</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMemberSelfCheckIn(act);
                        }}
                        className="w-full rounded-xl bg-[#F97316] px-3 py-2 text-center text-xs font-bold text-white shadow-md hover:bg-[#FB923C] hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-1.5"
                      >
                        <Zap className="h-3.5 w-3.5" />
                        <span>Confirm My Attendance</span>
                      </button>
                    )}

                    {checkInMessage && checkInMessage.id === act.id && (
                      <div className="mt-2 rounded-lg bg-green-950/80 border border-green-800 p-2 text-center text-[10px] font-bold text-green-300">
                        {checkInMessage.text}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Cols: Bulk Attendance Capture Sheet */}
        <div className="lg:col-span-2">
          {selectedActivity ? (
            <div className="rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 p-6 shadow-xl backdrop-blur-md">
              <div className="flex flex-col gap-3 border-b border-slate-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-orange-950/80 border border-orange-700/80 px-2 py-0.5 text-[10px] font-bold text-orange-300">
                      Official Attendance Sheet
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      Points Value: +{selectedActivity.pointsValue} pts
                    </span>
                  </div>
                  <h3 className="mt-1 text-lg font-black text-white">
                    {selectedActivity.title}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {new Date(selectedActivity.date).toLocaleDateString()} • {selectedActivity.location}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="rounded-lg border border-slate-700/80 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    {attendedIds.length === athletes.length ? "Deselect All" : "Select All"}
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleSaveBulkAttendance}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#F97316] px-4 py-2 text-xs font-bold text-white shadow-md transition-all duration-200 hover:bg-[#FB923C] hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                    <span>{saving ? "Saving..." : "Save Attendance"}</span>
                  </button>
                </div>
              </div>

              {saveSuccess && (
                <div className="mt-4 rounded-xl border border-emerald-800 bg-emerald-950/80 p-3 text-xs font-bold text-emerald-300">
                  ✓ Bulk attendance successfully recorded in database and recalculated into CCLI scores!
                </div>
              )}

              {/* Search Athletes */}
              <div className="mt-4 flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search member name or SEA number..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-400 focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div className="text-xs font-semibold text-slate-400">
                  Confirmed: <strong className="text-orange-400">{attendedIds.length}</strong> / {athletes.length}
                </div>
              </div>

              {/* Athletes Checklist */}
              <div className="mt-4 max-h-[480px] overflow-y-auto divide-y divide-slate-800 rounded-xl border border-slate-700/80 bg-slate-900/60">
                {filteredAthletes.map((ath) => {
                  const isChecked = attendedIds.includes(ath.id);
                  return (
                    <div
                      key={ath.id}
                      onClick={() => toggleAthlete(ath.id)}
                      className={`flex cursor-pointer items-center justify-between p-3 transition-colors ${
                        isChecked
                          ? "bg-orange-950/20"
                          : "hover:bg-slate-800/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-md border text-xs font-bold transition-colors ${
                            isChecked
                              ? "border-orange-500 bg-[#F97316] text-white"
                              : "border-slate-700 bg-slate-800 text-slate-400"
                          }`}
                        >
                          {isChecked && <Check className="h-3.5 w-3.5" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">
                            {ath.firstName} {ath.lastName}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {ath.athleteNumber}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[11px] font-semibold ${
                          isChecked
                            ? "text-orange-400"
                            : "text-slate-400"
                        }`}
                      >
                        {isChecked ? "Attended (+points)" : "Absent"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 p-12 text-center text-slate-400">
              Select an activity from the left column to view or record attendance.
            </div>
          )}
        </div>
      </div>
    </>
  )}

      {/* Marshal QR Rapid Camera / Hardware Scanner Modal */}
      {showScannerModal && (
        <QrMarshalScannerModal
          isOpen={showScannerModal}
          onClose={() => setShowScannerModal(false)}
          activity={selectedActivity || activities[0]}
          allActivities={activities}
          athletes={athletes}
          onAttendanceUpdated={(athleteId, updatedActivityId) => {
            const targetActId = updatedActivityId || selectedActivity?.id || activities[0]?.id;
            // Update local state so athlete is marked attended
            if (selectedActivity?.id === targetActId) {
              setAttendedIds((prev) => Array.from(new Set([...prev, athleteId])));
            }
            setActivities((prev) =>
              prev.map((item) => {
                if (item.id === targetActId) {
                  const existing = item.attendances || [];
                  if (!existing.some((a: any) => a.athleteId === athleteId)) {
                    return {
                      ...item,
                      attendances: [...existing, { athleteId, attended: true }],
                    };
                  }
                }
                return item;
              })
            );
          }}
        />
      )}
    </div>
  );
}
