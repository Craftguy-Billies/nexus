import prisma from '../config/database';
import { NotificationType, Prisma } from '@prisma/client';

/**
 * Notification service.
 * In production, this integrates with Expo Push Notifications.
 * This stub stores notifications in the DB and logs push attempts.
 */
export class NotificationService {
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, unknown>
  ) {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        data: (data || {}) as Prisma.InputJsonValue,
      },
    });

    // Check user's notification preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        expoPushToken: true,
        notifyNewFollower: true,
        notifyNewLike: true,
        notifyNewComment: true,
        notifyAiInteraction: true,
        notifySystemAlerts: true,
      },
    });

    if (!user) return notification;

    const shouldSend = this.checkPreference(user, type);
    if (shouldSend && user.expoPushToken) {
      await this.sendPushNotification(user.expoPushToken, title, body, data);
    }

    return notification;
  }

  async getNotifications(userId: string, limit = 20, cursor?: string) {
    const where: Record<string, unknown> = { userId };
    if (cursor) {
      where.createdAt = {
        lt: new Date(Buffer.from(cursor, 'base64').toString()),
      };
    }

    const notifications = await prisma.notification.findMany({
      where,
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
    });

    const hasMore = notifications.length > limit;
    const items = hasMore ? notifications.slice(0, limit) : notifications;
    const nextToken =
      hasMore && items.length > 0
        ? Buffer.from(
            items[items.length - 1].createdAt.toISOString()
          ).toString('base64')
        : null;

    return { items, nextToken };
  }

  async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  private checkPreference(
    user: {
      notifyNewFollower: boolean;
      notifyNewLike: boolean;
      notifyNewComment: boolean;
      notifyAiInteraction: boolean;
      notifySystemAlerts: boolean;
    },
    type: NotificationType
  ): boolean {
    switch (type) {
      case 'new_follower':
        return user.notifyNewFollower;
      case 'new_like':
        return user.notifyNewLike;
      case 'new_comment':
        return user.notifyNewComment;
      case 'ai_interaction':
        return user.notifyAiInteraction;
      case 'system_alert':
      case 'energy_refill':
      case 'streak_reward':
        return user.notifySystemAlerts;
      default:
        return true;
    }
  }

  /**
   * Push notification stub.
   * In production, use Expo Push Notification API.
   */
  private async sendPushNotification(
    pushToken: string,
    title: string,
    body: string,
    _data?: Record<string, unknown>
  ): Promise<void> {
    // In production:
    // const message = { to: pushToken, title, body, data, sound: 'default' };
    // await fetch('https://exp.host/--/api/v2/push/send', { ... });
    console.log(`[PUSH] To: ${pushToken.slice(0, 20)}... | ${title}: ${body}`);
  }
}

export const notificationService = new NotificationService();
