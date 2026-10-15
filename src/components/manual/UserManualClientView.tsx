"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Download,
  Printer,
  Search,
  ChevronRight,
  Shield,
  Trophy,
  Activity,
  Heart,
  Calendar,
  DollarSign,
  Sparkles,
  Database,
  FileCheck,
  CheckCircle2,
  HelpCircle,
  QrCode,
  ArrowLeft,
  HardDrive,
} from "lucide-react";

interface UserManualClientViewProps {
  userRole: string;
  userName: string;
}

export function UserManualClientView({ userRole, userName }: UserManualClientViewProps) {
  const [activeChapter, setActiveChapter] = useState("ch1");
  const [searchQuery, setSearchQuery] = useState("");

  const chapters = [
    {
      id: "ch1",
      number: "01",
      title: "System Overview & 5 Security Roles",
      icon: Shield,
      summary: "Club architecture, POPIA data governance, and role isolation.",
    },
    {
      id: "ch2",
      number: "02",
      title: "Athlete 360° Portal & Self-Service",
      icon: Activity,
      summary: "Logging workouts, daily wellness check-ins, and digital membership passes.",
    },
    {
      id: "ch3",
      number: "03",
      title: "Coaching Intelligence & Sports Science",
      icon: Trophy,
      summary: "Athlete Performance Index (API), Gabbett ACWR, and Riegel predictions.",
    },
    {
      id: "ch4",
      number: "04",
      title: "Official Races & Personal Bests",
      icon: FileCheck,
      summary: "Race verification, World Athletics normalization, and Comrades seeding.",
    },
    {
      id: "ch5",
      number: "05",
      title: "Club Attendance & CCLI Loyalty",
      icon: Calendar,
      summary: "QR code check-ins, pack walks, marshalling points, and approved exemptions.",
    },
    {
      id: "ch6",
      number: "06",
      title: "Sponsorship Governance & Reciprocity",
      icon: DollarSign,
      summary: "Club Sponsorship Score (CSS), reciprocity matrix, and covenant audits.",
    },
    {
      id: "ch7",
      number: "07",
      title: "Conferred Medallions & WhatsApp Sharing",
      icon: Sparkles,
      summary: "Athlete of the Month & Year criteria, certificates, and WhatsApp broadcasting.",
    },
    {
      id: "ch8",
      number: "08",
      title: "System Health, Self-Healing & Drive Backups",
      icon: HardDrive,
      summary: "In-app diagnostics, automated healing, and custom drive snapshots.",
    },
    {
      id: "ch9",
      number: "09",
      title: "Authoritative Mathematical Formulations",
      icon: BookOpen,
      summary: "Peer-reviewed citations (Riegel 1977, Gabbett 2016, Haversine, PDI).",
    },
    {
      id: "ch10",
      number: "10",
      title: "Proof-of-Payment (POP) & Banking Reconciliation",
      icon: DollarSign,
      summary: "POP slips, banking reference tagging, verification queues, and WhatsApp receipts.",
    },
    {
      id: "ch11",
      number: "11",
      title: "Local-First Ingestion, Logistics & Race Fleets",
      icon: Calendar,
      summary: "Zero-cloud GPX/CSV parsing, bus transport manifests, hotel rooming, and volunteer rosters.",
    },
    {
      id: "ch12",
      number: "12",
      title: "Direct Notices, ASA Rollover & 1-Click Restore",
      icon: HardDrive,
      summary: "1-Click WhatsApp/Email notice dispatch, ASA age-group season rollover, and safety restore.",
    },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header / Actions Bar (Hidden on Print) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-400 to-yellow-600 p-2 shadow-lg shadow-amber-500/20">
            <Image
              src="/images/emblem.png"
              alt="Super Eagles Emblem"
              width={48}
              height={48}
              className="object-contain drop-shadow"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black uppercase tracking-tight text-white">
                Super Eagles AMMS Comprehensive User Manual
              </h1>
              <span className="rounded-md bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                Official 2026 Edition
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Standard Operating Procedures, Role Guidelines, and Mathematical Specifications.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all duration-200 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF Booklet</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Handbook Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Table of Contents Sidebar (Hidden on Print) */}
        <div className="print:hidden lg:col-span-1 space-y-2 rounded-2xl border border-slate-700/80 bg-[#1E293B]/80 p-4 shadow-md h-fit">
          <div className="px-2 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700/80 mb-2">
            Table of Contents
          </div>

          {chapters.map((ch) => {
            const Icon = ch.icon;
            const isActive = activeChapter === ch.id;
            return (
              <button
                key={ch.id}
                onClick={() => setActiveChapter(ch.id)}
                className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-all ${
                  isActive
                    ? "bg-green-700 text-white shadow-md font-bold"
                    : "text-slate-300 hover:text-white hover:bg-slate-800 font-medium"
                }`}
              >
                <span className="font-mono text-[11px] opacity-70 mt-0.5">{ch.number}</span>
                <div className="flex-1">
                  <div className="text-xs leading-tight">{ch.title}</div>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isActive ? "opacity-100" : "opacity-40"}`} />
              </button>
            );
          })}
        </div>

        {/* Chapter Content View (Print Target) */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 p-6 sm:p-8 shadow-xl backdrop-blur-md text-white space-y-6 print:border-none print:bg-white print:text-black print:p-0">
          
          {/* Chapter 1 */}
          {(activeChapter === "ch1" || typeof window === "undefined") && (
            <div className="space-y-4">
              <div className="border-b border-slate-700 pb-3">
                <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">Chapter 01</span>
                <h2 className="text-2xl font-black tracking-tight text-white mt-1">
                  System Architecture & 5-Tier Role Isolation
                </h2>
              </div>

              <div className="text-xs leading-relaxed text-slate-300 space-y-3 font-sans">
                <p>
                  The Super Eagles Athletics Management System (AMMS) operates as a high-performance,
                  evidence-based platform built specifically for athletic governance, athlete tracking, and sponsorship reciprocity.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <strong className="text-emerald-400 font-bold block mb-1">1. Super Admin</strong>
                    <span>Complete system administration, system weights configuration, audit inspection, and self-healing controls.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <strong className="text-blue-400 font-bold block mb-1">2. Coach</strong>
                    <span>Direct squad performance tracking, training log review, Gabbett ACWR workload alerts, and deterministic AI prescription oversight.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <strong className="text-purple-400 font-bold block mb-1">3. Athlete (Self-Service)</strong>
                    <span>Direct private access to personal 360° profile, mileage log, verified competition results, and digital ASA membership pass.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <strong className="text-orange-400 font-bold block mb-1">4. Club Admin</strong>
                    <span>Membership operations, ASA license management, club attendance marshalling, and event schedule administration.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chapter 2 */}
          {activeChapter === "ch2" && (
            <div className="space-y-4">
              <div className="border-b border-slate-700 pb-3">
                <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">Chapter 02</span>
                <h2 className="text-2xl font-black tracking-tight text-white mt-1">
                  Athlete 360° Portal & Self-Service Guide
                </h2>
              </div>
              <div className="text-xs leading-relaxed text-slate-300 space-y-3">
                <p>
                  Athletes logging in are routed directly to their isolated personal dashboard with zero data leakage of other club members under POPIA compliance.
                </p>
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <h4 className="font-bold text-white text-sm">Key Athlete Capabilities:</h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    <li><strong>My Training Mileage:</strong> Log daily runs, walks, surfaces, and session Rate of Perceived Exertion (RPE).</li>
                    <li><strong>Smartwatch GPX Upload:</strong> Direct file ingestion for Garmin, Coros, Strava, and Apple Watch .gpx files.</li>
                    <li><strong>Daily Wellness Check-In:</strong> 30-second submission for sleep quality, soreness, and fatigue.</li>
                    <li><strong>Digital Membership Pass:</strong> Instant visual membership card with QR token for time trials and pack walks.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Chapter 3 */}
          {activeChapter === "ch3" && (
            <div className="space-y-4">
              <div className="border-b border-slate-700 pb-3">
                <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">Chapter 03</span>
                <h2 className="text-2xl font-black tracking-tight text-white mt-1">
                  Coaching Intelligence & Sports Science Models
                </h2>
              </div>
              <div className="text-xs leading-relaxed text-slate-300 space-y-3">
                <p>
                  Our sports science engine integrates Dr. Tim Gabbett's Acute:Chronic Workload Ratio (ACWR) and modified Riegel power-law predictions.
                </p>
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 font-mono text-[11px] text-emerald-300">
                  ACWR = Past 7 Days Load (Acute) / Rolling 28 Days Weekly Average (Chronic)
                  <br />
                  • 0.8 - 1.3: Optimal "Sweet Spot" (Low Relative Injury Risk)
                  <br />
                  • &gt; 1.5: Danger Zone (Spike in Workload / Overtraining Hazard)
                </div>
              </div>
            </div>
          )}

          {/* Chapter 4 */}
          {activeChapter === "ch4" && (
            <div className="space-y-4">
              <div className="border-b border-slate-700 pb-3">
                <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">Chapter 04</span>
                <h2 className="text-2xl font-black tracking-tight text-white mt-1">
                  Official Competitions, Race Verification & Personal Bests
                </h2>
              </div>

              <div className="text-xs leading-relaxed text-slate-300 space-y-4 font-sans">
                <p>
                  The Super Eagles Competition & Race Engine records verified championship performances, calculates official Personal Bests (PBs), and projects future race finishes using Peter Riegel’s fatigue formulation.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <strong className="text-amber-400 font-bold block text-sm">Official Race Results Logging</strong>
                    <p className="text-slate-300">
                      Coaches and administrators record chip-timed or gun-timed results under <strong>Races & Results</strong> (<code className="text-emerald-300">/races/results/new</code>). Every entry captures:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-slate-300">
                      <li>Official Race Name & Sanctioning Body (ASA / World Athletics)</li>
                      <li>Verified Distance (e.g., 10km, 21.1km, 42.2km, 89km Comrades)</li>
                      <li>Net Chip Time & Overall Finishing Position</li>
                      <li>Automatic Personal Best (PB) detection and medal classification</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <strong className="text-sky-400 font-bold block text-sm">Deterministic Riegel Race Predictions</strong>
                    <p className="text-slate-300">
                      AMMS projects prospective finish times using the modified Riegel formula:
                    </p>
                    <div className="p-2 rounded-lg bg-slate-950 font-mono text-[11px] text-emerald-300">
                      T₂ = T₁ × (D₂ / D₁)^(1.06 + fadeFactor - consistencyBonus)
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Adjusts dynamically for long-run readiness (runs &ge; 35km reduce fade) and training consistency (&gt;90% adds pace bonus).
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <strong className="text-emerald-400 font-bold block text-sm">Comrades Marathon & National Seeding Matrix</strong>
                  <p className="text-slate-300">
                    Official marathon results automatically map into standard seeding batches (A through H) for the Comrades Marathon and Two Oceans 56km:
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] mt-2 border border-slate-800">
                      <thead className="bg-slate-950 text-slate-300 border-b border-slate-800">
                        <tr>
                          <th className="p-2">Seeding Batch</th>
                          <th className="p-2">Qualifying Standard (42.2km)</th>
                          <th className="p-2">Target Finish (Comrades 89km)</th>
                          <th className="p-2">Super Eagles Target Squad</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        <tr>
                          <td className="p-2 font-bold text-amber-400">Batch A (Elite / Seeded)</td>
                          <td className="p-2 font-mono">Sub 2h50m (Marathon)</td>
                          <td className="p-2 font-mono text-emerald-300">Sub 6h00m (Gold / Wally Hayward)</td>
                          <td className="p-2">Elite Squad</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold text-sky-400">Batch B (Sub-Elite)</td>
                          <td className="p-2 font-mono">Sub 3h00m (Marathon)</td>
                          <td className="p-2 font-mono text-emerald-300">Sub 7h00m (Silver Medal)</td>
                          <td className="p-2">Performance Squad</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold text-purple-400">Batch C (Competitive)</td>
                          <td className="p-2 font-mono">Sub 3h20m (Marathon)</td>
                          <td className="p-2 font-mono text-emerald-300">Sub 7h30m (Isavel Roche-Kelly)</td>
                          <td className="p-2">Performance Squad</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold text-slate-300">Batch D to H (Club Finishers)</td>
                          <td className="p-2 font-mono">Sub 4h50m (Marathon Cutoff)</td>
                          <td className="p-2 font-mono text-emerald-300">Sub 11h00m / 12h00m (Vic Clapham)</td>
                          <td className="p-2">Development & Walkers</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chapter 5 */}
          {activeChapter === "ch5" && (
            <div className="space-y-4">
              <div className="border-b border-slate-700 pb-3">
                <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">Chapter 05</span>
                <h2 className="text-2xl font-black tracking-tight text-white mt-1">
                  Club Attendance & CCLI Loyalty Engine
                </h2>
              </div>

              <div className="text-xs leading-relaxed text-slate-300 space-y-4 font-sans">
                <p>
                  The Club Contribution & Loyalty Index (CCLI) is an objective 0–100 score designed to eliminate favoritism and honor both competitive champions and dedicated health walkers.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <strong className="text-emerald-400 font-bold block text-sm">7 Weighted Pillars of Club Loyalty</strong>
                    <ul className="list-disc list-inside space-y-1 text-slate-300">
                      <li><strong>Internal Club Runs (30%):</strong> Regular attendance at Saturday pack runs and Thursday time trials.</li>
                      <li><strong>Volunteering & Service (20%):</strong> Water point marshalling, timekeeping, and course marking.</li>
                      <li><strong>Club Representation (15%):</strong> Competing in designated ASA races wearing official club colors.</li>
                      <li><strong>Mentoring & Pacing (10%):</strong> Pacing development runners or guiding beginners.</li>
                      <li><strong>Club Meetings (10%):</strong> AGM and monthly club forum attendance.</li>
                      <li><strong>Sponsorship Compliance (10%):</strong> Fulfilling contracted athlete commitments.</li>
                      <li><strong>Membership Tenure (5%):</strong> Long-term loyalty to Super Eagles AC.</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <strong className="text-orange-400 font-bold block text-sm">Approved Exemption Governance</strong>
                    <p className="text-slate-300">
                      Crucial Rule: Athletes with legitimate, committee-approved exemptions (medical injury, pregnancy, university exams, or national team duty) are never unfairly penalized.
                    </p>
                    <div className="p-3 rounded-lg bg-slate-950 font-mono text-[11px] text-amber-300">
                      Adjusted Sessions = Expected Sessions × (1.0 - Exemption Ratio)
                    </div>
                    <p className="text-[11px] text-slate-400">
                      The attendance denominator is lowered proportionately so that an injured runner volunteering at the finish line retains their high loyalty score.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <strong className="text-sky-400 font-bold block text-sm">High-Speed QR Check-In Workflow</strong>
                  <p className="text-slate-300">
                    Marshals open the <strong>QR Marshal Scanner</strong> modal on the club computer or any mobile phone. Scanning a member's digital QR pass awards +10 to +15 loyalty points in under 50 milliseconds.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Chapter 6 */}
          {activeChapter === "ch6" && (
            <div className="space-y-4">
              <div className="border-b border-slate-700 pb-3">
                <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">Chapter 06</span>
                <h2 className="text-2xl font-black tracking-tight text-white mt-1">
                  Sponsorship Governance, Reciprocity & Audit Trails
                </h2>
              </div>

              <div className="text-xs leading-relaxed text-slate-300 space-y-4 font-sans">
                <p>
                  Super Eagles AC treats club sponsorship as an accountable partnership rather than unconditional patronage. The Sponsorship Governance Engine ensures club funds are distributed fairly, transparently, and with full reciprocity.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <strong className="text-purple-400 font-bold block text-sm">Club Sponsorship Score (CSS)</strong>
                    <p className="text-slate-300">
                      Every sponsorship recipient is evaluated on an objective 0–100 scale:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-slate-300">
                      <li>Verified Performance: <strong>25%</strong></li>
                      <li>Month-over-Month Improvement: <strong>20%</strong></li>
                      <li>Future Championship Potential: <strong>15%</strong></li>
                      <li>Training & Data Reliability: <strong>10%</strong></li>
                      <li>Club Contribution & Loyalty (CCLI): <strong>20%</strong></li>
                      <li>Sponsorship Compliance: <strong>10%</strong></li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <strong className="text-rose-400 font-bold block text-sm">The 'Take-and-Run' Reciprocity Guard</strong>
                    <p className="text-slate-300">
                      AMMS automatically flags athletes who consume club stipends, travel funding, or shoes but fail to represent the club at internal events:
                    </p>
                    <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/80 text-[11px] text-rose-300">
                      <strong>Automatic Flag Trigger:</strong> Performance &ge; 80 but Club Contribution &lt; 45% flags a <em>Reciprocity Review</em>, recommending conditional contracts with mandatory volunteer covenants.
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <strong className="text-amber-400 font-bold block text-sm">Financial Disbursement Logging & Covenants</strong>
                  <p className="text-slate-300">
                    Administrators log every voucher, shoe allocation, physiotherapy stipend, and race entry fee with full receipt numbers. The immutable audit log tracks remaining budget caps and ensures total fiduciary integrity for club sponsors.
                  </p>
                </div>
              </div>
            </div>
          )}
          {activeChapter === "ch7" && (
            <div className="space-y-4">
              <div className="border-b border-slate-700 pb-3">
                <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">Chapter 07</span>
                <h2 className="text-2xl font-black tracking-tight text-white mt-1">
                  Conferred Medallions & Official WhatsApp Broadcasting
                </h2>
              </div>
              <div className="text-xs leading-relaxed text-slate-300 space-y-3">
                <p>
                  Super Eagles recognizes outstanding members across both <strong>Competitive Performance</strong> and <strong>Community Health & Wellness</strong> tracks.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/40">
                    <strong className="text-amber-400 block mb-1">Gold Champion</strong>
                    <span>Athlete of the Year (Competitive Track). Conferred for national championship podiums and Comrades Gold standard.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-sky-500/40">
                    <strong className="text-sky-400 block mb-1">Platinum Elite</strong>
                    <span>Athlete of the Month (Competitive Track). Awarded for personal bests and API ranking performance.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/40">
                    <strong className="text-emerald-400 block mb-1">Emerald Wellness</strong>
                    <span>Athlete of the Month/Year (Health & Wellness). Awarded for 100% time-trial and pack walk attendance, community mileage, and mentoring.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chapter 8 */}
          {activeChapter === "ch8" && (
            <div className="space-y-4">
              <div className="border-b border-slate-700 pb-3">
                <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">Chapter 08</span>
                <h2 className="text-2xl font-black tracking-tight text-white mt-1">
                  System Health, Autonomous Self-Healing & Drive Backups
                </h2>
              </div>
              <div className="text-xs leading-relaxed text-slate-300 space-y-3">
                <p>
                  Administrators can inspect live pipeline latency, refresh the root database recovery snapshot or restore missing configurations,
                  and trigger manual or scheduled backups to any drive of choice (e.g. D:\Backups or external USB).
                </p>
              </div>
            </div>
          )}

          {/* Chapter 9 */}
          {activeChapter === "ch9" && (
            <div className="space-y-4">
              <div className="border-b border-slate-700 pb-3">
                <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">Chapter 09</span>
                <h2 className="text-2xl font-black tracking-tight text-white mt-1">
                  Authoritative Mathematical Formulations & Online Benchmarks
                </h2>
              </div>
              <div className="text-xs leading-relaxed text-slate-300 space-y-3">
                <p>
                  Every mathematical calculation in the Super Eagles platform is benchmarked against peer-reviewed literature:
                </p>
                <div className="space-y-2 font-mono text-[11px] bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                  <div>1. Peter Riegel (1977) Race Prediction Power Law: T₂ = T₁ × (D₂ / D₁)^1.06</div>
                  <div>2. Dr. Tim Gabbett (2016 BJSM) Workload Ratio: Acute (7d) / Chronic (28d)</div>
                  <div>3. IUGG / NOAA Geodesic Haversine Formula: R = 6,371,000 meters</div>
                  <div>4. World Athletics Split Decay: PDI = ((Split₂ - Split₁) / Split₁) × 100</div>
                </div>
              </div>
            </div>
          )}

          {/* Chapter 10 */}
          {activeChapter === "ch10" && (
            <div className="space-y-4">
              <div className="border-b border-slate-700 pb-3">
                <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">Chapter 10</span>
                <h2 className="text-2xl font-black tracking-tight text-white mt-1">
                  Proof-of-Payment (POP) & Banking Reconciliation
                </h2>
              </div>
              <div className="text-xs leading-relaxed text-slate-300 space-y-3">
                <p>
                  The Financial Reconciliation Engine resolves annual dues, race fee, and kit payment tracking with complete document auditability:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <strong className="text-amber-400 block text-sm">POP Document Ingestion</strong>
                    <p className="text-slate-300">
                      Members and administrators upload EFT bank statements, ATM deposit slips, and mobile banking PDF receipts directly into the athlete profile or payment queue.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <strong className="text-emerald-400 block text-sm">Two-Stage Verification Queue</strong>
                    <p className="text-slate-300">
                      Incoming POP submissions are staged in a &apos;Pending Verification&apos; state. The Club Treasurer compares the bank reference and amount before clicking &apos;Verify & Clear&apos;.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <strong className="text-sky-400 block text-sm">1-Click WhatsApp Receipts</strong>
                    <p className="text-slate-300">
                      Upon approval, the system generates an official receipt dispatchable directly to the athlete&apos;s WhatsApp with membership status update and official ASA license release.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <strong className="text-purple-400 block text-sm">Automated Arrears Resolution</strong>
                    <p className="text-slate-300">
                      Verifying a payment clears the athlete&apos;s financial arrears gatekeeper lock immediately, restoring full training logging and race registration privileges.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chapter 11 */}
          {activeChapter === "ch11" && (
            <div className="space-y-4">
              <div className="border-b border-slate-700 pb-3">
                <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">Chapter 11</span>
                <h2 className="text-2xl font-black tracking-tight text-white mt-1">
                  Local-First Telemetry Ingestion, Event Logistics & Race Fleets
                </h2>
              </div>
              <div className="text-xs leading-relaxed text-slate-300 space-y-3">
                <p>
                  AMMS provides complete event coordination without depending on third-party cloud subscriptions:
                </p>
                <div className="space-y-3 pt-1">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <strong className="text-emerald-400 block mb-1 text-sm">Zero-Cloud Local GPX / CSV Ingestion</strong>
                    <span className="text-slate-300">
                      Athletes upload raw GPX workout files from Garmin, Coros, or Strava exports. The browser-embedded TypeScript parser calculates distance, elevation gain, split paces, and Gabbett workload entirely offline on CPU.
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <strong className="text-amber-400 block mb-1 text-sm">Race Fleet Transport & Bus Manifests</strong>
                    <span className="text-slate-300">
                      For major travels (Comrades, Two Oceans, Kaapsehoop), the Event Logistics hub assigns athletes to numbered club buses with specific departure points, seat capacities, and emergency marshal contacts.
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <strong className="text-sky-400 block mb-1 text-sm">Hotel Rooming & Accommodation Allocations</strong>
                    <span className="text-slate-300">
                      Coordinate shared runner hotel rooms and guesthouses, track room occupancy limits, check-in dates, and special dietary or room-sharing requests.
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <strong className="text-purple-400 block mb-1 text-sm">Volunteer Marshal Rostering</strong>
                    <span className="text-slate-300">
                      Schedule and deploy water-point marshals, timing table officials, and pack-walk coordinators with instant attendance credit and CCLI loyalty point accrual.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chapter 12 */}
          {activeChapter === "ch12" && (
            <div className="space-y-4">
              <div className="border-b border-slate-700 pb-3">
                <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">Chapter 12</span>
                <h2 className="text-2xl font-black tracking-tight text-white mt-1">
                  Direct Notice Dispatch, Annual ASA Rollover & 1-Click Disaster Recovery
                </h2>
              </div>
              <div className="text-xs leading-relaxed text-slate-300 space-y-3">
                <p>
                  Enterprise club governance requires automated seasonal transitions and disaster resilience:
                </p>
                <div className="space-y-3 pt-1">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <strong className="text-emerald-400 block mb-1 text-sm">1-Click WhatsApp & Email Notice Dispatch</strong>
                    <span className="text-slate-300">
                      Broadcast personalized renewal reminders, payment receipts, race logistic bulletins, and training announcements. The notice engine auto-formats South African E.164 phone numbers and opens WhatsApp Web or default email clients with zero third-party API costs.
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <strong className="text-amber-400 block mb-1 text-sm">Annual ASA Season Rollover Engine</strong>
                    <span className="text-slate-300">
                      Executes statutory year-end rollover: recalculates athlete age categories (Senior, Sub-Vet 35+, Veteran 40+, Master 50+, Grandmaster 60+), transitions active rosters to pending renewal, preserves full historical snapshot archives, and projects next-season club revenue.
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <strong className="text-sky-400 block mb-1 text-sm">1-Click Disaster Recovery & Restore Engine</strong>
                    <span className="text-slate-300">
                      Restore the entire club database from any timestamped snapshot file with a single click. The restore engine automatically creates a safety snapshot before applying updates, runs SQLite PRAGMA quick_check, and synchronizes the dev.db and prisma/dev.db mirrors.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
