import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  athleteFindMany: vi.fn(),
  clubActivityCount: vi.fn(),
  sponsorshipFindMany: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    athlete: { findMany: mocks.athleteFindMany },
    clubActivity: { count: mocks.clubActivityCount },
    sponsorship: { findMany: mocks.sponsorshipFindMany },
  },
}));

import { GET } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.clubActivityCount.mockResolvedValue(10);
  mocks.sponsorshipFindMany.mockResolvedValue([
    {
      allocatedAmount: 15000,
      status: "ACTIVE",
      transactions: [{ amount: 5000, type: "DISBURSEMENT" }],
    },
  ]);
});

describe("GET /api/dashboard", () => {
  it("returns 401 when unauthenticated", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns leadership decision radar metrics for authenticated admin", async () => {
    mocks.getCurrentUser.mockResolvedValue({
      userId: "user-admin-1",
      email: "admin@supereagles.co.za",
      name: "Club Super Admin",
      role: "SUPER_ADMIN",
    });

    const mockAthletes = [
      {
        id: "ath-1",
        athleteNumber: "SEA-001",
        firstName: "Sipho",
        lastName: "Ndlovu",
        gender: "MALE",
        dateOfBirth: new Date("2002-05-14"),
        membershipStatus: "ACTIVE",
        membershipFeeStatus: "PENDING",
        membershipCategory: "SENIOR",
        raceResults: [
          { eventName: "100m", performanceScore: 820, date: new Date("2026-02-10"), verificationStatus: "VERIFIED" },
          { eventName: "100m", performanceScore: 780, date: new Date("2026-01-10"), verificationStatus: "VERIFIED" },
        ],
        trainingActivities: [{ date: new Date() }],
        clubAttendances: [
          { checkInTime: new Date() },
        ],
        volunteerContributions: [],
        loyaltyExemptions: [],
        sponsorships: [
          {
            allocatedAmount: 15000,
            status: "ACTIVE",
            transactions: [{ amount: 5000, type: "DISBURSEMENT" }],
          },
        ],
      },
      {
        id: "ath-2",
        athleteNumber: "SEA-002",
        firstName: "Kagiso",
        lastName: "Mokoena",
        gender: "MALE",
        dateOfBirth: new Date("2000-08-20"),
        membershipStatus: "ACTIVE",
        membershipFeeStatus: "PAID",
        membershipCategory: "SENIOR",
        raceResults: [],
        trainingActivities: [],
        clubAttendances: [],
        volunteerContributions: [],
        loyaltyExemptions: [],
        sponsorships: [],
      },
    ];

    mocks.athleteFindMany.mockResolvedValue(mockAthletes);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.athletes).toBeDefined();
    expect(Array.isArray(body.athletes)).toBe(true);
    expect(body.athletes.length).toBe(2);

    const sipho = body.athletes.find((a: any) => a.athleteNumber === "SEA-001");
    expect(sipho).toBeDefined();
    expect(sipho.duesOutstanding).toBe(850);
    expect(sipho.membershipFeeStatus).toBe("PENDING");

    expect(body.sponsorshipSummary).toBeDefined();
    expect(body.sponsorshipSummary.allocatedFunds).toBe(5000);
    expect(body.sponsorshipSummary.beneficiariesCount).toBe(1);
  });
});
