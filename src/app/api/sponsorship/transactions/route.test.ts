import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  athleteFindUnique: vi.fn(),
  sponsorshipCreate: vi.fn(),
  transactionCreate: vi.fn(),
  transactionFindMany: vi.fn(),
  logAudit: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/audit/auditLogger", () => ({ logAudit: mocks.logAudit }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    athlete: { findUnique: mocks.athleteFindUnique },
    $transaction: vi.fn(async (operation) =>
      operation({
        sponsorship: { create: mocks.sponsorshipCreate },
        sponsorshipTransaction: {
          create: mocks.transactionCreate,
          findMany: mocks.transactionFindMany,
        },
      })
    ),
  },
}));

import { POST } from "./route";

function makeRequest(payload: Record<string, unknown>): Request {
  return new Request("http://localhost/api/sponsorship/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentUser.mockResolvedValue({
    userId: "admin-1",
    email: "admin@supereagles.co.za",
    name: "General Manager",
    role: "SUPER_ADMIN",
  });
  mocks.athleteFindUnique.mockResolvedValue({
    id: "ath-1",
    athleteNumber: "SEA-002",
    firstName: "Kagiso",
    lastName: "Mokoena",
    athleteStatus: "ELITE",
    sponsorships: [{ id: "sp-1", currentTier: "PERFORMANCE", status: "ACTIVE" }],
  });
  mocks.transactionCreate.mockResolvedValue({
    id: "tx-1",
    sponsorshipId: "sp-1",
    athleteId: "ath-1",
    amount: 5000,
    supportType: "EQUIPMENT",
    fundingSource: "CLUB_CORE_BUDGET",
  });
  mocks.transactionFindMany.mockResolvedValue([{ amount: 38500 }, { amount: 5000 }]);
});

describe("POST /api/sponsorship/transactions", () => {
  it("rejects unauthorized users (e.g. ATHLETE role)", async () => {
    mocks.getCurrentUser.mockResolvedValue({
      userId: "ath-user",
      role: "ATHLETE",
    });

    const res = await POST(
      makeRequest({
        athleteId: "ath-1",
        amount: 1000,
        supportType: "CASH_STIPEND",
      })
    );
    expect(res.status).toBe(403);
  });

  it("rejects invalid or non-positive amounts", async () => {
    const res = await POST(
      makeRequest({
        athleteId: "ath-1",
        amount: -500,
        supportType: "CASH_STIPEND",
      })
    );
    expect(res.status).toBe(400);
  });

  it("successfully creates transaction, links sponsorship, and logs audit trail", async () => {
    const res = await POST(
      makeRequest({
        athleteId: "ath-1",
        amount: 5000,
        supportType: "EQUIPMENT",
        fundingSource: "CLUB_CORE_BUDGET",
        notes: "New marathon racing shoes allocation",
      })
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.updatedTotalZar).toBe(43500);
    expect(mocks.transactionCreate).toHaveBeenCalled();
    expect(mocks.logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "CREATE",
        entityType: "SPONSORSHIP",
      })
    );
  });
});
