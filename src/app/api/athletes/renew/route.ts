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

    // Only Admins can execute official annual membership dues renewal
    if (user.role !== "SUPER_ADMIN" && user.role !== "CLUB_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only Club Administrators may process annual membership renewals." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { athleteIds, targetYear } = body;

    // athleteIds can be a single string or an array of strings
    const ids: string[] = Array.isArray(athleteIds)
      ? athleteIds
      : typeof athleteIds === "string" && athleteIds
      ? [athleteIds]
      : [];

    if (ids.length === 0) {
      return NextResponse.json({ error: "No athlete IDs provided for renewal." }, { status: 400 });
    }

    // Determine target annual cycle expiry date: Dec 31 of chosen year (default: current or next year)
    const currentYear = new Date().getFullYear();
    const cycleYear = targetYear && Number.isInteger(Number(targetYear)) ? Number(targetYear) : currentYear;
    // Set to 23:59:59 on December 31st of the cycle year
    const renewalExpiry = new Date(Date.UTC(cycleYear, 11, 31, 23, 59, 59));

    const updatedAthletes: any[] = [];
    for (const id of ids) {
      const existing = await prisma.athlete.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!existing) continue;

      const updated = await prisma.athlete.update({
        where: { id },
        data: {
          membershipFeeStatus: "PAID",
          membershipStatus: "ACTIVE",
          membershipExpiry: renewalExpiry,
        },
      });

      // Audit Log
      await logAudit({
        userId: user.userId,
        action: "UPDATE",
        entityType: "ATHLETE",
        entityId: id,
        oldValues: {
          membershipFeeStatus: existing.membershipFeeStatus,
          membershipStatus: existing.membershipStatus,
          membershipExpiry: existing.membershipExpiry,
        },
        newValues: {
          membershipFeeStatus: "PAID",
          membershipStatus: "ACTIVE",
          membershipExpiry: renewalExpiry,
          renewalCycleYear: cycleYear,
        },
      });

      // If athlete has an active user account, issue an in-app notification
      if (existing.userId) {
        await prisma.notification.create({
          data: {
            userId: existing.userId,
            title: `Membership Dues Received for ${cycleYear}`,
            message: `Your Super Eagles membership fee for the ${cycleYear} season has been verified and settled. Annual cycle active through 31 Dec ${cycleYear}. All training, competition & wellness features unlocked!`,
            notificationType: "CONDITION_ALERT",
            linkUrl: `/athletes/${existing.id}?action=card`,
          },
        }).catch(() => {});
      }

      updatedAthletes.push(updated);
    }

    return NextResponse.json({
      success: true,
      count: updatedAthletes.length,
      cycleYear,
      renewalExpiry: renewalExpiry.toISOString(),
      message: `Successfully renewed ${updatedAthletes.length} member(s) for the ${cycleYear} annual cycle.`,
      athletes: updatedAthletes,
    });
  } catch (error: any) {
    console.error("POST athlete renew error:", error);
    return NextResponse.json({ error: error?.message || "Failed to process membership renewal." }, { status: 500 });
  }
}
