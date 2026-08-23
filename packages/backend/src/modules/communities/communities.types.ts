export enum CommunityPrivacy {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
}

export enum CommunityRole {
  MEMBER = "MEMBER",
  MODERATOR = "MODERATOR",
  ADMIN = "ADMIN",
}

export interface ICommunity {
  id: string;
  name: string;
  description?: string | null;
  avatarUrl?: string | null;
  privacy: CommunityPrivacy;
  ownerId: string;
  city?: string | null;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICommunityMember {
  id: string;
  communityId: string;
  userId: string;
  role: CommunityRole;
  joinedAt: Date;
}

export interface ICreateCommunityPayload {
  name: string;
  description?: string;
  avatarUrl?: string;
  privacy?: CommunityPrivacy;
  city?: string;
}

export interface IUpdateCommunityPayload {
  name?: string;
  description?: string;
  avatarUrl?: string;
  privacy?: CommunityPrivacy;
  city?: string;
}

export interface ICommunityListQuery {
  page: number;
  limit: number;
  city?: string;
  search?: string;
}
