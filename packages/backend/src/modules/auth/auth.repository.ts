import { PrismaClient, User } from '@prisma/client';

export class AuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: {
    email: string;
    phone: string;
    fullName: string;
    passwordHash: string;
    dateOfBirth: Date;
    gender: string;
  }): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({ where: { id }, data: { lastLoginAt: new Date() } });
  }

  async updateMobileVerified(id: string): Promise<void> {
    await this.prisma.user.update({ where: { id }, data: { mobileVerified: true } });
  }
}
