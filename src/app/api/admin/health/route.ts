import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { runComprehensiveSystemHealthCheck } from "@/lib/health/healthCheckEngine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "SUPER_ADMIN" && user.role !== "CLUB_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only administrators can access system health diagnostics." },
        { status: 403 }
      );
    }

    const report = await runComprehensiveSystemHealthCheck();
    return NextResponse.json(report);
  } catch (error: any) {
    console.error("Health check error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute health check diagnostics." },
      { status: 500 }
    );
  }
}
