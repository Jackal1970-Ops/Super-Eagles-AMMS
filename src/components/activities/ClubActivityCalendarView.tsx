"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Award,
  Sparkles,
  Upload,
  CheckCircle2,
  Users,
  Download,
  Share2,
  Filter,
  Check,
  Zap,
} from "lucide-react";

interface Activity {
  id: string;
  title: string;
  activityType: string;
  location: string;
  date: string | Date;
  pointsValue: number;
  isMandatory: boolean;
  notes?: string | null;
  attendances?: any[];
  volunteers?: any[];
}

interface CalendarViewProps {
  activities: Activity[];
  currentUser?: {
    id: string;
    name: string;
    role: string;
    athleteId?: string;
  };
  onSelfCheckIn: (activity: Activity) => Promise<void>;
  checkInMessage: { id: string; text: string } | null;
}

export function ClubActivityCalendarView({
  activities,
  currentUser,
  onSelfCheckIn,
  checkInMessage,
}: CalendarViewProps) {
  // Current month state (default to current date or month of activities)
  const [currentDate, setCurrentDate] = useState(() => {
    if (activities.length > 0) {
      return new Date(activities[0].date);
    }
    return new Date();
  });

  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("ALL");
  const [activeModalEvent, setActiveModalEvent] = useState<Activity | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Filter activities by discipline
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      if (selectedDiscipline === "ALL") return true;
      if (selectedDiscipline === "WALK") {
        return (
          act.activityType === "WEEKLY_WALK" ||
          act.title.toLowerCase().includes("walk")
        );
      }
      if (selectedDiscipline === "RUN") {
        return (
          act.activityType === "WEEKLY_RUN" ||
          act.activityType === "TIME_TRIAL" ||
          act.title.toLowerCase().includes("run")
        );
      }
      if (selectedDiscipline === "VOLUNTEER") {
        return (
          act.activityType === "WATER_POINT" ||
          act.activityType === "VOLUNTEER_EVENT" ||
          act.title.toLowerCase().includes("water")
        );
      }
      return true;
    });
  }, [activities, selectedDiscipline]);

  // Compute days in month
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    // Convert to Monday = 0
    const startDay = (firstDayIndex + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{
      dayNumber: number;
      isCurrentMonth: boolean;
      dateString: string;
      events: Activity[];
    }> = [];

    // Previous month padding
    for (let i = startDay - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, d);
      const dateStr = prevDate.toISOString().split("T")[0];
      days.push({
        dayNumber: d,
        isCurrentMonth: false,
        dateString: dateStr,
        events: [],
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const curDate = new Date(year, month, d);
      const dateStr = curDate.toISOString().split("T")[0];
      const dayEvents = filteredActivities.filter((act) => {
        const actDateStr = new Date(act.date).toISOString().split("T")[0];
        return actDateStr === dateStr;
      });

      days.push({
        dayNumber: d,
        isCurrentMonth: true,
        dateString: dateStr,
        events: dayEvents,
      });
    }

    // Next month padding to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const dateStr = nextDate.toISOString().split("T")[0];
      days.push({
        dayNumber: d,
        isCurrentMonth: false,
        dateString: dateStr,
        events: [],
      });
    }

    return days;
  }, [year, month, filteredActivities]);

  // Added Value: Monthly Metrics
  const monthlyStats = useMemo(() => {
    const currentMonthEvents = activities.filter((act) => {
      const d = new Date(act.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    const totalPoints = currentMonthEvents.reduce((sum, e) => sum + (e.pointsValue || 0), 0);
    const runsCount = currentMonthEvents.filter((e) => e.activityType === "WEEKLY_RUN" || e.activityType === "TIME_TRIAL").length;
    const walksCount = currentMonthEvents.filter((e) => e.activityType === "WEEKLY_WALK" || e.title.toLowerCase().includes("walk")).length;
    const volunteerCount = currentMonthEvents.filter((e) => e.activityType === "WATER_POINT" || e.activityType === "VOLUNTEER_EVENT").length;

    return {
      totalEvents: currentMonthEvents.length,
      totalPoints,
      runsCount,
      walksCount,
      volunteerCount,
    };
  }, [activities, year, month]);

  const getActivityBadgeColor = (type: string, title: string) => {
    if (type === "WEEKLY_WALK" || title.toLowerCase().includes("walk")) {
      return "bg-sky-950 text-sky-300 border-sky-800 hover:bg-sky-900";
    }
    if (type === "WATER_POINT" || type === "VOLUNTEER_EVENT") {
      return "bg-purple-950 text-purple-300 border-purple-800 hover:bg-purple-900";
    }
    if (type === "TIME_TRIAL") {
      return "bg-amber-950 text-amber-300 border-amber-800 hover:bg-amber-900";
    }
    if (type === "CLUB_MEETING") {
      return "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-750";
    }
    return "bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900";
  };

  const getActivityIcon = (type: string, title: string) => {
    if (type === "WEEKLY_WALK" || title.toLowerCase().includes("walk")) return "🚶";
    if (type === "WATER_POINT" || type === "VOLUNTEER_EVENT") return "💧";
    if (type === "TIME_TRIAL") return "⏱️";
    if (type === "CLUB_MEETING") return "📋";
    return "🏃";
  };

  return (
    <div className="space-y-4 select-none">
      {/* Added Value Top Intelligence Bar: Points, Disciplines & Quick Filters */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-3.5 shadow-lg">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <Award className="h-3.5 w-3.5 text-amber-400" />
            <span>Monthly Points Pool</span>
          </div>
          <div className="mt-1 text-xl font-black text-amber-400">
            +{monthlyStats.totalPoints} <span className="text-xs font-semibold text-slate-400">CCLI Pts</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Available for loyalty scoring</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-3.5 shadow-lg">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>Scheduled Activities</span>
          </div>
          <div className="mt-1 text-xl font-black text-white">
            {monthlyStats.totalEvents} <span className="text-xs font-semibold text-slate-400">Events</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {monthlyStats.runsCount} Runs • {monthlyStats.walksCount} Walks
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-3.5 shadow-lg">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <Zap className="h-3.5 w-3.5 text-blue-400" />
            <span>Aerobic Climate Indicator</span>
          </div>
          <div className="mt-1 text-xl font-black text-blue-400">
            17°C <span className="text-xs font-semibold text-slate-400">Optimal</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Mild Highveld morning conditions</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-3.5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <Upload className="h-3.5 w-3.5 text-green-400" />
            <span>Schedule CSV Import</span>
          </div>
          <Link
            href="/admin/csv-import"
            className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-green-700 hover:bg-green-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all"
          >
            <Upload className="h-3 w-3" />
            <span>Upload CSV Schedule</span>
          </Link>
        </div>
      </div>

      {/* Calendar Header with Navigation & Discipline Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-800 bg-slate-900/95 p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-950/80 border border-green-800 text-green-400">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">
              {monthNames[month]} {year}
            </h2>
            <div className="text-[11px] text-slate-400">
              Super Eagles Athletics & Walking Master Schedule
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Discipline Filter */}
          <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950 p-0.5">
            <button
              onClick={() => setSelectedDiscipline("ALL")}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                selectedDiscipline === "ALL"
                  ? "bg-green-700 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setSelectedDiscipline("RUN")}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                selectedDiscipline === "RUN"
                  ? "bg-emerald-700 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🏃 Runs
            </button>
            <button
              onClick={() => setSelectedDiscipline("WALK")}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                selectedDiscipline === "WALK"
                  ? "bg-sky-700 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🚶 Walks
            </button>
            <button
              onClick={() => setSelectedDiscipline("VOLUNTEER")}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                selectedDiscipline === "VOLUNTEER"
                  ? "bg-purple-700 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              💧 Volunteer
            </button>
          </div>

          {/* Month Stepper Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goToToday}
              className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              title="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Days of Week Header - High Contrast per ISO 9241-171 */}
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((dayName) => (
          <div
            key={dayName}
            className="py-2.5 text-xs font-black uppercase tracking-wider text-slate-100 bg-slate-800/90 rounded-xl border border-slate-700/80 shadow-xs"
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* Monthly Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {calendarDays.map((day, idx) => {
          const isToday =
            new Date().toISOString().split("T")[0] === day.dateString;

          return (
            <div
              key={idx}
              className={`min-h-[115px] sm:min-h-[130px] rounded-2xl border p-2.5 flex flex-col justify-between transition-all ${
                day.isCurrentMonth
                  ? isToday
                    ? "border-green-500/80 bg-slate-900/95 ring-2 ring-green-500/20 shadow-lg"
                    : "border-slate-800 bg-slate-900/80 hover:border-slate-700"
                  : "border-slate-800/40 bg-slate-950/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-black rounded-lg px-2 py-0.5 ${
                    isToday
                      ? "bg-green-600 text-white"
                      : day.isCurrentMonth
                      ? "text-white"
                      : "text-slate-500 font-semibold"
                  }`}
                >
                  {day.dayNumber}
                </span>

                {day.events.length > 0 && (
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-950/90 px-2 py-0.5 rounded-lg border border-amber-700/80 shadow-xs">
                    +{day.events.reduce((s, e) => s + e.pointsValue, 0)} pts
                  </span>
                )}
              </div>

              {/* Day Events Container */}
              <div className="mt-1.5 space-y-1.5 overflow-y-auto max-h-[85px]">
                {day.events.map((act) => {
                  const badgeColor = getActivityBadgeColor(
                    act.activityType,
                    act.title
                  );
                  const icon = getActivityIcon(act.activityType, act.title);

                  return (
                    <div
                      key={act.id}
                      onClick={() => setActiveModalEvent(act)}
                      className={`cursor-pointer rounded-xl border px-2 py-1.5 text-[11px] font-bold leading-tight transition-transform hover:scale-102 truncate shadow-xs ${badgeColor}`}
                      title={`${act.title} (+${act.pointsValue} pts)`}
                    >
                      <span>{icon} </span>
                      <span>{act.title}</span>
                    </div>
                  );
                })}
              </div>

              {/* Clean breathing room for open days without repetitive visual noise */}
              <div />
            </div>
          );
        })}
      </div>

      {/* Event Detail & 1-Click Check-In Modal */}
      {activeModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">
                  {getActivityIcon(
                    activeModalEvent.activityType,
                    activeModalEvent.title
                  )}
                </span>
                <div>
                  <h3 className="text-base font-black text-white">
                    {activeModalEvent.title}
                  </h3>
                  <div className="text-xs text-green-400 font-bold">
                    {activeModalEvent.activityType.replace(/_/g, " ")} • +
                    {activeModalEvent.pointsValue} Loyalty Points
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveModalEvent(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <div className="text-slate-400 font-semibold mb-1 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-blue-400" />
                  <span>Scheduled Date & Time</span>
                </div>
                <div className="font-bold text-white">
                  {new Date(activeModalEvent.date).toLocaleDateString("en-ZA", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <div className="text-slate-400 font-semibold mb-1 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-rose-400" />
                  <span>Meeting Location</span>
                </div>
                <div className="font-bold text-white">
                  {activeModalEvent.location}
                </div>
              </div>
            </div>

            {activeModalEvent.notes && (
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300">
                <strong className="text-white block mb-1 text-[11px] uppercase font-bold">
                  Coach Session Notes:
                </strong>
                {activeModalEvent.notes}
              </div>
            )}

            {checkInMessage && checkInMessage.id === activeModalEvent.id && (
              <div className="rounded-xl border border-green-700 bg-green-950/80 p-3 text-xs font-bold text-green-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{checkInMessage.text}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                {activeModalEvent.attendances?.length || 0} Members Registered
              </span>

              <div className="flex gap-2">
                <button
                  onClick={() => setActiveModalEvent(null)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
                >
                  Close
                </button>
                <button
                  onClick={() => onSelfCheckIn(activeModalEvent)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-green-700 px-4 py-2 text-xs font-bold text-white hover:bg-green-600 shadow-md transition-all"
                >
                  <Check className="h-4 w-4" />
                  <span>Confirm My Attendance (+{activeModalEvent.pointsValue} pts)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
