import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { restoreSystemBackup } from "@/lib/backup/backupEngine";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only General Manager / Super Admin may restore system backups." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { backupFileName, customDirectory } = body;

    if (!backupFileName || typeof backupFileName !== "string") {
      return NextResponse.json({ error: "backupFileName is required." }, { status: 400 });
    }

    // Sanitize fileName to prevent directory traversal
    const sanitized = backupFileName.replace(/[^a-zA-Z0-9_.-]/g, "");
    if (sanitized !== backupFileName || backupFileName.includes("..")) {
      return NextResponse.json({ error: "Invalid backup file name." }, { status: 400 });
    }

    const result = await restoreSystemBackup(backupFileName, customDirectory, user.userId);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error("Backup restoration error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to restore system backup." },
      { status: 500 }
    );
  }
}
