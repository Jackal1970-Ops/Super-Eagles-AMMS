/**
 * Super Eagles Authentication & Session Management
 * Provides JWT signing, verification, cookie extraction, and role authorization guards.
 */

import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "../prisma";

const COOKIE_NAME = "se_ams_session";

export const SESSION_ROLES = [
  "SUPER_ADMIN",
  "COACH",
  "ATHLETE",
  "CLUB_ADMIN",
  "SPONSORSHIP_COMMITTEE",
] as const;

export type SessionRole = (typeof SESSION_ROLES)[number];

export function isSessionRole(value: unknown): value is SessionRole {
  return typeof value === "string" && SESSION_ROLES.some((role) => role === value);
}

export function shouldUseSecureSessionCookie(request?: Request): boolean {
  const explicit = process.env.SESSION_COOKIE_SECURE?.trim().toLowerCase();
  if (explicit === "true") return true;
  if (explicit === "false") return false;

  const forwardedProtocol = request?.headers.get("x-forwarded-proto")?.split(",")[0].trim().toLowerCase();
  if (forwardedProtocol) return forwardedProtocol === "https";
  if (request) {
    try {
      return new URL(request.url).protocol === "https:";
    } catch {
      // Fall through to the configured public URL.
    }
  }
  return process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://") === true;
}

export function isUnsafeProductionSecret(secret: string): boolean {
  return secret.length < 32 || /replace-with|change-before|example-secret|placeholder/i.test(secret);
}

function getJwtSecret(): string {
  const configuredSecret = process.env.JWT_SECRET?.trim();
  if (configuredSecret) {
    if (process.env.NODE_ENV === "production" && isUnsafeProductionSecret(configuredSecret)) {
      throw new Error("JWT_SECRET must be a unique, random value of at least 32 characters in production.");
    }
    return configuredSecret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be configured in production.");
  }

  return "super-eagles-local-development-secret-change-before-production";
}

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: SessionRole;
  athleteId?: string;
}

export function canAccessAthleteProfile(
  user: Pick<SessionPayload, "userId" | "role" | "athleteId">,
  athleteId: string,
  assignedCoachIds: readonly string[]
): boolean {
  if (user.role === "SUPER_ADMIN" || user.role === "CLUB_ADMIN" || user.role === "SPONSORSHIP_COMMITTEE") {
    return true;
  }
  if (user.role === "ATHLETE") return user.athleteId === athleteId;
  return user.role === "COACH" && assignedCoachIds.includes(user.userId);
}

export function signToken(payload: SessionPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    const payload = jwt.verify(token, getJwtSecret());
    if (
      typeof payload !== "object" ||
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string" ||
      !isSessionRole(payload.role)
    ) {
      return null;
    }
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get(COOKIE_NAME);
    if (!tokenCookie?.value) return null;

    const payload = verifyToken(tokenCookie.value);
    if (!payload) return null;

    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { athlete: true },
    });

    if (!user || !user.isActive || !isSessionRole(user.role)) return null;

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      athleteId: user.athlete?.id,
    };
  } catch {
    return null;
  }
}

export async function requireAuth(allowedRoles?: Array<SessionPayload["role"]>): Promise<SessionPayload> {
  const session = await getCurrentUser();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  // SUPER_ADMIN has full developer master override access across all features
  if (session.role === "SUPER_ADMIN") {
    return session;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
    throw new Error("FORBIDDEN");
  }

  return session;
}
