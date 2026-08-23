import { z } from "zod";

export const NotificationListQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unreadOnly: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

export const MarkReadDto = z.object({
  ids: z.array(z.string().uuid()).min(1, "At least one notification ID is required"),
});

export const NotificationPreferencesDto = z.object({
  pushEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  bookingUpdates: z.boolean().optional(),
  chatMessages: z.boolean().optional(),
  communityUpdates: z.boolean().optional(),
  promotions: z.boolean().optional(),
});

export type NotificationListQueryDtoType = z.infer<typeof NotificationListQueryDto>;
export type MarkReadDtoType = z.infer<typeof MarkReadDto>;
export type NotificationPreferencesDtoType = z.infer<typeof NotificationPreferencesDto>;
