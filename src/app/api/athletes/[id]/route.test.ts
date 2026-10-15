import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  athleteFindUnique: vi.fn(),
  athleteUpdate: vi.fn(),
  logAudit: vi.fn(),
}));

vi.mock("@/lib/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/session")>();
  return { ...actual, getCurrentUser: mocks.getCurrentUser };
});
vi.mock("@/lib/audit/auditLogger", () => ({ logAudit: mocks.logAudit }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    athlete: { findUnique: mocks.athleteFindUnique, findFirst: mocks.athleteFindUnique, update: mocks.athleteUpdate },
    user: { update: vi.fn() },
  },
}));

import { GET, PATCH } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentUser.mockResolvedValue({ userId: "coach-1", email: "c@example.com", name: "Coach", role: "COACH" });
});

describe("athlete API privacy", () => {
  it("denies an unassigned coach and requests only safe related user fields", async () => {
    mocks.athleteFindUnique.mockResolvedValue({
      id: "athlete-1",
      coachAssignments: [{ coachId: "coach-2", coach: { id: "coach-2", name: "Other" } }],
    });

    const response = await GET(new Request("http://localhost/api/athletes/athlete-1"), {
      params: Promise.resolve({ id: "athlete-1" }),
    });

    expect(response.status).toBe(403);
    const query = mocks.athleteFindUnique.mock.calls[0][0];
    expect(query.include.user.select.passwordHash).toBeUndefined();
    expect(query.include.coachAssignments.include.coach.select.passwordHash).toBeUndefined();
  });

  it("prevents an unassigned coach from editing an athlete", async () => {
    mocks.athleteFindUnique.mockResolvedValue({ id: "athlete-1", userId: null, coachAssignments: [{ coachId: "coach-2" }] });
    const response = await PATCH(new Request("http://localhost/api/athletes/athlete-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName: "Changed" }),
    }), { params: Promise.resolve({ id: "athlete-1" }) });

    expect(response.status).toBe(403);
    expect(mocks.athleteUpdate).not.toHaveBeenCalled();
  });
});
