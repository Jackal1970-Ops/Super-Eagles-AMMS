"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  Activity,
  CheckCircle2,
  AlertTriangle,
  X,
  Flame,
  Clock,
  Heart,
  Mountain,
  Compass,
  FileCheck,
} from "lucide-react";
import { parseGpxString, ParsedTelemetry } from "@/lib/telemetry/gpxParser";
import { formatDuration, formatPace } from "@/lib/analytics/pace";

interface TelemetryUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  athleteId: string;
  athleteName?: string;
  onSuccess?: () => void;
}

export function TelemetryUploadModal({
  isOpen,
  onClose,
  athleteId,
  athleteName,
  onSuccess,
}: TelemetryUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedTelemetry | null>(null);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [workoutType, setWorkoutType] = useState<string>("EASY");
  const [sessionRpe, setSessionRpe] = useState<number>(6);
  const [surface, setSurface] = useState<string>("ROAD");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFileProcess = (file: File) => {
    setParsingError(null);
    setSubmitSuccess(false);

    if (!file.name.toLowerCase().endsWith(".gpx") && !file.name.toLowerCase().endsWith(".tcx") && !file.name.toLowerCase().endsWith(".xml")) {
      setParsingError("Please upload a valid .GPX or .TCX file exported from your watch or Strava.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const telemetry = parseGpxString(text, file.name);
        setParsedData(telemetry);
        setWorkoutType(telemetry.suggestedWorkoutType);
        setNotes(
          `${telemetry.activityName} • Elevation: +${telemetry.elevationGainMeters}m / -${telemetry.elevationLossMeters}m` +
            (telemetry.averageHeartRate ? ` • Avg HR: ${telemetry.averageHeartRate} bpm` : "")
        );
      } catch (err: any) {
        setParsingError(err.message || "Failed to parse GPS telemetry file.");
      }
    };
    reader.onerror = () => {
      setParsingError("Error reading the selected file.");
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!parsedData || !athleteId) return;
    setIsSubmitting(true);
    setParsingError(null);

    try {
      const res = await fetch("/api/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          athleteId,
          date: parsedData.startTime.toISOString(),
          activityType: parsedData.isWalkingDiscipline ? "WALK" : "RUN",
          distanceKm: parsedData.totalDistanceKm,
          durationSeconds: parsedData.totalDurationSeconds,
          averagePaceSeconds: parsedData.averagePaceSecondsPerKm,
          workoutType,
          surface,
          sessionRpe,
          athleteNotes: notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save workout.");
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setParsingError(err.message || "Failed to log workout session.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-3xl border border-slate-800 bg-[#0F172A] p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-md">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">
              Smartwatch Telemetry Sync (GPX / TCX)
            </h2>
            <p className="text-xs text-slate-400">
              {athleteName ? `Ingesting session for ${athleteName}` : "Direct file drag-and-drop from Garmin, Strava, Polar or Apple Watch"}
            </p>
          </div>
        </div>

        {/* Drag and Drop Zone */}
        {!parsedData && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
              isDragging
                ? "border-orange-500 bg-orange-500/10"
                : "border-slate-700/80 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-900/80"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".gpx,.tcx,.xml"
              onChange={handleFileChange}
              className="hidden"
            />
            <Compass className="h-10 w-10 text-orange-400 mb-2 opacity-80" />
            <span className="text-sm font-bold text-white">
              Drag & Drop your .GPX or .TCX activity file here
            </span>
            <span className="mt-1 text-xs text-slate-400">
              or click to browse your computer
            </span>
            <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              <span>Garmin Connect</span> • <span>Strava Export</span> • <span>Coros</span> • <span>Wahoo</span>
            </div>
          </div>
        )}

        {/* Parsing Error */}
        {parsingError && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-800/80 bg-rose-950/40 p-3 text-xs text-rose-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{parsingError}</span>
          </div>
        )}

        {/* Telemetry Preview Breakdown */}
        {parsedData && (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-emerald-800/60 bg-gradient-to-br from-emerald-950/40 to-slate-900 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  GPS Track Points Successfully Verified ({parsedData.trackPointsCount} points)
                </span>
                <button
                  onClick={() => setParsedData(null)}
                  className="text-[11px] font-semibold text-slate-400 hover:text-white underline"
                >
                  Change File
                </button>
              </div>

              {/* 4 Core Metrics Grid */}
              <div className="mt-3 grid grid-cols-4 gap-2.5 text-center">
                <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Distance
                  </span>
                  <span className="text-base font-black text-white">
                    {parsedData.totalDistanceKm} <span className="text-xs font-semibold text-slate-400">km</span>
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Duration
                  </span>
                  <span className="text-base font-black text-white">
                    {formatDuration(parsedData.totalDurationSeconds)}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Avg Pace
                  </span>
                  <span className="text-base font-black text-orange-400">
                    {formatPace(parsedData.averagePaceSecondsPerKm)}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Elevation
                  </span>
                  <span className="text-base font-black text-white">
                    +{parsedData.elevationGainMeters} <span className="text-xs font-semibold text-slate-400">m</span>
                  </span>
                </div>
              </div>

              {/* Heart Rate Telemetry Bar if Present */}
              {parsedData.averageHeartRate && (
                <div className="mt-2.5 flex items-center justify-between rounded-lg bg-slate-900/90 px-3 py-1.5 text-xs text-slate-300 border border-slate-800">
                  <span className="flex items-center gap-1 text-rose-400 font-semibold">
                    <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
                    Heart Rate Zones Detected
                  </span>
                  <span>
                    Avg: <b className="text-white">{parsedData.averageHeartRate} bpm</b> • Max:{" "}
                    <b className="text-white">{parsedData.maxHeartRate || "--"} bpm</b>
                  </span>
                </div>
              )}
            </div>

            {/* Editable Configuration Controls */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Workout Category</label>
                <select
                  value={workoutType}
                  onChange={(e) => setWorkoutType(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                >
                  <option value="EASY">Easy Run / Recovery</option>
                  <option value="TEMPO">Tempo / Threshold Run</option>
                  <option value="LONG_RUN">Long Aerobic Base Run</option>
                  <option value="INTERVALS">Track / Hill Intervals</option>
                  <option value="WALK">Fast Walk / Fitness Walk</option>
                  <option value="TIME_TRIAL">Time Trial Effort</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Surface Type</label>
                <select
                  value={surface}
                  onChange={(e) => setSurface(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                >
                  <option value="ROAD">Road / Tar</option>
                  <option value="TRAIL">Trail / Dirt Path</option>
                  <option value="TRACK">Synthetic Track</option>
                  <option value="GRASS">Grass / Cross Country</option>
                  <option value="TREADMILL">Treadmill</option>
                </select>
              </div>
            </div>

            {/* Perceived Exertion Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-300">Rate of Perceived Exertion (RPE): {sessionRpe}/10</span>
                <span className="text-orange-400 font-semibold">
                  {sessionRpe <= 3 ? "Very Easy" : sessionRpe <= 6 ? "Moderate Aerobic" : sessionRpe <= 8 ? "Hard Threshold" : "Maximal Effort"}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={sessionRpe}
                onChange={(e) => setSessionRpe(parseInt(e.target.value, 10))}
                className="w-full accent-orange-500 cursor-pointer"
              />
            </div>

            {/* Athlete Notes */}
            <div>
              <label className="font-bold text-slate-300 text-xs block mb-1">Session Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Course conditions, pacing notes, footwear..."
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Submit Success Confirmation */}
        {submitSuccess && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-950 border border-emerald-800 p-3 text-xs font-bold text-emerald-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Workout Successfully Added to Athlete Log & ACWR Engine!
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-slate-800/80 pt-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>

          {parsedData && (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || submitSuccess}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#F97316] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#FB923C] transition-all hover:-translate-y-0.5 disabled:opacity-50"
            >
              <Flame className="h-4 w-4" />
              <span>{isSubmitting ? "Logging..." : "Confirm & Save Workout"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

