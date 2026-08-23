import { Request, Response } from "express";
import { EventsService } from "./events.service";
import { EventsRepository } from "./events.repository";
import { CreateEventDto, UpdateEventDto, EventListQueryDto, CheckinDto } from "./events.dto";
import { sendSuccess, sendError } from "../../utils/response";
import { prisma } from "../../config/database";

const repo = new EventsRepository(prisma);
const service = new EventsService(repo);

type AuthRequest = Request & { user?: { userId: string } };

export async function listEvents(req: Request, res: Response): Promise<void> {
  const parsed = EventListQueryDto.safeParse(req.query);
  if (!parsed.success) { sendError(res, parsed.error.errors[0]?.message ?? "Validation error", 422); return; }
  try {
    const result = await service.list(parsed.data);
    sendSuccess(res, result);
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Failed to list events", 400);
  }
}

export async function createEvent(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  const parsed = CreateEventDto.safeParse(req.body);
  if (!parsed.success) { sendError(res, parsed.error.errors[0]?.message ?? "Validation error", 422); return; }
  try {
    const event = await service.create(userId, parsed.data);
    sendSuccess(res, event, "Event created", 201);
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Event creation failed", 400);
  }
}

export async function getEvent(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  try {
    const event = await service.getById(id);
    sendSuccess(res, event);
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Event not found", 404);
  }
}

export async function updateEvent(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  const { id } = req.params as { id: string };
  const parsed = UpdateEventDto.safeParse(req.body);
  if (!parsed.success) { sendError(res, parsed.error.errors[0]?.message ?? "Validation error", 422); return; }
  try {
    const event = await service.update(id, userId, parsed.data);
    sendSuccess(res, event, "Event updated");
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Update failed", 400);
  }
}

export async function registerForEvent(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  const { id } = req.params as { id: string };
  try {
    const attendee = await service.register(id, userId);
    sendSuccess(res, attendee, "Registered successfully", 201);
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Registration failed", 400);
  }
}

export async function getEventTicket(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  const { id } = req.params as { id: string };
  try {
    const ticket = await service.getTicket(id, userId);
    sendSuccess(res, ticket);
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Ticket not found", 404);
  }
}

export async function checkinEvent(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  const { id } = req.params as { id: string };
  const parsed = CheckinDto.safeParse(req.body);
  if (!parsed.success) { sendError(res, parsed.error.errors[0]?.message ?? "Validation error", 422); return; }
  try {
    const attendee = await service.checkin(id, parsed.data);
    sendSuccess(res, attendee, "Checked in successfully");
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Checkin failed", 400);
  }
}

export async function getEventAnalytics(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  const { id } = req.params as { id: string };
  try {
    const analytics = await service.getAnalytics(id, userId);
    sendSuccess(res, analytics);
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Analytics unavailable", 400);
  }
}

export async function cancelEventRegistration(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  const { id } = req.params as { id: string };
  try {
    const attendee = await service.cancelRegistration(id, userId);
    sendSuccess(res, attendee, "Registration cancelled");
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Cancellation failed", 400);
  }
}
