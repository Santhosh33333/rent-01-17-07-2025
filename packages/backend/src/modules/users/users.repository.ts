import { PrismaClient, User, Friendship, UserBlock, Session } from '@prisma/client';

export class UsersRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async updateProfile(id: string, data: Partial<Pick<User, 'fullName' | 'bio' | 'city' | 'country' | 'avatarUrl' | 'gender'>>): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async addEmergencyContact(userId: string, data: { emergencyContactName: string; emergencyContactPhone: string; emergencyContactRelation: string }): Promise<void> {
    await this.prisma.verification.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }

  async getEmergencyContacts(userId: string) {
    return this.prisma.verification.findUnique({
      where: { userId },
      select: {
        emergencyContactName: true,
        emergencyContactPhone: true,
        emergencyContactRelation: true,
      },
    });
  }

  async deleteEmergencyContact(userId: string): Promise<void> {
    await this.prisma.verification.update({
      where: { userId },
      data: {
        emergencyContactName: null,
        emergencyContactPhone: null,
        emergencyContactRelation: null,
      },
    });
  }

  async getFriends(userId: string): Promise<Friendship[]> {
    return this.prisma.friendship.findMany({
      where: {
        OR: [{ requesterId: userId }, { addresseeId: userId }],
        status: 'ACCEPTED',
      },
    });
  }

  async blockUser(blockerId: string, blockedId: string, reason?: string): Promise<UserBlock> {
    return this.prisma.userBlock.create({ data: { blockerId, blockedId, reason } });
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    await this.prisma.userBlock.deleteMany({ where: { blockerId, blockedId } });
  }

  async getSessions(userId: string): Promise<Session[]> {
    return this.prisma.session.findMany({ where: { userId } });
  }

  async deleteSession(id: string, userId: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { id, userId } });
  }

  async deactivate(userId: string): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { status: 'DEACTIVATED' } });
  }
}
