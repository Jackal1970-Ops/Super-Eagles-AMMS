import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  updateMany: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    notification: { updateMany: mocks.updateMany },
  },
}));

import { PATCH } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentUser.mockResolvedValue({ userId: "user-1", role: "ATHLETE", athleteId: "athlete-1" });
});

describe("notification ownership", () => {
  it("scopes a notification update to the signed-in user", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });
    const response = await PATCH(new Request("http://localhost/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: "somebody-elses-notification" }),
    }));

    expect(response.status).toBe(404);
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: "somebody-elses-notification", userId: "user-1" },
      data: { isRead: true },
    });
  });
});
