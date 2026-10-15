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
      raceEditionId,
      raceName,
      date,
      distanceKm,
      officialTimeSeconds,
      verificationStatus,
      bibNumber,
      certificateUrl,
      officialResultsUrl,
      notes,
    } = body;

    if (!athleteId || !raceName || !distanceKm || !officialTimeSeconds) {
      return NextResponse.json({ error: "Missing required result fields." }, { status: 400 });
    }

    let targetAthleteId = typeof athleteId === "string" ? athleteId : "";
    if (user.role === "ATHLETE") {
      if (!user.athleteId || (targetAthleteId && targetAthleteId !== user.athleteId)) {
        return NextResponse.json({ error: "Forbidden: athletes may only submit their own results." }, { status: 403 });
      }
      targetAthleteId = user.athleteId;

      // Arrears Payment Gatekeeper: Athletes with pending/lapsed dues cannot upload race results
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
            error: "Membership in arrears: Annual club dues are pending. Official race result submission is locked until membership renewal is settled.",
            membershipFeeStatus: athleteRecord.membershipFeeStatus,
            membershipStatus: athleteRecord.membershipStatus,
          },
          { status: 403 }
        );
      }
    } else if (user.role === "COACH") {
      const assignment = await prisma.coachAssignment.findFirst({ where: { athleteId: targetAthleteId, coachId: user.userId, status: "ACTIVE" }, select: { id: true } });
      if (!assignment) return NextResponse.json({ error: "Forbidden: athlete is not assigned to this coach." }, { status: 403 });
    } else if (user.role !== "SUPER_ADMIN" && user.role !== "CLUB_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const dist = Number(distanceKm);
    const timeSec = Number(officialTimeSeconds);
    const resultDate = date ? new Date(date) : new Date();
    if (!targetAthleteId || typeof raceName !== "string" || !raceName.trim() || !Number.isFinite(dist) || dist <= 0 || !Number.isInteger(timeSec) || timeSec <= 0 || Number.isNaN(resultDate.getTime())) {
      return NextResponse.json({ error: "Invalid race result values." }, { status: 400 });
    }
    if (verificationStatus !== undefined && !["VERIFIED", "PENDING_VERIFICATION"].includes(verificationStatus)) {
      return NextResponse.json({ error: "Invalid verification status." }, { status: 400 });
    }
    if (certificateUrl !== undefined && certificateUrl !== null && certificateUrl !== "" &&
        (typeof certificateUrl !== "string" || !/^\/uploads\/certificates\/cert_[A-Za-z0-9_-]+\.(?:jpg|png|webp|pdf)$/.test(certificateUrl))) {
      return NextResponse.json({ error: "Invalid certificate upload reference." }, { status: 400 });
    }
    if (officialResultsUrl) {
      try {
        const parsedUrl = new URL(String(officialResultsUrl));
        if (!["http:", "https:"].includes(parsedUrl.protocol) || parsedUrl.username || parsedUrl.password) throw new Error();
      } catch {
        return NextResponse.json({ error: "Official results URL must be a valid HTTP or HTTPS address." }, { status: 400 });
      }
    }

    const [athleteExists, editionExists] = await Promise.all([
      prisma.athlete.findUnique({ where: { id: targetAthleteId }, select: { id: true } }),
      raceEditionId ? prisma.raceEdition.findUnique({ where: { id: raceEditionId }, select: { id: true } }) : Promise.resolve({ id: "none" }),
    ]);
    if (!athleteExists) return NextResponse.json({ error: "Athlete not found." }, { status: 404 });
    if (raceEditionId && !editionExists) return NextResponse.json({ error: "Race edition not found." }, { status: 404 });
    const effectiveVerification = user.role === "ATHLETE" ? "PENDING_VERIFICATION" : (verificationStatus === "PENDING_VERIFICATION" ? verificationStatus : "VERIFIED");

    // Check if this is a personal best for this distance
    const priorBests = await prisma.raceResult.findMany({
      where: {
        athleteId: targetAthleteId,
        distanceKm: { gte: dist - 0.5, lte: dist + 0.5 },
        verificationStatus: "VERIFIED",
      },
      orderBy: { officialTimeSeconds: "asc" },
      take: 1,
    });

    const isPB = effectiveVerification === "VERIFIED" && (priorBests.length === 0 || timeSec < priorBests[0].officialTimeSeconds);

    const result = await prisma.$transaction(async (tx) => {
      if (isPB) {
        await tx.raceResult.updateMany({ where: { athleteId: targetAthleteId, distanceKm: { gte: dist - 0.5, lte: dist + 0.5 }, isPersonalBest: true }, data: { isPersonalBest: false } });
      }
      return tx.raceResult.create({ data: {
        athleteId: targetAthleteId,
        raceEditionId: raceEditionId || null,
        raceName: raceName.trim().slice(0, 300),
        date: resultDate,
        distanceKm: dist,
        officialTimeSeconds: timeSec,
        source: user.role === "ATHLETE" ? "SELF_REPORTED" : "OFFICIAL_TIMING",
        verificationStatus: effectiveVerification,
        isPersonalBest: isPB,
        bibNumber: typeof bibNumber === "string" ? bibNumber.trim().slice(0, 50) || null : null,
        certificateUrl: typeof certificateUrl === "string" ? certificateUrl.trim().slice(0, 2000) || null : null,
        officialResultsUrl: typeof officialResultsUrl === "string" ? officialResultsUrl.trim().slice(0, 2000) || null : null,
        notes: typeof notes === "string" ? notes.trim().slice(0, 2000) || null : null,
      } });
    });

    // Audit log
    await logAudit({
      userId: user.userId,
      action: "CREATE",
      entityType: "RACE_RESULT",
      entityId: result.id,
      newValues: { athleteId: targetAthleteId, raceName, distanceKm: dist, officialTimeSeconds: timeSec, isPB, verificationStatus: effectiveVerification },
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Race result create error:", error);
    return NextResponse.json({ error: error.message || "Failed to record result." }, { status: 500 });
  }
}
