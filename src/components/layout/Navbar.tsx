"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Search,
  User as UserIcon,
  Shield,
  ChevronDown,
  LogOut,
  Sliders,
  CheckCircle,
  Menu,
  X,
  Sparkles,
  Smartphone,
  BookOpen,
  AlertTriangle,
  Check,
  CreditCard,
} from "lucide-react";
import { RemoteAccessModal } from "@/components/shared/RemoteAccessModal";

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export function Navbar({ onToggleSidebar }: NavbarProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    role: string;
    email: string;
    athleteId?: string;
  } | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [arrearsAlert, setArrearsAlert] = useState<any | null>(null);
  const [adminArrearsCount, setAdminArrearsCount] = useState(0);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showRemoteModal, setShowRemoteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadNotifications = () => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setNotificationsList(data.notifications || []);
          setUnreadNotifications(data.unreadCount || 0);
          setArrearsAlert(data.arrearsAlert || null);
          setAdminArrearsCount(data.adminArrearsCount || 0);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});

    loadNotifications();
  }, []);

  const markNotificationRead = async (id?: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { notificationId: id } : { markAllAsRead: true }),
      });
      loadNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const switchRole = async (roleEmail: string) => {
    try {
      const res = await fetch("/api/auth/demo-switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: roleEmail }),
      });
      if (res.ok) {
        const data = await res.json();
        setShowRoleSwitcher(false);
        if (data.user?.role === "ATHLETE" && data.user?.athleteId) {
          window.location.href = `/athletes/${data.user.athleteId}`;
        } else {
          window.location.reload();
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/athletes?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-[#0F172A]/95 backdrop-blur-md px-4 shadow-md sm:px-6 text-white">
      {/* Left: Mobile Toggle & Super Eagles identity */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link
          href={
            currentUser?.role === "ATHLETE" && currentUser?.athleteId
              ? `/athletes/${currentUser.athleteId}`
              : "/dashboard"
          }
          className="flex items-center gap-3"
        >
          <img
            src="/images/emblem.png"
            alt="Super Eagles Crest"
            className="h-11 w-auto object-contain drop-shadow-md shrink-0 transition-transform hover:scale-105"
          />
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-tight text-white">
                Super Eagles AMMS
              </span>
              <span className="rounded bg-orange-950/80 border border-orange-600/70 px-1.5 py-0.5 text-[9px] font-bold tracking-wide uppercase text-orange-300">
                Official
              </span>
            </div>
            <div className="text-[10px] font-medium text-slate-400">
              Athletics, Walking & Membership Management
            </div>
          </div>
        </Link>
      </div>

      {/* Middle: Quick Search (Staff / Officials) or Personal Portal Badge (Athletes) */}
      <div className="mx-4 hidden max-w-md flex-1 md:block">
        {currentUser?.role === "ATHLETE" ? (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-800/60 bg-emerald-950/30 px-3 py-1.5 text-xs text-emerald-300">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
            <span className="font-semibold text-white">{currentUser?.name}</span>
            <span className="text-[11px] text-slate-400">• Personal Athlete Portal</span>
          </div>
        ) : (
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search athletes, membership #, coach, race..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/80 py-2 pl-9 pr-4 text-sm text-slate-100 placeholder-slate-400 transition-colors focus:border-green-500 focus:bg-slate-900 focus:outline-none"
            />
          </form>
        )}
      </div>

      {/* Right: Demo Role Switcher, Notifications & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Role Switcher for Test / Evaluation */}
        <div className="relative">
          <button
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            className="flex items-center gap-1.5 rounded-lg border border-green-800/80 bg-green-950/60 px-2.5 py-1.5 text-xs font-semibold text-green-300 hover:bg-green-900/60 transition-colors"
            title="Switch between roles to test RBAC workflows"
          >
            <Shield className="h-3.5 w-3.5 text-green-400" />
            <span className="hidden sm:inline">Role:</span>
            <span className="font-bold">
              {currentUser?.role === "SUPER_ADMIN"
                ? "General Manager"
                : currentUser?.role === "COACH"
                ? "Coach"
                : currentUser?.role === "ATHLETE"
                ? "Athlete"
                : currentUser?.role === "CLUB_ADMIN"
                ? "Club Admin"
                : currentUser?.role === "SPONSORSHIP_COMMITTEE"
                ? "Sponsorship Chair"
                : "Select Role"}
            </span>
            <ChevronDown className="h-3 w-3" />
          </button>

          {showRoleSwitcher && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50">
              <div className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Switch Test Role (Live Persona)
              </div>
              <button
                onClick={() => switchRole("admin@supereagles.co.za")}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-medium hover:bg-slate-800"
              >
                <div>
                  <div className="font-bold text-white">General Manager (Super Admin)</div>
                  <div className="text-[11px] text-slate-400">Full executive, sponsorship & audit</div>
                </div>
                {currentUser?.role === "SUPER_ADMIN" && <CheckCircle className="h-4 w-4 text-green-400" />}
              </button>

              <button
                onClick={() => switchRole("coach.hendrik@supereagles.co.za")}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-medium hover:bg-slate-800"
              >
                <div>
                  <div className="font-bold text-white">Coach (Hendrik Botha)</div>
                  <div className="text-[11px] text-slate-400">Squad training, readiness & AI review</div>
                </div>
                {currentUser?.role === "COACH" && <CheckCircle className="h-4 w-4 text-green-400" />}
              </button>

              <button
                onClick={() => switchRole("athlete.sipho@supereagles.co.za")}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-medium hover:bg-slate-800"
              >
                <div>
                  <div className="font-bold text-white">Athlete (Sipho Sithole)</div>
                  <div className="text-[11px] text-slate-400">Self-report, own profile & goals only</div>
                </div>
                {currentUser?.role === "ATHLETE" && <CheckCircle className="h-4 w-4 text-green-400" />}
              </button>

              <button
                onClick={() => switchRole("admin.club@supereagles.co.za")}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-medium hover:bg-slate-800"
              >
                <div>
                  <div className="font-bold text-white">Club Administrator</div>
                  <div className="text-[11px] text-slate-400">Bulk attendance, CSVs & activities</div>
                </div>
                {currentUser?.role === "CLUB_ADMIN" && <CheckCircle className="h-4 w-4 text-green-400" />}
              </button>

              <button
                onClick={() => switchRole("committee@supereagles.co.za")}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-medium hover:bg-slate-800"
              >
                <div>
                  <div className="font-bold text-white">Sponsorship Committee</div>
                  <div className="text-[11px] text-slate-400">Review cases & committee decisions</div>
                </div>
                {currentUser?.role === "SPONSORSHIP_COMMITTEE" && <CheckCircle className="h-4 w-4 text-green-400" />}
              </button>
            </div>
          )}
        </div>

        {/* Remote Access & Mobile Setup Guide Modal Trigger */}
        <button
          onClick={() => setShowRemoteModal(true)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          title="Remote access, mobile setup & offline guidance"
        >
          <Smartphone className="h-3.5 w-3.5 text-green-400" />
          <span className="hidden md:inline">Remote / Offline</span>
        </button>

        {/* User Manual & PDF Handbook */}
        <Link
          href="/manual"
          className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
          title="Super Eagles AMMS Comprehensive User Manual & PDF Handbook"
        >
          <BookOpen className="h-3.5 w-3.5 text-amber-400" />
          <span className="hidden md:inline">User Manual</span>
        </Link>

        {/* Notifications Icon with Interactive Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotificationMenu(!showNotificationMenu)}
            className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title="Club Notifications & Arrears Alerts"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {(unreadNotifications > 0 || !!arrearsAlert) && (
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
              </span>
            )}
          </button>

          {showNotificationMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-800 bg-[#0F172A] p-4 shadow-2xl z-50 text-white">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-[#F97316]" />
                  <span className="font-bold text-xs">Notifications & Alerts</span>
                  {unreadNotifications > 0 && (
                    <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                      {unreadNotifications} new
                    </span>
                  )}
                </div>
                {unreadNotifications > 0 && (
                  <button
                    onClick={() => markNotificationRead()}
                    className="text-[11px] font-semibold text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Arrears Warning Banner for Athlete */}
              {arrearsAlert && (
                <div className="mt-3 rounded-xl border border-rose-800/80 bg-rose-950/70 p-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-rose-200">{arrearsAlert.title}</div>
                      <p className="mt-1 text-[11px] text-rose-300/90 leading-snug">
                        {arrearsAlert.message}
                      </p>
                      <Link
                        href="/payments"
                        onClick={() => setShowNotificationMenu(false)}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:underline"
                      >
                        <CreditCard className="h-3 w-3" />
                        <span>View Payments & Banking Details</span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin pending dues alert */}
              {adminArrearsCount > 0 && (currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "CLUB_ADMIN") && (
                <div className="mt-3 rounded-xl border border-amber-800/80 bg-amber-950/60 p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                    <div className="text-xs">
                      <div className="font-bold text-amber-200">Annual Renewals Pending</div>
                      <div className="text-[11px] text-amber-300/80 mt-0.5">
                        {adminArrearsCount} member(s) have pending annual club dues for this cycle.
                      </div>
                      <Link
                        href="/payments"
                        onClick={() => setShowNotificationMenu(false)}
                        className="mt-1.5 inline-block text-[11px] font-bold text-orange-400 hover:underline"
                      >
                        Open Payments & Dues Management →
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications List */}
              <div className="mt-3 max-h-64 overflow-y-auto space-y-2 divide-y divide-slate-800/50">
                {notificationsList.length === 0 && !arrearsAlert && adminArrearsCount === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    No active notifications right now.
                  </div>
                ) : (
                  notificationsList.map((notif) => (
                    <div
                      key={notif.id}
                      className={`pt-2 flex items-start justify-between gap-2 text-xs ${
                        !notif.isRead ? "text-white" : "text-slate-400"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-[11px] text-slate-200">{notif.title}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{notif.message}</div>
                        <div className="text-[9px] text-slate-500 mt-1">
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      {!notif.isRead && (
                        <button
                          onClick={() => markNotificationRead(notif.id)}
                          className="text-slate-500 hover:text-green-400 transition-colors p-1"
                          title="Mark read"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-800 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-950 border border-green-800 text-xs font-bold text-green-300">
              {currentUser?.name ? currentUser.name.charAt(0) : "U"}
            </div>
            <div className="hidden text-left sm:block">
              <div className="text-xs font-semibold text-white">
                {currentUser?.name || "Loading..."}
              </div>
              <div className="text-[10px] text-slate-400">
                {currentUser?.email}
              </div>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-800 bg-slate-900 p-1.5 shadow-2xl z-50">
              {currentUser?.athleteId && (
                <Link
                  href={`/athletes/${currentUser.athleteId}`}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800"
                  onClick={() => setShowUserMenu(false)}
                >
                  <UserIcon className="h-3.5 w-3.5" />
                  My 360° Profile
                </Link>
              )}
              {currentUser?.role === "SUPER_ADMIN" && (
                <Link
                  href="/settings"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Sliders className="h-3.5 w-3.5" />
                  Settings & Weights
                </Link>
              )}
              <hr className="my-1 border-slate-800" />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-rose-400 hover:bg-rose-950/40"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Remote Access & Mobile Offline Setup Modal */}
      <RemoteAccessModal
        isOpen={showRemoteModal}
        onClose={() => setShowRemoteModal(false)}
      />
    </header>
  );
}
