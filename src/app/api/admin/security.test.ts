import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  previewSeasonRollover: vi.fn(),
  executeSeasonRollover: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/rollover/seasonRolloverEngine", () => ({
  previewSeasonRollover: mocks.previewSeasonRollover,
  executeSeasonRollover: mocks.executeSeasonRollover,
}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { GET as getRollover, POST as postRollover } from "./rollover/route";
import { GET as getComplianceReport } from "./reports/compliance/route";

beforeEach(() => vi.clearAllMocks());

describe("administrator endpoint authorization", () => {
  it("rejects unauthenticated rollover reads and writes", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const readResponse = await getRollover(new Request("http://localhost/api/admin/rollover"));
    const writeResponse = await postRollover(new Request("http://localhost/api/admin/rollover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetSeason: "2027" }),
    }));

    expect(readResponse.status).toBe(401);
    expect(writeResponse.status).toBe(401);
    expect(mocks.previewSeasonRollover).not.toHaveBeenCalled();
    expect(mocks.executeSeasonRollover).not.toHaveBeenCalled();
  });

  it("rejects non-administrators from rollover and compliance data", async () => {
    mocks.getCurrentUser.mockResolvedValue({ userId: "athlete-user", name: "Athlete", role: "ATHLETE", athleteId: "athlete-1" });

    const rolloverResponse = await getRollover(new Request("http://localhost/api/admin/rollover"));
    const complianceResponse = await getComplianceReport(new Request("http://localhost/api/admin/reports/compliance"));

    expect(rolloverResponse.status).toBe(403);
    expect(complianceResponse.status).toBe(403);
  });
});
