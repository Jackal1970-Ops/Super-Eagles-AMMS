import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { parseGpxXml } from "@/lib/importers/gpxParser";
import { parseActivityCsv } from "@/lib/importers/stravaGarminCsvParser";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const athleteId = formData.get("athleteId") as string | null;
    const targetAthleteId = user.role === "ATHLETE" ? user.athleteId : (athleteId || user.athleteId);

    if (!targetAthleteId) {
      return NextResponse.json({ error: "Target athlete is required." }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: "No telemetry file provided." }, { status: 400 });
    }

    if (file.size === 0 || file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Telemetry file must be between 1 byte and 10MB." }, { status: 400 });
    }

    if (user.role === "COACH") {
      const assignment = await prisma.coachAssignment.findFirst({
        where: { athleteId: targetAthleteId, coachId: user.userId, status: "ACTIVE" },
        select: { id: true },
      });
      if (!assignment) {
        return NextResponse.json({ error: "Forbidden: athlete is not assigned to this coach." }, { status: 403 });
      }
    } else if (user.role !== "ATHLETE" && user.role !== "SUPER_ADMIN" && user.role !== "CLUB_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const athlete = await prisma.athlete.findUnique({
      where: { id: targetAthleteId },
    });
    if (!athlete) {
      return NextResponse.json({ error: "Athlete not found." }, { status: 404 });
    }

    const text = await file.text();
    const fileName = file.name.toLowerCase();

    // -------------------------------------------------------------------------
    // GPX IMPORT
    // -------------------------------------------------------------------------
    if (fileName.endsWith(".gpx") || text.includes("<gpx")) {
      const gpx = parseGpxXml(text);

      const activity = await prisma.trainingActivity.create({
        data: {
          athleteId: targetAthleteId,
          date: gpx.startTime,
          activityType: gpx.totalDistanceKm > 30 ? "RUN" : athlete.disciplineCategory === "WALKER" ? "WALK" : "RUN",
          workoutType: gpx.totalDistanceKm >= 21 ? "LONG_RUN" : "EASY",
          distanceKm: gpx.totalDistanceKm,
          durationSeconds: gpx.totalDurationSeconds,
          averagePaceSeconds: gpx.averagePaceSeconds,
          elevationGain: gpx.elevationGainMeters,
          elevationLoss: gpx.elevationLossMeters,
          athleteNotes: `Imported from GPX (${file.name}): ${gpx.activityName}`,
          source: "GARMIN_EXPORT",
          isLongRun: gpx.totalDistanceKm >= 21,
          splits: {
            create: gpx.splits.map((s) => ({
              splitNumber: s.splitNumber,
              distanceKm: s.distanceKm,
              durationSeconds: s.durationSeconds,
              paceSeconds: s.paceSeconds,
              elevationChange: s.elevationChange,
            })),
          },
        },
        include: { splits: true },
      });

      return NextResponse.json({
        success: true,
        type: "GPX",
        count: 1,
        activity,
        message: `Successfully imported '${gpx.activityName}' (${gpx.totalDistanceKm}km) with ${gpx.splits.length} splits.`,
      });
    }

    // -------------------------------------------------------------------------
    // CSV IMPORT (Garmin / Strava / Custom)
    // -------------------------------------------------------------------------
    if (fileName.endsWith(".csv") || text.includes(",")) {
      const activities = parseActivityCsv(text);

      if (activities.length === 0) {
        return NextResponse.json({ error: "No valid activity records found in CSV." }, { status: 400 });
      }

      const createdActivities = await prisma.$transaction(
        activities.slice(0, 50).map((act) => prisma.trainingActivity.create({
          data: {
            athleteId: targetAthleteId,
            date: act.date,
            activityType: act.activityType,
            workoutType: act.workoutType,
            distanceKm: act.distanceKm,
            durationSeconds: act.durationSeconds,
            averagePaceSeconds: act.averagePaceSeconds,
            elevationGain: act.elevationGain,
            avgHeartRate: act.avgHeartRate,
            maxHeartRate: act.maxHeartRate,
            athleteNotes: act.notes || `Imported via ${act.source} (${file.name})`,
            source: act.source,
            isLongRun: act.distanceKm >= 21,
          },
        }))
      );

      return NextResponse.json({
        success: true,
        type: "CSV",
        count: createdActivities.length,
        activities: createdActivities,
        message: `Successfully imported ${createdActivities.length} workout(s) from ${file.name}.`,
      });
    }

    return NextResponse.json({ error: "Unsupported file format. Please upload a .gpx or .csv file." }, { status: 400 });
  } catch (error: any) {
    console.error("Telemetry import error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process telemetry file." },
      { status: 500 }
    );
  }
}
