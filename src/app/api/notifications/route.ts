import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user notifications
    const notifications = await prisma.notification.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: user.userId, isRead: false },
    });

    // Check membership dues status if user is an athlete
    let arrearsAlert: any = null;
    if (user.role === "ATHLETE" && user.athleteId) {
      const athlete = await prisma.athlete.findUnique({
        where: { id: user.athleteId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          membershipStatus: true,
          membershipFeeStatus: true,
          membershipExpiry: true,
          athleteNumber: true,
        },
      });

      if (athlete) {
        const isArrears =
          athlete.membershipFeeStatus !== "PAID" &&
          athlete.membershipFeeStatus !== "EXEMPT" &&
          athlete.membershipFeeStatus !== "SUBSIDIZED";

        if (isArrears) {
          arrearsAlert = {
            title: "Membership Payment Overdue",
            message: `Annual club dues for #${athlete.athleteNumber} are pending. Uploading workout sessions, wellness logs, and race results is locked until membership is renewed.`,
            status: athlete.membershipStatus,
            feeStatus: athlete.membershipFeeStatus,
            expiry: athlete.membershipExpiry,
          };
        }
      }
    }

    // For admins, count total members with pending dues
    let adminArrearsCount = 0;
    if (user.role === "SUPER_ADMIN" || user.role === "CLUB_ADMIN") {
      adminArrearsCount = await prisma.athlete.count({
        where: {
          OR: [
            { membershipFeeStatus: "PENDING" },
            { membershipStatus: "PENDING_RENEWAL" },
            { membershipStatus: "LAPSED" },
          ],
        },
      });
    }

    return NextResponse.json({
      notifications,
      unreadCount,
      arrearsAlert,
      adminArrearsCount,
    });
  } catch (error: any) {
    console.error("GET notifications error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { notificationId, markAllAsRead } = body;

    if (markAllAsRead) {
      await prisma.notification.updateMany({
        where: { userId: user.userId, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, message: "All notifications marked as read." });
    }

    if (notificationId) {
      if (typeof notificationId !== "string") {
        return NextResponse.json({ error: "Invalid notification ID." }, { status: 400 });
      }
      const result = await prisma.notification.updateMany({
        where: { id: notificationId, userId: user.userId },
        data: { isRead: true },
      });
      if (result.count === 0) {
        return NextResponse.json({ error: "Notification not found." }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: "Notification marked as read." });
    }

    return NextResponse.json({ error: "Invalid notification payload." }, { status: 400 });
  } catch (error: any) {
    console.error("PATCH notifications error:", error);
    return NextResponse.json({ error: "Failed to update notification." }, { status: 500 });
  }
}
