import { z } from "zod";

export const CreateEventDto = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().max(2000).optional(),
  communityId: z.string().uuid().optional(),
  location: z.string().max(500).optional(),
  startTime: z.string().refine((v) => !isNaN(Date.parse(v)), "Invalid start time"),
  endTime: z.string().refine((v) => !isNaN(Date.parse(v)), "Invalid end time").optional(),
  capacity: z.number().int().min(1).optional(),
});

export const UpdateEventDto = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(2000).optional(),
  location: z.string().max(500).optional(),
  startTime: z.string().refine((v) => !isNaN(Date.parse(v)), "Invalid start time").optional(),
  endTime: z.string().refine((v) => !isNaN(Date.parse(v)), "Invalid end time").optional(),
  capacity: z.number().int().min(1).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "CANCELLED"]).optional(),
});

export const EventListQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "CANCELLED"]).optional(),
  communityId: z.string().uuid().optional(),
});

export const CheckinDto = z.object({
  userId: z.string().uuid("Invalid user ID"),
  ticketCode: z.string().optional(),
});

export type CreateEventDtoType = z.infer<typeof CreateEventDto>;
export type UpdateEventDtoType = z.infer<typeof UpdateEventDto>;
export type EventListQueryDtoType = z.infer<typeof EventListQueryDto>;
export type CheckinDtoType = z.infer<typeof CheckinDto>;
