/**
 * Super Eagles Pace and Durability Engine
 * Provides pace conversions, deterioration percentages, and durability classifications.
 */

export function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || isNaN(totalSeconds) || totalSeconds < 0) return "0:00:00";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function formatPace(secondsPerKm: number): string {
  if (!secondsPerKm || isNaN(secondsPerKm) || secondsPerKm <= 0) return "--:--/km";
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}/km`;
}

export function parsePace(paceStr: string): number {
  if (!paceStr) return 0;
  const clean = paceStr.replace("/km", "").trim();
  const parts = clean.split(":");
  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10) || 0;
    const secs = parseInt(parts[1], 10) || 0;
    return mins * 60 + secs;
  }
  return 0;
}

export function calculatePace(distanceKm: number, durationSeconds: number): number {
  if (!distanceKm || distanceKm <= 0 || !durationSeconds || durationSeconds <= 0) {
    return 0;
  }
  return Math.round(durationSeconds / distanceKm);
}

/**
 * Calculates pace deterioration percentage between early and late race splits.
 * Deterioration % = ((later pace - early pace) / early pace) * 100
 * A positive number indicates slowing down (taking more seconds per km).
 */
export function calculatePaceDeterioration(earlyPaceSeconds: number, latePaceSeconds: number): number {
  if (!earlyPaceSeconds || earlyPaceSeconds <= 0 || !latePaceSeconds || latePaceSeconds <= 0) {
    return 0;
  }
  const deterioration = ((latePaceSeconds - earlyPaceSeconds) / earlyPaceSeconds) * 100;
  return Number(deterioration.toFixed(2));
}

export type DurabilityRating = "EXCELLENT" | "GOOD" | "MODERATE" | "POOR" | "INSUFFICIENT_DATA";

export interface DurabilityClassification {
  rating: DurabilityRating;
  label: string;
  color: string;
  description: string;
  deteriorationPercent: number;
}

export function classifyPaceDurability(deteriorationPercent: number, hasData: boolean = true): DurabilityClassification {
  if (!hasData || isNaN(deteriorationPercent)) {
    return {
      rating: "INSUFFICIENT_DATA",
      label: "Insufficient Data",
      color: "text-slate-400 bg-slate-100 border-slate-300",
      description: "Additional split or long-run data needed to evaluate late-race durability.",
      deteriorationPercent: 0,
    };
  }

  // Negative or minimal deterioration (<= +2%) is Excellent (even / negative split)
  if (deteriorationPercent <= 2.0) {
    return {
      rating: "EXCELLENT",
      label: "Excellent Durability",
      color: "text-emerald-700 bg-emerald-50 border-emerald-300",
      description: "Maintained pace or executed negative split throughout the race/session.",
      deteriorationPercent,
    };
  }

  if (deteriorationPercent <= 6.0) {
    return {
      rating: "GOOD",
      label: "Good Durability",
      color: "text-blue-700 bg-blue-50 border-blue-300",
      description: "Minor aerobic fade (+2% to +6%), well within acceptable marathon tolerance.",
      deteriorationPercent,
    };
  }

  if (deteriorationPercent <= 12.0) {
    return {
      rating: "MODERATE",
      label: "Moderate Durability",
      color: "text-amber-700 bg-amber-50 border-amber-300",
      description: "Noticeable deceleration (+6% to +12%) in final 25-30% of distance.",
      deteriorationPercent,
    };
  }

  return {
    rating: "POOR",
    label: "Poor Durability",
    color: "text-rose-700 bg-rose-50 border-rose-300",
    description: "Significant pace decay (> +12%), indicating muscular exhaustion or glycogen depletion.",
    deteriorationPercent,
  };
}
