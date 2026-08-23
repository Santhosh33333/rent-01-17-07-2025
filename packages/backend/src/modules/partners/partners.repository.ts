import { PrismaClient, Partner, Booking } from '@prisma/client';

export class PartnersRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUserId(userId: string): Promise<Partner | null> {
    return this.prisma.partner.findUnique({ where: { userId } });
  }

  async findById(id: string): Promise<Partner | null> {
    return this.prisma.partner.findUnique({ where: { id } });
  }

  async create(data: { userId: string; providesWalking?: boolean; providesCarry?: boolean }): Promise<Partner> {
    return this.prisma.partner.create({
      data: { ...data, status: 'APPLIED' },
    });
  }

  async updateAvailability(userId: string, isAvailable: boolean, latitude?: number, longitude?: number): Promise<Partner> {
    return this.prisma.partner.update({
      where: { userId },
      data: { isAvailable, latitude, longitude },
    });
  }

  async updateBankDetails(userId: string, data: { bankAccountName: string; bankAccountNumber: string; bankIfsc: string; upiId?: string }): Promise<Partner> {
    return this.prisma.partner.update({ where: { userId }, data });
  }

  async getNearby(latitude: number, longitude: number, serviceType: string, radius: number = 10): Promise<Partner[]> {
    // Simplified query - in production use PostGIS or Haversine formula
    const field = serviceType === 'WALKING' ? 'providesWalking' : 'providesCarry';
    return this.prisma.partner.findMany({
      where: {
        [field]: true,
        isAvailable: true,
        status: 'APPROVED',
        latitude: { not: null },
        longitude: { not: null },
      },
      take: 20,
    });
  }

  async getPartnerJobs(partnerId: string, page: number, limit: number): Promise<{ jobs: Booking[]; total: number }> {
    const where = { partnerId };
    const [jobs, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.booking.count({ where }),
    ]);
    return { jobs, total };
  }

  async getJobById(jobId: string, partnerId: string): Promise<Booking | null> {
    return this.prisma.booking.findFirst({ where: { id: jobId, partnerId } });
  }
}
