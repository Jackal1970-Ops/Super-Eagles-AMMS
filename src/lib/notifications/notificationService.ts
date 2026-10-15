/**
 * Super Eagles In-App Notification Dispatcher
 */

import { prisma } from "../prisma";

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  notificationType:
    | "SPONSORSHIP_REVIEW"
    | "CONDITION_ALERT"
    | "RACE_APPROACHING"
    | "RESULT_VERIFICATION"
    | "PERFORMANCE_DECLINE"
    | "IMPROVEMENT"
    | "LOW_PARTICIPATION"
    | "QUALIFICATION_ACHIEVED"
    | "SPONSORSHIP_DECISION";
  linkUrl?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    return await prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        notificationType: params.notificationType,
        linkUrl: params.linkUrl || null,
        isRead: false,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}
