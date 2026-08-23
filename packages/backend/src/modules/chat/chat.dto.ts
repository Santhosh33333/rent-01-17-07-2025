import { z } from "zod";

export const SendMessageDto = z.object({
  conversationId: z.string().uuid("Invalid conversation ID"),
  content: z.string().min(1, "Message content is required").max(4000),
});

export const SendChatRequestDto = z.object({
  receiverId: z.string().uuid("Invalid receiver ID"),
  message: z.string().max(300).optional(),
});

export const ChatReportDto = z.object({
  messageId: z.string().uuid().optional(),
  conversationId: z.string().uuid().optional(),
  reason: z.string().min(1, "Reason is required").max(255),
  description: z.string().max(1000).optional(),
});

export const MessageQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.string().optional(),
});

export const PinMessageDto = z.object({
  pinned: z.boolean(),
});

export type SendMessageDtoType = z.infer<typeof SendMessageDto>;
export type SendChatRequestDtoType = z.infer<typeof SendChatRequestDto>;
export type ChatReportDtoType = z.infer<typeof ChatReportDto>;
export type MessageQueryDtoType = z.infer<typeof MessageQueryDto>;
export type PinMessageDtoType = z.infer<typeof PinMessageDto>;
