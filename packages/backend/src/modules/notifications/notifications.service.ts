import { Notification } from "@prisma/client";
import { NotificationsRepository } from "./notifications.repository";
import type { NotificationListQueryDtoType, MarkReadDtoType, NotificationPreferencesDtoType } from "./notifications.dto";
import { INotificationPreferences } from "./notifications.types";

export class NotificationsService {
  constructor(private repo: NotificationsRepository) {}

  async getNotifications(userId: string, params: NotificationListQueryDtoType): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
    const [result, unreadCount] = await Promise.all([
      this.repo.findByUserId({ userId, ...params }),
      this.repo.getUnreadCount(userId),
    ]);
    return { ...result, unreadCount };
  }

  async markAllRead(userId: string): Promise<void> {
    await this.repo.markAllRead(userId);
  }

  async markRead(id: string, userId: string): Promise<Notification> {
    return this.repo.markRead(id, userId);
  }

  async markManyRead(data: MarkReadDtoType, userId: string): Promise<void> {
    await this.repo.markManyRead(data.ids, userId);
  }

  async getPreferences(_userId: string): Promise<INotificationPreferences> {
    // In production: load from user settings table
    return {
      pushEnabled: true,
      emailEnabled: true,
      smsEnabled: false,
      bookingUpdates: true,
      chatMessages: true,
      communityUpdates: true,
      promotions: false,
    };
  }

  async updatePreferences(_userId: string, _data: NotificationPreferencesDtoType): Promise<INotificationPreferences> {
    // In production: persist to user settings
    return this.getPreferences(_userId);
  }

  async sendToUser(userId: string, title: string, body: string, data?: Record<string, unknown>): Promise<Notification> {
    return this.repo.create({
      userId,
      title,
      body,
      data: data ? JSON.stringify(data) : undefined,
    });
  }
}
