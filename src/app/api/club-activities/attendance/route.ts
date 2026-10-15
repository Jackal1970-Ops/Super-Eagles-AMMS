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

    if (user.role !== "SUPER_ADMIN" && user.role !== "CLUB_ADMIN") {
      return NextResponse.json({ error: "Forbidden: administrator access required." }, { status: 403 });
    }

    const { activityId, attendedAthleteIds } = await req.json();

    if (!activityId || !Array.isArray(attendedAthleteIds)) {
      return NextResponse.json({ error: "Invalid attendance parameters." }, { status: 400 });
    }

    const activity = await prisma.clubActivity.findUnique({ where: { id: activityId } });
    if (!activity) {
      return NextResponse.json({ error: "Club activity not found." }, { status: 404 });
    }

    const uniqueAthleteIds = [...new Set(attendedAthleteIds.filter((id): id is string => typeof id === "string" && id.length > 0))];
    const matchingAthletes = await prisma.athlete.count({ where: { id: { in: uniqueAthleteIds } } });
    if (matchingAthletes !== uniqueAthleteIds.length) {
      return NextResponse.json({ error: "One or more athlete IDs are invalid." }, { status: 400 });
    }

    // Create bulk attendance
    const records = uniqueAthleteIds.map((athId: string) => ({
      clubActivityId: activityId,
      athleteId: athId,
      attended: true,
      checkInTime: new Date(),
      recordedBy: user.name,
    }));

    await prisma.$transaction(async (tx) => {
      await tx.clubAttendance.deleteMany({ where: { clubActivityId: activityId } });
      if (records.length > 0) await tx.clubAttendance.createMany({ data: records });
    });

    await logAudit({
      userId: user.userId,
      action: "UPDATE",
      entityType: "ATHLETE",
      entityId: activityId,
      newValues: { attendedCount: records.length },
    });

    return NextResponse.json({ success: true, count: records.length });
  } catch (error: any) {
    console.error("Bulk attendance error:", error);
    return NextResponse.json({ error: error.message || "Failed to save attendance." }, { status: 500 });
  }
}
