import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

export const CSV_TEMPLATES: Record<
  string,
  {
    filename: string;
    description: string;
    headers: string[];
    sampleRows: string[][];
  }
> = {
  ATHLETES: {
    filename: "super_eagles_blank_members_template.csv",
    description: "Athletes & Members Master Register (Personal details, ASA License, Disciplines, Fee Status)",
    headers: [
      "athleteNumber",
      "firstName",
      "lastName",
      "preferredName",
      "dateOfBirth",
      "gender",
      "contactEmail",
      "contactPhone",
      "emergencyContact",
      "primaryDiscipline",
      "disciplineCategory",
      "athleteStatus",
      "asaLicenseNumber",
      "membershipCategory",
      "membershipStatus",
      "membershipFeeStatus",
      "membershipExpiry",
    ],
    sampleRows: [
      [
        "SEA-021",
        "Mandla",
        "Khumalo",
        "Mandla",
        "1995-04-12",
        "MALE",
        "mandla.khumalo@example.co.za",
        "+27 82 555 1234",
        "Nomsa (+27 82 555 9999)",
        "MARATHON",
        "RUNNER",
        "DEVELOPMENT",
        "2026-ASA-9921",
        "SENIOR_RUNNER",
        "ACTIVE",
        "PAID",
        "2026-12-31",
      ],
      [
        "SEA-022",
        "Refilwe",
        "Mabaso",
        "Fifi",
        "1998-09-21",
        "FEMALE",
        "refilwe.m@example.co.za",
        "+27 71 888 4321",
        "Parent (+27 83 444 3333)",
        "FITNESS_WALK",
        "WALKER",
        "RECREATIONAL",
        "2026-ASA-9922",
        "SENIOR_WALKER",
        "ACTIVE",
        "PAID",
        "2026-12-31",
      ],
    ],
  },
  RACE_RESULTS: {
    filename: "super_eagles_blank_race_results_template.csv",
    description: "Official Competition Race Results (Times, Positions, Verification)",
    headers: [
      "athleteNumber",
      "raceName",
      "date",
      "distanceKm",
      "officialTimeFormatted",
      "overallPosition",
      "genderPosition",
      "categoryPosition",
      "verificationStatus",
      "notes",
    ],
    sampleRows: [
      [
        "SEA-001",
        "Kaapsehoop Marathon 2026",
        "2026-03-07",
        "42.195",
        "2:24:10",
        "14",
        "12",
        "4",
        "VERIFIED",
        "Official championship qualifier",
      ],
    ],
  },
  TRAINING: {
    filename: "super_eagles_blank_training_workouts_template.csv",
    description: "Training Activities & Workouts (Mileage, Duration, Session RPE, Surface)",
    headers: [
      "athleteNumber",
      "date",
      "activityType",
      "workoutType",
      "distanceKm",
      "durationMinutes",
      "sessionRpe",
      "surface",
      "athleteNotes",
    ],
    sampleRows: [
      [
        "SEA-001",
        "2026-03-01",
        "RUN",
        "LONG_RUN",
        "32.0",
        "130",
        "7",
        "ROAD",
        "Aerobic endurance pacing session",
      ],
    ],
  },
  CLUB_ACTIVITIES: {
    filename: "super_eagles_blank_club_schedule_template.csv",
    description: "Club Activities, Time Trials, Weekly Group Runs, and Volunteering",
    headers: [
      "title",
      "activityType",
      "date",
      "location",
      "pointsValue",
      "isMandatory",
      "notes",
    ],
    sampleRows: [
      [
        "Saturday Morning 25km Club Long Run",
        "WEEKLY_RUN",
        "2026-04-04",
        "Super Eagles Clubhouse, Wanderers",
        "15",
        "false",
        "Aerobic base building session",
      ],
      [
        "Wednesday Twilight 10km Pack Walk",
        "WEEKLY_WALK",
        "2026-04-08",
        "Zoo Lake Grounds",
        "15",
        "false",
        "Fast walkers and recreational members",
      ],
    ],
  },
  ATTENDANCE: {
    filename: "super_eagles_blank_attendance_template.csv",
    description: "Club Activity Attendance Log for CCLI Loyalty Calculation",
    headers: [
      "athleteNumber",
      "activityTitle",
      "date",
      "attended",
    ],
    sampleRows: [
      [
        "SEA-001",
        "Saturday Morning 25km Club Long Run",
        "2026-04-04",
        "true",
      ],
    ],
  },
  SPONSORSHIP: {
    filename: "super_eagles_blank_sponsorship_template.csv",
    description: "Sponsorship Transactions, Stipends, Travel, and Gear Disbursements",
    headers: [
      "athleteNumber",
      "transactionDate",
      "supportType",
      "amountZar",
      "notes",
    ],
    sampleRows: [
      [
        "SEA-001",
        "2026-03-15",
        "CASH_STIPEND",
        "6000",
        "Monthly high-performance training stipend",
      ],
    ],
  },
};

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = (searchParams.get("type") || "ATHLETES").toUpperCase();
    const includeSamples = searchParams.get("samples") === "true";

    const template = CSV_TEMPLATES[type];
    if (!template) {
      return NextResponse.json(
        { error: `Invalid template type. Available: ${Object.keys(CSV_TEMPLATES).join(", ")}` },
        { status: 400 }
      );
    }

    // Build CSV content
    const lines: string[] = [];
    lines.push(template.headers.join(","));

    if (includeSamples && template.sampleRows) {
      for (const row of template.sampleRows) {
        // Escape quotes/commas if needed
        const formatted = row.map((cell) => {
          if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        });
        lines.push(formatted.join(","));
      }
    }

    const csvOutput = lines.join("\r\n");

    return new Response(csvOutput, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${template.filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("CSV template error:", error);
    return NextResponse.json({ error: "Failed to generate CSV template." }, { status: 500 });
  }
}
