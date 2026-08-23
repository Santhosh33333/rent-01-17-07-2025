import { PrismaClient, Community, CommunityMember } from "@prisma/client";

export class CommunitiesRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: {
    name: string;
    description?: string;
    avatarUrl?: string;
    privacy: string;
    ownerId: string;
    city?: string;
  }): Promise<Community> {
    return this.prisma.$transaction(async (tx) => {
      const community = await tx.community.create({ data });
      await tx.communityMember.create({
        data: { communityId: community.id, userId: data.ownerId, role: "ADMIN" },
      });
      return community;
    });
  }

  async findById(id: string): Promise<Community | null> {
    return this.prisma.community.findUnique({ where: { id } });
  }

  async findAll(params: { page: number; limit: number; city?: string; search?: string }): Promise<{ communities: Community[]; total: number }> {
    const where: Record<string, unknown> = {};
    if (params.city) where["city"] = params.city;
    if (params.search) where["name"] = { contains: params.search };
    const skip = (params.page - 1) * params.limit;
    const [communities, total] = await Promise.all([
      this.prisma.community.findMany({ where, skip, take: params.limit, orderBy: { memberCount: "desc" } }),
      this.prisma.community.count({ where }),
    ]);
    return { communities, total };
  }

  async update(id: string, data: { name?: string; description?: string; avatarUrl?: string; privacy?: string; city?: string }): Promise<Community> {
    return this.prisma.community.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Community> {
    return this.prisma.community.delete({ where: { id } });
  }

  async addMember(communityId: string, userId: string): Promise<CommunityMember> {
    const member = await this.prisma.communityMember.create({
      data: { communityId, userId, role: "MEMBER" },
    });
    await this.prisma.community.update({
      where: { id: communityId },
      data: { memberCount: { increment: 1 } },
    });
    return member;
  }

  async removeMember(communityId: string, userId: string): Promise<void> {
    await this.prisma.communityMember.deleteMany({ where: { communityId, userId } });
    await this.prisma.community.update({
      where: { id: communityId },
      data: { memberCount: { decrement: 1 } },
    });
  }

  async getMember(communityId: string, userId: string): Promise<CommunityMember | null> {
    return this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId } },
    });
  }

  async getMembers(communityId: string): Promise<CommunityMember[]> {
    return this.prisma.communityMember.findMany({ where: { communityId } });
  }

  async updateMemberRole(communityId: string, userId: string, role: string): Promise<CommunityMember> {
    return this.prisma.communityMember.update({
      where: { communityId_userId: { communityId, userId } },
      data: { role },
    });
  }
}
