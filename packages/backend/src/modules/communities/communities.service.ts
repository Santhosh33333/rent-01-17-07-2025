import { Community, CommunityMember } from "@prisma/client";
import { CommunitiesRepository } from "./communities.repository";
import type {
  CreateCommunityDtoType,
  UpdateCommunityDtoType,
  CommunityListQueryDtoType,
  UpdateMemberRoleDtoType,
} from "./communities.dto";

export class CommunitiesService {
  constructor(private repo: CommunitiesRepository) {}

  async create(ownerId: string, data: CreateCommunityDtoType): Promise<Community> {
    return this.repo.create({ ...data, ownerId });
  }

  async getById(id: string): Promise<Community> {
    const community = await this.repo.findById(id);
    if (!community) throw new Error("Community not found");
    return community;
  }

  async list(params: CommunityListQueryDtoType): Promise<{ communities: Community[]; total: number }> {
    return this.repo.findAll(params);
  }

  async update(id: string, userId: string, data: UpdateCommunityDtoType): Promise<Community> {
    const community = await this.getById(id);
    const member = await this.repo.getMember(id, userId);
    if (!member || !["ADMIN", "MODERATOR"].includes(member.role)) {
      throw new Error("Not authorized to update this community");
    }
    return this.repo.update(id, data);
  }

  async delete(id: string, userId: string): Promise<void> {
    const community = await this.getById(id);
    if (community.ownerId !== userId) throw new Error("Only the owner can delete this community");
    await this.repo.delete(id);
  }

  async join(communityId: string, userId: string): Promise<CommunityMember> {
    const community = await this.getById(communityId);
    if (community.privacy === "PRIVATE") throw new Error("This community is private");
    const existing = await this.repo.getMember(communityId, userId);
    if (existing) throw new Error("Already a member of this community");
    return this.repo.addMember(communityId, userId);
  }

  async leave(communityId: string, userId: string): Promise<void> {
    const community = await this.getById(communityId);
    if (community.ownerId === userId) throw new Error("Owner cannot leave the community");
    await this.repo.removeMember(communityId, userId);
  }

  async removeMember(communityId: string, targetUserId: string, requesterId: string): Promise<void> {
    const member = await this.repo.getMember(communityId, requesterId);
    if (!member || !["ADMIN", "MODERATOR"].includes(member.role)) {
      throw new Error("Not authorized to remove members");
    }
    await this.repo.removeMember(communityId, targetUserId);
  }

  async updateMemberRole(communityId: string, targetUserId: string, requesterId: string, data: UpdateMemberRoleDtoType): Promise<CommunityMember> {
    const member = await this.repo.getMember(communityId, requesterId);
    if (!member || member.role !== "ADMIN") throw new Error("Only admins can change roles");
    return this.repo.updateMemberRole(communityId, targetUserId, data.role);
  }

  async getMembers(communityId: string): Promise<CommunityMember[]> {
    return this.repo.getMembers(communityId);
  }
}
