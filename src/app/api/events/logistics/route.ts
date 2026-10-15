import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

const TRANSPORT_OPTIONS = new Set(["NONE", "BUS_SEAT", "CARPOOL", "SELF_DRIVE"]);
const ACCOMMODATION_OPTIONS = new Set(["NONE", "HOTEL_SHARED", "HOTEL_SINGLE"]);
const REGISTRATION_STATUSES = new Set(["REGISTERED", "CONFIRMED", "WAITLIST", "WITHDRAWN"]);
const FEE_STATUSES = new Set(["PENDING", "PAID", "SUBSIDIZED", "WAIVED"]);

function finiteNumber(value: unknown, fallback: number | null = null): number | null {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function validDate(value: unknown): Date | null {
  if (value === undefined || value === null || value === "") return null;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function canManageAthlete(user: Awaited<ReturnType<typeof getCurrentUser>>, athleteId: string): Promise<boolean> {
  if (!user) return false;
  if (user.role === "SUPER_ADMIN" || user.role === "CLUB_ADMIN") return true;
  if (user.role === "ATHLETE") return user.athleteId === athleteId;
  if (user.role !== "COACH") return false;
  return Boolean(await prisma.coachAssignment.findFirst({
    where: { athleteId, coachId: user.userId, status: "ACTIVE" },
    select: { id: true },
  }));
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!["SUPER_ADMIN", "CLUB_ADMIN", "COACH", "ATHLETE"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const raceEditionId = searchParams.get("raceEditionId");

    const whereClause: any = {};
    if (raceEditionId) whereClause.id = raceEditionId;

    const registrationWhere = user.role === "ATHLETE"
      ? { athleteId: user.athleteId || "__unassigned__" }
      : user.role === "COACH"
        ? { athlete: { coachAssignments: { some: { coachId: user.userId, status: "ACTIVE" } } } }
        : undefined;

    const editions = await prisma.raceEdition.findMany({
      where: whereClause,
      include: {
        race: true,
        eventLogistics: true,
        eventRegistrations: {
          where: registrationWhere,
          include: {
            athlete: {
              select: {
                id: true,
                athleteNumber: true,
                firstName: true,
                lastName: true,
                contactPhone: true,
                contactEmail: true,
                gender: true,
                membershipCategory: true,
                asaLicenseNumber: true,
              },
            },
          },
          orderBy: { registrationDate: "asc" },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ success: true, editions });
  } catch (error: any) {
    console.error("GET event logistics error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch event logistics." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const action = body.action || "REGISTER_ATHLETE";

    // -------------------------------------------------------------------------
    // ACTION 1: Configure Event Logistics (Bus, Hotel, Volunteer Stations)
    // -------------------------------------------------------------------------
    if (action === "UPDATE_LOGISTICS") {
      if (!["SUPER_ADMIN", "CLUB_ADMIN"].includes(user.role)) {
        return NextResponse.json({ error: "Forbidden: Only administrators can configure event logistics." }, { status: 403 });
      }

      const {
        raceEditionId,
        busEnabled,
        busDepartureLocation,
        busDepartureTime,
        busCapacity,
        busCostPerPerson,
        hotelEnabled,
        hotelName,
        hotelAddress,
        hotelCheckIn,
        hotelCheckOut,
        hotelTotalRooms,
        hotelCostPerRoom,
        volunteerRosterJson,
        notes,
      } = body;

      if (!raceEditionId) {
        return NextResponse.json({ error: "raceEditionId is required." }, { status: 400 });
      }

      const parsedBusDeparture = validDate(busDepartureTime);
      const parsedHotelCheckIn = validDate(hotelCheckIn);
      const parsedHotelCheckOut = validDate(hotelCheckOut);
      const parsedBusCapacity = finiteNumber(busCapacity, 50);
      const parsedBusCost = finiteNumber(busCostPerPerson, 0);
      const parsedHotelRooms = finiteNumber(hotelTotalRooms, 10);
      const parsedHotelCost = finiteNumber(hotelCostPerRoom, 0);
      if (
        (busDepartureTime && !parsedBusDeparture) || (hotelCheckIn && !parsedHotelCheckIn) ||
        (hotelCheckOut && !parsedHotelCheckOut) || !Number.isInteger(parsedBusCapacity) ||
        (parsedBusCapacity ?? 0) < 0 || !Number.isInteger(parsedHotelRooms) || (parsedHotelRooms ?? 0) < 0 ||
        (parsedBusCost ?? -1) < 0 || (parsedHotelCost ?? -1) < 0 ||
        (parsedHotelCheckIn && parsedHotelCheckOut && parsedHotelCheckOut < parsedHotelCheckIn)
      ) {
        return NextResponse.json({ error: "Invalid logistics dates, capacity, room count, or costs." }, { status: 400 });
      }

      const editionExists = await prisma.raceEdition.findUnique({ where: { id: raceEditionId }, select: { id: true } });
      if (!editionExists) return NextResponse.json({ error: "Race edition not found." }, { status: 404 });

      const logistics = await prisma.eventLogistics.upsert({
        where: { raceEditionId },
        update: {
          busEnabled: Boolean(busEnabled),
          busDepartureLocation: busDepartureLocation || null,
          busDepartureTime: parsedBusDeparture,
          busCapacity: parsedBusCapacity!,
          busCostPerPerson: parsedBusCost!,
          hotelEnabled: Boolean(hotelEnabled),
          hotelName: hotelName || null,
          hotelAddress: hotelAddress || null,
          hotelCheckIn: parsedHotelCheckIn,
          hotelCheckOut: parsedHotelCheckOut,
          hotelTotalRooms: parsedHotelRooms!,
          hotelCostPerRoom: parsedHotelCost!,
          volunteerRosterJson: typeof volunteerRosterJson === "string" ? volunteerRosterJson : JSON.stringify(volunteerRosterJson || []),
          notes: notes || null,
        },
        create: {
          raceEditionId,
          busEnabled: Boolean(busEnabled),
          busDepartureLocation: busDepartureLocation || null,
          busDepartureTime: parsedBusDeparture,
          busCapacity: parsedBusCapacity!,
          busCostPerPerson: parsedBusCost!,
          hotelEnabled: Boolean(hotelEnabled),
          hotelName: hotelName || null,
          hotelAddress: hotelAddress || null,
          hotelCheckIn: parsedHotelCheckIn,
          hotelCheckOut: parsedHotelCheckOut,
          hotelTotalRooms: parsedHotelRooms!,
          hotelCostPerRoom: parsedHotelCost!,
          volunteerRosterJson: typeof volunteerRosterJson === "string" ? volunteerRosterJson : JSON.stringify(volunteerRosterJson || []),
          notes: notes || null,
        },
      });

      return NextResponse.json({ success: true, logistics, message: "Event logistics updated successfully." });
    }

    // -------------------------------------------------------------------------
    // ACTION 2: Athlete Event Registration
    // -------------------------------------------------------------------------
    if (action === "REGISTER_ATHLETE") {
      const {
        raceEditionId,
        athleteId,
        transportOption = "NONE",
        busSeatNumber,
        accommodationOption = "NONE",
        roomNumber,
        dietaryRequirements,
        emergencyContact,
        bibNumber,
        feeAmount,
        targetDistanceKm,
        targetTimeSeconds,
        notes,
      } = body;

      const targetAthleteId = user.role === "ATHLETE" ? user.athleteId : (athleteId || user.athleteId);
      if (!targetAthleteId || !raceEditionId) {
        return NextResponse.json({ error: "raceEditionId and athleteId are required." }, { status: 400 });
      }

      if (!(await canManageAthlete(user, targetAthleteId))) {
        return NextResponse.json({ error: "Forbidden: athlete is outside your permitted scope." }, { status: 403 });
      }
      if (!TRANSPORT_OPTIONS.has(transportOption) || !ACCOMMODATION_OPTIONS.has(accommodationOption)) {
        return NextResponse.json({ error: "Invalid transport or accommodation option." }, { status: 400 });
      }
      const parsedFeeAmount = finiteNumber(feeAmount, 0);
      const parsedTargetDistance = finiteNumber(targetDistanceKm);
      const parsedTargetTime = finiteNumber(targetTimeSeconds);
      if ((parsedFeeAmount ?? -1) < 0 || (parsedTargetDistance !== null && parsedTargetDistance <= 0) ||
          (parsedTargetTime !== null && (!Number.isInteger(parsedTargetTime) || parsedTargetTime <= 0))) {
        return NextResponse.json({ error: "Fee, target distance, or target time is invalid." }, { status: 400 });
      }

      const [athleteExists, editionExists, duplicate] = await Promise.all([
        prisma.athlete.findUnique({ where: { id: targetAthleteId }, select: { id: true } }),
        prisma.raceEdition.findUnique({ where: { id: raceEditionId }, select: { id: true } }),
        prisma.eventRegistration.findFirst({ where: { raceEditionId, athleteId: targetAthleteId, status: { not: "WITHDRAWN" } }, select: { id: true } }),
      ]);
      if (!athleteExists || !editionExists) return NextResponse.json({ error: "Athlete or race edition not found." }, { status: 404 });
      if (duplicate) return NextResponse.json({ error: "Athlete is already registered for this race edition." }, { status: 409 });

      // Check bus capacity if BUS_SEAT selected
      if (transportOption === "BUS_SEAT") {
        const logistics = await prisma.eventLogistics.findUnique({ where: { raceEditionId } });
        if (!logistics?.busEnabled) {
          return NextResponse.json({ error: "Club bus transport is not enabled for this event." }, { status: 400 });
        }
        if (logistics.busEnabled) {
          const currentBusCount = await prisma.eventRegistration.count({
            where: { raceEditionId, transportOption: "BUS_SEAT", status: { not: "WITHDRAWN" } },
          });
          if (currentBusCount >= logistics.busCapacity) {
            return NextResponse.json({ error: `Club bus is currently fully booked (${logistics.busCapacity} seats).` }, { status: 400 });
          }
        }
      }

      const registration = await prisma.eventRegistration.create({
        data: {
          raceEditionId,
          athleteId: targetAthleteId,
          transportOption,
          busSeatNumber: busSeatNumber || null,
          accommodationOption,
          roomNumber: roomNumber || null,
          dietaryRequirements: dietaryRequirements || null,
          emergencyContact: emergencyContact || null,
          bibNumber: bibNumber || null,
          feeAmount: parsedFeeAmount!,
          feeStatus: "PENDING",
          targetDistanceKm: parsedTargetDistance,
          targetTimeSeconds: parsedTargetTime,
          notes: notes || null,
        },
        include: {
          raceEdition: { include: { race: true } },
          athlete: { select: { id: true, athleteNumber: true, firstName: true, lastName: true } },
        },
      });

      return NextResponse.json({
        success: true,
        registration,
        message: `Registered successfully for ${registration.raceEdition.race.name}.`,
      });
    }

    // -------------------------------------------------------------------------
    // ACTION 3: Update Registration (Assign Bib, Room, Seat, Status)
    // -------------------------------------------------------------------------
    if (action === "UPDATE_REGISTRATION") {
      if (!["SUPER_ADMIN", "CLUB_ADMIN", "COACH"].includes(user.role)) {
        return NextResponse.json({ error: "Forbidden: Only officials can update registration rosters." }, { status: 403 });
      }

      const { id, bibNumber, busSeatNumber, roomNumber, feeStatus, status, notes } = body;
      if (!id) return NextResponse.json({ error: "Registration ID is required." }, { status: 400 });

      const existing = await prisma.eventRegistration.findUnique({ where: { id }, select: { athleteId: true } });
      if (!existing) return NextResponse.json({ error: "Registration not found." }, { status: 404 });
      if (!(await canManageAthlete(user, existing.athleteId))) {
        return NextResponse.json({ error: "Forbidden: athlete is outside your permitted scope." }, { status: 403 });
      }
      if ((feeStatus !== undefined && !FEE_STATUSES.has(feeStatus)) ||
          (status !== undefined && !REGISTRATION_STATUSES.has(status))) {
        return NextResponse.json({ error: "Invalid registration or fee status." }, { status: 400 });
      }

      const updated = await prisma.eventRegistration.update({
        where: { id },
        data: {
          bibNumber: bibNumber !== undefined ? bibNumber : undefined,
          busSeatNumber: busSeatNumber !== undefined ? busSeatNumber : undefined,
          roomNumber: roomNumber !== undefined ? roomNumber : undefined,
          feeStatus: feeStatus !== undefined ? feeStatus : undefined,
          status: status !== undefined ? status : undefined,
          notes: notes !== undefined ? notes : undefined,
        },
      });

      return NextResponse.json({ success: true, registration: updated, message: "Roster details updated." });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error: any) {
    console.error("POST event logistics error:", error);
    return NextResponse.json({ error: error.message || "Failed to process event registration." }, { status: 500 });
  }
}
