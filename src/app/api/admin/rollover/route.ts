import { NextResponse } from "next/server";
import { previewSeasonRollover, executeSeasonRollover } from "@/lib/rollover/seasonRolloverEngine";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

async function requireRolloverAdmin() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (user.role !== "SUPER_ADMIN" && user.role !== "CLUB_ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden: administrator access required." }, { status: 403 }) };
  }
  return { user };
}

export async function GET(request: Request) {
  try {
    const auth = await requireRolloverAdmin();
    if (auth.error) return auth.error;
    const { searchParams } = new URL(request.url);
    const targetSeason = searchParams.get("targetSeason") || undefined;
    const history = searchParams.get("history") === "true";

    if (history) {
      const archives = await prisma.seasonArchive.findMany({
        orderBy: { archivedAt: "desc" },
        take: 20
      });
      return NextResponse.json({ success: true, archives });
    }

    const preview = await previewSeasonRollover(targetSeason);
    return NextResponse.json({ success: true, preview });
  } catch (error: any) {
    console.error("Rollover preview error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to preview season rollover" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRolloverAdmin();
    if (auth.error) return auth.error;
    const body = await request.json();
    const { targetSeason } = body;

    if (!targetSeason) {
      return NextResponse.json(
        { success: false, error: "targetSeason is required (e.g., '2026' or '2026/2027')" },
        { status: 400 }
      );
    }

    const result = await executeSeasonRollover(String(targetSeason).trim(), auth.user.name);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Rollover execution error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute season rollover" },
      { status: 500 }
    );
  }
}
