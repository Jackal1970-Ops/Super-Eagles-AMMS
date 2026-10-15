import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/auditLogger";

const WEIGHT_KEYS: Record<string, string[]> = {
  SCORING_WEIGHTS_PERFORMANCE: ["verifiedPerformanceWeight", "improvementWeight", "targetCapabilityWeight", "reliabilityWeight"],
  SCORING_WEIGHTS_SPONSORSHIP: ["verifiedPerformanceWeight", "improvementWeight", "futurePotentialWeight", "reliabilityWeight", "clubContributionWeight", "complianceWeight"],
};

function validateConfiguration(configKey: unknown, rawValue: unknown): { key: string; value: string } | null {
  if (typeof configKey !== "string" || typeof rawValue !== "string" || rawValue.length > 20_000) return null;
  const key = configKey.trim();
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(rawValue);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;

  const weightKeys = WEIGHT_KEYS[key];
  if (weightKeys) {
    const values = weightKeys.map((name) => parsed[name]);
    if (values.some((value) => typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1)) return null;
    const total = (values as number[]).reduce((sum, value) => sum + value, 0);
    if (Math.abs(total - 1) > 0.000001) return null;
  } else if (key === "POLICY_MATRIX_THRESHOLDS") {
    if (typeof parsed.perfThreshold !== "number" || parsed.perfThreshold < 50 || parsed.perfThreshold > 95 ||
        typeof parsed.contribThreshold !== "number" || parsed.contribThreshold < 30 || parsed.contribThreshold > 90) return null;
  } else if (key === "GEMINI_AI_CONFIG") {
    if (typeof parsed.apiKey !== "string" || parsed.apiKey.length > 512 ||
        typeof parsed.model !== "string" || !/^[a-zA-Z0-9._-]{1,100}$/.test(parsed.model)) return null;
  } else if (key === "CLUB_PROFILE") {
    if (typeof parsed.clubName !== "string" || !parsed.clubName.trim()) return null;
  } else if (key === "ANNUAL_FEE_SCHEDULE") {
    const vals = Object.values(parsed);
    if (!vals.every((v) => typeof v === "number" && Number.isFinite(v) && v >= 0)) return null;
  } else if (key === "ACTIVE_SEASON_CONFIG") {
    if (typeof parsed.seasonYear !== "number" || parsed.seasonYear < 2020 || parsed.seasonYear > 2100) return null;
  } else if (key === "COMMUNICATION_TEMPLATES" || key === "DISCIPLINE_CATALOG" || key === "BACKUP_CONFIG") {
    // Valid structured JSON
  } else {
    return null;
  }
  return { key, value: JSON.stringify(parsed) };
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "SUPER_ADMIN" && user.role !== "CLUB_ADMIN") {
      return NextResponse.json({ error: "Forbidden: insufficient permissions." }, { status: 403 });
    }

    const configs = await prisma.systemConfiguration.findMany();
    return NextResponse.json({ configs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch configuration." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "SUPER_ADMIN" && user.role !== "CLUB_ADMIN") {
      return NextResponse.json({ error: "Forbidden: only Administrators can alter scoring and policy configuration." }, { status: 403 });
    }

    const { configKey, configValueJson } = await req.json();
    const validated = validateConfiguration(configKey, configValueJson);
    if (!validated) {
      return NextResponse.json({ error: "Unsupported or invalid configuration payload." }, { status: 400 });
    }

    const updated = await prisma.systemConfiguration.upsert({
      where: { configKey: validated.key },
      update: {
        configValueJson: validated.value,
        updatedBy: user.userId,
        updatedAt: new Date(),
      },
      create: {
        configKey: validated.key,
        configValueJson: validated.value,
        updatedBy: user.userId,
      },
    });

    await logAudit({
      userId: user.userId,
      action: "UPDATE",
      entityType: "CONFIG",
      entityId: updated.id,
      newValues: { configKey: validated.key, configValueJson: validated.value },
    });

    return NextResponse.json({ success: true, config: updated });
  } catch (error: any) {
    console.error("Save config error:", error);
    return NextResponse.json({ error: error.message || "Failed to update configuration." }, { status: 500 });
  }
}
