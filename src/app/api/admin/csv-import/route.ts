import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/auditLogger";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "SUPER_ADMIN" && user.role !== "CLUB_ADMIN") {
      return NextResponse.json({ error: "Forbidden: administrator access required." }, { status: 403 });
    }

    const { importType, rows } = await req.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No data rows provided." }, { status: 400 });
    }

    const allowedImportTypes = ["ATHLETES", "RACE_RESULTS", "TRAINING", "SPONSORSHIP", "CLUB_ACTIVITIES", "ATTENDANCE"];
    if (!allowedImportTypes.includes(importType)) {
      return NextResponse.json({ error: "Unsupported import type." }, { status: 400 });
    }

    let insertedCount = 0;

    if (importType === "ATHLETES") {
      for (const row of rows) {
        if (!row.athleteNumber || !row.firstName || !row.contactEmail) continue;

        const num = row.athleteNumber.trim().toUpperCase();
        const existing = await prisma.athlete.findUnique({
          where: { athleteNumber: num },
        });

        const athletePayload: Record<string, any> = {
          athleteNumber: num,
          firstName: row.firstName.trim(),
          lastName: row.lastName?.trim() || "",
          preferredName: row.preferredName?.trim() || null,
          dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : new Date("1996-01-01"),
          gender: row.gender || "MALE",
          contactEmail: row.contactEmail.trim().toLowerCase(),
          contactPhone: row.contactPhone?.trim() || null,
          emergencyContact: row.emergencyContact?.trim() || null,
          primaryDiscipline: row.primaryDiscipline || "MARATHON",
          disciplineCategory: row.disciplineCategory || (row.primaryDiscipline?.includes("WALK") ? "WALKER" : "RUNNER"),
          athleteStatus: row.athleteStatus || "DEVELOPMENT",
          asaLicenseNumber: row.asaLicenseNumber?.trim() || null,
          membershipCategory: row.membershipCategory || "SENIOR_RUNNER",
          membershipStatus: row.membershipStatus || "ACTIVE",
          membershipFeeStatus: row.membershipFeeStatus || "PAID",
          membershipStartDate: new Date(),
        };

        if (row.membershipExpiry) {
          const exp = new Date(row.membershipExpiry);
          if (!Number.isNaN(exp.getTime())) athletePayload.membershipExpiry = exp;
        }

        if (!existing) {
          await prisma.athlete.create({
            data: athletePayload as any,
          });
          insertedCount++;
        } else {
          // Update existing athlete record with template data
          await prisma.athlete.update({
            where: { id: existing.id },
            data: athletePayload as any,
          });
          insertedCount++;
        }
      }
    } else if (importType === "RACE_RESULTS") {
      for (const row of rows) {
        if (!row.athleteNumber || !row.raceName) continue;
        const athlete = await prisma.athlete.findUnique({
          where: { athleteNumber: row.athleteNumber.trim() },
        });
        if (!athlete) continue;

        const parts = (row.officialTimeFormatted || "3:00:00").split(":");
        const secs =
          parts.length === 3
            ? parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2])
            : 10800;

        await prisma.raceResult.create({
          data: {
            athleteId: athlete.id,
            raceName: row.raceName,
            date: row.date ? new Date(row.date) : new Date(),
            distanceKm: parseFloat(row.distanceKm) || 42.195,
            officialTimeSeconds: secs,
            verificationStatus: row.verificationStatus || "VERIFIED",
            source: "OFFICIAL_TIMING",
          },
        });
        insertedCount++;
      }
    } else if (importType === "TRAINING") {
      for (const row of rows) {
        if (!row.athleteNumber) continue;
        const athlete = await prisma.athlete.findUnique({
          where: { athleteNumber: row.athleteNumber.trim() },
        });
        if (!athlete) continue;

        const dist = parseFloat(row.distanceKm) || 10;
        const durSecs = (parseInt(row.durationMinutes) || 50) * 60;

        await prisma.trainingActivity.create({
          data: {
            athleteId: athlete.id,
            date: row.date ? new Date(row.date) : new Date(),
            activityType: "RUN",
            workoutType: row.workoutType || "EASY",
            distanceKm: dist,
            durationSeconds: durSecs,
            averagePaceSeconds: Math.round(durSecs / dist),
            sessionRpe: parseInt(row.sessionRpe) || 5,
            source: "CSV",
            isLongRun: dist >= 25,
          },
        });
        insertedCount++;
      }
    } else if (importType === "SPONSORSHIP") {
      for (const row of rows) {
        if (!row.athleteNumber) continue;
        const athlete = await prisma.athlete.findUnique({
          where: { athleteNumber: row.athleteNumber.trim() },
          include: { sponsorships: { where: { status: "ACTIVE" } } },
        });
        if (!athlete) continue;

        let spId = athlete.sponsorships[0]?.id;
        if (!spId) {
          const newSp = await prisma.sponsorship.create({
            data: { athleteId: athlete.id, currentTier: "DEVELOPMENT" },
          });
          spId = newSp.id;
        }

        await prisma.sponsorshipTransaction.create({
          data: {
            sponsorshipId: spId,
            athleteId: athlete.id,
            transactionDate: row.transactionDate ? new Date(row.transactionDate) : new Date(),
            supportType: row.supportType || "CASH_STIPEND",
            amount: parseFloat(row.amountZar) || 1000,
            currency: "ZAR",
            approvedBy: user.userId,
            notes: row.notes || "Bulk CSV disbursement",
          },
        });
        insertedCount++;
      }
    } else if (importType === "CLUB_ACTIVITIES") {
      for (const row of rows) {
        if (!row.title || !row.date) continue;
        await prisma.clubActivity.create({
          data: {
            title: row.title.trim(),
            activityType: row.activityType || "WEEKLY_RUN",
            date: new Date(row.date),
            location: row.location || "Super Eagles Clubhouse, Wanderers",
            pointsValue: parseInt(row.pointsValue, 10) || 15,
            isMandatory: row.isMandatory === "true" || row.isMandatory === true,
            notes: row.notes || null,
          },
        });
        insertedCount++;
      }
    } else if (importType === "ATTENDANCE") {
      for (const row of rows) {
        if (!row.athleteNumber) continue;
        const athlete = await prisma.athlete.findUnique({
          where: { athleteNumber: row.athleteNumber.trim() },
        });
        if (!athlete) continue;

        let activity: any = null;
        if (row.activityTitle) {
          activity = await prisma.clubActivity.findFirst({
            where: { title: { contains: row.activityTitle.trim() } },
          });
        }
        if (!activity) {
          activity = await prisma.clubActivity.findFirst({
            orderBy: { date: "desc" },
          });
        }
        if (!activity) continue;

        const isAttended = row.attended === undefined || row.attended === "true" || row.attended === true || row.attended === "1";
        if (isAttended) {
          const existingAtt = await prisma.clubAttendance.findFirst({
            where: { athleteId: athlete.id, clubActivityId: activity.id },
          });
          if (!existingAtt) {
            await prisma.clubAttendance.create({
              data: {
                athleteId: athlete.id,
                clubActivityId: activity.id,
                attended: true,
                recordedBy: user.userId,
              },
            });
            insertedCount++;
          }
        }
      }
    }

    await logAudit({
      userId: user.userId,
      action: "IMPORT",
      entityType: "ATHLETE",
      newValues: { importType, rowsProcessed: rows.length, insertedCount },
    });

    return NextResponse.json({ success: true, count: insertedCount });
  } catch (error: any) {
    console.error("CSV import API error:", error);
    return NextResponse.json({ error: error.message || "Failed to process CSV." }, { status: 500 });
  }
}
