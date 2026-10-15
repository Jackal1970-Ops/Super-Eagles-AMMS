import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/auditLogger";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === "ATHLETE" && !user.athleteId) {
      return NextResponse.json({ athletes: [] });
    }

    const where = user.role === "ATHLETE"
      ? { id: user.athleteId }
      : user.role === "COACH"
        ? { coachAssignments: { some: { coachId: user.userId, status: "ACTIVE" } } }
        : {};

    const athletes = await prisma.athlete.findMany({
      where,
      include: {
        coachAssignments: {
          where: { status: "ACTIVE" },
          include: {
            coach: { select: { id: true, email: true, name: true, phone: true, avatarUrl: true, isActive: true } },
          },
        },
        sponsorships: {
          where: { status: "ACTIVE" },
        },
      },
      orderBy: { athleteNumber: "asc" },
    });

    return NextResponse.json({ athletes });
  } catch (error) {
    console.error("GET athletes error:", error);
    return NextResponse.json({ error: "Failed to fetch athletes." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Only SUPER_ADMIN and CLUB_ADMIN can register athletes
    if (user.role !== "SUPER_ADMIN" && user.role !== "CLUB_ADMIN") {
      return NextResponse.json({ error: "Forbidden: insufficient permissions." }, { status: 403 });
    }

    const body = await req.json();
    const {
      athleteNumber,
      firstName,
      lastName,
      preferredName,
      dateOfBirth,
      gender,
      contactEmail,
      contactPhone,
      membershipStartDate,
      athleteStatus,
      primaryDiscipline,
      coachId,
      targetRaceName,
      targetTimeSeconds,
      targetDate,
    } = body;

    if (!athleteNumber || !firstName || !lastName || !contactEmail || !dateOfBirth) {
      return NextResponse.json({ error: "Missing required identification fields." }, { status: 400 });
    }

    // Check duplicate athlete number
    const existing = await prisma.athlete.findUnique({
      where: { athleteNumber: athleteNumber.trim() },
    });
    if (existing) {
      return NextResponse.json({ error: "Athlete number already registered." }, { status: 400 });
    }

    const birthDate = new Date(dateOfBirth);
    const memberSince = membershipStartDate ? new Date(membershipStartDate) : new Date();
    if (Number.isNaN(birthDate.getTime()) || Number.isNaN(memberSince.getTime()) || birthDate >= new Date()) {
      return NextResponse.json({ error: "Invalid birth or membership date." }, { status: 400 });
    }
    if (coachId) {
      const coach = await prisma.user.findFirst({ where: { id: coachId, role: "COACH", isActive: true }, select: { id: true } });
      if (!coach) return NextResponse.json({ error: "Selected coach is invalid or inactive." }, { status: 400 });
    }

    const athlete = await prisma.$transaction(async (tx) => {
      const created = await tx.athlete.create({ data: {
        athleteNumber: athleteNumber.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        preferredName: preferredName?.trim() || null,
        dateOfBirth: birthDate,
        gender: gender || "MALE",
        contactEmail: contactEmail.toLowerCase().trim(),
        contactPhone: contactPhone || null,
        membershipStartDate: memberSince,
        athleteStatus: athleteStatus || "DEVELOPMENT",
        primaryDiscipline: primaryDiscipline || "MARATHON",
        membershipStatus: "ACTIVE",
      } });

      if (coachId) {
        await tx.coachAssignment.create({
        data: {
          athleteId: created.id,
          coachId: coachId,
          status: "ACTIVE",
        },
        });
      }

      if (targetRaceName) {
        const goalDate = targetDate ? new Date(targetDate) : new Date("2026-10-18");
        const goalSeconds = Number(targetTimeSeconds) || 10800;
        if (Number.isNaN(goalDate.getTime()) || !Number.isInteger(goalSeconds) || goalSeconds <= 0) throw new Error("INVALID_GOAL");
        await tx.athleteGoal.create({
        data: {
          athleteId: created.id,
          targetRaceName: String(targetRaceName).trim(),
          targetDate: goalDate,
          targetTimeSeconds: goalSeconds,
          status: "IN_PROGRESS",
        },
        });
      }
      return created;
    });

    // Log immutable audit record
    await logAudit({
      userId: user.userId,
      action: "CREATE",
      entityType: "ATHLETE",
      entityId: athlete.id,
      newValues: { athleteNumber, firstName, lastName, contactEmail, athleteStatus },
    });

    return NextResponse.json({ success: true, athlete });
  } catch (error: any) {
    console.error("Create athlete error:", error);
    if (error?.message === "INVALID_GOAL") return NextResponse.json({ error: "Invalid target goal date or time." }, { status: 400 });
    return NextResponse.json({ error: "Failed to create athlete." }, { status: 500 });
  }
}
