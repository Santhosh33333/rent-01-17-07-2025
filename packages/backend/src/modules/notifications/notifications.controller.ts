import { Request, Response } from "express";
import { NotificationsService } from "./notifications.service";
import { NotificationsRepository } from "./notifications.repository";
import { NotificationListQueryDto, MarkReadDto, NotificationPreferencesDto } from "./notifications.dto";
import { sendSuccess, sendError } from "../../utils/response";
import { prisma } from "../../config/database";

const repo = new NotificationsRepository(prisma);
const service = new NotificationsService(repo);

type AuthRequest = Request & { user?: { userId: string } };

export async function getNotifications(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  const parsed = NotificationListQueryDto.safeParse(req.query);
  if (!parsed.success) { sendError(res, parsed.error.errors[0]?.message ?? "Validation error", 422); return; }
  try {
    const result = await service.getNotifications(userId, parsed.data);
    sendSuccess(res, result);
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch notifications", 400);
  }
}

export async function markAllRead(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  try {
    await service.markAllRead(userId);
    sendSuccess(res, null, "All notifications marked as read");
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Operation failed", 400);
  }
}

export async function markOneRead(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  const { id } = req.params as { id: string };
  try {
    const notification = await service.markRead(id, userId);
    sendSuccess(res, notification, "Notification marked as read");
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Operation failed", 400);
  }
}

export async function getPreferences(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  try {
    const prefs = await service.getPreferences(userId);
    sendSuccess(res, prefs);
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch preferences", 400);
  }
}

export async function updatePreferences(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  const parsed = NotificationPreferencesDto.safeParse(req.body);
  if (!parsed.success) { sendError(res, parsed.error.errors[0]?.message ?? "Validation error", 422); return; }
  try {
    const prefs = await service.updatePreferences(userId, parsed.data);
    sendSuccess(res, prefs, "Preferences updated");
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Update failed", 400);
  }
}
