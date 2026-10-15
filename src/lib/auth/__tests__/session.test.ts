import { afterEach, describe, expect, it, vi } from "vitest";
import {
  canAccessAthleteProfile,
  isSessionRole,
  shouldUseSecureSessionCookie,
  signToken,
  verifyToken,
} from "../session";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("session security policy", () => {
  it("accepts only supported persisted roles", () => {
    expect(isSessionRole("COACH")).toBe(true);
    expect(isSessionRole("UNKNOWN_ROLE")).toBe(false);
    expect(isSessionRole(null)).toBe(false);
  });

  it("rejects a signed token whose role is outside the authorization model", async () => {
    vi.stubEnv("NODE_ENV", "test");
    const secret = "test-secret-that-is-long-enough-for-regression-checks";
    vi.stubEnv("JWT_SECRET", secret);
    const jwt = await import("jsonwebtoken");
    const token = jwt.default.sign(
      { userId: "user-1", email: "test@example.com", name: "Test", role: "UNKNOWN_ROLE" },
      secret
    );
    expect(verifyToken(token)).toBeNull();
  });

  it("round-trips a valid token", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("JWT_SECRET", "test-secret-that-is-long-enough-for-regression-checks");
    const token = signToken({ userId: "user-1", email: "coach@example.com", name: "Coach", role: "COACH" });
    expect(verifyToken(token)?.role).toBe("COACH");
  });

  it("allows local HTTP cookies for the documented production launcher", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    expect(shouldUseSecureSessionCookie(new Request("http://localhost:3000/api/auth/login"))).toBe(false);
  });

  it("uses secure cookies behind an HTTPS proxy", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(shouldUseSecureSessionCookie(new Request("http://localhost:3000/api/auth/login", {
      headers: { "x-forwarded-proto": "https" },
    }))).toBe(true);
  });

  it("rejects recognizable placeholder secrets in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("JWT_SECRET", "replace-with-a-long-random-secret-before-production");
    expect(() => signToken({ userId: "user-1", email: "coach@example.com", name: "Coach", role: "COACH" }))
      .toThrow(/unique, random value/i);
  });
});

describe("athlete profile access", () => {
  it("denies an unassigned coach and permits the assigned coach", () => {
    const coach = { userId: "coach-1", role: "COACH" as const };
    expect(canAccessAthleteProfile(coach, "athlete-1", ["coach-2"])).toBe(false);
    expect(canAccessAthleteProfile(coach, "athlete-1", ["coach-1"])).toBe(true);
  });

  it("limits athletes to their own profile", () => {
    const athlete = { userId: "user-1", role: "ATHLETE" as const, athleteId: "athlete-1" };
    expect(canAccessAthleteProfile(athlete, "athlete-1", [])).toBe(true);
    expect(canAccessAthleteProfile(athlete, "athlete-2", [])).toBe(false);
  });

  it("permits authorized administrative and sponsorship roles", () => {
    for (const role of ["SUPER_ADMIN", "CLUB_ADMIN", "SPONSORSHIP_COMMITTEE"] as const) {
      expect(canAccessAthleteProfile({ userId: "user-1", role }, "athlete-1", [])).toBe(true);
    }
  });
});
