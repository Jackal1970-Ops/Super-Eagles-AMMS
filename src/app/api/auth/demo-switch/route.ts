import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSessionRole, shouldUseSecureSessionCookie, signToken } from "@/lib/auth/session";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    const demoSwitchEnabled =
      process.env.NODE_ENV !== "production" || process.env.ENABLE_DEMO_ROLE_SWITCH === "true";

    if (!demoSwitchEnabled) {
      return NextResponse.json({ error: "Demo role switching is disabled." }, { status: 403 });
    }

    const { email } = await req.json();

    if (typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Canonical demo personas available in the UI
    const DEMO_EMAILS = new Set([
      "admin@supereagles.co.za",
      "coach.hendrik@supereagles.co.za",
      "athlete.sipho@supereagles.co.za",
      "admin.club@supereagles.co.za",
      "committee@supereagles.co.za",
    ]);

    // Allow switching if user is SUPER_ADMIN, OR if switching to one of the 5 canonical demo accounts
    if (currentUser?.role !== "SUPER_ADMIN" && !DEMO_EMAILS.has(cleanEmail)) {
      return NextResponse.json(
        { error: "Forbidden: role switcher is restricted to official demo personas." },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { athlete: true },
    });

    if (!user || !user.isActive || !isSessionRole(user.role)) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      athleteId: user.athlete?.id,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        athleteId: user.athlete?.id,
      },
    });

    response.cookies.set("se_ams_session", token, {
      httpOnly: true,
      secure: shouldUseSecureSessionCookie(req),
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Demo switch error:", error);
    return NextResponse.json({ error: "Failed to switch role." }, { status: 500 });
  }
}
