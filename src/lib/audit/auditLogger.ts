/**
 * Super Eagles Audit Logging Service
 * Records immutable audit logs for compliance, POPIA, and sponsorship governance.
 */

import { prisma } from "../prisma";

export interface LogAuditParams {
  userId?: string | null;
  action: "CREATE" | "UPDATE" | "DELETE" | "OVERRIDE" | "APPROVE" | "REJECT" | "IMPORT" | "EXPORT";
  entityType: "ATHLETE" | "RACE_RESULT" | "SPONSORSHIP" | "SPONSORSHIP_DECISION" | "EXEMPTION" | "CONDITION" | "CONFIG" | "USER" | "TRAINING" | "WELLNESS" | "CLUB_ACTIVITY";
  entityId?: string | null;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string | null;
}

export async function logAudit(params: LogAuditParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId || null,
        oldValuesJson: params.oldValues ? JSON.stringify(params.oldValues) : null,
        newValuesJson: params.newValues ? JSON.stringify(params.newValues) : null,
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
    // Non-blocking so core flow doesn't crash
    return null;
  }
}
