"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Trophy,
  Activity,
  HeartHandshake,
  DollarSign,
  Sparkles,
  Flame,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  FileCheck,
  ChevronRight,
  HelpCircle,
  PlusCircle,
  Check,
  X,
  Edit3,
  Shield,
  FileSpreadsheet,
  Heart,
  QrCode,
  Compass,
  Trash2,
  RefreshCw,
  CreditCard,
  KeyRound,
  ExternalLink,
  Eye,
  ChevronDown,
  Upload,
} from "lucide-react";
import { ExplainScoreModal, ScoreExplanationData } from "../shared/ExplainScoreModal";
import { formatDuration, formatPace } from "@/lib/analytics/pace";
import { AthletePerformanceGraph } from "./AthletePerformanceGraph";
import { AthleteLifestyleView } from "./AthleteLifestyleView";
import { saveOfflineEntry } from "@/lib/offline/offlineQueue";
import { DigitalMembershipCardModal } from "./DigitalMembershipCardModal";
import { TelemetryUploadModal } from "../training/TelemetryUploadModal";
import { MedallionBadge } from "../medallions/MedallionBadge";
import { MedallionModal, MedallionData } from "../medallions/MedallionModal";
import { EditAthleteModal } from "./EditAthleteModal";
import { DeleteAthleteModal } from "./DeleteAthleteModal";
import { ChangePasswordModal } from "./ChangePasswordModal";
import { RecordDisbursementModal } from "../sponsorship/RecordDisbursementModal";

interface AthleteProfileClientViewProps {
  athlete: any;
  userRole: string;
  canViewFinancials: boolean;
  apiResult: any;
  ccliResult: any;
  cssResult: any;
  readiness: any;
  pdi: any;
  prediction: any;
  totalSupportZar: number;
}

