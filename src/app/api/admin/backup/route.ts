import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getBackupConfig,
  saveBackupConfig,
  createSystemBackup,
  listBackups,
} from "@/lib/backup/backupEngine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "SUPER_ADMIN" && user.role !== "CLUB_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only administrators can access backup controls." },
        { status: 403 }
      );
    }

    const config = await getBackupConfig();
    const backups = listBackups(config.targetDirectory);

    return NextResponse.json({ config, backups });
  } catch (error: any) {
    console.error("Fetch backups error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch backups." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "SUPER_ADMIN" && user.role !== "CLUB_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only administrators can execute backups." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const customDirectory = typeof body.targetDirectory === "string" ? body.targetDirectory.trim() : undefined;

    const result = await createSystemBackup(customDirectory);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Execute backup error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create system backup." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only Super Administrators can modify auto-backup configuration." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updated = await saveBackupConfig(body);

    return NextResponse.json({ success: true, config: updated });
  } catch (error: any) {
    if (error?.message === "INVALID_BACKUP_CONFIG") {
      return NextResponse.json({ error: "Invalid backup configuration." }, { status: 400 });
    }
    console.error("Update backup config error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update backup configuration." },
      { status: 500 }
    );
  }
}
