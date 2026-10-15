"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Activity,
  Flame,
  Trophy,
  CalendarCheck2,
  HeartHandshake,
  DollarSign,
  Sparkles,
  FileText,
  Settings,
  ShieldAlert,
  ChevronRight,
  User,
  BookOpen,
  CreditCard,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Role-based tab visibility matrix ────────────────────────────────────────
// Each tab lists which roles CAN see it.
const ALL_NAV_ITEMS = [
  {
    label: "My 360° Athlete Profile",
    href: "/athletes",
    isAthleteProfile: true,
    icon: User,
    allowedRoles: ["ATHLETE"],
  },
  {
    label: "Executive Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    allowedRoles: ["SUPER_ADMIN", "COACH", "CLUB_ADMIN", "SPONSORSHIP_COMMITTEE"],
  },
  {
    label: "Members & Athletes",
    href: "/athletes",
    icon: Users,
    allowedRoles: ["SUPER_ADMIN", "COACH", "CLUB_ADMIN"],
  },
  {
    label: "Membership Payments & Dues",
    href: "/payments",
    icon: CreditCard,
    allowedRoles: ["SUPER_ADMIN", "COACH", "ATHLETE", "CLUB_ADMIN", "SPONSORSHIP_COMMITTEE"],
  },
  {
    label: "Performance Engine",
    href: "/performance",
    icon: Activity,
    allowedRoles: ["SUPER_ADMIN", "COACH"],
  },
  {
    label: "Training & Walks Log",
    href: "/training",
    icon: Flame,
    allowedRoles: ["SUPER_ADMIN", "COACH", "ATHLETE"],
  },
  {
    label: "Races & Results",
    href: "/races",
    icon: Trophy,
    allowedRoles: ["SUPER_ADMIN", "COACH", "ATHLETE"],
  },
  {
    label: "Club Runs & Walks",
    href: "/club-activities",
    icon: CalendarCheck2,
    allowedRoles: ["SUPER_ADMIN", "COACH", "ATHLETE", "CLUB_ADMIN"],
  },
  {
    label: "Contribution & Loyalty",
    href: "/loyalty",
    icon: HeartHandshake,
    allowedRoles: ["SUPER_ADMIN", "COACH", "CLUB_ADMIN"],
  },
  {
    label: "Sponsorship & Reciprocity",
    href: "/sponsorship",
    icon: DollarSign,
    allowedRoles: ["SUPER_ADMIN", "SPONSORSHIP_COMMITTEE"],
  },
  {
    label: "AI Performance & Coaching",
    href: "/ai-insights",
    icon: Sparkles,
    allowedRoles: ["SUPER_ADMIN", "COACH"],
  },
  {
    label: "Reports & Exports",
    href: "/reports",
    icon: FileText,
    allowedRoles: ["SUPER_ADMIN", "SPONSORSHIP_COMMITTEE", "CLUB_ADMIN"],
  },
  {
    label: "System Administration",
    href: "/admin",
    icon: ShieldAlert,
    allowedRoles: ["SUPER_ADMIN", "CLUB_ADMIN"],
  },
  {
    label: "Settings & Weights",
    href: "/settings",
    icon: Settings,
    allowedRoles: ["SUPER_ADMIN"],
  },
  {
    label: "User Manual & Handbook",
    href: "/manual",
    icon: BookOpen,
    allowedRoles: ["SUPER_ADMIN", "COACH", "ATHLETE", "CLUB_ADMIN", "SPONSORSHIP_COMMITTEE"],
  },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<{ role: string; athleteId?: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.user) setCurrentUser(d.user); })
      .catch(() => {});
  }, []);

  // Filter nav items by current user's role and populate athlete dynamic links
  const navItems = currentUser?.role
    ? ALL_NAV_ITEMS
        .filter((item) => item.allowedRoles.includes(currentUser.role))
        .map((item) => {
          if (item.isAthleteProfile && currentUser.athleteId) {
            return { ...item, href: `/athletes/${currentUser.athleteId}` };
          }
          return item;
        })
    : [];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-[#0c1220] transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Navigation Header Spacer / Context */}
        <div className="hidden lg:flex items-center justify-between border-b border-slate-800/80 bg-slate-900/40 px-4 py-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Navigation Menu
          </span>
          <span className="rounded bg-orange-950/70 border border-orange-700/60 px-1.5 py-0.5 text-[9px] font-bold uppercase text-orange-300">
            Active
          </span>
        </div>

        {/* Mobile Header - Clean, No Black Frame */}
        <div className="flex h-18 items-center justify-between border-b border-slate-800 px-4 lg:hidden">
          <div className="flex items-center gap-3">
            <img
              src="/images/emblem.png"
              alt="Super Eagles Crest"
              className="h-12 w-auto object-contain drop-shadow-sm shrink-0"
            />
            <div>
              <span className="text-sm font-bold text-white block">Super Eagles AMMS</span>
              <span className="text-[10px] text-slate-400 block">Athletics & Membership</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Club Philosophy Motto Badge */}
        <div className="border-b border-slate-800/80 px-4 py-3">
          <div className="rounded-xl bg-[#1E293B]/80 border border-slate-700/70 px-3 py-2 text-[11px] text-slate-200">
            <div className="font-bold text-orange-400 uppercase tracking-wider text-[10px]">
              Club Philosophy
            </div>
            <div className="mt-0.5 font-medium italic text-slate-300">
              Measure → Normalise → Trend → Predict → Recommend → Human Decision
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-[#F97316] text-white shadow-md shadow-orange-950/40 -translate-y-0.5"
                    : "text-slate-300 hover:bg-[#1E293B]/80 hover:text-white hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 ${
                      isActive
                        ? "text-white"
                        : "text-slate-400 group-hover:text-orange-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-90" />}
              </Link>
            );
          })}
        </nav>

        {/* POPIA / Non-Medical Sports Disclaimer Banner */}
        <div className="border-t border-slate-800 p-3">
          <div className="rounded-lg border border-amber-900/50 bg-amber-950/40 p-2 text-[10px] leading-snug text-amber-300">
            <span className="font-bold">Sports Performance Intelligence:</span> This system provides athletic development data and does not provide medical advice.
          </div>
        </div>
      </aside>
    </>
  );
}
