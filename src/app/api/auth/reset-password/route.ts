import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, verification, newPassword } = await req.json();

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: "Email and new password are required." },
        { status: 400 }
      );
    }

    if (typeof newPassword !== "string" || newPassword.length < 8 || newPassword.length > 256) {
      return NextResponse.json(
        { error: "Password must contain between 8 and 256 characters." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { athlete: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No account found matching this email address." },
        { status: 404 }
      );
    }

    // Verification check:
    // Can match registered phone, emergency contact, or birth date (local-first offline security verification)
    let verified = false;
    const cleanVerification = String(verification || "").trim().toLowerCase();
    const normalizedDigits = cleanVerification.replace(/\D/g, "");

    if (cleanVerification) {
      // Check phone
      const userPhone = (user.phone || "").replace(/\D/g, "");
      const athletePhone = (user.athlete?.contactPhone || "").replace(/\D/g, "");

      if (normalizedDigits.length >= 7 && (userPhone === normalizedDigits || athletePhone === normalizedDigits)) {
        verified = true;
      }

      // Check birth date (e.g. 1995-04-12)
      if (user.athlete?.dateOfBirth) {
        const dobIso = user.athlete.dateOfBirth.toISOString().slice(0, 10);
        if (dobIso === cleanVerification || dobIso.replace(/-/g, "") === normalizedDigits) {
          verified = true;
        }
      }

    }

    if (!verified) {
      return NextResponse.json(
        {
          error:
            "Verification failed. Please enter your full registered phone number or date of birth (YYYY-MM-DD).",
        },
        { status: 400 }
      );
    }

    // Update password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "PASSWORD_RESET_SELF_SERVICE",
        entityType: "USER",
        entityId: user.id,
        newValuesJson: JSON.stringify({
          email: cleanEmail,
          timestamp: new Date().toISOString(),
          identityFactorVerified: true,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password successfully reset! You can now log in with your new password.",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error resetting password." },
      { status: 500 }
    );
  }
}
