import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { runSystemQualityAssuranceAudit } from "@/lib/qa/qualityAssuranceLayer";
import { runAuthoritativeMathematicalBenchmarks } from "@/lib/analytics/authoritativeBenchmarks";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "SUPER_ADMIN" && user.role !== "CLUB_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only administrators can access quality assurance reports." },
        { status: 403 }
      );
    }

    const qaAudit = await runSystemQualityAssuranceAudit();
    const mathBenchmarks = runAuthoritativeMathematicalBenchmarks();

    return NextResponse.json({ qaAudit, mathBenchmarks });
  } catch (error: any) {
    console.error("QA audit error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute Quality Assurance audit." },
      { status: 500 }
    );
  }
}
