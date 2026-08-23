import { PrismaClient, Notification } from "@prisma/client";

export class NotificationsRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: { userId: string; title: string; body: string; data?: string }): Promise<Notification> {
    return this.prisma.notification.create({ data });
  }

  async findByUserId(params: { userId: string; page: number; limit: number; unreadOnly?: boolean }): Promise<{ notifications: Notification[]; total: number }> {
    const where: Record<string, unknown> = { userId: params.userId };
    if (params.unreadOnly) where["isRead"] = false;
    const skip = (params.page - 1) * params.limit;
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.notification.count({ where }),
    ]);
    return { notifications, total };
  }

  async markRead(id: string, userId: string): Promise<Notification> {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async markManyRead(ids: string[], userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id: { in: ids }, userId },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }
}
