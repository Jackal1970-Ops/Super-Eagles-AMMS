import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/auditLogger";

const COACHING_ROLES = new Set(["SUPER_ADMIN", "COACH", "CLUB_ADMIN"]);

function optionalBoundedNumber(value: unknown, min: number, max: number): number | null | undefined {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : undefined;
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role === "SPONSORSHIP_COMMITTEE") {
      return NextResponse.json({ error: "Forbidden: wellness data is restricted." }, { status: 403 });
    }

    const body = await req.json();
    const requestedAthleteId = typeof body.athleteId === "string" ? body.athleteId : "";
    const athleteId = user.role === "ATHLETE" ? user.athleteId : requestedAthleteId;

    if (!athleteId || (user.role === "ATHLETE" && requestedAthleteId && requestedAthleteId !== user.athleteId)) {
      return NextResponse.json({ error: "Invalid athlete scope." }, { status: 403 });
    }

    if (user.role === "ATHLETE") {
      // Arrears Payment Gatekeeper: Athletes with pending/lapsed dues cannot upload wellness data
      const athleteRecord = await prisma.athlete.findUnique({
        where: { id: athleteId },
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
            error: "Membership in arrears: Annual club dues are pending. Wellness check-ins are locked until membership renewal is settled.",
            membershipFeeStatus: athleteRecord.membershipFeeStatus,
            membershipStatus: athleteRecord.membershipStatus,
          },
          { status: 403 }
        );
      }
    } else if (user.role === "COACH") {
      const assignment = await prisma.coachAssignment.findFirst({
        where: { athleteId, coachId: user.userId, status: "ACTIVE" },
        select: { id: true },
      });
      if (!assignment) return NextResponse.json({ error: "Forbidden: athlete is not assigned to this coach." }, { status: 403 });
    } else if (!COACHING_ROLES.has(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sleepQuality = optionalBoundedNumber(body.sleepQuality, 1, 5);
    const sleepDurationHours = optionalBoundedNumber(body.sleepDurationHours, 0, 24);
    const fatigueLevel = optionalBoundedNumber(body.fatigueLevel, 1, 5);
    const muscleSoreness = optionalBoundedNumber(body.muscleSoreness, 1, 5);
    const stressLevel = optionalBoundedNumber(body.stressLevel, 1, 5);
    const restingHeartRate = optionalBoundedNumber(body.restingHeartRate, 20, 250);
    const values = [sleepQuality, sleepDurationHours, fatigueLevel, muscleSoreness, stressLevel, restingHeartRate];
    if (values.some((value) => value === undefined)) {
      return NextResponse.json({ error: "One or more wellness values are outside the accepted range." }, { status: 400 });
    }

    const date = body.date ? new Date(body.date) : new Date();
    if (Number.isNaN(date.getTime())) return NextResponse.json({ error: "Invalid wellness date." }, { status: 400 });

    const entry = await prisma.wellnessEntry.create({
      data: {
        athleteId,
        date,
        sleepQuality,
        sleepDurationHours,
        fatigueLevel,
        muscleSoreness,
        stressLevel,
        restingHeartRate,
        notes: typeof body.notes === "string" ? body.notes.trim().slice(0, 2000) || null : null,
      },
    });

    await logAudit({
      userId: user.userId,
      action: "CREATE",
      entityType: "WELLNESS",
      entityId: entry.id,
      newValues: { athleteId, date: entry.date },
    });

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error("Wellness create error:", error);
    return NextResponse.json({ error: "Failed to record wellness check-in." }, { status: 500 });
  }
}
