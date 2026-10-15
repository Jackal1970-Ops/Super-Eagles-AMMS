"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Lock, Mail, ArrowRight, UserCheck, CheckCircle2, UserPlus, KeyRound, X, Send, Check, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@supereagles.co.za");
  const [password, setPassword] = useState("AdminPass2026!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password modal state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetVerification, setResetVerification] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    setResetSuccess("");

    if (resetNewPassword !== resetConfirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }
    if (resetNewPassword.length < 8) {
      setResetError("Password must be at least 8 characters.");
      return;
    }

    setResetLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail,
          verification: resetVerification,
          newPassword: resetNewPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResetError(data.error || "Reset failed.");
        setResetLoading(false);
        return;
      }
      setResetSuccess(data.message || "Password updated successfully!");
      setEmail(resetEmail);
      setPassword(resetNewPassword);
      setTimeout(() => {
        setForgotOpen(false);
      }, 2000);
    } catch {
      setResetError("Network error connecting to reset service.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed.");
        setLoading(false);
        return;
      }

      if (data.user?.role === "ATHLETE" && data.user?.athleteId) {
        router.push(`/athletes/${data.user.athleteId}`);
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoEmail: string, demoPass: string, autoSubmit = false) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError("");

    if (autoSubmit) {
      setLoading(true);
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: demoEmail, password: demoPass }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to authenticate.");
          setLoading(false);
          return;
        }

        if (data.user?.role === "ATHLETE" && data.user?.athleteId) {
          router.push(`/athletes/${data.user.athleteId}`);
        } else {
          router.push("/dashboard");
        }
      } catch {
        setError("Network error. Please try again.");
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-900 px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* High Definition Super Eagles Club Crest - Clean, No Black Frame */}
        <div className="mx-auto flex justify-center py-2">
          <img
            src="/images/emblem.png"
            alt="Super Eagles Official Crest"
            className="h-44 sm:h-52 w-auto object-contain drop-shadow-[0_16px_32px_rgba(0,0,0,0.8)] transition-all hover:scale-105 duration-300"
          />
        </div>
        <h1 className="mt-5 text-2xl font-black tracking-tight text-white sm:text-3xl">
          Super Eagles Athletics & Membership Management System
        </h1>
        <p className="mt-1.5 text-xs font-bold uppercase tracking-widest text-green-400">
          Official Athletics, Walking, Sponsorship & Membership Intelligence
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-4 rounded-xl border border-rose-900/50 bg-rose-950/50 p-3 text-xs font-bold text-rose-300">
              {error}
            </div>
          )}

          {/* Master Developer Admin 1-Click Access */}
          <div className="mb-5">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickDemo("admin@supereagles.co.za", "AdminPass2026!", true)}
              className="flex w-full items-center justify-between rounded-xl border-2 border-amber-400/60 bg-gradient-to-r from-amber-500/25 via-amber-600/20 to-green-600/25 p-3.5 text-left transition-all hover:border-amber-400 hover:from-amber-500/35 hover:shadow-lg hover:shadow-amber-500/10"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/25 text-amber-400 border border-amber-500/40 text-base font-black shadow-inner">
                  👑
                </span>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-amber-300">
                    DEVELOPER MASTER ADMIN LOGIN
                  </div>
                  <div className="text-[11px] text-slate-300">
                    1-Click Access to ALL Features & Pages Unlocked
                  </div>
                </div>
              </div>
              <span className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-sm hover:bg-amber-300">
                {loading ? "..." : "ENTER"}
              </span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300">
                Email Address
              </label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:border-green-500 focus:outline-none"
                  placeholder="name@supereagles.co.za"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setResetError("");
                    setResetSuccess("");
                    setForgotOpen(true);
                  }}
                  className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:border-green-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-bold text-white shadow-lg shadow-green-900/30 transition-all hover:bg-green-500 focus:outline-none disabled:opacity-50"
            >
              <span>{loading ? "Authenticating..." : "Sign In to AMMS"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* New Member Registration Callout */}
            <div className="pt-2">
              <Link
                href="/register"
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-emerald-500/50 bg-emerald-950/40 py-2.5 px-4 text-xs font-black uppercase tracking-wider text-emerald-300 shadow-md transition-all hover:bg-emerald-900/50 hover:border-emerald-400"
              >
                <UserPlus className="h-4 w-4 text-emerald-400" />
                <span>New Member? Join Club & Create Profile</span>
              </Link>
            </div>
          </form>

          {/* Quick Demo Test Personas */}
          <div className="mt-8 border-t border-slate-800/80 pt-6">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-green-400" />
                Quick Test Personas
              </span>
              <span className="text-[10px] font-normal text-slate-500">1-Click Fill</span>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo("admin@supereagles.co.za", "AdminPass2026!")}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-left text-xs hover:border-green-500/50 hover:bg-slate-800"
              >
                <div>
                  <div className="font-semibold text-white">General Manager (Super Admin)</div>
                  <div className="text-[10px] text-slate-400">admin@supereagles.co.za</div>
                </div>
                <span className="rounded bg-green-950 px-2 py-0.5 text-[10px] font-bold text-green-400">
                  Full Access
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo("coach.hendrik@supereagles.co.za", "CoachPass2026!")}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-left text-xs hover:border-green-500/50 hover:bg-slate-800"
              >
                <div>
                  <div className="font-semibold text-white">Coach (Hendrik Botha)</div>
                  <div className="text-[10px] text-slate-400">coach.hendrik@supereagles.co.za</div>
                </div>
                <span className="rounded bg-blue-950 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                  Squad & AI
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo("athlete.sipho@supereagles.co.za", "AthletePass2026!")}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-left text-xs hover:border-green-500/50 hover:bg-slate-800"
              >
                <div>
                  <div className="font-semibold text-white">Athlete (Sipho Sithole)</div>
                  <div className="text-[10px] text-slate-400">athlete.sipho@supereagles.co.za</div>
                </div>
                <span className="rounded bg-purple-950 px-2 py-0.5 text-[10px] font-bold text-purple-400">
                  Self 360°
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo("admin.club@supereagles.co.za", "ClubPass2026!")}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-left text-xs hover:border-green-500/50 hover:bg-slate-800"
              >
                <div>
                  <div className="font-semibold text-white">Club Administrator</div>
                  <div className="text-[10px] text-slate-400">admin.club@supereagles.co.za</div>
                </div>
                <span className="rounded bg-amber-950 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                  Attendance/CSV
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo("committee@supereagles.co.za", "CommitteePass2026!")}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-left text-xs hover:border-green-500/50 hover:bg-slate-800"
              >
                <div>
                  <div className="font-semibold text-white">Sponsorship Committee Chair</div>
                  <div className="text-[10px] text-slate-400">committee@supereagles.co.za</div>
                </div>
                <span className="rounded bg-teal-950 px-2 py-0.5 text-[10px] font-bold text-teal-400">
                  Reviews & Votes
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* POPIA notice */}
        <div className="mt-6 text-center text-[11px] text-slate-500">
          Protected under POPIA Act standards. Confidential athlete data strictly role-isolated.
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <KeyRound className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">Reset Member Password</h3>
                  <p className="text-[11px] text-slate-400">Offline Local Verification (POPIA Compliant)</p>
                </div>
              </div>
              <button
                onClick={() => setForgotOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {resetError && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-900/50 bg-rose-950/50 p-2.5 text-xs font-semibold text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-950/70 p-2.5 text-xs font-semibold text-emerald-300">
                <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{resetSuccess}</span>
              </div>
            )}

            <form onSubmit={handleResetSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Registered Email Address
                </label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="name@supereagles.co.za"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Verification Credential
                </label>
                <p className="text-[10px] text-slate-400">
                  Enter your full registered phone number or birth date (YYYY-MM-DD).
                </p>
                <input
                  type="text"
                  required
                  value={resetVerification}
                  onChange={(e) => setResetVerification(e.target.value)}
                  placeholder="e.g. 082 123 4567, 1995-04-12, or SEA-001"
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 py-2 px-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 py-2 px-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 py-2 px-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setForgotOpen(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="rounded-xl bg-emerald-500 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-md hover:bg-emerald-400 disabled:opacity-50"
                >
                  {resetLoading ? "Verifying..." : "Update Password"}
                </button>
              </div>
            </form>

            <div className="mt-4 border-t border-slate-800 pt-3 text-center">
              <a
                href="https://api.whatsapp.com/send?text=Hi%20Super%20Eagles%20Club%20Secretary,%20I%20am%20having%20trouble%20retrieving%20my%20member%20password.%20Please%20assist."
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-green-400 hover:underline"
              >
                <Send className="h-3 w-3" />
                <span>Need Secretary assistance? Contact via WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
