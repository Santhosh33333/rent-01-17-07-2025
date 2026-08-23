import { z } from "zod";

export const CreateCommunityDto = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  description: z.string().max(1000).optional(),
  avatarUrl: z.string().url("Invalid URL").optional(),
  privacy: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
  city: z.string().max(100).optional(),
});

export const UpdateCommunityDto = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(1000).optional(),
  avatarUrl: z.string().url("Invalid URL").optional(),
  privacy: z.enum(["PUBLIC", "PRIVATE"]).optional(),
  city: z.string().max(100).optional(),
});

export const CommunityListQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  city: z.string().optional(),
  search: z.string().optional(),
});

export const UpdateMemberRoleDto = z.object({
  role: z.enum(["MEMBER", "MODERATOR", "ADMIN"]),
});

export const MuteMemberDto = z.object({
  muted: z.boolean(),
});

export type CreateCommunityDtoType = z.infer<typeof CreateCommunityDto>;
export type UpdateCommunityDtoType = z.infer<typeof UpdateCommunityDto>;
export type CommunityListQueryDtoType = z.infer<typeof CommunityListQueryDto>;
export type UpdateMemberRoleDtoType = z.infer<typeof UpdateMemberRoleDto>;
export type MuteMemberDtoType = z.infer<typeof MuteMemberDto>;
