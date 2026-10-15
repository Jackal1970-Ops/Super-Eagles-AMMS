/**
 * Super Eagles AMMS - Garmin & Strava CSV Activity Importer
 * Parses bulk CSV exports from Garmin Connect, Strava, and custom timing sheets without cloud APIs.
 */

export interface ParsedCsvActivity {
  date: Date;
  activityType: string; // RUN, TRAIL_RUN, TIME_TRIAL, WALK
  workoutType: string;  // EASY, LONG_RUN, TEMPO, INTERVALS, RECOVERY
  distanceKm: number;
  durationSeconds: number;
  averagePaceSeconds: number;
  elevationGain: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  cadence?: number;
  notes?: string;
  source: "GARMIN_EXPORT" | "STRAVA_EXPORT" | "CSV";
}

function parseDurationToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const cleaned = timeStr.trim().replace(/"/g, "");
  if (/^\d+$/.test(cleaned)) return parseInt(cleaned, 10);

  const parts = cleaned.split(":").map((p) => parseFloat(p));
  if (parts.length === 3) {
    return Math.round(parts[0] * 3600 + parts[1] * 60 + parts[2]);
  }
  if (parts.length === 2) {
    return Math.round(parts[0] * 60 + parts[1]);
  }
  return 0;
}

export function parseActivityCsv(csvContent: string): ParsedCsvActivity[] {
  if (!csvContent || typeof csvContent !== "string") {
    throw new Error("Invalid CSV payload: empty content.");
  }

  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    throw new Error("CSV contains insufficient rows (header + minimum 1 data row required).");
  }

  // Parse header
  const headers = lines[0]
    .toLowerCase()
    .split(",")
    .map((h) => h.trim().replace(/^["']|["']$/g, ""));

  // Find column indices
  const findCol = (candidates: string[]): number => {
    return headers.findIndex((h) => candidates.some((c) => h.includes(c)));
  };

  const dateIdx = findCol(["date", "start", "time"]);
  const distIdx = findCol(["distance", "dist"]);
  const timeIdx = findCol(["elapsed time", "moving time", "duration", "time", "time (s)"]);
  const typeIdx = findCol(["type", "activity type", "sport"]);
  const eleIdx = findCol(["elevation", "gain", "elev"]);
  const hrIdx = findCol(["avg hr", "heart rate", "avg heart rate"]);
  const maxHrIdx = findCol(["max hr", "max heart rate"]);
  const notesIdx = findCol(["title", "name", "description", "notes"]);

  if (dateIdx === -1 || distIdx === -1) {
    throw new Error("CSV is missing mandatory 'Date' or 'Distance' columns.");
  }

  const activities: ParsedCsvActivity[] = [];

  for (let i = 1; i < lines.length; i++) {
    // Handle quoted values with commas inside
    const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(",");
    const cleanRow = row.map((c) => c.trim().replace(/^"|"$/g, ""));

    const dateRaw = cleanRow[dateIdx];
    const distRaw = cleanRow[distIdx];
    if (!dateRaw || !distRaw) continue;

    const parsedDate = new Date(dateRaw);
    if (isNaN(parsedDate.getTime())) continue;

    let distKm = parseFloat(distRaw.replace(/[^0-9.]/g, ""));
    if (isNaN(distKm) || distKm <= 0) continue;

    // Detect if distance was exported in meters (e.g. 10000 -> 10km)
    if (distKm > 300) {
      distKm = distKm / 1000;
    }

    const durationSeconds = timeIdx !== -1 ? parseDurationToSeconds(cleanRow[timeIdx]) : Math.round(distKm * 300);
    const avgPace = distKm > 0 ? Math.round(durationSeconds / distKm) : 300;

    const rawType = (typeIdx !== -1 ? cleanRow[typeIdx] : "").toUpperCase();
    let activityType = "RUN";
    if (rawType.includes("WALK")) activityType = "WALK";
    else if (rawType.includes("TRAIL")) activityType = "TRAIL_RUN";
    else if (rawType.includes("TIME TRIAL") || rawType.includes("TT")) activityType = "TIME_TRIAL";

    let workoutType = "EASY";
    if (distKm >= 21.0) workoutType = "LONG_RUN";
    else if (rawType.includes("TEMPO")) workoutType = "TEMPO";
    else if (rawType.includes("INTERVAL")) workoutType = "INTERVALS";

    const elevationGain = eleIdx !== -1 ? parseInt(cleanRow[eleIdx].replace(/[^0-9]/g, ""), 10) || 0 : 0;
    const avgHeartRate = hrIdx !== -1 ? parseInt(cleanRow[hrIdx].replace(/[^0-9]/g, ""), 10) || undefined : undefined;
    const maxHeartRate = maxHrIdx !== -1 ? parseInt(cleanRow[maxHrIdx].replace(/[^0-9]/g, ""), 10) || undefined : undefined;
    const notes = notesIdx !== -1 ? cleanRow[notesIdx] : undefined;

    const source = headers.some((h) => h.includes("strava"))
      ? "STRAVA_EXPORT"
      : headers.some((h) => h.includes("garmin"))
      ? "GARMIN_EXPORT"
      : "CSV";

    activities.push({
      date: parsedDate,
      activityType,
      workoutType,
      distanceKm: Math.round(distKm * 100) / 100,
      durationSeconds: Math.max(1, durationSeconds),
      averagePaceSeconds: avgPace,
      elevationGain,
      avgHeartRate,
      maxHeartRate,
      notes,
      source,
    });
  }

  return activities;
}

export function parseStravaGarminCsv(csvContent: string) {
  const activities = parseActivityCsv(csvContent);
  return {
    activities,
    count: activities.length,
  };
}