export function AthleteProfileClientView({
  athlete,
  userRole,
  canViewFinancials,
  apiResult,
  ccliResult,
  cssResult,
  readiness,
  pdi,
  prediction,
  totalSupportZar,
}: AthleteProfileClientViewProps) {
  const [activeTab, setActiveTab] = useState<
    "PERFORMANCE" | "TRAINING" | "CONTRIBUTION" | "SPONSORSHIP" | "READINESS" | "AI_COACHING"
  >("PERFORMANCE");
  const [trackMode, setTrackMode] = useState<"COMPETITIVE" | "LIFESTYLE">(
    athlete.disciplineCategory === "WALKER" ? "LIFESTYLE" : "COMPETITIVE"
  );

  // Modal explanation state
  const [modalData, setModalData] = useState<ScoreExplanationData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Quick Action Form Modals
  const searchParams = useSearchParams();
  const [currentAthlete, setCurrentAthlete] = useState(athlete);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showWellnessModal, setShowWellnessModal] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showTelemetryModal, setShowTelemetryModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDisbursementModal, setShowDisbursementModal] = useState(false);
  const [currentSupportZar, setCurrentSupportZar] = useState(totalSupportZar);
  const [transactionsList, setTransactionsList] = useState(athlete.sponsorships[0]?.transactions || []);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [previewCertificateUrl, setPreviewCertificateUrl] = useState<string | null>(null);
  const [isRenewing, setIsRenewing] = useState(false);
  const [selectedMedallion, setSelectedMedallion] = useState<MedallionData | null>(null);

  useEffect(() => {
    const action = searchParams?.get("action");
    if (action === "gpx") {
      setShowTelemetryModal(true);
    } else if (action === "card") {
      setShowCardModal(true);
    } else if (action === "edit") {
      setShowEditModal(true);
    }
  }, [searchParams]);

  const isArrears =
    currentAthlete.membershipFeeStatus !== "PAID" &&
    currentAthlete.membershipFeeStatus !== "EXEMPT" &&
    currentAthlete.membershipFeeStatus !== "SUBSIDIZED";

  const handleRenewDues = async () => {
    setIsRenewing(true);
    try {
      const res = await fetch("/api/athletes/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ athleteIds: [currentAthlete.id] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to renew membership dues.");
      setCurrentAthlete((prev: any) => ({
        ...prev,
        membershipFeeStatus: "PAID",
        membershipStatus: "ACTIVE",
        membershipExpiry: data.renewalExpiry,
      }));
      setActionSuccessMessage(`Annual dues renewed successfully through 31 Dec ${data.cycleYear}! All submissions unlocked.`);
      setTimeout(() => setActionSuccessMessage(""), 6000);
    } catch (err: any) {
      setActionErrorMessage(err.message || "Failed to renew annual dues.");
      setTimeout(() => setActionErrorMessage(""), 6000);
    } finally {
      setIsRenewing(false);
    }
  };

  // Form states
  const [trainingForm, setTrainingForm] = useState({
    date: new Date().toISOString().split("T")[0],
    distanceKm: 15,
    durationMinutes: 65,
    workoutType: "TEMPO",
    surface: "ROAD",
    sessionRpe: 6,
    athleteNotes: "Steady threshold workout around Zoo Lake.",
  });

  const [resultForm, setResultForm] = useState({
    raceName: "Kaapsehoop Marathon 2026",
    date: "2026-03-07",
    distanceKm: 42.195,
    timeFormatted: "2:44:30",
    bibNumber: "",
    officialResultsUrl: "",
    certificateUrl: "",
    verificationStatus: "VERIFIED",
    notes: "Official qualifying chip result.",
  });
  const [modalCertificateFile, setModalCertificateFile] = useState<File | null>(null);

  const [wellnessForm, setWellnessForm] = useState({
    sleepQuality: 4,
    sleepDurationHours: 8,
    fatigueLevel: 2,
    muscleSoreness: 2,
    stressLevel: 2,
    restingHeartRate: 48,
    notes: "Feeling recovered and hydrated.",
  });

  const [decisionForm, setDecisionForm] = useState({
    recommendedTier: cssResult.recommendation.recommendedTier,
    actualTier: cssResult.recommendation.recommendedTier,
    isOverridden: false,
    overrideReason: "",
    committeeNotes: "Executive review confirming alignment with strategic championship targets.",
  });

  const [aiRecommendations, setAiRecommendations] = useState(athlete.aiRecommendations || []);
  const [actionSuccessMessage, setActionSuccessMessage] = useState("");
  const [actionErrorMessage, setActionErrorMessage] = useState("");

  const coachName = athlete.coachAssignments[0]?.coach?.name || "Unassigned";
  const birthYear = new Date(athlete.dateOfBirth).getFullYear();
  const age = Math.max(0, new Date().getFullYear() - birthYear);
  const tenureYears = ((Date.now() - new Date(athlete.membershipStartDate).getTime()) / (365 * 86400000)).toFixed(1);

  // Handlers for score explanation modals
  const openApiExplanation = () => {
    setModalData({
      title: "Athlete Performance Index (API)",
      scoreType: "PERFORMANCE_INDEX",
      finalScore: apiResult.totalIndex,
      confidencePercent: 92,
      formula: "API = (Verified Perf × 35%) + (Improvement × 30%) + (Target Capability × 20%) + (Reliability × 15%)",
      components: [
        {
          name: "Verified Competition Performance",
          value: apiResult.verifiedPerformanceScore,
          weightPercent: apiResult.weights.verifiedPerformanceWeight * 100,
          weightedResult: apiResult.breakdown.weightedVerified,
          sourceData: "World Athletics normalised scoring of chip-verified race results.",
        },
        {
          name: "Longitudinal Improvement",
          value: apiResult.improvementScore,
          weightPercent: apiResult.weights.improvementWeight * 100,
          weightedResult: apiResult.breakdown.weightedImprovement,
          sourceData: `Trend classification: ${apiResult.trend.trendClassification} (+${apiResult.trend.sixMonthImprovementPercent}%).`,
        },
        {
          name: "Target Race Capability",
          value: apiResult.targetCapabilityScore,
          weightPercent: apiResult.weights.targetCapabilityWeight * 100,
          weightedResult: apiResult.breakdown.weightedTarget,
          sourceData: "Deterministic Riegel prediction probability against season target.",
        },
        {
          name: "Competitive Reliability",
          value: apiResult.reliabilityScore,
          weightPercent: apiResult.weights.reliabilityWeight * 100,
          weightedResult: apiResult.breakdown.weightedReliability,
          sourceData: "Consistency ratio between historical expected and actual race finishes.",
        },
      ],
      narrativeExplanation: apiResult.breakdown.explanation,
      governanceNote: "All component weights are configurable by General Management in System Settings.",
    });
    setIsModalOpen(true);
  };

  const openCssExplanation = () => {
    setModalData({
      title: "Club Sponsorship Score (CSS)",
      scoreType: "SPONSORSHIP_SCORE",
      finalScore: cssResult.totalScore,
      confidencePercent: 88,
      formula: "CSS = (Perf × 25%) + (Imprv × 20%) + (Potential × 15%) + (Reliability × 10%) + (CCLI × 20%) + (Compliance × 10%)",
      components: [
        {
          name: "Verified Competition Performance",
          value: cssResult.componentScores.verifiedPerformanceScore,
          weightPercent: 25,
          weightedResult: cssResult.weightedScores.weightedPerformance,
          sourceData: "Normalised chip results from national/provincial races.",
        },
        {
          name: "Performance Improvement",
          value: cssResult.componentScores.improvementScore,
          weightPercent: 20,
          weightedResult: cssResult.weightedScores.weightedImprovement,
          sourceData: "Rolling 12-month percentage delta.",
        },
        {
          name: "Future Performance / Race Potential",
          value: cssResult.componentScores.futurePotentialScore,
          weightPercent: 15,
          weightedResult: cssResult.weightedScores.weightedPotential,
          sourceData: "Deterministic pacing durability & aerobic threshold potential.",
        },
        {
          name: "Competitive Reliability",
          value: cssResult.componentScores.reliabilityScore,
          weightPercent: 10,
          weightedResult: cssResult.weightedScores.weightedReliability,
          sourceData: "Execution variance in high-priority competitions.",
        },
        {
          name: "Club Contribution & Loyalty (CCLI)",
          value: cssResult.componentScores.clubContributionScore,
          weightPercent: 20,
          weightedResult: cssResult.weightedScores.weightedContribution,
          sourceData: "Internal runs, volunteering, representation, mentoring.",
        },
        {
          name: "Administrative & Sponsorship Compliance",
          value: cssResult.componentScores.complianceScore,
          weightPercent: 10,
          weightedResult: cssResult.weightedScores.weightedCompliance,
          sourceData: "Fulfilment of agreed sponsorship covenants and appearances.",
        },
      ],
      narrativeExplanation: cssResult.explanation,
      governanceNote: "AI assists recommendations; final sponsorship decisions belong to Human Management.",
    });
    setIsModalOpen(true);
  };

  const openCcliExplanation = () => {
    setModalData({
      title: "Club Contribution & Loyalty Index (CCLI)",
      scoreType: "CLUB_CONTRIBUTION",
      finalScore: ccliResult.totalScore,
      confidencePercent: 95,
      formula: "CCLI = (Runs × 30%) + (Vol × 20%) + (Rep × 15%) + (Ment × 10%) + (Meet × 10%) + (Obl × 10%) + (Tenure × 5%)",
      components: [
        {
          name: "Internal Club Run Participation",
          value: `${ccliResult.attendanceRatePercent}%`,
          weightPercent: 30,
          weightedResult: ccliResult.weightedScores.weightedInternalRuns,
          sourceData: ccliResult.exemptionAdjustment.hasApprovedExemption
            ? `Exemption applied: Denominator adjusted from ${ccliResult.exemptionAdjustment.originalExpectedSessions} to ${ccliResult.exemptionAdjustment.adjustedExpectedSessions} sessions.`
            : "Actual attendance at scheduled club runs & time trials.",
        },
        {
          name: "Club Service & Volunteering",
          value: ccliResult.scores.volunteeringScore,
          weightPercent: 20,
          weightedResult: ccliResult.weightedScores.weightedVolunteering,
          sourceData: "Marshalling, water points, race administration.",
        },
        {
          name: "Club Representation",
          value: ccliResult.scores.representationScore,
          weightPercent: 15,
          weightedResult: ccliResult.weightedScores.weightedRepresentation,
          sourceData: "Representing Super Eagles AC in designated provincial/national events.",
        },
        {
          name: "Mentoring & Pacing",
          value: ccliResult.scores.mentoringScore,
          weightPercent: 10,
          weightedResult: ccliResult.weightedScores.weightedMentoring,
          sourceData: "Mentoring development athletes and leading training pace groups.",
        },
        {
          name: "Club Meetings & Functions",
          value: ccliResult.scores.meetingsScore,
          weightPercent: 10,
          weightedResult: ccliResult.weightedScores.weightedMeetings,
          sourceData: "Attendance at AGMs, strategy sessions, and awards.",
        },
        {
          name: "Continuous Active Membership Tenure",
          value: ccliResult.scores.tenureScore,
          weightPercent: 5,
          weightedResult: ccliResult.weightedScores.weightedTenure,
          sourceData: `Tenure (${tenureYears} yrs). Weighted low to distinguish tenure from active loyalty.`,
        },
      ],
      narrativeExplanation: ccliResult.explanation,
    });
    setIsModalOpen(true);
  };

  // Quick Action Submission handlers
  const handleLogTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const paceSeconds = Math.round((trainingForm.durationMinutes * 60) / trainingForm.distanceKm);
      const res = await fetch("/api/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          athleteId: athlete.id,
          date: trainingForm.date,
          activityType: "RUN",
          distanceKm: Number(trainingForm.distanceKm),
          durationSeconds: trainingForm.durationMinutes * 60,
          averagePaceSeconds: paceSeconds,
          workoutType: trainingForm.workoutType,
          surface: trainingForm.surface,
          sessionRpe: Number(trainingForm.sessionRpe),
          athleteNotes: trainingForm.athleteNotes,
        }),
      });

      if (res.ok) {
        setShowTrainingModal(false);
        setActionSuccessMessage("Training workout recorded successfully! Paces and workload recalculated.");
        setTimeout(() => setActionSuccessMessage(""), 5000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecordResult = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalCertUrl = resultForm.certificateUrl;
      if (modalCertificateFile) {
        const certData = new FormData();
        certData.append("certificate", modalCertificateFile);
        const upRes = await fetch("/api/races/upload-certificate", {
          method: "POST",
          body: certData,
        });
        const upJson = await upRes.json();
        if (upRes.ok && upJson.fileUrl) {
          finalCertUrl = upJson.fileUrl;
        }
      }

      const parts = resultForm.timeFormatted.split(":");
      const secs =
        parts.length === 3
          ? parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2])
          : 10800;

      const res = await fetch("/api/races/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          athleteId: athlete.id,
          raceName: resultForm.raceName,
          date: resultForm.date,
          distanceKm: Number(resultForm.distanceKm),
          officialTimeSeconds: secs,
          verificationStatus: resultForm.verificationStatus,
          bibNumber: resultForm.bibNumber.trim() || undefined,
          certificateUrl: finalCertUrl || undefined,
          officialResultsUrl: resultForm.officialResultsUrl.trim() || undefined,
          notes: resultForm.notes,
        }),
      });

      if (res.ok) {
        setShowResultModal(false);
        setActionSuccessMessage("Official competition result with verification evidence captured in database. Refreshing view...");
        setTimeout(() => window.location.reload(), 1200);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecordDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/sponsorship/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          athleteId: athlete.id,
          sponsorshipId: athlete.sponsorships[0]?.id,
          recommendedTier: decisionForm.recommendedTier,
          actualTier: decisionForm.actualTier,
          isOverridden: decisionForm.isOverridden,
          overrideReason: decisionForm.isOverridden ? decisionForm.overrideReason : null,
          committeeNotes: decisionForm.committeeNotes,
        }),
      });

      if (res.ok) {
        setShowDecisionModal(false);
        setActionSuccessMessage("Official management sponsorship decision recorded in audit log.");
        setTimeout(() => setActionSuccessMessage(""), 5000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleWellnessCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionErrorMessage("");
    const payload = {
      athleteId: athlete.id,
      date: new Date().toISOString(),
      ...wellnessForm,
    };

    try {
      const res = await fetch("/api/wellness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionErrorMessage(data.error || "Wellness check-in could not be saved.");
        return;
      }

      setShowWellnessModal(false);
      setActionSuccessMessage("Wellness check-in recorded successfully. Readiness data will refresh on reload.");
      setTimeout(() => setActionSuccessMessage(""), 5000);
    } catch {
      saveOfflineEntry("WELLNESS", payload, `${athlete.firstName} ${athlete.lastName}`);
      setShowWellnessModal(false);
      setActionSuccessMessage("Server unavailable. Wellness check-in is stored safely and queued for sync.");
      setTimeout(() => setActionSuccessMessage(""), 5000);
    }
  };

  const handleUpdateAIRecommendation = async (recId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/ai/recommendations/${recId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setAiRecommendations((prev: any[]) =>
          prev.map((r) => (r.id === recId ? { ...r, status: newStatus } : r))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {actionSuccessMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}
      {actionErrorMessage && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-800 bg-rose-950/60 p-4 text-xs font-bold text-rose-200">
          <AlertTriangle className="h-4 w-4" />
          <span>{actionErrorMessage}</span>
        </div>
      )}

      {/* ARREARS WARNING BANNER */}
      {isArrears && (
        <div className="rounded-2xl border border-rose-600/80 bg-gradient-to-r from-rose-950/90 via-slate-900 to-rose-950/80 p-5 text-white shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="rounded-xl bg-rose-500/20 p-2.5 text-rose-400 shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-rose-200">
                    Annual Membership Dues in Arrears
                  </h2>
                  <span className="rounded-md bg-rose-500/30 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-300">
                    {currentAthlete.membershipFeeStatus}
                  </span>
                </div>
                <p className="mt-1 text-xs text-rose-300/90">
                  Annual club dues are pending for this cycle. Under Super Eagles governance, members in payment arrears are locked from submitting workout sessions, wellness logs, and official race results.
                </p>
                {currentAthlete.membershipExpiry && (
                  <p className="mt-1 text-[11px] text-slate-400">
                    Last cycle expired on: <span className="font-semibold text-slate-300">{new Date(currentAthlete.membershipExpiry).toLocaleDateString()}</span>
                  </p>
                )}
              </div>
            </div>

            {(userRole === "SUPER_ADMIN" || userRole === "CLUB_ADMIN") && (
              <button
                onClick={handleRenewDues}
                disabled={isRenewing}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg transition-all disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isRenewing ? "animate-spin" : ""}`} />
                <span>{isRenewing ? "Renewing..." : "Process Annual Renewal"}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 360° Athlete Profile Header Card */}
      <div className="rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Athlete Bio & Core Details */}
          <div className="flex items-start gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-2xl font-black text-white shadow-md">
              {currentAthlete.firstName[0]}
              {currentAthlete.lastName[0]}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-white">
                  {currentAthlete.firstName} {currentAthlete.lastName}
                </h1>
                <span className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-0.5 font-mono text-xs font-bold text-slate-200">
                  {currentAthlete.athleteNumber}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    currentAthlete.athleteStatus === "ELITE"
                      ? "bg-purple-950/80 border border-purple-800/80 text-purple-300"
                      : currentAthlete.athleteStatus === "PERFORMANCE"
                      ? "bg-blue-950/80 border border-blue-800/80 text-blue-300"
                      : "bg-teal-950/80 border border-teal-800/80 text-teal-300"
                  }`}
                >
                  {currentAthlete.athleteStatus} SQUAD
                </span>
                {currentAthlete.medallions && currentAthlete.medallions.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pl-2 border-l border-slate-700">
                    {currentAthlete.medallions.map((m: any) => (
                      <MedallionBadge
                        key={m.id}
                        variant={m.badgeVariant}
                        awardType={m.awardType}
                        trackCategory={m.trackCategory}
                        size="sm"
                        showLabel={true}
                        onClick={() => setSelectedMedallion({ ...m, athlete: currentAthlete })}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                <div>Discipline: <span className="font-semibold text-white">{currentAthlete.primaryDiscipline.replace("_", " ")}</span></div>
                <div>Age: <span className="font-semibold text-white">{age} yrs ({currentAthlete.gender})</span></div>
                <div>Coach: <span className="font-semibold text-white">{coachName}</span></div>
                <div>Club Tenure: <span className="font-semibold text-white">{tenureYears} yrs</span></div>
                {currentAthlete.asaLicenseNumber && (
                  <div>ASA License: <span className="font-mono font-bold text-orange-400">{currentAthlete.asaLicenseNumber}</span></div>
                )}
                <div>
                  Fee Status:{" "}
                  <span
                    className={`font-bold ${
                      currentAthlete.membershipFeeStatus === "PAID"
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {currentAthlete.membershipFeeStatus}
                  </span>
                </div>
              </div>

              {/* Dual Track Switcher: Competitive Athlete vs Health & Lifestyle */}
              <div className="mt-3 flex items-center gap-1.5 rounded-2xl border border-slate-700/80 bg-slate-900/90 p-1 w-fit">
                <button
                  type="button"
                  onClick={() => setTrackMode("COMPETITIVE")}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition-all ${
                    trackMode === "COMPETITIVE"
                      ? "bg-[#F97316] text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Trophy className="h-3.5 w-3.5" />
                  <span>Competitive Track</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTrackMode("LIFESTYLE")}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition-all ${
                    trackMode === "LIFESTYLE"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Heart className="h-3.5 w-3.5 text-rose-400" />
                  <span>Health & Lifestyle Track</span>
                </button>
              </div>

              {/* Streamlined Modern Action Bar (De-cluttered) */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {/* Primary Action 1: Log Workout */}
                <button
                  onClick={() => setShowTrainingModal(true)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black text-white shadow-md transition-all hover:-translate-y-0.5 ${
                    isArrears ? "bg-slate-700 opacity-60 cursor-not-allowed" : "bg-[#F97316] hover:bg-[#FB923C]"
                  }`}
                  title={isArrears ? "Locked: Membership in arrears" : "Log Workout Session"}
                >
                  <Flame className="h-4 w-4" />
                  <span>Log Workout</span>
                </button>

                {/* Primary Action 2: Capture Official Result */}
                <button
                  onClick={() => setShowResultModal(true)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-all hover:-translate-y-0.5 ${
                    isArrears
                      ? "border-slate-800 bg-slate-800/60 opacity-60 cursor-not-allowed"
                      : "border-slate-700 bg-slate-800/90 hover:bg-slate-700"
                  }`}
                  title={isArrears ? "Locked: Membership in arrears" : "Capture Official Competition Result"}
                >
                  <Trophy className="h-3.5 w-3.5 text-orange-400" />
                  <span>Capture Result</span>
                </button>

                {/* Primary Action 3: Digital Club Card */}
                <button
                  onClick={() => setShowCardModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-950/30 px-3 py-2 text-xs font-bold text-amber-300 shadow-xs hover:bg-amber-900/40 transition-all hover:-translate-y-0.5"
                >
                  <QrCode className="h-3.5 w-3.5 text-amber-400" />
                  <span>Digital Pass</span>
                </button>

                {/* Primary Action 4: Wellness Check-In */}
                <button
                  onClick={() => setShowWellnessModal(true)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:-translate-y-0.5 ${
                    isArrears
                      ? "border-slate-800 bg-slate-800/60 opacity-60 cursor-not-allowed"
                      : "border-slate-700/80 bg-slate-900/80 hover:bg-slate-800"
                  }`}
                  title={isArrears ? "Locked: Membership in arrears" : "Log Daily Wellness"}
                >
                  <Activity className="h-3.5 w-3.5 text-blue-400" />
                  <span>Wellness</span>
                </button>

                {/* Overflow "More Actions" Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowMoreActions(!showMoreActions)}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs font-bold text-slate-300 shadow-xs hover:bg-slate-700 hover:text-white transition-all"
                  >
                    <span>More Actions</span>
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showMoreActions ? "rotate-180" : ""}`} />
                  </button>

                  {showMoreActions && (
                    <div className="absolute left-0 mt-2 z-40 w-56 rounded-2xl border border-slate-700 bg-[#0F172A] p-2 shadow-2xl backdrop-blur-xl divide-y divide-slate-800 animate-in fade-in zoom-in-95 duration-150">
                      <div className="py-1">
                        {(userRole === "SUPER_ADMIN" || userRole === "CLUB_ADMIN" || userRole === "COACH" || (userRole === "ATHLETE" && currentAthlete.id === athlete.id)) && (
                          <button
                            onClick={() => { setShowEditModal(true); setShowMoreActions(false); }}
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                          >
                            <Edit3 className="h-3.5 w-3.5 text-orange-400" />
                            <span>Edit Member Profile</span>
                          </button>
                        )}

                        {(userRole === "SUPER_ADMIN" || (userRole === "ATHLETE" && currentAthlete.id === athlete.id)) && (
                          <button
                            onClick={() => { setShowPasswordModal(true); setShowMoreActions(false); }}
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                          >
                            <KeyRound className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Change Password</span>
                          </button>
                        )}

                        <Link
                          href="/payments"
                          onClick={() => setShowMoreActions(false)}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                        >
                          <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Payments & Dues</span>
                        </Link>

                        <button
                          onClick={() => { setShowTelemetryModal(true); setShowMoreActions(false); }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                        >
                          <Compass className="h-3.5 w-3.5 text-orange-400" />
                          <span>Sync Watch (.GPX)</span>
                        </button>
                      </div>

                      {(userRole === "SUPER_ADMIN" || userRole === "SPONSORSHIP_COMMITTEE" || userRole === "CLUB_ADMIN") && (
                        <div className="py-1">
                          {(userRole === "SUPER_ADMIN" || userRole === "SPONSORSHIP_COMMITTEE") && (
                            <button
                              onClick={() => { setShowDecisionModal(true); setShowMoreActions(false); }}
                              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-950/40 transition-colors"
                            >
                              <DollarSign className="h-3.5 w-3.5 text-amber-400" />
                              <span>Sponsorship Decision</span>
                            </button>
                          )}

                          <button
                            onClick={() => { setShowDeleteModal(true); setShowMoreActions(false); }}
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-950/40 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                            <span>Archive / Delete Member</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* THREE SEPARATE CORE INDICES (NEVER COMBINED) */}
          <div className="grid grid-cols-3 gap-3 rounded-2xl border border-slate-700/80 bg-slate-900/80 p-3 sm:gap-4">
            {/* Score 1: Athlete Performance Index */}
            <div className="flex flex-col justify-between rounded-xl border border-slate-700/80 bg-[#1E293B]/90 p-3 shadow-md backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  Perf Index (API)
                </span>
                <button
                  onClick={openApiExplanation}
                  className="text-slate-400 hover:text-orange-400"
                  title="How was this calculated?"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-1">
                <div className="text-2xl font-black text-emerald-400">
                  {apiResult.totalIndex}
                </div>
                <div className="text-[10px] font-semibold text-slate-300">
                  {apiResult.trend.trendClassification}
                </div>
              </div>
            </div>

            {/* Score 2: Club Sponsorship Score */}
            <div className="flex flex-col justify-between rounded-xl border border-slate-700/80 bg-[#1E293B]/90 p-3 shadow-md backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  Sponsorship Score
                </span>
                <button
                  onClick={openCssExplanation}
                  className="text-slate-400 hover:text-orange-400"
                  title="How was this calculated?"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-1">
                <div className="text-2xl font-black text-purple-400">
                  {cssResult.totalScore}
                </div>
                <div className="truncate text-[10px] font-semibold text-purple-300">
                  {cssResult.recommendation.tierLabel}
                </div>
              </div>
            </div>

            {/* Score 3: Athlete Readiness Score (Coaching Only) */}
            <div className="flex flex-col justify-between rounded-xl border border-slate-700/80 bg-[#1E293B]/90 p-3 shadow-md backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  Coaching Readiness
                </span>
                <span className="text-[10px] text-slate-400">Non-Medical</span>
              </div>
              <div className="mt-1">
                <div
                  className={`inline-block rounded-md px-2 py-0.5 text-xs font-black ${readiness.badgeColor}`}
                >
                  {readiness.label}
                </div>
                <div className="mt-0.5 text-[10px] text-slate-300">
                  ACWR: {readiness.acwrStatus}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* POPIA Non-Medical Sports Disclaimer */}
        <div className="mt-4 border-t border-slate-700/80 pt-3 text-[10px] text-slate-400">
          <span className="font-semibold text-slate-300">Governance & Medical Disclaimer: </span>
          {readiness.disclaimer} Fatigue, sleep, or HRV indicators are utilized exclusively for training guidance and never reduce the Sponsorship Score.
        </div>
      </div>

      {trackMode === "LIFESTYLE" ? (
        <AthleteLifestyleView
          athlete={athlete}
          clubAttendances={athlete.clubAttendances || []}
          volunteerContributions={athlete.volunteerContributions || []}
          userRole={userRole}
        />
      ) : (
        <>
          {/* Target Race & PDI Performance Prediction Bar */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Target Race Goal */}
        <div className="rounded-xl border border-slate-700/80 bg-[#1E293B]/85 p-4 shadow-md backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Target Championship</span>
            <Trophy className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-sm font-black text-white">
            {athlete.goals[0]?.targetRaceName || "Target Goal TBD"}
          </div>
          <div className="text-xs text-slate-300">
            Goal: <b className="text-white">{athlete.goals[0] ? formatDuration(athlete.goals[0].targetTimeSeconds) : "--:--"}</b>
          </div>
        </div>

        {/* Card 2: Deterministic Prediction Engine */}
        <div className="rounded-xl border border-slate-700/80 bg-[#1E293B]/85 p-4 shadow-md backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Deterministic Prediction</span>
            <Sparkles className="h-4 w-4 text-orange-400" />
          </div>
          <div className="mt-2 text-sm font-black text-emerald-400">
            {prediction.predictedRangeSeconds.minFormatted} – {prediction.predictedRangeSeconds.maxFormatted}
          </div>
          <div className="text-xs text-slate-300">
            Central: <b className="text-white">{prediction.centralEstimateFormatted}</b> ({prediction.confidencePercent}% confidence)
          </div>
        </div>

        {/* Card 3: Target Probability */}
        <div className="rounded-xl border border-slate-700/80 bg-[#1E293B]/85 p-4 shadow-md backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Target Probability</span>
            <TrendingUp className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 text-sm font-black text-blue-400">
            {prediction.probabilityOfTargetPercent !== undefined
              ? `${prediction.probabilityOfTargetPercent}% Chance`
              : "Calibrating..."}
          </div>
          <div className="text-xs text-slate-300">
            Based on durability & training consistency
          </div>
        </div>

        {/* Card 4: Pace Durability Index */}
        <div className="rounded-xl border border-slate-700/80 bg-[#1E293B]/85 p-4 shadow-md backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Pace Durability</span>
            <Activity className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2">
            <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${pdi.color}`}>
              {pdi.label}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-300">
            Split delta: {pdi.deteriorationPercent > 0 ? `+${pdi.deteriorationPercent}%` : `${pdi.deteriorationPercent}%`}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-700 pb-px">
        {[
          { id: "PERFORMANCE", label: "Official Results & PBs", icon: Trophy },
          { id: "TRAINING", label: "Training Log & Splits", icon: Flame },
          { id: "CONTRIBUTION", label: "Club Contribution & Loyalty", icon: HeartHandshake },
          { id: "SPONSORSHIP", label: "Sponsorship & Reciprocity", icon: DollarSign },
          { id: "READINESS", label: "Readiness & Wellness", icon: Activity },
          { id: "AI_COACHING", label: "AI Insights & Recommendations", icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition-colors ${
                isActive
                  ? "border-[#F97316] text-[#F97316]"
                  : "border-transparent text-slate-400 hover:border-slate-600 hover:text-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: PERFORMANCE & OFFICIAL RESULTS */}
      {activeTab === "PERFORMANCE" && (
        <div className="space-y-4">
          <AthletePerformanceGraph
            raceResults={athlete.raceResults || []}
            athleteName={`${athlete.firstName} ${athlete.lastName}`}
          />

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">
              Official Competition Results History ({athlete.raceResults.length})
            </h3>
            <button
              onClick={() => setShowResultModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#F97316] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#FB923C] transition-all hover:-translate-y-0.5"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Add Result</span>
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 shadow-xl backdrop-blur-md">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-700 bg-[#0F172A] text-[11px] font-bold uppercase tracking-wider text-white">
                <tr>
                  <th className="px-4 py-3 text-white font-bold">Race Name</th>
                  <th className="px-4 py-3 text-white font-bold">Date</th>
                  <th className="px-4 py-3 text-white font-bold">Distance</th>
                  <th className="px-4 py-3 text-white font-bold">Official Time</th>
                  <th className="px-4 py-3 text-white font-bold">Average Pace</th>
                  <th className="px-4 py-3 text-white font-bold">PDI Split Pace</th>
                  <th className="px-4 py-3 text-white font-bold">Evidence</th>
                  <th className="px-4 py-3 text-white font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {athlete.raceResults.map((r: any) => {
                  const avgPace = Math.round(r.officialTimeSeconds / r.distanceKm);
                  return (
                    <tr key={r.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-white">
                        {r.raceName}
                        {r.bibNumber && (
                          <span className="ml-2 text-[10px] font-mono text-slate-400">
                            (Bib #{r.bibNumber})
                          </span>
                        )}
                        {r.isPersonalBest && (
                          <span className="ml-2 rounded-md border border-amber-700/80 bg-amber-950/80 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
                            PB
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {new Date(r.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-white">{r.distanceKm} km</td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                        {formatDuration(r.officialTimeSeconds)}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{formatPace(avgPace)}</td>
                      <td className="px-4 py-3 text-slate-300">
                        {r.firstHalfPaceSeconds && r.secondHalfPaceSeconds ? (
                          <span>
                            {formatPace(r.firstHalfPaceSeconds)} / {formatPace(r.secondHalfPaceSeconds)}
                          </span>
                        ) : (
                          <span className="text-slate-400">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {r.certificateUrl ? (
                            <button
                              type="button"
                              onClick={() => setPreviewCertificateUrl(r.certificateUrl)}
                              className="inline-flex items-center gap-1 rounded-md bg-emerald-950/80 border border-emerald-700 px-2 py-0.5 text-[10px] font-bold text-emerald-300 hover:bg-emerald-900/80 transition-colors"
                              title="View uploaded timing certificate"
                            >
                              <FileCheck className="h-3 w-3 text-emerald-400" />
                              <span>Certificate</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">Self-logged</span>
                          )}
                          {r.officialResultsUrl && (
                            <a
                              href={r.officialResultsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sky-400 hover:text-sky-300 p-0.5"
                              title="Open official race results link"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            r.verificationStatus === "VERIFIED"
                              ? "bg-emerald-950/80 border border-emerald-800 text-emerald-300"
                              : "bg-slate-800 border border-slate-700 text-slate-300"
                          }`}
                        >
                          {r.verificationStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: TRAINING ACTIVITIES */}
      {activeTab === "TRAINING" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">
              Recent Training Activities & Long Runs ({athlete.trainingActivities.length})
            </h3>
            <div className="flex items-center gap-2">
              <span className="rounded-lg border border-slate-700 bg-slate-800/90 px-2.5 py-1 text-[11px] text-slate-300">
                Garmin / Strava: <i className="text-amber-400 font-medium">Integration not configured (Manual & CSV active)</i>
              </span>
              <button
                onClick={() => setShowTrainingModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#F97316] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#FB923C] transition-all hover:-translate-y-0.5"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Log Session</span>
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 shadow-xl backdrop-blur-md">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-700 bg-[#0F172A] text-[11px] font-bold uppercase tracking-wider text-white">
                <tr>
                  <th className="px-4 py-3 text-white font-bold">Date</th>
                  <th className="px-4 py-3 text-white font-bold">Workout Type</th>
                  <th className="px-4 py-3 text-white font-bold">Distance</th>
                  <th className="px-4 py-3 text-white font-bold">Duration</th>
                  <th className="px-4 py-3 text-white font-bold">Avg Pace</th>
                  <th className="px-4 py-3 text-white font-bold">Elevation</th>
                  <th className="px-4 py-3 text-white font-bold">RPE</th>
                  <th className="px-4 py-3 text-white font-bold">Splits / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {athlete.trainingActivities.map((act: any) => (
                  <tr key={act.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 text-slate-300">
                      {new Date(act.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {act.workoutType}
                      {act.isLongRun && (
                        <span className="ml-1.5 rounded bg-blue-950/80 border border-blue-800 px-1.5 py-0.5 text-[9px] font-bold text-blue-300">
                          LONG RUN
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-white">{act.distanceKm} km</td>
                    <td className="px-4 py-3 text-slate-200">{formatDuration(act.durationSeconds)}</td>
                    <td className="px-4 py-3 font-mono text-emerald-400">{formatPace(act.averagePaceSeconds)}</td>
                    <td className="px-4 py-3 text-slate-300">+{act.elevationGain}m</td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-200">
                        {act.sessionRpe ? `${act.sessionRpe}/10` : "--/10"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {act.splits.length > 0 ? (
                        <span className="text-[11px] text-orange-400 font-semibold">
                          {act.splits.length} splits recorded
                        </span>
                      ) : (
                        act.athleteNotes || "Standard workout"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: CLUB CONTRIBUTION & LOYALTY */}
      {activeTab === "CONTRIBUTION" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">
                Club Reciprocity, Volunteering & Exemption Log
              </h3>
              <p className="text-xs text-slate-300">
                Active loyalty evaluated separately from raw membership tenure.
              </p>
            </div>
            <button
              onClick={openCcliExplanation}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <HelpCircle className="h-3.5 w-3.5 text-orange-400" />
              <span>How CCLI was Calculated</span>
            </button>
          </div>

          {/* Exemption Banner if active */}
          {ccliResult.exemptionAdjustment.hasApprovedExemption && (
            <div className="rounded-xl border border-blue-800/80 bg-blue-950/40 p-4 text-xs text-blue-200">
              <div className="flex items-center gap-2 font-bold text-white">
                <CheckCircle2 className="h-4 w-4 text-blue-400" />
                Approved Participation Exemption Active ({ccliResult.exemptionAdjustment.exemptionReason})
              </div>
              <p className="mt-1 text-slate-300">
                The expected attendance denominator has been reduced from {ccliResult.exemptionAdjustment.originalExpectedSessions} to {ccliResult.exemptionAdjustment.adjustedExpectedSessions} sessions, ensuring fair reciprocity scoring.
              </p>
            </div>
          )}

          {/* Volunteering List */}
          <div className="rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 p-5 shadow-xl backdrop-blur-md">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Volunteer Service Records ({athlete.volunteerContributions.length})
            </h4>
            <div className="mt-3 divide-y divide-slate-800">
              {athlete.volunteerContributions.map((v: any) => (
                <div key={v.id} className="flex items-center justify-between py-2.5 text-xs">
                  <div>
                    <div className="font-bold text-white">{v.clubActivity.title}</div>
                    <div className="text-[11px] text-slate-300">Role: {v.roleName} • {v.hoursServed} hours served</div>
                  </div>
                  <span className="rounded bg-teal-950/80 border border-teal-800 px-2 py-0.5 font-bold text-teal-300">
                    +{v.pointsAwarded} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: SPONSORSHIP & RECIPROCITY */}
      {activeTab === "SPONSORSHIP" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white">
                Sponsorship Support Register &amp; Reciprocity Review
              </h3>
              <p className="text-xs text-slate-300">
                Total Support Invested YTD: <b className="text-emerald-400 font-mono font-bold">R{currentSupportZar.toLocaleString()}</b>
              </p>
            </div>

            {(userRole === "SUPER_ADMIN" || userRole === "SPONSORSHIP_COMMITTEE") && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDisbursementModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-0.5"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Record Disbursement</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDecisionModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-1.5 text-xs font-bold text-amber-300 shadow-sm transition-all hover:-translate-y-0.5"
                >
                  <DollarSign className="h-3.5 w-3.5 text-amber-400" />
                  <span>Record Decision / Override</span>
                </button>
              </div>
            )}
          </div>

          {/* Conditional Covenants Tracker */}
          {athlete.sponsorships[0]?.conditions && athlete.sponsorships[0].conditions.length > 0 && (
            <div className="rounded-2xl border border-amber-800/80 bg-amber-950/40 p-5 shadow-xl">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Active Conditional Sponsorship Covenants
              </h4>
              <div className="mt-3 space-y-2">
                {athlete.sponsorships[0].conditions.map((cond: any) => (
                  <div
                    key={cond.id}
                    className="flex items-center justify-between rounded-xl border border-amber-700/60 bg-slate-900/90 p-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{cond.conditionText}</div>
                      <div className="text-[11px] text-slate-300">
                        Deadline: {new Date(cond.deadline).toLocaleDateString()} • Target: {cond.targetValue} (Current: {cond.currentValue})
                      </div>
                    </div>
                    <span className="rounded bg-amber-950/80 border border-amber-700 px-2 py-0.5 font-bold text-amber-300">
                      {cond.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transactions Ledger */}
          <div className="overflow-hidden rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 shadow-xl backdrop-blur-md">
            <div className="border-b border-slate-700/80 bg-slate-900/80 px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Disbursements &amp; Financial Assistance Ledger ({transactionsList.length} Entries)
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                Total: R{currentSupportZar.toLocaleString()}
              </span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-700 bg-[#0F172A] text-[11px] font-bold uppercase tracking-wider text-white">
                <tr>
                  <th className="px-4 py-3 text-white font-bold">Date</th>
                  <th className="px-4 py-3 text-white font-bold">Support Type</th>
                  <th className="px-4 py-3 text-white font-bold">Monetary Amount</th>
                  <th className="px-4 py-3 text-white font-bold">Funding Source</th>
                  <th className="px-4 py-3 text-white font-bold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {transactionsList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No financial disbursements recorded yet for this season.
                    </td>
                  </tr>
                ) : (
                  transactionsList.map((t: any) => (
                    <tr key={t.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 text-slate-300 font-mono">
                        {new Date(t.transactionDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block rounded-md bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-200">
                          {t.supportType.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-400 text-sm">
                        R{t.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{t.fundingSource}</td>
                      <td className="px-4 py-3 text-slate-400 max-w-xs truncate">{t.notes || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: READINESS & WELLNESS */}
      {activeTab === "READINESS" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">
                Non-Invasive Athlete Readiness Indicators
              </h3>
              <p className="text-xs text-slate-300">
                Subjective wellness & workload ratio monitoring for coaches.
              </p>
            </div>
            <button
              onClick={() => setShowWellnessModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#F97316] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#FB923C] transition-all hover:-translate-y-0.5"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Log Self-Report Check-In</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 p-4 shadow-xl backdrop-blur-md">
              <span className="text-xs font-bold text-slate-300">Sleep & Rest</span>
              <div className="mt-2 text-sm font-bold text-white">
                {readiness.factors.sleepStatus}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 p-4 shadow-xl backdrop-blur-md">
              <span className="text-xs font-bold text-slate-300">Muscular Fatigue & Soreness</span>
              <div className="mt-2 text-sm font-bold text-white">
                {readiness.factors.fatigueSorenessStatus}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 p-4 shadow-xl backdrop-blur-md">
              <span className="text-xs font-bold text-slate-300">Workload Progression (ACWR)</span>
              <div className="mt-2 text-sm font-bold text-white">
                {readiness.factors.workloadStatus}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 6: AI PERFORMANCE & COACHING */}
      {activeTab === "AI_COACHING" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">
                AI Performance Analysis & Coaching Assistant
              </h3>
              <p className="text-xs text-slate-300">
                Audited intelligence separating factual data from interpretative guidance.
              </p>
            </div>
            <span className="rounded-lg bg-emerald-950/80 border border-emerald-800 px-2.5 py-1 text-xs font-bold text-emerald-300">
              State: Proposed → Coach Governed → Completed
            </span>
          </div>

          {/* AI Recommendations List */}
          <div className="space-y-4">
            {aiRecommendations.map((rec: any) => (
              <div
                key={rec.id}
                className="rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 p-5 shadow-xl backdrop-blur-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="rounded bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
                      {rec.recommendationType.replace(/_/g, " ")}
                    </span>
                    <h4 className="mt-1.5 text-sm font-bold text-white">
                      {rec.title}
                    </h4>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      rec.status === "APPROVED_BY_COACH"
                        ? "bg-emerald-950/80 border border-emerald-800 text-emerald-300"
                        : rec.status === "REJECTED_BY_COACH"
                        ? "bg-rose-950/80 border border-rose-800 text-rose-300"
                        : "bg-amber-950/80 border border-amber-700 text-amber-300"
                    }`}
                  >
                    {rec.status.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-3 text-xs">
                    <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                      FACTS FROM DATA
                    </span>
                    <pre className="mt-1 font-mono text-[11px] text-slate-200 whitespace-pre-wrap">
                      {rec.factualDataJson}
                    </pre>
                  </div>

                  <div className="rounded-xl border border-emerald-800/80 bg-emerald-950/40 p-3 text-xs">
                    <span className="font-bold uppercase tracking-wider text-emerald-300 text-[10px]">
                      AI INTERPRETATION
                    </span>
                    <p className="mt-1 text-slate-200">
                      {rec.aiInterpretation || rec.summary}
                    </p>
                  </div>
                </div>

                {/* Coach Decision Action Buttons */}
                <div className="mt-4 flex flex-wrap items-center justify-between border-t border-slate-700/80 pt-3">
                  <span className="text-[11px] text-slate-400">
                    Human Coach Decision Gate: Coach Hendrik Botha
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateAIRecommendation(rec.id, "APPROVED_BY_COACH")}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
                    >
                      <Check className="h-3 w-3" />
                      <span>Approve</span>
                    </button>

                    <button
                      onClick={() => handleUpdateAIRecommendation(rec.id, "MODIFIED_BY_COACH")}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Modify</span>
                    </button>

                    <button
                      onClick={() => handleUpdateAIRecommendation(rec.id, "REJECTED_BY_COACH")}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-800 bg-rose-950/80 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-900 transition-colors"
                    >
                      <X className="h-3 w-3" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
        </>
      )}

      {/* MODAL 1: Log Training Activity */}
      {showTrainingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-700/80 bg-[#1E293B] p-6 shadow-2xl text-white">
            <h3 className="text-base font-bold text-white">
              Log Training Activity
            </h3>
            <form onSubmit={handleLogTraining} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300">Date</label>
                  <input
                    type="date"
                    value={trainingForm.date}
                    onChange={(e) => setTrainingForm({ ...trainingForm, date: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#F97316] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300">Workout Type</label>
                  <select
                    value={trainingForm.workoutType}
                    onChange={(e) => setTrainingForm({ ...trainingForm, workoutType: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#F97316] focus:outline-hidden"
                  >
                    <option value="EASY">Easy Aerobic</option>
                    <option value="TEMPO">Tempo / Threshold</option>
                    <option value="INTERVALS">Track Intervals</option>
                    <option value="LONG_RUN">Long Run</option>
                    <option value="RECOVERY">Recovery Jog</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300">Distance (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={trainingForm.distanceKm}
                    onChange={(e) => setTrainingForm({ ...trainingForm, distanceKm: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#F97316] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300">Duration (minutes)</label>
                  <input
                    type="number"
                    value={trainingForm.durationMinutes}
                    onChange={(e) => setTrainingForm({ ...trainingForm, durationMinutes: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#F97316] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300">Notes</label>
                <input
                  type="text"
                  value={trainingForm.athleteNotes}
                  onChange={(e) => setTrainingForm({ ...trainingForm, athleteNotes: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#F97316] focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTrainingModal(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#F97316] px-4 py-2 text-xs font-bold text-white hover:bg-[#FB923C]"
                >
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Record Result */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-700/80 bg-[#1E293B] p-6 shadow-2xl text-white">
            <h3 className="text-base font-bold text-white">
              Capture Official Race Result
            </h3>
            <form onSubmit={handleRecordResult} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300">Race Name</label>
                <input
                  type="text"
                  value={resultForm.raceName}
                  onChange={(e) => setResultForm({ ...resultForm, raceName: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#F97316] focus:outline-hidden"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300">Distance (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={resultForm.distanceKm}
                    onChange={(e) => setResultForm({ ...resultForm, distanceKm: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#F97316] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300">Time (hh:mm:ss)</label>
                  <input
                    type="text"
                    value={resultForm.timeFormatted}
                    onChange={(e) => setResultForm({ ...resultForm, timeFormatted: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono text-white focus:border-[#F97316] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300">Bib / Race #</label>
                  <input
                    type="text"
                    value={resultForm.bibNumber}
                    placeholder="e.g. 14205"
                    onChange={(e) => setResultForm({ ...resultForm, bibNumber: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono text-white focus:border-[#F97316] focus:outline-hidden placeholder:text-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300">Official Results Link</label>
                  <input
                    type="url"
                    value={resultForm.officialResultsUrl}
                    placeholder="https://results.finishtime.co.za/..."
                    onChange={(e) => setResultForm({ ...resultForm, officialResultsUrl: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono text-white focus:border-[#F97316] focus:outline-hidden placeholder:text-slate-600"
                  />
                </div>
              </div>

              {/* Timing Certificate File Upload */}
              <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <FileCheck className="h-4 w-4" />
                  <span>Attach Timing Certificate / Finisher Slip</span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-emerald-600/60 bg-emerald-950/30 hover:bg-emerald-950/50 px-3 py-2 text-xs font-bold text-emerald-300 transition-colors">
                    <Upload className="h-3.5 w-3.5" />
                    <span>{modalCertificateFile ? "Change File" : "Upload Certificate (PDF / Image)"}</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setModalCertificateFile(f);
                      }}
                    />
                  </label>
                  {modalCertificateFile && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
                      <span className="truncate max-w-[160px]">{modalCertificateFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setModalCertificateFile(null)}
                        className="text-slate-400 hover:text-rose-400"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResultModal(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#F97316] px-4 py-2 text-xs font-bold text-white hover:bg-[#FB923C]"
                >
                  Save Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Wellness Check-In */}
      {showWellnessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-700/80 bg-[#1E293B] p-6 shadow-2xl text-white">
            <h3 className="text-base font-bold text-white">Daily Wellness Check-In</h3>
            <p className="mt-1 text-xs text-slate-300">Coaching readiness information only; this is not a medical assessment.</p>
            <form onSubmit={handleWellnessCheckIn} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {([
                  ["Sleep quality", "sleepQuality", 1, 5],
                  ["Sleep hours", "sleepDurationHours", 0, 24],
                  ["Fatigue", "fatigueLevel", 1, 5],
                  ["Muscle soreness", "muscleSoreness", 1, 5],
                  ["Stress", "stressLevel", 1, 5],
                  ["Resting heart rate", "restingHeartRate", 20, 250],
                ] as const).map(([label, key, min, max]) => (
                  <label key={key} className="block text-xs font-bold text-slate-300">
                    {label} ({min}-{max})
                    <input
                      required
                      type="number"
                      min={min}
                      max={max}
                      step={key === "sleepDurationHours" ? "0.1" : "1"}
                      value={wellnessForm[key]}
                      onChange={(e) => setWellnessForm({ ...wellnessForm, [key]: Number(e.target.value) })}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#F97316] focus:outline-hidden"
                    />
                  </label>
                ))}
              </div>
              <label className="block text-xs font-bold text-slate-300">
                Notes
                <textarea
                  value={wellnessForm.notes}
                  onChange={(e) => setWellnessForm({ ...wellnessForm, notes: e.target.value })}
                  rows={2}
                  maxLength={2000}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-2 text-xs text-white focus:border-[#F97316] focus:outline-hidden"
                />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowWellnessModal(false)} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700">Cancel</button>
                <button type="submit" className="rounded-lg bg-[#F97316] px-4 py-2 text-xs font-bold text-white hover:bg-[#FB923C]">Save Check-In</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Sponsorship Decision with Override */}
      {showDecisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-700/80 bg-[#1E293B] p-6 shadow-2xl text-white">
            <h3 className="text-base font-bold text-white">
              Executive Sponsorship Decision & Override
            </h3>
            <p className="mt-1 text-xs text-slate-300">
              System recommended: <b className="text-purple-400 font-bold">{cssResult.recommendation.tierLabel}</b> (Score: {cssResult.totalScore}/100)
            </p>

            <form onSubmit={handleRecordDecision} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300">
                  Approved Decision Tier
                </label>
                <select
                  value={decisionForm.actualTier}
                  onChange={(e) => {
                    const newTier = e.target.value;
                    const isOver = newTier !== decisionForm.recommendedTier;
                    setDecisionForm({ ...decisionForm, actualTier: newTier, isOverridden: isOver });
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-white focus:border-[#F97316] focus:outline-hidden"
                >
                  <option value="ELITE_CLUB_ATHLETE">Elite Club Athlete (Tier 1)</option>
                  <option value="PERFORMANCE_ATHLETE">Performance Athlete (Tier 2)</option>
                  <option value="DEVELOPMENT_ATHLETE">Development Athlete</option>
                  <option value="MAINTAIN_SPONSORSHIP">Maintain Current Sponsorship</option>
                  <option value="INCREASE_SPONSORSHIP">Increase Sponsorship</option>
                  <option value="CONDITIONAL_SPONSORSHIP">Conditional Sponsorship</option>
                  <option value="SPONSORSHIP_REVIEW">Sponsorship Review</option>
                  <option value="REDUCE_SPONSORSHIP">Reduce Sponsorship</option>
                  <option value="NON_SPONSORED">Non-Sponsored</option>
                </select>
              </div>

              {decisionForm.isOverridden && (
                <div>
                  <label className="block text-xs font-bold text-amber-300">
                    * Recorded Reason for Recommendation Override (Mandatory)
                  </label>
                  <textarea
                    required
                    value={decisionForm.overrideReason}
                    onChange={(e) => setDecisionForm({ ...decisionForm, overrideReason: e.target.value })}
                    placeholder="Enter management justification for overriding the calculated recommendation..."
                    className="mt-1 w-full rounded-xl border border-amber-700 bg-slate-900 p-2 text-xs text-white focus:border-[#F97316] focus:outline-hidden"
                    rows={2}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300">
                  Committee Notes
                </label>
                <textarea
                  value={decisionForm.committeeNotes}
                  onChange={(e) => setDecisionForm({ ...decisionForm, committeeNotes: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-2 text-xs text-white focus:border-[#F97316] focus:outline-hidden"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDecisionModal(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#F97316] px-4 py-2 text-xs font-bold text-white hover:bg-[#FB923C]"
                >
                  Record Official Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Sponsorship Disbursement Modal */}
      {showDisbursementModal && (
        <RecordDisbursementModal
          athleteId={currentAthlete.id}
          athleteName={`${currentAthlete.firstName} ${currentAthlete.lastName}`}
          athleteNumber={currentAthlete.athleteNumber}
          isOpen={showDisbursementModal}
          onClose={() => setShowDisbursementModal(false)}
          onSuccess={(newTransaction, updatedTotalZar) => {
            setTransactionsList((prev: any[]) => [newTransaction, ...prev]);
            setCurrentSupportZar(updatedTotalZar);
            setActionSuccessMessage(
              `Recorded disbursement of R${newTransaction.amount.toLocaleString()} for ${currentAthlete.firstName} successfully!`
            );
            setTimeout(() => setActionSuccessMessage(""), 5000);
          }}
        />
      )}

      {/* "How Was This Calculated?" Explanation Modal */}
      <ExplainScoreModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={modalData}
      />

      {/* Digital Membership Card Modal */}
      <DigitalMembershipCardModal
        isOpen={showCardModal}
        onClose={() => setShowCardModal(false)}
        athlete={athlete}
      />

      {/* Smartwatch Telemetry GPX Upload Modal */}
      <TelemetryUploadModal
        isOpen={showTelemetryModal}
        onClose={() => setShowTelemetryModal(false)}
        athleteId={athlete.id}
        athleteName={`${athlete.firstName} ${athlete.lastName}`}
        onSuccess={() => window.location.reload()}
      />

      {/* Conferred Medallion Certificate & WhatsApp Broadcast Modal */}
      <MedallionModal
        medallion={selectedMedallion}
        isOpen={!!selectedMedallion}
        onClose={() => setSelectedMedallion(null)}
      />

      {/* Edit Member Profile Modal */}
      {showEditModal && (
        <EditAthleteModal
          athlete={currentAthlete}
          isOpen={showEditModal}
          currentUserRole={userRole}
          onClose={() => setShowEditModal(false)}
          onSaved={(updated) => {
            setCurrentAthlete(updated);
            setActionSuccessMessage(`Member #${updated.athleteNumber} details saved successfully!`);
            setTimeout(() => setActionSuccessMessage(""), 5000);
          }}
        />
      )}

      {/* Delete / Archive Member Modal */}
      {showDeleteModal && (
        <DeleteAthleteModal
          athlete={currentAthlete}
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onDeleted={(_id, isPermanent) => {
            if (isPermanent) {
              window.location.href = "/athletes";
            } else {
              setCurrentAthlete((prev: any) => ({
                ...prev,
                membershipStatus: "LAPSED",
                membershipFeeStatus: "PENDING",
              }));
              setActionSuccessMessage("Member archived with LAPSED standing.");
              setTimeout(() => setActionSuccessMessage(""), 5000);
            }
          }}
        />
      )}

      {/* Change Account Password Modal */}
      {showPasswordModal && (
        <ChangePasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          userName={`${currentAthlete.firstName} ${currentAthlete.lastName}`}
        />
      )}

      {/* Official Certificate / Proof Document Lightbox Modal */}
      {previewCertificateUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md">
          <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl border border-slate-700 bg-[#0F172A] p-6 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Verified Timing Certificate & Official Evidence</h3>
              </div>
              <button
                onClick={() => setPreviewCertificateUrl(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex-1 overflow-auto rounded-2xl border border-slate-800 bg-slate-950 p-2 flex items-center justify-center min-h-[350px]">
              {previewCertificateUrl.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={previewCertificateUrl}
                  className="h-[60vh] w-full rounded-xl"
                  title="Official Timing Certificate PDF"
                />
              ) : (
                <img
                  src={previewCertificateUrl}
                  alt="Official Timing Certificate / Finisher Slip"
                  className="max-h-[65vh] w-auto rounded-xl object-contain shadow-lg"
                />
              )}
            </div>

            <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <span className="text-slate-400">
                Official document proof registered with Super Eagles AMMS timing audit.
              </span>
              <a
                href={previewCertificateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Open in New Tab</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
