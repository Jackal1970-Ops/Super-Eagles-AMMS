import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken, shouldUseSecureSessionCookie } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      firstName,
      lastName,
      preferredName,
      email,
      password,
      gender = "MALE",
      dateOfBirth,
      contactPhone,
      membershipCategory = "SENIOR_RUNNER",
      disciplineCategory = "RUNNER",
      primaryDiscipline = "MARATHON",
      emergencyContact,
      asaLicenseNumber,
    } = body;

    // Strict validation
    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json(
        { error: "First and last name are required." },
        { status: 400 }
      );
    }

    if (!email?.trim() || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 8 || password.length > 256) {
      return NextResponse.json(
        { error: "Password must contain between 8 and 256 characters." },
        { status: 400 }
      );
    }

    if (!dateOfBirth) {
      return NextResponse.json(
        { error: "Date of birth is required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please log in instead." },
        { status: 400 }
      );
    }

    // Determine sequential athleteNumber (e.g. SEA-001, SEA-017...)
    const athletes = await prisma.athlete.findMany({
      select: { athleteNumber: true },
    });

    let maxNum = 0;
    for (const a of athletes) {
      const match = a.athleteNumber.match(/SEA-(\d+)/i);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    }
    const nextNum = maxNum + 1;
    const athleteNumber = `SEA-${nextNum.toString().padStart(3, "0")}`;

    // Hash chosen password
    const passwordHash = await bcrypt.hash(password, 10);
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime()) || dob >= new Date()) {
      return NextResponse.json({ error: "Enter a valid date of birth in the past." }, { status: 400 });
    }

    const currentYear = new Date().getFullYear();
    const annualExpiry = new Date(currentYear, 11, 31, 23, 59, 59);

    // Create User and Athlete atomically
    const newUser = await prisma.user.create({
      data: {
        email: cleanEmail,
        name: fullName,
        passwordHash,
        role: "ATHLETE",
        phone: contactPhone || null,
        isActive: true,
        athlete: {
          create: {
            athleteNumber,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            preferredName: preferredName?.trim() || null,
            dateOfBirth: dob,
            gender,
            contactEmail: cleanEmail,
            contactPhone: contactPhone || null,
            membershipStartDate: new Date(),
            membershipStatus: "ACTIVE",
            membershipCategory,
            disciplineCategory,
            primaryDiscipline,
            athleteStatus: "DEVELOPMENT",
            membershipFeeStatus: "PENDING", // Pending annual fee payment
            membershipExpiry: annualExpiry,
            emergencyContact: emergencyContact?.trim() || null,
            asaLicenseNumber: asaLicenseNumber?.trim() || null,
          },
        },
      },
      include: {
        athlete: true,
      },
    });

    // Create Welcome Notification
    await prisma.notification.create({
      data: {
        userId: newUser.id,
        title: "Welcome to Super Eagles Athletics Club!",
        message: `Your membership profile has been created. Your Club ID is ${athleteNumber}. Please check the Payments section to arrange your annual membership dues.`,
        notificationType: "WELCOME",
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: newUser.id,
        action: "MEMBER_SELF_REGISTRATION",
        entityType: "ATHLETE",
        entityId: newUser.athlete?.id || newUser.id,
        newValuesJson: JSON.stringify({
          athleteNumber,
          name: fullName,
          email: cleanEmail,
          membershipCategory,
          annualCycle: currentYear,
          registrationDate: new Date().toISOString(),
        }),
      },
    });

    // Sign JWT Session Token
    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: "ATHLETE",
      athleteId: newUser.athlete?.id,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        athleteId: newUser.athlete?.id,
      },
      athleteNumber,
      message: `Welcome to Super Eagles! Your Member ID is ${athleteNumber}.`,
    });

    // Set secure auth cookie so user is immediately logged in
    response.cookies.set("se_ams_session", token, {
      httpOnly: true,
      secure: shouldUseSecureSessionCookie(req),
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Member registration error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during registration." },
      { status: 500 }
    );
  }
}
