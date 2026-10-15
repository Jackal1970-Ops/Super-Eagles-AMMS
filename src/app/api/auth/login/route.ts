import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { isSessionRole, shouldUseSecureSessionCookie, signToken } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { athlete: true },
    });

    if (!user || !user.isActive || !isSessionRole(user.role)) {
      return NextResponse.json(
        { error: "Invalid credentials or inactive account." },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 }
      );
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

    // Production sessions must never travel over plaintext HTTP.
    response.cookies.set("se_ams_session", token, {
      httpOnly: true,
      secure: shouldUseSecureSessionCookie(req),
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    const message = error?.message ? `Login failed: ${error.message}` : "Internal server error occurred.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
