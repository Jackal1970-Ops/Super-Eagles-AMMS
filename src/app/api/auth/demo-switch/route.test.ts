import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  userFindUnique: vi.fn(),
  signToken: vi.fn(),
  isSessionRole: vi.fn(),
  shouldUseSecureSessionCookie: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: mocks.getCurrentUser,
  isSessionRole: mocks.isSessionRole,
  signToken: mocks.signToken,
  shouldUseSecureSessionCookie: mocks.shouldUseSecureSessionCookie,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: mocks.userFindUnique },
  },
}));

import { POST } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NODE_ENV", "test");
  process.env.ENABLE_DEMO_ROLE_SWITCH = "true";
  mocks.isSessionRole.mockReturnValue(true);
  mocks.shouldUseSecureSessionCookie.mockReturnValue(false);
  mocks.signToken.mockReturnValue("mocked-jwt-token");
});

describe("POST /api/auth/demo-switch", () => {
  it("rejects invalid email formats", async () => {
    mocks.getCurrentUser.mockResolvedValue({ userId: "u-1", role: "COACH" });

    const req = new Request("http://localhost/api/auth/demo-switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("valid email is required");
  });

  it("permits switching from COACH or ATHLETE back to SUPER_ADMIN via canonical demo email without entrapment", async () => {
    // Current user is locked into COACH persona
    mocks.getCurrentUser.mockResolvedValue({
      userId: "u-coach",
      email: "coach.hendrik@supereagles.co.za",
      role: "COACH",
    });

    // Target is admin
    mocks.userFindUnique.mockResolvedValue({
      id: "u-admin",
      email: "admin@supereagles.co.za",
      name: "Club Super Admin",
      role: "SUPER_ADMIN",
      isActive: true,
      athlete: null,
    });

    const req = new Request("http://localhost/api/auth/demo-switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@supereagles.co.za" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.user.role).toBe("SUPER_ADMIN");
    expect(res.cookies.get("se_ams_session")?.value).toBe("mocked-jwt-token");
  });

  it("denies switching to arbitrary unauthorized accounts when non-admin", async () => {
    mocks.getCurrentUser.mockResolvedValue({
      userId: "u-coach",
      email: "coach.hendrik@supereagles.co.za",
      role: "COACH",
    });

    const req = new Request("http://localhost/api/auth/demo-switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "arbitrary.intruder@external.com" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("restricted to official demo personas");
  });

  it("blocks demo switching entirely when disabled in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.ENABLE_DEMO_ROLE_SWITCH = "false";

    const req = new Request("http://localhost/api/auth/demo-switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@supereagles.co.za" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("disabled");

    vi.unstubAllEnvs();
  });
});
