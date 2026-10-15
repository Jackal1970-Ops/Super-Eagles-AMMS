import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { DEFAULT_CLUB_BANK_DETAILS, ClubBankDetails } from "@/lib/communication/noticeEngine";

// Standard fallback fee schedule per category (in ZAR)
export const ANNUAL_FEE_SCHEDULE: Record<string, number> = {
  SENIOR_RUNNER: 850,
  MASTER_RUNNER: 750,
  SENIOR_WALKER: 600,
  MASTER_WALKER: 600,
  JUNIOR_RUNNER: 450,
  JUNIOR_WALKER: 450,
  SOCIAL_WALKER: 400,
  LIFE_MEMBER: 0,
};

export async function getDynamicFeeSchedule(): Promise<Record<string, number>> {
  try {
    const config = await prisma.systemConfiguration.findUnique({
      where: { configKey: "ANNUAL_FEE_SCHEDULE" },
    });
    if (config) {
      const parsed = JSON.parse(config.configValueJson);
      return { ...ANNUAL_FEE_SCHEDULE, ...parsed };
    }
  } catch {}
  return ANNUAL_FEE_SCHEDULE;
}

export async function getDynamicBankDetails(): Promise<ClubBankDetails> {
  try {
    const config = await prisma.systemConfiguration.findUnique({
      where: { configKey: "CLUB_PROFILE" },
    });
    if (config) {
      const parsed = JSON.parse(config.configValueJson);
      return {
        bankName: parsed.bankName || DEFAULT_CLUB_BANK_DETAILS.bankName,
        accountName: parsed.accountName || DEFAULT_CLUB_BANK_DETAILS.accountName,
        accountNumber: parsed.accountNumber || DEFAULT_CLUB_BANK_DETAILS.accountNumber,
        branchCode: parsed.branchCode || DEFAULT_CLUB_BANK_DETAILS.branchCode,
        accountType: parsed.accountType || DEFAULT_CLUB_BANK_DETAILS.accountType,
        referenceFormat: parsed.referenceFormat || DEFAULT_CLUB_BANK_DETAILS.referenceFormat,
        snapScanUrl: parsed.snapScanUrl || DEFAULT_CLUB_BANK_DETAILS.snapScanUrl,
      };
    }
  } catch {}
  return DEFAULT_CLUB_BANK_DETAILS;
}

export function getDuesForCategory(category: string, schedule = ANNUAL_FEE_SCHEDULE): number {
  return schedule[category] ?? 750;
}

