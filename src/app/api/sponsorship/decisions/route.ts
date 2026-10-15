import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/auditLogger";
import { createNotification } from "@/lib/notifications/notificationService";

const SPONSORSHIP_TIERS = new Set([
  "ELITE",
  "PERFORMANCE",
  "DEVELOPMENT",
  "MAINTAIN",
  "CONDITIONAL",
  "REVIEW",
  "REDUCE",
  "NON_SPONSORED",
]);

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Only SUPER_ADMIN or SPONSORSHIP_COMMITTEE can record decisions
    if (user.role !== "SUPER_ADMIN" && user.role !== "SPONSORSHIP_COMMITTEE") {
      return NextResponse.json({ error: "Forbidden: insufficient permissions." }, { status: 403 });
    }

    const body = await req.json();
    const {
      athleteId,
      sponsorshipId,
      recommendedTier,
      actualTier,
      isOverridden,
      overrideReason,
      committeeNotes,
    } = body;

    if (typeof athleteId !== "string" || !athleteId.trim() || typeof actualTier !== "string") {
      return NextResponse.json({ error: "Missing athlete or decision tier." }, { status: 400 });
    }

    const normalizedAthleteId = athleteId.trim();
    const normalizedActualTier = actualTier.trim().toUpperCase();
    const normalizedRecommendedTier = typeof recommendedTier === "string"
      ? recommendedTier.trim().toUpperCase()
      : normalizedActualTier;
    const effectiveOverride = isOverridden === true;

    if (!SPONSORSHIP_TIERS.has(normalizedActualTier) || !SPONSORSHIP_TIERS.has(normalizedRecommendedTier)) {
      return NextResponse.json({ error: "Invalid sponsorship tier." }, { status: 400 });
    }

    if (sponsorshipId !== undefined && sponsorshipId !== null && (typeof sponsorshipId !== "string" || !sponsorshipId.trim())) {
      return NextResponse.json({ error: "Invalid sponsorship identifier." }, { status: 400 });
    }

    if (effectiveOverride && (typeof overrideReason !== "string" || !overrideReason.trim())) {
      return NextResponse.json(
        { error: "Mandatory justification reason required for recommendation override." },
        { status: 400 }
      );
    }

    const athlete = await prisma.athlete.findUnique({
      where: { id: normalizedAthleteId },
      include: { user: true },
    });
    if (!athlete) return NextResponse.json({ error: "Athlete not found." }, { status: 404 });

    const decision = await prisma.$transaction(async (tx) => {
      let spId: string;
      if (typeof sponsorshipId === "string") {
        const normalizedSponsorshipId = sponsorshipId.trim();
        const existingSponsorship = await tx.sponsorship.findUnique({
          where: { id: normalizedSponsorshipId },
          select: { id: true, athleteId: true },
        });
        if (!existingSponsorship) throw new Error("SPONSORSHIP_NOT_FOUND");
        if (existingSponsorship.athleteId !== normalizedAthleteId) throw new Error("SPONSORSHIP_ATHLETE_MISMATCH");
        await tx.sponsorship.update({
          where: { id: normalizedSponsorshipId },
          data: { currentTier: normalizedActualTier, updatedAt: new Date() },
        });
        spId = normalizedSponsorshipId;
      } else {
        const sponsorship = await tx.sponsorship.create({
          data: {
            athleteId: normalizedAthleteId,
            currentTier: normalizedActualTier,
            startDate: new Date(),
            status: "ACTIVE",
          },
        });
        spId = sponsorship.id;
      }

      return tx.sponsorshipDecision.create({
        data: {
          sponsorshipId: spId,
          athleteId: normalizedAthleteId,
          decidedById: user.userId,
          recommendedTier: normalizedRecommendedTier,
          actualTier: normalizedActualTier,
          isOverridden: effectiveOverride,
          overrideReason: effectiveOverride ? overrideReason.trim().slice(0, 2000) : null,
          committeeNotes: typeof committeeNotes === "string" ? committeeNotes.trim().slice(0, 4000) || null : null,
          decisionDate: new Date(),
        },
      });
    });

    // Immutable audit logging
    await logAudit({
      userId: user.userId,
      action: isOverridden ? "OVERRIDE" : "APPROVE",
      entityType: "SPONSORSHIP_DECISION",
      entityId: decision.id,
      newValues: { athleteId: normalizedAthleteId, recommendedTier: normalizedRecommendedTier, actualTier: normalizedActualTier, isOverridden: effectiveOverride, overrideReason },
    });

    // Notify athlete if linked account exists
    if (athlete?.userId) {
      await createNotification({
        userId: athlete.userId,
        title: "Sponsorship Decision Finalized",
        message: `Your club sponsorship status has been officially updated to ${normalizedActualTier}.`,
        notificationType: "SPONSORSHIP_DECISION",
        linkUrl: `/athletes/${athlete.id}`,
      });
    }

    return NextResponse.json({ success: true, decision });
  } catch (error: any) {
    if (error?.message === "SPONSORSHIP_NOT_FOUND") {
      return NextResponse.json({ error: "Sponsorship not found." }, { status: 404 });
    }
    if (error?.message === "SPONSORSHIP_ATHLETE_MISMATCH") {
      return NextResponse.json({ error: "Sponsorship does not belong to the selected athlete." }, { status: 400 });
    }
    console.error("Sponsorship decision error:", error);
    return NextResponse.json({ error: error.message || "Failed to record decision." }, { status: 500 });
  }
}
