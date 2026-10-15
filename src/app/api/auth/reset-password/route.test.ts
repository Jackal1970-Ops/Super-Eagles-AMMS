import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  userUpdate: vi.fn(),
  auditCreate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: mocks.userFindUnique, update: mocks.userUpdate },
    auditLog: { create: mocks.auditCreate },
  },
}));

import { POST } from "./route";

function request(verification: string): Request {
  return new Request("http://localhost/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "member@example.com", verification, newPassword: "NewPassword2026!" }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.userFindUnique.mockResolvedValue({
    id: "user-1",
    phone: "+27 82 123 4567",
    athlete: { contactPhone: "082 123 4567", athleteNumber: "SEA-001", dateOfBirth: new Date("1990-01-02") },
  });
});

describe("password reset identity verification", () => {
  it("rejects short partial phone fragments", async () => {
    const response = await POST(request("4567"));
    expect(response.status).toBe(400);
    expect(mocks.userUpdate).not.toHaveBeenCalled();
  });

  it("rejects a public Club ID as a password-reset secret", async () => {
    const response = await POST(request("SEA-001"));
    expect(response.status).toBe(400);
    expect(mocks.userUpdate).not.toHaveBeenCalled();
  });

  it("accepts the full registered phone number", async () => {
    const response = await POST(request("082 123 4567"));
    expect(response.status).toBe(200);
    expect(mocks.userUpdate).toHaveBeenCalledOnce();
  });
});
