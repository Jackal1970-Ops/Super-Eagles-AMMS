import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessAthleteProfile, getCurrentUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/auditLogger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const athlete = await prisma.athlete.findFirst({
      where: {
        OR: [{ id }, { athleteNumber: id }, { athleteNumber: id.toUpperCase() }],
      },
      include: {
        user: {
          select: { id: true, email: true, name: true, role: true, phone: true, avatarUrl: true, isActive: true },
        },
        coachAssignments: {
          where: { status: "ACTIVE" },
          include: {
            coach: { select: { id: true, email: true, name: true, phone: true, avatarUrl: true, isActive: true } },
          },
        },
        sponsorships: {
          where: { status: "ACTIVE" },
        },
      },
    });

    if (!athlete) {
      return NextResponse.json({ error: "Athlete not found" }, { status: 404 });
    }

    if (!canAccessAthleteProfile(user, athlete.id, athlete.coachAssignments.map((assignment) => assignment.coachId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ athlete });
  } catch (error) {
    console.error("GET athlete by ID error:", error);
    return NextResponse.json({ error: "Failed to fetch athlete." }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if athlete exists by id or athleteNumber
    const existing = await prisma.athlete.findFirst({
      where: {
        OR: [{ id }, { athleteNumber: id }, { athleteNumber: id.toUpperCase() }],
      },
      include: {
        coachAssignments: { where: { status: "ACTIVE" }, select: { coachId: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Athlete not found" }, { status: 404 });
    }

    // Only Admin or Coach (if assigned) can edit administrative details; athletes can edit contact info
    const isExecutive = user.role === "SUPER_ADMIN" || user.role === "CLUB_ADMIN";
    const isCoach = user.role === "COACH" && existing.coachAssignments.some((assignment) => assignment.coachId === user.userId);
    const isSelf = user.role === "ATHLETE" && user.athleteId === existing.id;

    if (!isExecutive && !isCoach && !isSelf) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // Prepare update data according to role permissions
    const updateData: Record<string, any> = {};

    // Fields anyone (including athlete themselves) can update
    if (body.contactEmail !== undefined) updateData.contactEmail = String(body.contactEmail).trim().toLowerCase();
    if (body.contactPhone !== undefined) updateData.contactPhone = body.contactPhone ? String(body.contactPhone).trim() : null;
    if (body.emergencyContact !== undefined) updateData.emergencyContact = body.emergencyContact ? String(body.emergencyContact).trim() : null;
    if (body.preferredName !== undefined) updateData.preferredName = body.preferredName ? String(body.preferredName).trim() : null;

    // Administrative & athletic fields only Admins or Coaches can update
    if (isExecutive || isCoach) {
      if (body.firstName !== undefined) updateData.firstName = String(body.firstName).trim();
      if (body.lastName !== undefined) updateData.lastName = String(body.lastName).trim();
      if (body.dateOfBirth !== undefined) {
        const dob = new Date(body.dateOfBirth);
        if (!Number.isNaN(dob.getTime())) updateData.dateOfBirth = dob;
      }
      if (body.gender !== undefined) updateData.gender = body.gender;
      if (body.athleteStatus !== undefined) updateData.athleteStatus = body.athleteStatus;
      if (body.primaryDiscipline !== undefined) updateData.primaryDiscipline = body.primaryDiscipline;
      if (body.disciplineCategory !== undefined) updateData.disciplineCategory = body.disciplineCategory;
    }

    // Membership, financial & license fields only Club Executive/Admins can update
    if (isExecutive) {
      if (body.athleteNumber !== undefined) updateData.athleteNumber = String(body.athleteNumber).trim().toUpperCase();
      if (body.asaLicenseNumber !== undefined) updateData.asaLicenseNumber = body.asaLicenseNumber ? String(body.asaLicenseNumber).trim() : null;
      if (body.membershipCategory !== undefined) updateData.membershipCategory = body.membershipCategory;
      if (body.membershipStatus !== undefined) updateData.membershipStatus = body.membershipStatus;
      if (body.membershipFeeStatus !== undefined) updateData.membershipFeeStatus = body.membershipFeeStatus;
      if (body.membershipExpiry !== undefined) {
        if (body.membershipExpiry === null || body.membershipExpiry === "") {
          updateData.membershipExpiry = null;
        } else {
          const exp = new Date(body.membershipExpiry);
          if (!Number.isNaN(exp.getTime())) updateData.membershipExpiry = exp;
        }
      }
      if (body.membershipStartDate !== undefined) {
        const start = new Date(body.membershipStartDate);
        if (!Number.isNaN(start.getTime())) updateData.membershipStartDate = start;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No modifiable fields provided." }, { status: 400 });
    }

    const updated = await prisma.athlete.update({
      where: { id: existing.id },
      data: updateData,
    });

    // Also keep the User email/phone in sync if this athlete has a linked User account
    if (existing.userId && (updateData.contactEmail || updateData.contactPhone || updateData.firstName || updateData.lastName)) {
      const userUpdate: Record<string, any> = {};
      if (updateData.contactEmail) userUpdate.email = updateData.contactEmail;
      if (updateData.contactPhone !== undefined) userUpdate.phone = updateData.contactPhone;
      if (updateData.firstName || updateData.lastName) {
        userUpdate.name = `${updateData.firstName || existing.firstName} ${updateData.lastName || existing.lastName}`;
      }
      try {
        await prisma.user.update({
          where: { id: existing.userId },
          data: userUpdate,
        });
      } catch (err) {
        console.warn("Could not sync linked User table entry:", err);
      }
    }

    // Audit log
    await logAudit({
      userId: user.userId,
      action: "UPDATE",
      entityType: "ATHLETE",
      entityId: updated.id,
      oldValues: existing,
      newValues: updated,
    });

    return NextResponse.json({
      success: true,
      message: `Member profile for ${updated.firstName} ${updated.lastName} successfully updated.`,
      athlete: updated,
    });
  } catch (error: any) {
    console.error("PATCH athlete error:", error);
    return NextResponse.json({ error: error?.message || "Failed to update athlete details." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Club Admins & Super Admins can delete or archive members
    if (user.role !== "SUPER_ADMIN" && user.role !== "CLUB_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Only Club Administrators may archive or delete members." }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.athlete.findFirst({
      where: {
        OR: [
          { id },
          { athleteNumber: id },
          { athleteNumber: id.toUpperCase() },
        ],
      },
      include: { user: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Athlete not found." }, { status: 404 });
    }

    const url = new URL(req.url);
    const hardDelete = url.searchParams.get("hard") === "true";

    if (hardDelete) {
      // Hard delete: cascade delete athlete & deactivate linked user
      await prisma.athlete.delete({
        where: { id: existing.id },
      });

      if (existing.userId) {
        await prisma.user.update({
          where: { id: existing.userId },
          data: { isActive: false },
        }).catch(() => {});
      }

      await logAudit({
        userId: user.userId,
        action: "DELETE",
        entityType: "ATHLETE",
        entityId: existing.id,
        oldValues: existing,
        newValues: { status: "PERMANENTLY_DELETED" },
      });

      return NextResponse.json({
        success: true,
        message: `Athlete record #${existing.athleteNumber} (${existing.firstName} ${existing.lastName}) permanently deleted from register.`,
      });
    } else {
      // Soft Archive: Set status to LAPSED / SUSPENDED and mark inactive
      const updated = await prisma.athlete.update({
        where: { id: existing.id },
        data: {
          membershipStatus: "LAPSED",
          membershipFeeStatus: "PENDING",
        },
      });

      if (existing.userId) {
        await prisma.user.update({
          where: { id: existing.userId },
          data: { isActive: false },
        }).catch(() => {});
      }

      await logAudit({
        userId: user.userId,
        action: "UPDATE",
        entityType: "ATHLETE",
        entityId: existing.id,
        oldValues: existing,
        newValues: updated,
      });

      return NextResponse.json({
        success: true,
        message: `Member #${existing.athleteNumber} (${existing.firstName} ${existing.lastName}) safely archived with LAPSED standing.`,
        athlete: updated,
      });
    }
  } catch (error: any) {
    console.error("DELETE athlete error:", error);
    return NextResponse.json({ error: error?.message || "Failed to remove member." }, { status: 500 });
  }
}