export async function GET(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filterStatus = searchParams.get("status"); // PAID, PENDING, EXEMPT, SUBSIDIZED, PENDING_POP
    const query = searchParams.get("q")?.toLowerCase();

    const isRestrictedAthlete = session.role === "ATHLETE";
    if (session.role === "COACH") {
      return NextResponse.json({ error: "Forbidden: coaches cannot access membership financial records." }, { status: 403 });
    }
    const dynamicFees = await getDynamicFeeSchedule();
    const bankDetails = await getDynamicBankDetails();

    const whereClause: any = {};
    if (isRestrictedAthlete) {
      whereClause.id = session.athleteId || "__unassigned__";
    } else {
      if (filterStatus && filterStatus !== "ALL") {
        whereClause.membershipFeeStatus = filterStatus;
      }
      if (query) {
        whereClause.OR = [
          { firstName: { contains: query } },
          { lastName: { contains: query } },
          { athleteNumber: { contains: query } },
          { asaLicenseNumber: { contains: query } },
          { contactEmail: { contains: query } },
        ];
      }
    }

    const athletes = await prisma.athlete.findMany({
      where: whereClause,
      select: {
        id: true,
        athleteNumber: true,
        firstName: true,
        lastName: true,
        preferredName: true,
        contactEmail: true,
        contactPhone: true,
        dateOfBirth: true,
        gender: true,
        membershipCategory: true,
        disciplineCategory: true,
        primaryDiscipline: true,
        athleteStatus: true,
        membershipStatus: true,
        membershipFeeStatus: true,
        membershipExpiry: true,
        asaLicenseNumber: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
        payments: {
          orderBy: { paymentDate: "desc" },
          take: 5,
        },
      },
      orderBy: { athleteNumber: "asc" },
    });

    const currentYear = new Date().getFullYear();
    const cycleStart = new Date(currentYear, 0, 1).toISOString();
    const cycleEnd = new Date(currentYear, 11, 31, 23, 59, 59).toISOString();

    const aggregateAthletes = isRestrictedAthlete
      ? athletes
      : await prisma.athlete.findMany({
          select: { membershipCategory: true, membershipFeeStatus: true },
        });

    let totalProjectedRevenue = 0;
    let totalCollectedRevenue = 0;
    let totalOutstandingArrears = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let exemptCount = 0;
    let subsidizedCount = 0;

    for (const a of aggregateAthletes) {
      const fee = getDuesForCategory(a.membershipCategory, dynamicFees);
      totalProjectedRevenue += fee;

      if (a.membershipFeeStatus === "PAID") {
        totalCollectedRevenue += fee;
        paidCount++;
      } else if (a.membershipFeeStatus === "PENDING") {
        totalOutstandingArrears += fee;
        pendingCount++;
      } else if (a.membershipFeeStatus === "EXEMPT") {
        exemptCount++;
      } else if (a.membershipFeeStatus === "SUBSIDIZED") {
        totalCollectedRevenue += fee * 0.5;
        totalOutstandingArrears += fee * 0.5;
        subsidizedCount++;
      }
    }

    // Pending POP verification queue (for admins)
    let pendingPopPayments: any[] = [];
    if (!isRestrictedAthlete) {
      pendingPopPayments = await prisma.membershipPayment.findMany({
        where: { status: "PENDING_VERIFICATION" },
        include: {
          athlete: {
            select: {
              id: true,
              athleteNumber: true,
              firstName: true,
              lastName: true,
              membershipCategory: true,
              contactEmail: true,
              contactPhone: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    const items = athletes.map((a) => {
      const standardDues = getDuesForCategory(a.membershipCategory, dynamicFees);
      const hasPendingPop = a.payments.some((p) => p.status === "PENDING_VERIFICATION");
      return {
        ...a,
        standardDues,
        cycleYear: currentYear,
        cycleEnd,
        hasPendingPop,
        isOverdue:
          a.membershipFeeStatus === "PENDING" ||
          (a.membershipExpiry && new Date(a.membershipExpiry) < new Date()),
      };
    });

    return NextResponse.json({
      success: true,
      cycle: {
        year: currentYear,
        startDate: cycleStart,
        endDate: cycleEnd,
        label: `Annual Cycle ${currentYear} (1 Jan - 31 Dec)`,
      },
      summary: {
        totalMembers: aggregateAthletes.length,
        paidCount,
        pendingCount,
        exemptCount,
        subsidizedCount,
        totalProjectedRevenue,
        totalCollectedRevenue,
        totalOutstandingArrears,
        pendingPopCount: pendingPopPayments.length,
        collectionRatePercent:
          totalProjectedRevenue > 0
            ? Math.round((totalCollectedRevenue / totalProjectedRevenue) * 100)
            : 100,
      },
      bankingDetails: bankDetails,
      feeSchedule: dynamicFees,
      athletes: items,
      pendingPopPayments,
    });
  } catch (error: any) {
    console.error("Failed to fetch payments data:", error);
    return NextResponse.json(
      { error: "Internal server error fetching payments" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const action = body.action || "RECORD_PAYMENT";
    const currentYear = new Date().getFullYear();
    const targetExpiry = new Date(currentYear, 11, 31, 23, 59, 59);

    // -------------------------------------------------------------------------
    // ACTION 1: Athlete Submits Proof of Payment (POP)
    // -------------------------------------------------------------------------
    if (action === "SUBMIT_POP") {
      const { athleteId, amount, paymentMethod = "EFT", referenceNumber, popUrl, popFileName, notes } = body;
      const targetAthleteId = session.role === "ATHLETE" ? session.athleteId : athleteId;

      if (!targetAthleteId) {
        return NextResponse.json({ error: "Target athlete is required." }, { status: 400 });
      }

      if (!["ATHLETE", "SUPER_ADMIN", "CLUB_ADMIN", "SPONSORSHIP_COMMITTEE"].includes(session.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (!new Set(["EFT", "CASH", "SNAPSCAN", "CARD"]).has(paymentMethod)) {
        return NextResponse.json({ error: "Invalid payment method." }, { status: 400 });
      }
      if (typeof popUrl !== "string" || !/^\/uploads\/pop\/pop_[A-Za-z0-9_-]+\.(?:jpg|png|webp|pdf)$/.test(popUrl)) {
        return NextResponse.json({ error: "A valid uploaded proof-of-payment file is required." }, { status: 400 });
      }

      const athlete = await prisma.athlete.findUnique({
        where: { id: targetAthleteId },
      });
      if (!athlete) {
        return NextResponse.json({ error: "Athlete not found." }, { status: 404 });
      }

      const schedule = await getDynamicFeeSchedule();
      const parsedAmount = amount === undefined || amount === null || amount === ""
        ? getDuesForCategory(athlete.membershipCategory, schedule)
        : Number(amount);
      if (!Number.isFinite(parsedAmount) || parsedAmount < 0 || parsedAmount > 1_000_000) {
        return NextResponse.json({ error: "Payment amount must be a valid non-negative value." }, { status: 400 });
      }
      const payment = await prisma.membershipPayment.create({
        data: {
          athleteId: targetAthleteId,
          seasonYear: currentYear,
          amount: parsedAmount,
          paymentMethod,
          referenceNumber: referenceNumber || `POP-${Date.now().toString().slice(-6)}`,
          popUrl: popUrl || null,
          popFileName: popFileName || null,
          status: "PENDING_VERIFICATION",
          notes: typeof notes === "string" ? notes.trim().slice(0, 2000) || null : null,
        },
      });

      // Notify Club Admins
      const admins = await prisma.user.findMany({
        where: { role: { in: ["SUPER_ADMIN", "CLUB_ADMIN"] }, isActive: true },
        select: { id: true },
      });

      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            title: "New Proof of Payment Uploaded",
            message: `${athlete.firstName} ${athlete.lastName} (#${athlete.athleteNumber}) submitted POP for R${parsedAmount.toFixed(2)} (${paymentMethod}). Please review and reconcile.`,
            notificationType: "CONDITION_ALERT",
            linkUrl: "/payments?status=PENDING_POP",
          },
        }).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        payment,
        message: "Proof of payment submitted successfully. Your club admin will review and verify shortly.",
      });
    }

    // -------------------------------------------------------------------------
    // ACTION 2: Admin Reconciles & Approves/Rejects a Payment
    // -------------------------------------------------------------------------
    if (action === "RECONCILE_POP") {
      if (!["SUPER_ADMIN", "CLUB_ADMIN", "SPONSORSHIP_COMMITTEE"].includes(session.role)) {
        return NextResponse.json({ error: "Forbidden: Only administrators can reconcile payments." }, { status: 403 });
      }

      const { paymentId, status, notes } = body;
      if (!paymentId || !["VERIFIED", "REJECTED"].includes(status)) {
        return NextResponse.json({ error: "Valid paymentId and status (VERIFIED or REJECTED) required." }, { status: 400 });
      }

      const payment = await prisma.membershipPayment.findUnique({
        where: { id: paymentId },
        include: { athlete: true },
      });

      if (!payment) {
        return NextResponse.json({ error: "Payment record not found." }, { status: 404 });
      }

      const receiptNumber = status === "VERIFIED" ? `REC-${currentYear}-${Date.now().toString().slice(-6)}` : null;

      const updatedPayment = await prisma.membershipPayment.update({
        where: { id: paymentId },
        data: {
          status,
          receiptNumber,
          verifiedById: session.userId,
          verifiedAt: new Date(),
          notes: notes || payment.notes,
        },
      });

      if (status === "VERIFIED") {
        await prisma.athlete.update({
          where: { id: payment.athleteId },
          data: {
            membershipFeeStatus: "PAID",
            membershipStatus: "ACTIVE",
            membershipExpiry: targetExpiry,
          },
        });

        if (payment.athlete.userId) {
          await prisma.notification.create({
            data: {
              userId: payment.athlete.userId,
              title: "Proof of Payment Verified & Approved",
              message: `Your annual dues payment of R${payment.amount.toFixed(2)} was verified. Official Receipt #${receiptNumber} issued. Membership active through 31 Dec ${currentYear}.`,
              notificationType: "CONDITION_ALERT",
              linkUrl: "/payments",
            },
          }).catch(() => {});
        }
      } else {
        if (payment.athlete.userId) {
          await prisma.notification.create({
            data: {
              userId: payment.athlete.userId,
              title: "Payment Reconciliation Notice",
              message: `Your submitted proof of payment was not approved (${notes || "details could not be matched"}). Please review with club administration.`,
              notificationType: "CONDITION_ALERT",
              linkUrl: "/payments",
            },
          }).catch(() => {});
        }
      }

      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: "UPDATE",
          entityType: "PAYMENT",
          entityId: paymentId,
          newValuesJson: JSON.stringify({
            status,
            receiptNumber,
            reconciledBy: session.name,
            athleteNumber: payment.athlete.athleteNumber,
            amount: payment.amount,
          }),
        },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        payment: updatedPayment,
        message: status === "VERIFIED" ? `Payment verified successfully. Receipt #${receiptNumber} issued.` : "Payment marked as rejected.",
      });
    }

    // -------------------------------------------------------------------------
    // ACTION 3: Direct Admin Payment Record
    // -------------------------------------------------------------------------
    if (!["SUPER_ADMIN", "CLUB_ADMIN", "SPONSORSHIP_COMMITTEE"].includes(session.role)) {
      return NextResponse.json(
        { error: "Forbidden: Only administrators or committee members can record payments." },
        { status: 403 }
      );
    }

    const {
      athleteId,
      amount,
      paymentMethod = "EFT",
      receiptRef,
      paymentDate = new Date().toISOString(),
      feeStatus = "PAID",
      notes,
    } = body;

    if (!athleteId) {
      return NextResponse.json({ error: "athleteId is required." }, { status: 400 });
    }

    const allowedFeeStatuses = new Set(["PAID", "PENDING", "EXEMPT", "SUBSIDIZED"]);
    const allowedPaymentMethods = new Set(["EFT", "CASH", "SNAPSCAN", "CARD"]);
    const parsedAmount = Number(amount);
    const parsedPaymentDate = new Date(paymentDate);
    if (!allowedFeeStatuses.has(feeStatus) || !allowedPaymentMethods.has(paymentMethod)) {
      return NextResponse.json({ error: "Invalid payment method or fee status." }, { status: 400 });
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0 || Number.isNaN(parsedPaymentDate.getTime())) {
      return NextResponse.json({ error: "Payment amount and date must be valid." }, { status: 400 });
    }

    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      include: { user: true },
    });

    if (!athlete) {
      return NextResponse.json({ error: "Athlete not found." }, { status: 404 });
    }

    const updatedAthlete = await prisma.athlete.update({
      where: { id: athleteId },
      data: {
        membershipFeeStatus: feeStatus,
        membershipStatus: feeStatus === "PAID" || feeStatus === "EXEMPT" ? "ACTIVE" : athlete.membershipStatus,
        membershipExpiry: feeStatus === "PAID" || feeStatus === "EXEMPT" ? targetExpiry : athlete.membershipExpiry,
      },
    });

    const receiptNum = receiptRef || `REC-${currentYear}-${Date.now().toString().slice(-6)}`;

    // Create formal payment record
    const payment = await prisma.membershipPayment.create({
      data: {
        athleteId,
        seasonYear: currentYear,
        amount: parsedAmount,
        paymentMethod,
        receiptNumber: feeStatus === "PAID" ? receiptNum : null,
        referenceNumber: receiptNum,
        status: feeStatus === "PAID" ? "VERIFIED" : "PENDING_VERIFICATION",
        paymentDate: parsedPaymentDate,
        verifiedById: session.userId,
        verifiedAt: feeStatus === "PAID" ? new Date() : null,
        notes,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "RECORD_MEMBERSHIP_PAYMENT",
        entityType: "PAYMENT",
        entityId: athleteId,
        newValuesJson: JSON.stringify({
          athleteNumber: athlete.athleteNumber,
          athleteName: `${athlete.firstName} ${athlete.lastName}`,
          amount: parsedAmount,
          paymentMethod,
          receiptNumber: receiptNum,
          paymentDate: parsedPaymentDate.toISOString(),
          feeStatus,
          annualCycle: currentYear,
          notes,
          recordedBy: session.name,
        }),
      },
    });

    if (athlete.userId) {
      await prisma.notification.create({
        data: {
          userId: athlete.userId,
          title: feeStatus === "PAID" ? "Membership Dues Received" : "Membership Status Updated",
          message:
            feeStatus === "PAID"
              ? `Your annual membership payment of R${parsedAmount.toFixed(2)} via ${paymentMethod} has been confirmed. Receipt #${receiptNum}. Active through 31 Dec ${currentYear}.`
              : `Your membership fee status was updated to ${feeStatus}.`,
          notificationType: "PAYMENT_CONFIRMATION",
        },
      });
    }

    return NextResponse.json({
      success: true,
      athlete: updatedAthlete,
      payment,
      message: `Payment successfully recorded for ${athlete.firstName} ${athlete.lastName}.`,
    });
  } catch (error: any) {
    console.error("Failed to record payment:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error recording payment" },
      { status: 500 }
    );
  }
}
