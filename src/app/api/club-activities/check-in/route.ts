import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/auditLogger";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const { activityId, athleteId, action } = await req.json();

    if (!activityId) {
      return NextResponse.json({ error: "Activity ID is required." }, { status: 400 });
    }

    // Determine athlete: if role is ATHLETE, use their assigned athleteId; otherwise use provided athleteId or find user's athlete
    let targetAthleteId = athleteId;
    if (user.role === "ATHLETE" && user.athleteId) {
      targetAthleteId = user.athleteId;
    } else if (!targetAthleteId) {
      // Look up athlete by user id
      const ath = await prisma.athlete.findFirst({
        where: { userId: user.userId },
      });
      targetAthleteId = ath?.id;
    }

    if (!targetAthleteId) {
      return NextResponse.json(
        { error: "No associated athlete profile found for check-in." },
        { status: 400 }
      );
    }

    if (user.role !== "ATHLETE" && user.role !== "SUPER_ADMIN" && user.role !== "CLUB_ADMIN") {
      return NextResponse.json({ error: "Forbidden: attendance may only be self-recorded or managed by an administrator." }, { status: 403 });
    }

    if (action && action !== "CHECK_IN" && action !== "CANCEL") {
      return NextResponse.json({ error: "Invalid attendance action." }, { status: 400 });
    }

    const activity = await prisma.clubActivity.findUnique({
      where: { id: activityId },
    });

    if (!activity) {
      return NextResponse.json({ error: "Club activity not found." }, { status: 404 });
    }

    // Check if already checked in
    const existing = await prisma.clubAttendance.findFirst({
      where: {
        clubActivityId: activityId,
        athleteId: targetAthleteId,
      },
    });

    if (action === "CANCEL" && existing) {
      await prisma.clubAttendance.delete({
        where: { id: existing.id },
      });

      await logAudit({
        userId: user.userId,
        action: "DELETE",
        entityType: "ATHLETE",
        entityId: targetAthleteId,
        oldValues: { clubActivityId: activityId, status: "CANCELLED_CHECKIN" },
      });

      return NextResponse.json({
        success: true,
        status: "CANCELLED",
        message: "Attendance registration cancelled.",
      });
    }

    if (existing) {
      return NextResponse.json({
        success: true,
        status: "ALREADY_CHECKED_IN",
        attendance: existing,
        message: `Already registered as attended at ${existing.checkInTime ? new Date(existing.checkInTime).toLocaleTimeString() : "earlier"}.`,
      });
    }

    // Record check-in
    const attendance = await prisma.clubAttendance.create({
      data: {
        clubActivityId: activityId,
        athleteId: targetAthleteId,
        attended: true,
        checkInTime: new Date(),
        recordedBy: user.role === "ATHLETE" ? "MEMBER_SELF_CHECKIN" : `OFFICIAL_${user.name}`,
        notes: `Member confirmed attendance for ${activity.title}`,
      },
    });

    await logAudit({
      userId: user.userId,
      action: "CREATE",
      entityType: "ATHLETE",
      entityId: targetAthleteId,
      newValues: {
        clubActivityId: activityId,
        activityTitle: activity.title,
        pointsAwarded: activity.pointsValue,
        recordedBy: attendance.recordedBy,
      },
    });

    return NextResponse.json({
      success: true,
      status: "CONFIRMED",
      attendance,
      pointsAwarded: activity.pointsValue,
      message: `✓ Attendance confirmed! ${activity.pointsValue} club loyalty points recorded toward your CCLI.`,
    });
  } catch (error: any) {
    console.error("Member check-in error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record member attendance." },
      { status: 500 }
    );
  }
}
