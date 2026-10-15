/**
 * Super Eagles AMMS - Offline Event & Performance Queue
 * Allows athletes to log event attendance, race results, workouts, and wellness
 * even when the clubhouse computer is turned off, during load shedding, or without signal.
 * Automatically synchronizes when the connection is restored.
 */

export interface OfflineEntry {
  id: string;
  type: "ATTENDANCE" | "RACE_RESULT" | "WORKOUT" | "WELLNESS";
  data: any;
  timestamp: string;
  athleteName?: string;
  status: "PENDING" | "SYNCED" | "FAILED";
}

const STORAGE_KEY = "se_amms_offline_queue";

export function getOfflineQueue(): OfflineEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to read offline queue:", e);
    return [];
  }
}

export function saveOfflineEntry(
  type: OfflineEntry["type"],
  data: any,
  athleteName?: string
): OfflineEntry {
  const entries = getOfflineQueue();
  const newEntry: OfflineEntry = {
    id: `off_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    type,
    data,
    timestamp: new Date().toISOString(),
    athleteName: athleteName || "Athlete",
    status: "PENDING",
  };

  entries.push(newEntry);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    window.dispatchEvent(new Event("se_offline_queue_updated"));
  }
  return newEntry;
}

export function removeOfflineEntry(id: string): void {
  const entries = getOfflineQueue().filter((e) => e.id !== id);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    window.dispatchEvent(new Event("se_offline_queue_updated"));
  }
}

export function clearOfflineQueue(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("se_offline_queue_updated"));
  }
}

/**
 * Attempts to replay all pending offline entries against the server API.
 */
export async function syncOfflineQueue(): Promise<{
  successCount: number;
  failedCount: number;
  remainingCount: number;
}> {
  const entries = getOfflineQueue();
  if (entries.length === 0) {
    return { successCount: 0, failedCount: 0, remainingCount: 0 };
  }

  let successCount = 0;
  let failedCount = 0;
  const remaining: OfflineEntry[] = [];

  for (const entry of entries) {
    try {
      let endpoint = "";
      if (entry.type === "ATTENDANCE") endpoint = "/api/club-activities/check-in";
      else if (entry.type === "RACE_RESULT") endpoint = "/api/races/results";
      else if (entry.type === "WORKOUT") endpoint = "/api/training";
      else if (entry.type === "WELLNESS") endpoint = "/api/wellness";

      if (!endpoint) {
        remaining.push(entry);
        continue;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry.data),
      });

      if (res.ok) {
        successCount++;
      } else {
        failedCount++;
        remaining.push(entry);
      }
    } catch {
      failedCount++;
      remaining.push(entry);
    }
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
  }

  return {
    successCount,
    failedCount,
    remainingCount: remaining.length,
  };
}

/**
 * Generates formatted WhatsApp text summary of offline activities
 * so athletes can text their coach directly if the computer remains off.
 */
export function generateWhatsAppSummary(athleteName: string): string {
  const entries = getOfflineQueue();
  if (entries.length === 0) return "No pending offline entries.";

  let text = `🦅 *Super Eagles AMMS - Offline Submissions*\n`;
  text += `*Athlete:* ${athleteName}\n`;
  text += `*Date:* ${new Date().toLocaleDateString()}\n\n`;

  entries.forEach((e, idx) => {
    text += `${idx + 1}. *[${e.type}]* ${new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n`;
    if (e.type === "ATTENDANCE") {
      text += `   • Event: ${e.data.activityTitle || e.data.activityId}\n`;
    } else if (e.type === "RACE_RESULT") {
      text += `   • Race: ${e.data.raceName} (${e.data.distanceKm}km)\n`;
      text += `   • Time: ${e.data.timeFormatted || e.data.officialTimeSeconds}s\n`;
    } else if (e.type === "WORKOUT") {
      text += `   • Workout: ${e.data.distanceKm}km in ${Math.round(e.data.durationSeconds / 60)}m\n`;
    }
  });

  text += `\n_Recorded offline on mobile device. Please verify in club register._`;
  return text;
}
