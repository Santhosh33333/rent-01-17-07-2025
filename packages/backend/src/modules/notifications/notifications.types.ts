export enum NotificationChannel {
  PUSH = "PUSH",
  IN_APP = "IN_APP",
  EMAIL = "EMAIL",
  SMS = "SMS",
}

export interface INotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  isRead: boolean;
  data?: string | null;
  createdAt: Date;
}

export interface ISendNotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channel?: NotificationChannel;
}

export interface INotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  bookingUpdates: boolean;
  chatMessages: boolean;
  communityUpdates: boolean;
  promotions: boolean;
}

export interface INotificationListQuery {
  page: number;
  limit: number;
  unreadOnly?: boolean;
}
