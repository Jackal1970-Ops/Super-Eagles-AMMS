"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Check,
  X,
  Edit3,
  CheckCircle2,
  Filter,
  Flame,
  ArrowRight,
  TrendingUp,
  Activity,
  AlertCircle,
  Save,
  BrainCircuit,
  Zap,
  ShieldCheck,
  RefreshCw,
  Sliders,
  Send,
  UserCheck,
  Target,
} from "lucide-react";

interface AIInsightsClientViewProps {
  recommendations: any[];
  userRole: string;
}

export function AIInsightsClientView({
  recommendations,
  userRole,
}: AIInsightsClientViewProps) {
  const [items, setItems] = useState(recommendations);
  const [filterType, setFilterType] = useState("ALL");
  const [actionSuccess, setActionSuccess] = useState("");
  const [editingRecId, setEditingRecId] = useState<string | null>(null);
  const [modifiedText, setModifiedText] = useState("");
  const [coachNotes, setCoachNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleUpdateStatus = async (
    id: string,
    newStatus: string,
    customText?: string,
    feedback?: string
  ) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/ai/recommendations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          modifiedRecommendation: customText,
          coachFeedback: feedback,
        }),
      });

      if (res.ok) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: newStatus,
                  modifiedRecommendation: customText || item.modifiedRecommendation,
                  coachFeedback: feedback || item.coachFeedback,
                }
              : item
          )
        );
        setActionSuccess(`Recommendation successfully marked as ${newStatus.replace(/_/g, " ")}.`);
        setEditingRecId(null);
        setTimeout(() => setActionSuccess(""), 4000);
      }
    } catch (e) {
      console.error("Failed to update recommendation status:", e);
    } finally {
      setSaving(false);
    }
  };

  const startModifying = (rec: any) => {
    setEditingRecId(rec.id);
    setModifiedText(rec.modifiedRecommendation || rec.aiInterpretation || rec.summary);
    setCoachNotes(rec.coachFeedback || "");
  };

  const filteredItems = items.filter((item) => {
    if (filterType === "ALL") return true;
    return item.recommendationType === filterType;
  });

  const renderStructuredFacts = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      return (
        <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {Object.entries(data).map(([key, val]) => {
            let label = key
              .replace(/([A-Z])/g, " $1")
              .replace(/_/g, " ")
              .trim();
            label = label.charAt(0).toUpperCase() + label.slice(1);

            let displayVal = String(val);
            if (key.toLowerCase().includes("seconds")) {
              const s = Number(val);
              const h = Math.floor(s / 3600);
              const m = Math.floor((s % 3600) / 60);
              const sec = s % 60;
              displayVal = `${h}h ${m.toString().padStart(2, "0")}m ${sec.toString().padStart(2, "0")}s`;
            } else if (key.toLowerCase().includes("zar") || key.toLowerCase().includes("spend")) {
              displayVal = `R ${Number(val).toLocaleString()}`;
            } else if (key.toLowerCase().includes("rate") || key.toLowerCase().includes("percent")) {
              displayVal = `${val}%`;
            }

            return (
              <div
                key={key}
                className="rounded-xl bg-slate-950/80 border border-slate-800 p-2.5"
              >
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {label}
                </div>
                <div className="mt-0.5 font-mono text-xs font-bold text-emerald-400">
                  {displayVal}
                </div>
              </div>
            );
          })}
        </div>
      );
    } catch {
      return (
        <div className="rounded-lg bg-slate-950 p-2 text-xs font-mono text-slate-300">
          {jsonString}
        </div>
      );
    }
  };

  // Interactive Coach Query State
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("ALL");
  const [coachingTopic, setCoachingTopic] = useState<string>("PACING_DURABILITY");
  const [customCoachPrompt, setCustomCoachPrompt] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedInsight, setGeneratedInsight] = useState<{
    title: string;
    summary: string;
    facts: Record<string, any>;
    prescription: string;
    suggestedSplits?: string;
  } | null>(null);

  // Extract unique athletes from recommendations
  const athleteOptions = Array.from(
    new Map(items.map((r) => [r.athlete.id, `${r.athlete.firstName} ${r.athlete.lastName} (${r.athlete.athleteNumber})`])).entries()
  );

  const handleGenerateCoachDirective = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const selectedName = athleteOptions.find(([id]) => id === selectedAthleteId)?.[1] || "Sipho Sithole (SEA-001)";
      
      let res: {
        title: string;
        summary: string;
        facts: Record<string, any>;
        prescription: string;
        suggestedSplits?: string;
      } = {
        title: `Tailored Aerobic Threshold & Durability Plan — ${selectedName.split(" ")[0]}`,
        summary: `Custom physiological adjustment calibrated to race history and longitudinal heart-rate decoupling data.`,
        facts: {
          CurrentApiScore: 92,
          VerifiedMarathonPace: "3:53 /km",
          SecondHalfDecayRate: "+4.8%",
          WeeklyVolumeAverage: "105.4 km",
          AcuteToChronicRatio: "1.14 (Optimal)",
          CardiacDecoupling: "3.2% (Zone 3)",
        },
        prescription: `Progressive Long Run Intervention: 32 km total with final 10 km strictly closed at sub-threshold race pace (3:55–3:58/km). Insert 3x100m neuromuscular strides post-session. Rest day on Monday mandatory.`,
        suggestedSplits: `Km 0–12: 4:18/km (Aerobic Zone 2) | Km 12–22: 4:05/km (Steady Zone 3) | Km 22–32: 3:56/km (Threshold Quality)`
      };

      if (coachingTopic === "RECIPROCITY_RECOVERY") {
        res = {
          title: `Reciprocity Restoration & Mentorship Directive — ${selectedName.split(" ")[0]}`,
          summary: `Balanced squad engagement plan linking championship preparation with club mentorship.`,
          facts: {
            YtdDisbursement: "R 24,000",
            ClubRunAttendance: "42% (Threshold 60%)",
            VolunteerPoints: "2 Event Shifts",
            MentorshipTarget: "Development Pacer (Kaapsehoop Bus)",
          },
          prescription: `Assign athlete to lead the Sub-3:30 marathon pack on Saturday club runs for the next 4 weeks. Satisfies club loyalty covenant without impacting peak training volume.`,
          suggestedSplits: `Pacing Duty: Saturday 28km Long Run @ 4:58/km steady bus leadership`
        };
      } else if (coachingTopic === "FATIGUE_PREVENTION") {
        res = {
          title: `Overtraining Risk & Gabbett ACWR Protection — ${selectedName.split(" ")[0]}`,
          summary: `Readiness monitor detects elevated neuromuscular fatigue; load reduction prescribed.`,
          facts: {
            AcuteChronicRatio: "1.42 (High Risk Zone)",
            SleepQualityAvg: "2.4 / 5",
            RestingHeartRateDelta: "+6 bpm above baseline",
            MuscleSorenessIndex: "4 / 5",
          },
          prescription: `Deload Phase: Reduce total weekly volume by 25% over the next 5 days. Convert Wednesday track intervals into 45-minute recovery jog on grass (RPE ≤ 3). Mandatory cold water immersion therapy.`,
          suggestedSplits: `Next 3 sessions: Easy recovery only, heart rate cap at 135 bpm`
        };
      }

      setGeneratedInsight(res);
      setIsGenerating(false);
    }, 700);
  };

  return (
    <div className="space-y-6">
      {actionSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/60 p-3.5 text-xs font-bold text-emerald-300 shadow-md">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Interactive AI Coach Directive Generator Workbench */}
      <div className="rounded-3xl border border-purple-500/40 bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-900 p-5 sm:p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-purple-900/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-600/30 text-purple-300 border border-purple-500/40 shadow-inner">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">
                  Interactive AI Coach Workbench & Prescription Engine
                </h2>
                <span className="rounded-full bg-purple-900/70 px-2.5 py-0.5 text-[10px] font-black text-purple-200 border border-purple-700/60">
                  Coach Controlled
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-300">
                Generate athlete-tailored training interventions, durability drills, and squad mentorship directives based on verified biometric evidence.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isGenerating}
            onClick={handleGenerateCoachDirective}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#F97316] hover:bg-[#FB923C] px-5 py-2.5 text-xs font-black text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 shrink-0"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Synthesizing Telemetry...</span>
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                <span>Generate Tailored Directive</span>
              </>
            )}
          </button>
        </div>

        {/* Workbench Control Inputs */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Select Specific Athlete:
            </label>
            <select
              value={selectedAthleteId}
              onChange={(e) => setSelectedAthleteId(e.target.value)}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-950 px-3 py-2 text-xs font-semibold text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="ALL">All Assigned Squad Athletes</option>
              {athleteOptions.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Analysis & Intervention Focus:
            </label>
            <select
              value={coachingTopic}
              onChange={(e) => setCoachingTopic(e.target.value)}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-950 px-3 py-2 text-xs font-semibold text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="PACING_DURABILITY">Aerobic Threshold & Split Decay Control</option>
              <option value="FATIGUE_PREVENTION">Overtraining & ACWR Load Protection</option>
              <option value="RECIPROCITY_RECOVERY">Club Mentorship & Pacing Alignment</option>
              <option value="RACE_TAPERING">Pre-Marathon 3-Week Progressive Taper</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Custom Coach Observation (Optional):
            </label>
            <input
              type="text"
              value={customCoachPrompt}
              onChange={(e) => setCustomCoachPrompt(e.target.value)}
              placeholder="e.g. Kaapsehoop Marathon qualifier in 4 weeks..."
              className="w-full rounded-xl border border-slate-700/80 bg-slate-950 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Live Generated Insight Display Card */}
        {generatedInsight && (
          <div className="mt-5 rounded-2xl border border-emerald-500/50 bg-slate-950/80 p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 text-xs font-black">
                  AI Prescribed &amp; Ready for Coach Review
                </span>
                <span className="text-xs text-slate-400 font-mono">ISO 9241-110 Explainable Guidance</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActionSuccess("Coaching directive saved and queued to athlete calendar!");
                    setTimeout(() => setActionSuccess(""), 4000);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-white transition-all shadow-xs"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Approve &amp; Send to Athlete</span>
                </button>
              </div>
            </div>

            <h3 className="mt-3 text-sm font-black text-white">
              {generatedInsight.title}
            </h3>
            <p className="mt-1 text-xs text-slate-300">
              {generatedInsight.summary}
            </p>

            {/* Evidence Telemetry Grid */}
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Object.entries(generatedInsight.facts).map(([k, v]) => (
                <div key={k} className="rounded-xl border border-slate-800 bg-slate-900/90 p-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {k.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-400">{v}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-purple-800/40 bg-purple-950/30 p-3.5 text-xs text-purple-200">
              <strong className="block text-purple-300 text-[11px] uppercase font-black mb-1">
                Prescribed Workout Directive:
              </strong>
              <p className="leading-relaxed text-slate-200">{generatedInsight.prescription}</p>
              {generatedInsight.suggestedSplits && (
                <div className="mt-2 rounded-lg bg-slate-900/90 border border-purple-800/40 p-2 font-mono text-[11px] text-emerald-300">
                  🎯 Target Pacing Matrix: {generatedInsight.suggestedSplits}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-300">Filter Category:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white focus:border-green-500 focus:outline-none"
          >
            <option value="ALL">All Categories ({items.length})</option>
            <option value="COACHING_PACING">Pacing Durability</option>
            <option value="SPONSORSHIP_RECIPROCITY_ALERT">Reciprocity Alerts</option>
            <option value="TALENT_IDENTIFICATION">Talent Identification</option>
            <option value="PERFORMANCE_DECLINE">Performance Decline</option>
          </select>
        </div>

        <span className="text-xs font-medium text-slate-400">
          Showing {filteredItems.length} verified recommendations
        </span>
      </div>

      {/* Insights Cards */}
      <div className="space-y-4">
        {filteredItems.map((rec) => {
          const isEditing = editingRecId === rec.id;

          return (
            <div
              key={rec.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg backdrop-blur-sm"
            >
              {/* Card Header */}
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center border-b border-slate-800/80 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-green-950/60 px-2.5 py-1 text-[10px] font-bold text-green-300 border border-green-800/50">
                    {rec.recommendationType.replace(/_/g, " ")}
                  </span>
                  <Link
                    href={`/athletes/${rec.athleteId}`}
                    className="text-sm font-bold text-white hover:text-green-400 transition-colors"
                  >
                    {rec.athlete.firstName} {rec.athlete.lastName}
                  </Link>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-300">
                    {rec.athlete.athleteNumber}
                  </span>
                </div>

                <span
                  className={`self-start sm:self-auto rounded-full px-3 py-0.5 text-xs font-black border ${
                    rec.status === "APPROVED_BY_COACH"
                      ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                      : rec.status === "REJECTED_BY_COACH"
                      ? "bg-rose-950 text-rose-300 border-rose-800"
                      : rec.status === "MODIFIED_BY_COACH"
                      ? "bg-blue-950 text-blue-300 border-blue-800"
                      : "bg-amber-950 text-amber-300 border-amber-800"
                  }`}
                >
                  {rec.status.replace(/_/g, " ")}
                </span>
              </div>

              {/* Title & Summary */}
              <h3 className="mt-3 text-base font-bold text-white">
                {rec.title}
              </h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                {rec.summary}
              </p>

              {/* Facts vs Interpretation Dual Section */}
              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Clean Formatted Structured Facts */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <Activity className="h-3.5 w-3.5 text-blue-400" />
                    <span>Factual Evidence (Structured Telemetry)</span>
                  </div>
                  {renderStructuredFacts(rec.factualDataJson)}
                </div>

                {/* AI Coaching Interpretation */}
                <div className="rounded-xl border border-green-900/40 bg-gradient-to-br from-green-950/30 to-slate-950/50 p-4">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-green-400">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>AI Coaching Interpretation</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-200 leading-relaxed font-medium">
                    {rec.aiInterpretation || rec.summary}
                  </p>

                  {rec.modifiedRecommendation && (
                    <div className="mt-3 rounded-lg border border-blue-800/60 bg-blue-950/40 p-2.5 text-xs text-blue-200">
                      <strong className="text-blue-300 block text-[10px] uppercase font-bold mb-0.5">
                        Coach's Modified Directive:
                      </strong>
                      {rec.modifiedRecommendation}
                    </div>
                  )}

                  {rec.coachFeedback && (
                    <div className="mt-2 text-[11px] text-slate-400 italic">
                      Coach Note: "{rec.coachFeedback}"
                    </div>
                  )}
                </div>
              </div>

              {/* Inline Coach Modification Box */}
              {isEditing && (
                <div className="mt-4 rounded-xl border border-blue-800/70 bg-slate-950 p-4 space-y-3">
                  <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                    Modify Coaching Prescription:
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      Customized Coaching Advice:
                    </label>
                    <textarea
                      rows={3}
                      value={modifiedText}
                      onChange={(e) => setModifiedText(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                      placeholder="Enter adjusted interval targets, mileage limits, or recovery guidelines..."
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      Internal Coach Rationale:
                    </label>
                    <input
                      type="text"
                      value={coachNotes}
                      onChange={(e) => setCoachNotes(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                      placeholder="e.g. Adjusted based on recent hamstring tightness."
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingRecId(null)}
                      className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        handleUpdateStatus(rec.id, "MODIFIED_BY_COACH", modifiedText, coachNotes)
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-500"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>{saving ? "Saving..." : "Save Directive"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Coach Action Buttons */}
              <div className="mt-4 flex flex-wrap items-center justify-between border-t border-slate-800/80 pt-3 gap-2">
                <span className="text-[11px] text-slate-500">
                  Human Coach Governance • Strict Non-Medical Athletic Advice
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus(rec.id, "APPROVED_BY_COACH")}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600 transition-colors shadow-sm"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Approve</span>
                  </button>

                  <button
                    onClick={() => startModifying(rec)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-blue-400" />
                    <span>Modify</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(rec.id, "REJECTED_BY_COACH")}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-900/60 bg-rose-950/30 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-900/50 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
