import { Request, Response } from "express";
import { ChatService } from "./chat.service";
import { ChatRepository } from "./chat.repository";
import { SendMessageDto, SendChatRequestDto, ChatReportDto, MessageQueryDto, PinMessageDto } from "./chat.dto";
import { sendSuccess, sendError } from "../../utils/response";
import { prisma } from "../../config/database";

const repo = new ChatRepository(prisma);
const service = new ChatService(repo);

type AuthRequest = Request & { user?: { userId: string } };

export async function getConversations(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  try {
    const conversations = await service.getConversations(userId);
    sendSuccess(res, conversations);
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch conversations", 400);
  }
}

export async function getConversationMessages(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  const { id } = req.params as { id: string };
  const parsed = MessageQueryDto.safeParse(req.query);
  if (!parsed.success) { sendError(res, parsed.error.errors[0]?.message ?? "Validation error", 422); return; }
  try {
    const result = await service.getConversationMessages(id, userId, parsed.data);
    sendSuccess(res, result);
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch messages", 400);
  }
}

export async function sendMessage(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  const parsed = SendMessageDto.safeParse(req.body);
  if (!parsed.success) { sendError(res, parsed.error.errors[0]?.message ?? "Validation error", 422); return; }
  try {
    const message = await service.sendMessage(userId, parsed.data);
    sendSuccess(res, message, "Message sent", 201);
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Failed to send message", 400);
  }
}

export async function deleteMessage(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  const { id } = req.params as { id: string };
  try {
    const message = await service.deleteMessage(id, userId);
    sendSuccess(res, message, "Message deleted");
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Delete failed", 400);
  }
}

export async function pinMessage(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  const { id } = req.params as { id: string };
  const parsed = PinMessageDto.safeParse(req.body);
  if (!parsed.success) { sendError(res, parsed.error.errors[0]?.message ?? "Validation error", 422); return; }
  try {
    const message = await service.pinMessage(id, parsed.data.pinned);
    sendSuccess(res, message, parsed.data.pinned ? "Message pinned" : "Message unpinned");
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Pin operation failed", 400);
  }
}

export async function sendChatRequest(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  const parsed = SendChatRequestDto.safeParse(req.body);
  if (!parsed.success) { sendError(res, parsed.error.errors[0]?.message ?? "Validation error", 422); return; }
  try {
    const request = await service.sendChatRequest(userId, parsed.data);
    sendSuccess(res, request, "Chat request sent", 201);
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Failed to send chat request", 400);
  }
}

export async function getChatRequests(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  try {
    const requests = await service.getChatRequests(userId);
    sendSuccess(res, requests);
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch chat requests", 400);
  }
}

export async function acceptChatRequest(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  const { id } = req.params as { id: string };
  try {
    const request = await service.acceptChatRequest(id, userId);
    sendSuccess(res, request, "Chat request accepted");
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Accept failed", 400);
  }
}

export async function rejectChatRequest(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  const { id } = req.params as { id: string };
  try {
    const request = await service.rejectChatRequest(id, userId);
    sendSuccess(res, request, "Chat request rejected");
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Reject failed", 400);
  }
}

export async function reportChat(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  const parsed = ChatReportDto.safeParse(req.body);
  if (!parsed.success) { sendError(res, parsed.error.errors[0]?.message ?? "Validation error", 422); return; }
  try {
    await service.reportChat(userId, parsed.data);
    sendSuccess(res, null, "Report submitted", 201);
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Report failed", 400);
  }
}
