import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/auditLogger";
import { z } from "zod";

const TransactionSchema = z.object({
  athleteId: z.string().min(1, "Athlete ID is required"),
  amount: z.number().positive("Disbursement amount must be greater than zero"),
  supportType: z.enum([
    "CASH_STIPEND",
    "RACE_ENTRY",
    "TRAVEL",
    "EQUIPMENT",
    "PHYSIO_MEDICAL",
    "COACHING_SUBSIDY",
    "OTHER",
  ]),
  fundingSource: z.string().default("CLUB_CORE_BUDGET"),
  transactionDate: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Only SUPER_ADMIN or SPONSORSHIP_COMMITTEE can disburse sponsorship funds
    if (user.role !== "SUPER_ADMIN" && user.role !== "SPONSORSHIP_COMMITTEE") {
      return NextResponse.json(
        { error: "Forbidden: insufficient permissions to disburse sponsorship funds." },
        { status: 403 }
      );
    }

    const rawBody = await req.json();
    const parsed = TransactionSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid disbursement payload." },
        { status: 400 }
      );
    }

    const { athleteId, amount, supportType, fundingSource, transactionDate, notes } = parsed.data;

    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      include: {
        sponsorships: {
          where: { status: "ACTIVE" },
          orderBy: { startDate: "desc" },
          take: 1,
        },
      },
    });

    if (!athlete) {
      return NextResponse.json({ error: "Athlete record not found." }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Find or create active sponsorship record
      let sponsorshipId = athlete.sponsorships[0]?.id;
      if (!sponsorshipId) {
        const newSponsorship = await tx.sponsorship.create({
          data: {
            athleteId: athlete.id,
            currentTier: athlete.athleteStatus === "ELITE" ? "PERFORMANCE" : "DEVELOPMENT",
            startDate: new Date(),
            status: "ACTIVE",
          },
        });
        sponsorshipId = newSponsorship.id;
      }

      const txDate = transactionDate ? new Date(transactionDate) : new Date();

      const newTransaction = await tx.sponsorshipTransaction.create({
        data: {
          sponsorshipId,
          athleteId: athlete.id,
          transactionDate: txDate,
          supportType,
          amount,
          currency: "ZAR",
          fundingSource,
          approvedBy: user.userId,
          notes: notes || `Direct sponsorship disbursement recorded by ${user.name}`,
        },
      });

      // Calculate new total YTD spend
      const allTransactions = await tx.sponsorshipTransaction.findMany({
        where: { athleteId: athlete.id },
        select: { amount: true },
      });
      const updatedTotalZar = allTransactions.reduce((sum, t) => sum + t.amount, 0);

      return { newTransaction, updatedTotalZar };
    });

    // Financial compliance audit logging
    await logAudit({
      userId: user.userId,
      action: "CREATE",
      entityType: "SPONSORSHIP",
      entityId: result.newTransaction.id,
      newValues: {
        athleteId,
        athleteNumber: athlete.athleteNumber,
        amount,
        supportType,
        fundingSource,
        userRole: user.role,
        details: `Disbursed R${amount.toLocaleString()} (${supportType}) to ${athlete.firstName} ${athlete.lastName} (${athlete.athleteNumber}). Source: ${fundingSource}`,
      },
    });

    return NextResponse.json(
      {
        success: true,
        transaction: result.newTransaction,
        updatedTotalZar: result.updatedTotalZar,
        message: `Successfully recorded disbursement of R${amount.toLocaleString()} for ${athlete.firstName} ${athlete.lastName}.`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error recording sponsorship disbursement:", error);
    return NextResponse.json(
      { error: "Internal server error processing disbursement." },
      { status: 500 }
    );
  }
}
