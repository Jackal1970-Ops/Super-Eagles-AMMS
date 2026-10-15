import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("pop") as File | null;
    const requestedAthleteId = formData.get("athleteId") as string | null;
    const athleteId = user.role === "ATHLETE" ? user.athleteId : requestedAthleteId;

    if (!file) {
      return NextResponse.json({ error: "No proof-of-payment file provided." }, { status: 400 });
    }

    if (!athleteId) {
      return NextResponse.json({ error: "Target athlete is required." }, { status: 400 });
    }

    if (user.role === "ATHLETE" && (!user.athleteId || (requestedAthleteId && requestedAthleteId !== user.athleteId))) {
      return NextResponse.json({ error: "Forbidden: athletes can only upload their own proof of payment." }, { status: 403 });
    }
    if (user.role === "COACH") {
      const assignment = await prisma.coachAssignment.findFirst({
        where: { athleteId, coachId: user.userId, status: "ACTIVE" },
        select: { id: true },
      });
      if (!assignment) {
        return NextResponse.json({ error: "Forbidden: athlete is not assigned to this coach." }, { status: 403 });
      }
    } else if (user.role !== "ATHLETE" && user.role !== "SUPER_ADMIN" && user.role !== "CLUB_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const athleteExists = await prisma.athlete.findUnique({ where: { id: athleteId }, select: { id: true } });
    if (!athleteExists) {
      return NextResponse.json({ error: "Athlete not found." }, { status: 404 });
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File exceeds 10MB size limit." }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "Uploaded file is empty." }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file format. Allowed formats: PDF, PNG, JPEG, and WebP." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Magic bytes signature verification
    const signatures: Record<string, (data: Buffer) => boolean> = {
      "image/jpeg": (data) => data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff,
      "image/png": (data) => data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
      "image/webp": (data) => data.length >= 12 && data.subarray(0, 4).toString("ascii") === "RIFF" && data.subarray(8, 12).toString("ascii") === "WEBP",
      "application/pdf": (data) => data.length >= 5 && data.subarray(0, 5).toString("ascii") === "%PDF-",
    };

    if (!signatures[file.type](buffer)) {
      return NextResponse.json({ error: "File contents do not match the declared file type." }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "pop");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const extensions: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
      "application/pdf": ".pdf",
    };

    const originalExt = path.extname(file.name);
    const sanitizedBase = path.basename(file.name, originalExt).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 25) || "pop_receipt";
    const uniqueFilename = `pop_${crypto.randomUUID()}_${sanitizedBase}${extensions[file.type]}`;
    const filePath = path.join(uploadDir, uniqueFilename);

    await fs.promises.writeFile(filePath, buffer, { flag: "wx" });
    const popUrl = `/uploads/pop/${uniqueFilename}`;

    return NextResponse.json({
      success: true,
      popUrl,
      fileName: file.name,
      fileSizeBytes: file.size,
    });
  } catch (error: any) {
    console.error("POP upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload proof of payment." },
      { status: 500 }
    );
  }
}
