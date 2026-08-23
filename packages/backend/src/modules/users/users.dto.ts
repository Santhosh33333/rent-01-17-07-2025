import { z } from 'zod';

export const UpdateProfileDto = z.object({
  fullName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  avatarUrl: z.string().url().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
});

export const EmergencyContactDto = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/),
  relation: z.string().min(1).max(50),
});

export const FriendRequestDto = z.object({
  addresseeId: z.string().uuid(),
});

export const BlockUserDto = z.object({
  reason: z.string().max(500).optional(),
});

export type UpdateProfileDtoType = z.infer<typeof UpdateProfileDto>;
export type EmergencyContactDtoType = z.infer<typeof EmergencyContactDto>;
