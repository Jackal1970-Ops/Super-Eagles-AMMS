import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getBackupConfig } from "@/lib/backup/backupEngine";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "SUPER_ADMIN" && user.role !== "CLUB_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only administrators can download backup archives." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get("file");

    if (!fileName) {
      return NextResponse.json({ error: "Missing file parameter." }, { status: 400 });
    }

    // Sanitize fileName to prevent directory traversal
    const safeFileName = path.basename(fileName);
    const config = await getBackupConfig();
    const filePath = path.resolve(config.targetDirectory, safeFileName);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Backup file not found." }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const isSqlite = safeFileName.endsWith(".sqlite.bak");

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": isSqlite ? "application/octet-stream" : "application/json",
        "Content-Disposition": `attachment; filename="${safeFileName}"`,
      },
    });
  } catch (error: any) {
    console.error("Download backup error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to download backup file." },
      { status: 500 }
    );
  }
}
