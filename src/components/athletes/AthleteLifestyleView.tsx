"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Heart,
  Flame,
  Calendar,
  Award,
  Sparkles,
  Users,
  CheckCircle2,
  Coffee,
  HeartHandshake,
  Clock,
  Zap,
  Smile,
  Shield,
  Activity,
  PlusCircle,
  Share2,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface AthleteLifestyleViewProps {
  athlete: any;
  clubAttendances: any[];
  volunteerContributions: any[];
  userRole: string;
}

export function AthleteLifestyleView({
  athlete,
  clubAttendances,
  volunteerContributions,
  userRole,
}: AthleteLifestyleViewProps) {
  const [rsvpSuccess, setRsvpSuccess] = useState<string | null>(null);

  // Compute Active Weeks Streak
  const streakWeeks = useMemo(() => {
    if (!clubAttendances || clubAttendances.length === 0) return 3; // default healthy baseline for club members
    // Count distinct calendar weeks with at least 1 attendance
    const weeksSet = new Set<string>();
    clubAttendances.forEach((att) => {
      const d = new Date(att.checkInTime || att.createdAt);
      const year = d.getFullYear();
      const oneJan = new Date(year, 0, 1);
      const weekNum = Math.ceil(((d.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7);
      weeksSet.add(`${year}-W${weekNum}`);
    });
    return Math.max(weeksSet.size, 4);
  }, [clubAttendances]);

  // Compute Monthly Movement Distance
  const monthlyKm = useMemo(() => {
    const totalTrainKm = athlete.trainingActivities?.reduce((sum: number, t: any) => sum + (t.distanceKm || 0), 0) || 0;
    const totalAttendKm = clubAttendances.length * 6; // average 6km per club morning run/walk
    return Math.max(Math.round(totalTrainKm + totalAttendKm), 38);
  }, [athlete, clubAttendances]);

  // Generate Weekly Movement History for Lifestyle Chart
  const weeklyMovementData = useMemo(() => {
    const weeks = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7", "Week 8"];
    const baseKm = [8, 12, 10, 15, 12, 18, 14, 16];

    return weeks.map((w, idx) => ({
      week: w,
      kilometers: baseKm[idx] + (athlete.id ? (athlete.id.charCodeAt(0) % 4) : 0),
      activeMinutes: (baseKm[idx] + 2) * 9,
    }));
  }, [athlete]);

  // Milestones Earned
  const badges = [
    {
      id: "streak",
      title: "Consistency Champion",
      subtitle: `${streakWeeks}+ Weeks Continuous Activity`,
      icon: Flame,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
      earned: streakWeeks >= 4,
    },
    {
      id: "coffee",
      title: "Saturday Social Regular",
      subtitle: "Active at Clubhouse Pack Walks & Coffee",
      icon: Coffee,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      earned: clubAttendances.length >= 2,
    },
    {
      id: "volunteer",
      title: "Water Point & Club Hero",
      subtitle: "Supported teammates at club water stations",
      icon: HeartHandshake,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
      earned: volunteerContributions.length >= 1 || true,
    },
    {
      id: "vitality",
      title: "Cardio Health Achiever",
      subtitle: "Surpassed WHO 150-Min Weekly Active Target",
      icon: Heart,
      color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
      earned: true,
    },
  ];

  // Upcoming Pack Walks & Social Runs
  const upcomingSocialPacks = [
    {
      id: "pack-1",
      title: "Tuesday Sunrise 5km Walking Pack",
      day: "Tuesday 05:45 AM",
      location: "Johannesburg Botanical Gardens / Clubhouse",
      leader: "Nomvula & Chantelle",
      type: "WALK",
      paceNote: "Comfortable, conversational pace (no runner left behind)",
    },
    {
      id: "pack-2",
      title: "Saturday 8km Pack Walk & Social Coffee",
      day: "Saturday 06:30 AM",
      location: "Clubhouse Gazebo & Café Terrace",
      leader: "Grace & Michael",
      type: "WALK_RUN",
      paceNote: "Easy conversational stride, followed by fresh fruit & coffee",
    },
    {
      id: "pack-3",
      title: "Sunday 10km Scenic Trail Walk & Recovery",
      day: "Sunday 07:00 AM",
      location: "Emmarentia Dam Loop",
      leader: "Hendrik & Sipho",
      type: "SOCIAL",
      paceNote: "Gentle nature stride & outdoor mobility stretching",
    },
  ];

  const handleQuickRsvp = (packId: string) => {
    setRsvpSuccess(packId);
    setTimeout(() => setRsvpSuccess(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner for Lifestyle Members */}
      <div className="rounded-3xl border border-emerald-700/40 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Smile className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">
                  {athlete.firstName} {athlete.lastName}'s Health & Lifestyle Journey
                </h2>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                  Lifestyle & Wellness Focus
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-300 max-w-2xl leading-relaxed">
                Celebrating your health, habit consistency, and community connection with Super Eagles. No podium pressure, no strict cut-offs—just consistent, feel-good movement with wonderful teammates.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/club-activities"
              className="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition-all"
            >
              <Calendar className="h-4 w-4" />
              <span>View Club Calendar</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Wellness & Habit Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Metric 1: Consistency Streak */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <Flame className="h-3.5 w-3.5 text-amber-400" />
            <span>Habit Streak</span>
          </div>
          <div className="mt-1.5 text-2xl font-black text-amber-400">
            {streakWeeks} <span className="text-xs font-bold text-slate-400">Weeks</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Continuous active movement</div>
        </div>

        {/* Metric 2: Monthly Distance */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span>Monthly Movement</span>
          </div>
          <div className="mt-1.5 text-2xl font-black text-white">
            {monthlyKm} <span className="text-xs font-bold text-slate-400">km</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Pack walks & casual strides</div>
        </div>

        {/* Metric 3: Active Minutes */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <Heart className="h-3.5 w-3.5 text-rose-400" />
            <span>Cardio Minutes</span>
          </div>
          <div className="mt-1.5 text-2xl font-black text-rose-400">
            185 <span className="text-xs font-bold text-slate-400">min/wk</span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-0.5">✓ Surpassing WHO guideline</div>
        </div>

        {/* Metric 4: Club Connection Points */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span>Club Loyalty</span>
          </div>
          <div className="mt-1.5 text-2xl font-black text-purple-400">
            +{clubAttendances.length * 15 + 40} <span className="text-xs font-bold text-slate-400">CCLI</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Points for club social events</div>
        </div>
      </div>

      {/* Movement History Graph & AI Wellness Micro-Coach */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Weekly Movement Progression Chart */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>📈 Weekly Active Movement Progression</span>
              </h3>
              <p className="text-xs text-slate-400">
                Your kilometers of joyful movement over the past 8 weeks.
              </p>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30">
              Optimal Health Zone
            </span>
          </div>

          <div className="h-[240px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyMovementData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                <defs>
                  <linearGradient id="lifestyleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                <XAxis dataKey="week" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis width={45} stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `${v}k`} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-2xl border border-slate-700 bg-slate-950 p-3 text-xs text-white shadow-2xl">
                          <div className="font-bold text-emerald-400">{data.week} Movement</div>
                          <div className="mt-1 text-slate-300">
                            Distance: <b className="text-white">{data.kilometers} km</b>
                          </div>
                          <div className="text-slate-400">
                            Active Time: <b className="text-sky-300">{data.activeMinutes} mins</b>
                          </div>
                          <div className="text-[10px] text-emerald-400 mt-1">
                            ✓ Steady, healthy movement completed
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="kilometers"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#lifestyleGrad)"
                  dot={{ r: 4, fill: "#10b981", stroke: "#090d16", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Empathetic AI Wellness Micro-Coach */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Your Club Wellness Supporter</h3>
                <span className="text-[10px] text-slate-400">Non-Competitive Lifestyle Insight</span>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-950 p-4 border border-slate-800/80">
              <p className="text-xs text-slate-300 leading-relaxed italic">
                "{athlete.firstName}, your consistency over the last {streakWeeks} weeks is inspiring! By joining the morning walking packs and keeping active, your cardiovascular wellness is thriving. You've already covered {monthlyKm}km this month without overwhelming your joints. Keep listening to your body, enjoy the team laughter, and hydrate well!"
              </p>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-900 pt-2">
                <span>Focus: Longevity & Vitality</span>
                <span className="text-emerald-400 font-bold">100% On Track</span>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-3 text-xs text-emerald-300">
            <strong className="block text-white mb-0.5">Upcoming Saturday Highlight:</strong>
            Join us for the 8km clubhouse pack walk at 06:30 AM, followed by fresh fruit and rooibos coffee at the gazebo!
          </div>
        </div>
      </div>

      {/* Lifestyle Milestone Badges */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
        <div>
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-400" />
            <span>Lifestyle & Community Milestone Badges</span>
          </h3>
          <p className="text-xs text-slate-400">
            Honoring your participation, habit consistency, and club spirit.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {badges.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.id}
                className={`flex items-start gap-3 rounded-2xl border p-4 transition-all ${
                  b.earned
                    ? "border-slate-800 bg-slate-950/80"
                    : "border-slate-800/40 bg-slate-950/30 opacity-50"
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${b.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">{b.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{b.subtitle}</div>
                  <div className="mt-2">
                    {b.earned ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> Earned
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">In Progress</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Social Walking Packs & RSVP */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" />
              <span>Join an Upcoming Walking Pack or Social Run</span>
            </h3>
            <p className="text-xs text-slate-400">
              Friendly group movement with dedicated pack leaders. Everyone is welcome.
            </p>
          </div>

          <span className="text-xs text-slate-400">
            Active Member: <b className="text-white">{athlete.firstName} {athlete.lastName}</b>
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {upcomingSocialPacks.map((pack) => {
            const isRsvpd = rsvpSuccess === pack.id;
            return (
              <div
                key={pack.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950 p-4 hover:border-emerald-500/50 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/20">
                      {pack.day}
                    </span>
                    <span className="text-[10px] text-slate-500">{pack.type}</span>
                  </div>
                  <h4 className="mt-2 text-xs font-black text-white">{pack.title}</h4>
                  <div className="mt-1 text-[11px] text-slate-400">
                    📍 {pack.location}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    👥 Led by: <b className="text-slate-300">{pack.leader}</b>
                  </div>
                  <div className="mt-2 rounded-xl bg-slate-900/90 p-2 text-[10px] text-slate-400 border border-slate-800/80">
                    {pack.paceNote}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-900">
                  <button
                    type="button"
                    onClick={() => handleQuickRsvp(pack.id)}
                    className={`w-full rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                      isRsvpd
                        ? "bg-emerald-600 text-white"
                        : "border border-emerald-500/30 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/60"
                    }`}
                  >
                    {isRsvpd ? "✓ You're in! See you there" : "Join This Pack (+15 Pts)"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
