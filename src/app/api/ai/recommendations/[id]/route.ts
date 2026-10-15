import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "SUPER_ADMIN" && user.role !== "COACH") {
      return NextResponse.json({ error: "Forbidden: coach access required." }, { status: 403 });
    }

    const resolvedParams = await params;
    const recId = resolvedParams.id;
    const body = await req.json();
    const { status, coachFeedback, modifiedRecommendation } = body;

    const allowedStatuses = ["PROPOSED", "APPROVED_BY_COACH", "MODIFIED_BY_COACH", "REJECTED_BY_COACH", "COMPLETED"];
    if (status !== undefined && !allowedStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid recommendation status." }, { status: 400 });
    }

    const existing = await prisma.aIRecommendation.findUnique({ where: { id: recId }, select: { id: true, athleteId: true } });
    if (!existing) return NextResponse.json({ error: "Recommendation not found." }, { status: 404 });
    if (user.role === "COACH") {
      const assignment = await prisma.coachAssignment.findFirst({ where: { athleteId: existing.athleteId, coachId: user.userId, status: "ACTIVE" }, select: { id: true } });
      if (!assignment) return NextResponse.json({ error: "Forbidden: athlete is not assigned to this coach." }, { status: 403 });
    }

    const updated = await prisma.aIRecommendation.update({
      where: { id: recId },
      data: {
        status: status || undefined,
        coachFeedback: typeof coachFeedback === "string" ? coachFeedback.trim().slice(0, 4000) || null : undefined,
        modifiedRecommendation: typeof modifiedRecommendation === "string" ? modifiedRecommendation.trim().slice(0, 4000) || null : undefined,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, recommendation: updated });
  } catch (error: any) {
    console.error("Update AI recommendation error:", error);
    return NextResponse.json({ error: error.message || "Failed to update recommendation." }, { status: 500 });
  }
}
