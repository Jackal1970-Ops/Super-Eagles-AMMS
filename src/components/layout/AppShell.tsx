"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarCheck2,
  Trophy,
  Menu,
  Flame,
} from "lucide-react";
import { OfflineSyncManager } from "@/components/shared/OfflineSyncManager";

interface BottomNavItem {
  label: string;
  href: string;
  icon: any;
}

function getBottomNavItems(user: { role: string; athleteId?: string } | null): BottomNavItem[] {
  if (!user?.role) return [];
  if (user.role === "ATHLETE") {
    return [
      { label: "My Profile", href: user.athleteId ? `/athletes/${user.athleteId}` : "/athletes", icon: LayoutDashboard },
      { label: "Training", href: "/training", icon: Flame },
      { label: "Races", href: "/races", icon: Trophy },
      { label: "Events", href: "/club-activities", icon: CalendarCheck2 },
    ];
  }
  return [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Members", href: "/athletes", icon: Users },
    { label: "Events", href: "/club-activities", icon: CalendarCheck2 },
    { label: "Races", href: "/races", icon: Trophy },
    { label: "Training", href: "/training", icon: Flame },
  ];
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ role: string; athleteId?: string } | null>(null);
  const pathname = usePathname();

  // If on login or unauthorized screen, render full page without app shell
  const isAuthPage = pathname === "/login" || pathname === "/unauthorized";

  useEffect(() => {
    if (!isAuthPage) {
      fetch("/api/auth/me")
        .then((r) => r.json())
        .then((d) => { if (d.user) setCurrentUser(d.user); })
        .catch(() => {});
    }
  }, [isAuthPage]);

  if (isAuthPage) {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  const bottomNavItems = getBottomNavItems(currentUser);

  return (
    <div className="flex min-h-screen flex-col bg-[#0F172A] text-white">
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Main Content Area: padded on mobile for bottom navigation */}
        <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8 pb-24 lg:pb-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>

      {/* Mobile Scalable Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-800 bg-[#1E293B]/95 px-2 backdrop-blur-md lg:hidden shadow-xl"
      >
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2.5 min-w-[56px] min-h-[44px] rounded-xl transition-all ${
                isActive
                  ? "text-orange-400 font-bold"
                  : "text-slate-400 hover:text-slate-200 font-medium"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
              <span className="mt-1 text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}

        {/* More Menu Drawer Trigger */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2.5 min-w-[56px] min-h-[44px] rounded-xl text-slate-400 hover:text-slate-200"
          title="Open Menu"
        >
          <Menu className="h-5 w-5 stroke-2" />
          <span className="mt-1 text-[10px] tracking-tight">More</span>
        </button>
      </nav>

      {/* Global Offline Event & Synchronization Protection Manager */}
      <OfflineSyncManager />
    </div>
  );
}

