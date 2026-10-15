import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  athleteFindUnique: vi.fn(),
  sponsorshipFindUnique: vi.fn(),
  sponsorshipUpdate: vi.fn(),
  sponsorshipCreate: vi.fn(),
  decisionCreate: vi.fn(),
  logAudit: vi.fn(),
  createNotification: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/audit/auditLogger", () => ({ logAudit: mocks.logAudit }));
vi.mock("@/lib/notifications/notificationService", () => ({ createNotification: mocks.createNotification }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    athlete: { findUnique: mocks.athleteFindUnique },
    $transaction: vi.fn(async (operation) => operation({
      sponsorship: {
        findUnique: mocks.sponsorshipFindUnique,
        update: mocks.sponsorshipUpdate,
        create: mocks.sponsorshipCreate,
      },
      sponsorshipDecision: { create: mocks.decisionCreate },
    })),
  },
}));

import { POST } from "./route";

function decisionRequest(payload: Record<string, unknown>): Request {
  return new Request("http://localhost/api/sponsorship/decisions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentUser.mockResolvedValue({
    userId: "committee-1",
    email: "committee@example.com",
    name: "Committee",
    role: "SPONSORSHIP_COMMITTEE",
  });
  mocks.athleteFindUnique.mockResolvedValue({ id: "athlete-1", userId: null, user: null });
});

describe("sponsorship decision integrity", () => {
  it("rejects unsupported tier values before writing", async () => {
    const response = await POST(decisionRequest({ athleteId: "athlete-1", actualTier: "invented" }));
    expect(response.status).toBe(400);
    expect(mocks.athleteFindUnique).not.toHaveBeenCalled();
    expect(mocks.decisionCreate).not.toHaveBeenCalled();
  });

  it("rejects a sponsorship that belongs to another athlete", async () => {
    mocks.sponsorshipFindUnique.mockResolvedValue({ id: "sponsorship-1", athleteId: "athlete-2" });

    const response = await POST(decisionRequest({
      athleteId: "athlete-1",
      sponsorshipId: "sponsorship-1",
      actualTier: "PERFORMANCE",
    }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/does not belong/i);
    expect(mocks.sponsorshipUpdate).not.toHaveBeenCalled();
    expect(mocks.decisionCreate).not.toHaveBeenCalled();
  });
});
