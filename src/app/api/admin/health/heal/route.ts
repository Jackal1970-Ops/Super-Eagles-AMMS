import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { executeSelfHealing } from "@/lib/health/selfHealing";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "SUPER_ADMIN" && user.role !== "CLUB_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only administrators can trigger automated system self-healing." },
        { status: 403 }
      );
    }

    const report = await executeSelfHealing(user.userId);
    return NextResponse.json(report);
  } catch (error: any) {
    console.error("Self-healing error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute automated self-healing." },
      { status: 500 }
    );
  }
}
