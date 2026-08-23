import { PrismaClient, Booking } from '@prisma/client';

export class BookingsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: {
    userId: string;
    serviceType: string;
    startLocation: string;
    endLocation: string;
    scheduledAt: Date;
    durationMinutes?: number;
    itemType?: string;
    itemDescription?: string;
    couponCode?: string;
    notes?: string;
    estimatedAmount?: number;
    platformFee?: number;
    partnerEarning?: number;
  }): Promise<Booking> {
    return this.prisma.booking.create({ data });
  }

  async findById(id: string): Promise<Booking | null> {
    return this.prisma.booking.findUnique({ where: { id } });
  }

  async findByIdAndUser(id: string, userId: string): Promise<Booking | null> {
    return this.prisma.booking.findFirst({ where: { id, userId } });
  }

  async getUserHistory(userId: string, page: number, limit: number): Promise<{ bookings: Booking[]; total: number }> {
    const where = { userId };
    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.booking.count({ where }),
    ]);
    return { bookings, total };
  }

  async getActiveBookings(userId: string): Promise<Booking[]> {
    return this.prisma.booking.findMany({
      where: {
        userId,
        status: { notIn: ['COMPLETED', 'CANCELLED', 'REFUND_COMPLETED'] },
      },
    });
  }

  async updateStatus(id: string, status: string, extra?: Partial<Booking>): Promise<Booking> {
    return this.prisma.booking.update({ where: { id }, data: { status, ...extra } });
  }

  async cancel(id: string, cancelledBy: string, reason: string): Promise<Booking> {
    return this.prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledBy, cancelReason: reason, cancelledAt: new Date() },
    });
  }
}
