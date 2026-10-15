"use client";

import React from "react";
import {
  X,
  Award,
  Zap,
  TrendingUp,
  ShieldCheck,
  Target,
  Clock,
  HeartHandshake,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  BarChart3,
  Sliders,
} from "lucide-react";

interface ScoringRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  perfThreshold: number;
  contribThreshold: number;
}

export function ScoringRulesModal({
  isOpen,
  onClose,
  perfThreshold,
  contribThreshold,
}: ScoringRulesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-100 sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4 border-b border-slate-800 pb-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-500/20 text-green-400 border border-green-500/30">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">
                Club Policy & Scoring Rules Guide
              </h2>
              <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-bold text-green-400 border border-green-500/30">
                Official Club Standard
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Understanding how the Performance vs. Contribution Matrix classifies athletes, defines Elite standards, and protects club sponsorship funds.
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="mt-6 space-y-8 text-sm">
          {/* Section 1: What Defines an Elite Athlete */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
            <div className="flex items-center gap-2.5 text-green-400 font-bold text-base">
              <Zap className="h-5 w-5" />
              <h3>1. What Defines an "Elite Athlete" (Above the Green Line)?</h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              In Super Eagles AMMS, an athlete is classified in the upper tier when their{" "}
              <strong className="text-white">Athlete Performance Index (API)</strong> meets or exceeds the policy cutoff of{" "}
              <strong className="text-green-400">{perfThreshold}/100</strong>. The score is calculated using four audited pillars governed by Athletics South Africa (ASA) racing criteria:
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Pillar 1 */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-emerald-400" />
                    Verified Race Pace
                  </span>
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[11px] font-mono font-bold text-emerald-300">
                    35% Weight
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400 leading-normal">
                  Chip-timed results in official 10km, 21km, 42km, Two Oceans, and Comrades races. Sub-3:30/km paces score 90–98; 3:35–4:05/km scores 75–88; &gt;5:00/km scores &lt;60.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-blue-400" />
                    12-Month Improvement
                  </span>
                  <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[11px] font-mono font-bold text-blue-300">
                    30% Weight
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400 leading-normal">
                  Measures whether an athlete is actively dropping minutes off their PBs over 3, 6, and 12-month intervals. Positive trajectory earns 85–95; stagnant/declining times score 45–60.
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Target className="h-4 w-4 text-amber-400" />
                    Championship Readiness
                  </span>
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[11px] font-mono font-bold text-amber-300">
                    20% Weight
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400 leading-normal">
                  Probability of achieving National/Provincial qualifying, Comrades Gold/Silver (Sub-6:00 / Sub-7:30), or Two Oceans Sainsbury medals.
                </p>
              </div>

              {/* Pillar 4 */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-purple-400" />
                    Competitive Reliability
                  </span>
                  <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[11px] font-mono font-bold text-purple-300">
                    15% Weight
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400 leading-normal">
                  Race completion rate, zero unexpected DNF dropouts, and sustained 8-week structured workload adherence.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: The 4 Quadrants & Why We Have Two Crosshairs */}
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-bold text-base mb-3">
              <BarChart3 className="h-5 w-5" />
              <h3>2. The Four Matrix Quadrants: Balancing Speed with Club Loyalty</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Running fast alone is not enough to receive club sponsorship. The vertical line (at{" "}
              <strong className="text-blue-400">{contribThreshold}/100</strong>) measures the{" "}
              <strong className="text-white">Club Contribution & Loyalty Index (CCLI)</strong>: attendance at club runs, marshalling, wearing club colours, and meeting obligations.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Q1 */}
              <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-950/20 p-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-slate-950 font-black text-xs">
                    ★
                  </span>
                  <h4 className="font-black text-emerald-300 text-sm">
                    Priority Athletes (Elite) — Top Right
                  </h4>
                </div>
                <div className="mt-2 text-xs text-slate-300 space-y-1">
                  <p>• <strong>Criteria</strong>: Performance ≥ {perfThreshold} AND Contribution ≥ {contribThreshold}</p>
                  <p>• <strong>Action</strong>: Prime candidates for full sponsorship packages, travel subsidies, and elite gear allocations.</p>
                  <p className="text-emerald-400 font-semibold">• High Speed + High Club Loyalty.</p>
                </div>
              </div>

              {/* Q2 */}
              <div className="rounded-2xl border-2 border-amber-500/40 bg-amber-950/20 p-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-slate-950 font-black text-xs">
                    ⚠️
                  </span>
                  <h4 className="font-black text-amber-300 text-sm">
                    Sponsorship Reciprocity Review — Top Left
                  </h4>
                </div>
                <div className="mt-2 text-xs text-slate-300 space-y-1">
                  <p>• <strong>Criteria</strong>: Performance ≥ {perfThreshold} BUT Contribution &lt; {contribThreshold}</p>
                  <p>• <strong>Action</strong>: High race speed, but low club engagement. The committee requires participation commitments before disbursing funding.</p>
                  <p className="text-amber-400 font-semibold">• Reciprocity Alert: Elite talent must give back to the club.</p>
                </div>
              </div>

              {/* Q3 */}
              <div className="rounded-2xl border-2 border-teal-500/40 bg-teal-950/20 p-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500 text-slate-950 font-black text-xs">
                    🌱
                  </span>
                  <h4 className="font-black text-teal-300 text-sm">
                    Development Opportunity — Bottom Right
                  </h4>
                </div>
                <div className="mt-2 text-xs text-slate-300 space-y-1">
                  <p>• <strong>Criteria</strong>: Performance &lt; {perfThreshold} BUT Contribution ≥ {contribThreshold}</p>
                  <p>• <strong>Action</strong>: Highly loyal club members who attend every session. Focus on coaching, training plans, and biomechanical support.</p>
                  <p className="text-teal-400 font-semibold">• The future core of the competitive squad.</p>
                </div>
              </div>

              {/* Q4 */}
              <div className="rounded-2xl border-2 border-slate-600/40 bg-slate-800/30 p-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-500 text-slate-950 font-black text-xs">
                    📋
                  </span>
                  <h4 className="font-black text-slate-300 text-sm">
                    Management Review — Bottom Left
                  </h4>
                </div>
                <div className="mt-2 text-xs text-slate-300 space-y-1">
                  <p>• <strong>Criteria</strong>: Performance &lt; {perfThreshold} AND Contribution &lt; {contribThreshold}</p>
                  <p>• <strong>Action</strong>: Low performance and inactive club attendance. Check for injury, lapsed dues, or personal circumstances.</p>
                  <p className="text-slate-400 font-semibold">• Inactive or non-participating athletes.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Policy Crosshair Calibration */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-base">
              <Sliders className="h-5 w-5" />
              <h3>3. Executive Crosshair Adjustment Policy</h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              The club executive committee is empowered to adjust the horizontal and vertical crosshairs to align with changing seasonal policies:
            </p>
            <ul className="mt-2 list-disc list-inside text-xs text-slate-400 space-y-1">
              <li>
                <strong className="text-slate-200">Pre-Comrades & Two Oceans Window</strong>: The committee can raise the Performance threshold to <strong>78 or 80</strong> to identify podium-caliber athletes.
              </li>
              <li>
                <strong className="text-slate-200">Rebuilding / Off-Season Window</strong>: The committee can lower the Contribution threshold to <strong>50</strong> to encourage broader winter participation.
              </li>
              <li>
                <strong className="text-slate-200">Strict Boundary Clamping</strong>: Athletes near the crosshairs are mathematically and visually clamped to their true quadrant so anti-overlap physics never pushes an athlete across benchmark lines.
              </li>
            </ul>
          </div>

          {/* Section 4: Monthly & Yearly Achievement Medallions & Placement Guidelines */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
              <Award className="h-5 w-5" />
              <h3>4. Monthly &amp; Yearly Achievement Medallions &amp; Placement Criteria</h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              Super Eagles AMMS recognises excellence across dual tracks (Competitive and Health &amp; Lifestyle). Placement on the podium, in graph highlights, and in annual honors follows strict governance rules:
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* Gold Champion Medallion */}
              <div className="rounded-xl border border-amber-500/40 bg-slate-900/90 p-3.5">
                <div className="flex items-center gap-2 text-amber-400 font-black text-xs">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-slate-950 text-xs">🥇</span>
                  <span>Gold Champion (24K Laurel)</span>
                </div>
                <div className="mt-2 space-y-1 text-[11px] text-slate-300 leading-normal">
                  <p>• <strong>Scope</strong>: Monthly &amp; Yearly Elite Competitive Honors.</p>
                  <p>• <strong>Criteria</strong>: Verified top-tier championship performance, high World Athletics points, or major podium finish (Comrades, Two Oceans, Provincial Champs).</p>
                  <p>• <strong>Graph Placement</strong>: Gold halo with prominent pin on the Performance Progression curve.</p>
                </div>
              </div>

              {/* Platinum Elite Medallion */}
              <div className="rounded-xl border border-blue-500/40 bg-slate-900/90 p-3.5">
                <div className="flex items-center gap-2 text-blue-300 font-black text-xs">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-slate-950 text-xs">💎</span>
                  <span>Platinum Elite (Titanium Crown)</span>
                </div>
                <div className="mt-2 space-y-1 text-[11px] text-slate-300 leading-normal">
                  <p>• <strong>Scope</strong>: Annual All-Rounder &amp; Club Athlete of the Year.</p>
                  <p>• <strong>Criteria</strong>: Sustained API ≥ 85 across the entire season, combined with CCLI ≥ 80 (exemplary volunteering, mentoring, and race representation).</p>
                  <p>• <strong>Graph Placement</strong>: Featured in the Executive Dashboard Reigning Champions panel.</p>
                </div>
              </div>

              {/* Emerald Wellness Medallion */}
              <div className="rounded-xl border border-emerald-500/40 bg-slate-900/90 p-3.5">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-xs">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-slate-950 text-xs">🌿</span>
                  <span>Emerald Wellness (Lifestyle Laurel)</span>
                </div>
                <div className="mt-2 space-y-1 text-[11px] text-slate-300 leading-normal">
                  <p>• <strong>Scope</strong>: Monthly &amp; Yearly Health &amp; Community Honors.</p>
                  <p>• <strong>Criteria</strong>: Awarded in the Health &amp; Lifestyle track for 100% monthly internal run consistency, lifestyle transformation, and community marshalling.</p>
                  <p>• <strong>Graph Placement</strong>: Highlighted in the Lifestyle Track and Volunteer Service registry.</p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-[11px] text-slate-400">
              <strong className="text-white">Longitudinal Performance Curve Placement</strong>: Every verified race result is plotted chronologically. Gold stars represent official Personal Bests (PBs), and the curve reflects Riegel aerobic power law scaling across distances.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-end border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="rounded-xl bg-green-600 px-6 py-2.5 text-xs font-black text-white hover:bg-green-500 transition-colors shadow-lg shadow-green-900/30"
          >
            Understood & Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
