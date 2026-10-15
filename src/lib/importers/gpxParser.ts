/**
 * Super Eagles AMMS - Pure Local GPX Parser
 * Zero-dependency parser for Garmin, Strava, Coros, and Apple Watch .gpx files.
 * Calculates Haversine distances, moving paces, elevation gain/loss, and kilometer splits.
 */

export interface GpxTrackPoint {
  latitude: number;
  longitude: number;
  elevationMeters: number | null;
  timestamp: Date | null;
}

export interface GpxSplit {
  splitNumber: number;
  distanceKm: number;
  durationSeconds: number;
  paceSeconds: number; // seconds per km
  elevationChange: number;
}

export interface ParsedGpxSummary {
  activityName: string;
  startTime: Date;
  totalDistanceKm: number;
  totalDurationSeconds: number;
  averagePaceSeconds: number;
  elevationGainMeters: number;
  elevationLossMeters: number;
  trackpointsCount: number;
  splits: GpxSplit[];
}

/**
 * Calculates distance between two WGS-84 coordinates in kilometers using the Haversine formula.
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Parses raw GPX XML string into structured summary and splits without external dependencies.
 */
export function parseGpxXml(xmlString: string): ParsedGpxSummary {
  if (!xmlString || typeof xmlString !== "string") {
    throw new Error("Invalid GPX payload: empty or non-string input");
  }

  // Extract activity name
  const nameMatch = xmlString.match(/<name>(.*?)<\/name>/i);
  const activityName = nameMatch ? nameMatch[1].trim() : "Club Run Activity";

  // Match all <trkpt lat="..." lon="..."> ... </trkpt>
  const trkptRegex = /<trkpt\s+[^>]*lat=["']([^"']+)["'][^>]*lon=["']([^"']+)["'][^>]*>([\s\S]*?)<\/trkpt>/gi;
  const points: GpxTrackPoint[] = [];

  let match: RegExpExecArray | null;
  while ((match = trkptRegex.exec(xmlString)) !== null) {
    const lat = parseFloat(match[1]);
    const lon = parseFloat(match[2]);
    const inner = match[3];

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      continue;
    }

    const eleMatch = inner.match(/<ele>(.*?)<\/ele>/i);
    const ele = eleMatch ? parseFloat(eleMatch[1]) : null;

    const timeMatch = inner.match(/<time>(.*?)<\/time>/i);
    const time = timeMatch ? new Date(timeMatch[1]) : null;

    points.push({
      latitude: lat,
      longitude: lon,
      elevationMeters: isNaN(ele as any) ? null : ele,
      timestamp: time && !isNaN(time.getTime()) ? time : null,
    });
  }

  if (points.length < 2) {
    throw new Error("GPX file contains insufficient valid trackpoints (minimum 2 required).");
  }

  let totalDistanceKm = 0;
  let elevationGain = 0;
  let elevationLoss = 0;

  // Split calculation variables
  const splits: GpxSplit[] = [];
  let currentSplitKm = 0;
  let currentSplitStartTime = points[0].timestamp ? points[0].timestamp.getTime() : 0;
  let currentSplitEleStart = points[0].elevationMeters ?? 0;
  let splitIndex = 1;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];

    const dKm = haversineDistanceKm(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
    totalDistanceKm += dKm;
    currentSplitKm += dKm;

    if (curr.elevationMeters !== null && prev.elevationMeters !== null) {
      const dEle = curr.elevationMeters - prev.elevationMeters;
      if (dEle > 0) elevationGain += dEle;
      else elevationLoss += Math.abs(dEle);
    }

    // Every 1.0 km interval, create a split
    if (currentSplitKm >= 1.0) {
      const splitEndTime = curr.timestamp ? curr.timestamp.getTime() : currentSplitStartTime + (currentSplitKm * 300 * 1000);
      const durationSec = Math.max(1, Math.round((splitEndTime - currentSplitStartTime) / 1000));
      const paceSec = Math.round(durationSec / currentSplitKm);

      splits.push({
        splitNumber: splitIndex++,
        distanceKm: Math.round(currentSplitKm * 100) / 100,
        durationSeconds: durationSec,
        paceSeconds: paceSec,
        elevationChange: curr.elevationMeters !== null ? Math.round(curr.elevationMeters - currentSplitEleStart) : 0,
      });

      currentSplitKm = 0;
      currentSplitStartTime = splitEndTime;
      currentSplitEleStart = curr.elevationMeters ?? 0;
    }
  }

  // Handle remaining split fraction if > 0.1km
  if (currentSplitKm >= 0.1) {
    const lastPoint = points[points.length - 1];
    const splitEndTime = lastPoint.timestamp ? lastPoint.timestamp.getTime() : currentSplitStartTime + (currentSplitKm * 300 * 1000);
    const durationSec = Math.max(1, Math.round((splitEndTime - currentSplitStartTime) / 1000));
    const paceSec = Math.round(durationSec / currentSplitKm);

    splits.push({
      splitNumber: splitIndex,
      distanceKm: Math.round(currentSplitKm * 100) / 100,
      durationSeconds: durationSec,
      paceSeconds: paceSec,
      elevationChange: lastPoint.elevationMeters !== null ? Math.round(lastPoint.elevationMeters - currentSplitEleStart) : 0,
    });
  }

  const startTime = points[0].timestamp || new Date();
  const endTime = points[points.length - 1].timestamp;
  let totalDurationSeconds = 0;

  if (startTime && endTime && endTime.getTime() > startTime.getTime()) {
    totalDurationSeconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
  } else {
    // Estimate based on sum of splits
    totalDurationSeconds = splits.reduce((acc, s) => acc + s.durationSeconds, 0);
  }

  if (totalDurationSeconds === 0) {
    totalDurationSeconds = Math.round(totalDistanceKm * 300); // 5:00/km default fallback
  }

  const averagePaceSeconds = totalDistanceKm > 0 ? Math.round(totalDurationSeconds / totalDistanceKm) : 300;

  return {
    activityName,
    startTime,
    totalDistanceKm: Math.round(totalDistanceKm * 100) / 100,
    totalDurationSeconds,
    averagePaceSeconds,
    elevationGainMeters: Math.round(elevationGain),
    elevationLossMeters: Math.round(elevationLoss),
    trackpointsCount: points.length,
    splits,
  };
}

export const parseGpxData = parseGpxXml;
