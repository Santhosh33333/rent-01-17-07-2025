import { PrismaClient, Verification, VerificationHistory } from '@prisma/client';

export class KycRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUserId(userId: string): Promise<Verification | null> {
    return this.prisma.verification.findUnique({ where: { userId } });
  }

  async create(data: { userId: string; selfieUrl?: string; govIdUrl?: string; govIdType?: string; addressProofUrl?: string }): Promise<Verification> {
    return this.prisma.verification.create({ data: { ...data, status: 'SUBMITTED' } });
  }

  async updateStatus(
    id: string,
    data: { status: string; reviewedBy?: string; rejectionReason?: string; reviewedAt?: Date },
  ): Promise<Verification> {
    return this.prisma.verification.update({ where: { id }, data });
  }

  async addHistory(verificationId: string, data: { status: string; note?: string; changedBy?: string }): Promise<VerificationHistory> {
    return this.prisma.verificationHistory.create({ data: { verificationId, ...data } });
  }

  async getHistory(verificationId: string): Promise<VerificationHistory[]> {
    return this.prisma.verificationHistory.findMany({ where: { verificationId }, orderBy: { createdAt: 'desc' } });
  }

  async getQueue(page: number, limit: number): Promise<{ items: Verification[]; total: number }> {
    const [items, total] = await Promise.all([
      this.prisma.verification.findMany({
        where: { status: { in: ['SUBMITTED', 'PENDING_REVIEW'] } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.verification.count({ where: { status: { in: ['SUBMITTED', 'PENDING_REVIEW'] } } }),
    ]);
    return { items, total };
  }
}
