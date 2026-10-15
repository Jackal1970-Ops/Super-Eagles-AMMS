import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/auditLogger";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      athleteId,
      date,
      activityType,
      distanceKm,
      durationSeconds,
      averagePaceSeconds,
      workoutType,
      surface,
      sessionRpe,
      athleteNotes,
    } = body;

    if (!athleteId || !distanceKm || !durationSeconds) {
      return NextResponse.json({ error: "Missing required training fields." }, { status: 400 });
    }

    let targetAthleteId = typeof athleteId === "string" ? athleteId : "";
    if (user.role === "ATHLETE") {
      if (!user.athleteId || (targetAthleteId && targetAthleteId !== user.athleteId)) {
        return NextResponse.json({ error: "Forbidden: athletes may only log their own training." }, { status: 403 });
      }
      targetAthleteId = user.athleteId;

      // Arrears Payment Gatekeeper: Athletes with pending/lapsed dues cannot upload workout data
      const athleteRecord = await prisma.athlete.findUnique({
        where: { id: targetAthleteId },
        select: { membershipFeeStatus: true, membershipStatus: true },
      });

      if (
        athleteRecord &&
        athleteRecord.membershipFeeStatus !== "PAID" &&
        athleteRecord.membershipFeeStatus !== "EXEMPT" &&
        athleteRecord.membershipFeeStatus !== "SUBSIDIZED"
      ) {
        return NextResponse.json(
          {
            error: "Membership in arrears: Annual club dues are pending. Workout submission is locked until membership renewal is settled.",
            membershipFeeStatus: athleteRecord.membershipFeeStatus,
            membershipStatus: athleteRecord.membershipStatus,
          },
          { status: 403 }
        );
      }
    } else if (user.role === "COACH") {
      const assignment = await prisma.coachAssignment.findFirst({
        where: { athleteId: targetAthleteId, coachId: user.userId, status: "ACTIVE" },
        select: { id: true },
      });
      if (!assignment) return NextResponse.json({ error: "Forbidden: athlete is not assigned to this coach." }, { status: 403 });
    } else if (user.role !== "SUPER_ADMIN" && user.role !== "CLUB_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsedDistance = Number(distanceKm);
    const parsedDuration = Number(durationSeconds);
    const parsedPace = averagePaceSeconds === undefined ? Math.round(parsedDuration / parsedDistance) : Number(averagePaceSeconds);
    const parsedRpe = sessionRpe === undefined || sessionRpe === null || sessionRpe === "" ? null : Number(sessionRpe);
    const activityDate = date ? new Date(date) : new Date();
    if (!targetAthleteId || !Number.isFinite(parsedDistance) || parsedDistance <= 0 || !Number.isFinite(parsedDuration) || parsedDuration <= 0 || !Number.isFinite(parsedPace) || parsedPace <= 0) {
      return NextResponse.json({ error: "Distance, duration, and pace must be positive numbers." }, { status: 400 });
    }
    if ((parsedRpe !== null && (!Number.isInteger(parsedRpe) || parsedRpe < 1 || parsedRpe > 10)) || Number.isNaN(activityDate.getTime())) {
      return NextResponse.json({ error: "Invalid date or session RPE (expected 1-10)." }, { status: 400 });
    }

    const activity = await prisma.trainingActivity.create({
      data: {
        athleteId: targetAthleteId,
        date: activityDate,
        activityType: activityType || "RUN",
        distanceKm: parsedDistance,
        durationSeconds: parsedDuration,
        averagePaceSeconds: parsedPace,
        workoutType: workoutType || "EASY",
        surface: surface || "ROAD",
        sessionRpe: parsedRpe,
        athleteNotes: typeof athleteNotes === "string" ? athleteNotes.trim().slice(0, 2000) || null : null,
        source: "MANUAL",
        isLongRun: parsedDistance >= 25.0,
      },
    });

    await logAudit({ userId: user.userId, action: "CREATE", entityType: "TRAINING", entityId: activity.id, newValues: { athleteId: targetAthleteId, distanceKm: parsedDistance, durationSeconds: parsedDuration } });

    return NextResponse.json({ success: true, activity });
  } catch (error: any) {
    console.error("Training create error:", error);
    return NextResponse.json({ error: error.message || "Failed to log workout." }, { status: 500 });
  }
}
