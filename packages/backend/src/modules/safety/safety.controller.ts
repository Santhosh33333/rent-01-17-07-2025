import { Request, Response } from "express";
import { SafetyService } from "./safety.service";
import { SafetyRepository } from "./safety.repository";
import { SosTriggerDto, AddContactDto, SafetyTimerDto, IncidentReportDto } from "./safety.dto";
import { sendSuccess, sendError } from "../../utils/response";
import { prisma } from "../../config/database";

const repo = new SafetyRepository(prisma);
const service = new SafetyService(repo);

type AuthRequest = Request & { user?: { userId: string } };

export async function triggerSos(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  const parsed = SosTriggerDto.safeParse(req.body);
  if (!parsed.success) { sendError(res, parsed.error.errors[0]?.message ?? "Validation error", 422); return; }
  try {
    const alert = await service.triggerSos(userId, parsed.data);
    sendSuccess(res, alert, "SOS alert triggered", 201);
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "SOS trigger failed", 400);
  }
}

export async function resolveSos(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  const { id } = req.params as { id: string };
  try {
    const alert = await service.resolveSos(id, userId);
    sendSuccess(res, alert, "SOS resolved");
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Resolve failed", 400);
  }
}

export async function getEmergencyContacts(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  try {
    const contacts = await service.getEmergencyContacts(userId);
    sendSuccess(res, contacts);
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch contacts", 400);
  }
}

export async function addEmergencyContact(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  const parsed = AddContactDto.safeParse(req.body);
  if (!parsed.success) { sendError(res, parsed.error.errors[0]?.message ?? "Validation error", 422); return; }
  try {
    const contact = await service.addEmergencyContact(userId, parsed.data);
    sendSuccess(res, contact, "Emergency contact added", 201);
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Failed to add contact", 400);
  }
}

export async function removeEmergencyContact(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  const { id } = req.params as { id: string };
  try {
    await service.removeEmergencyContact(userId, id);
    sendSuccess(res, null, "Emergency contact removed");
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Remove failed", 400);
  }
}

export async function startSafetyTimer(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  const parsed = SafetyTimerDto.safeParse(req.body);
  if (!parsed.success) { sendError(res, parsed.error.errors[0]?.message ?? "Validation error", 422); return; }
  try {
    const timer = await service.startSafetyTimer(userId, parsed.data);
    sendSuccess(res, timer, "Safety timer started", 201);
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Failed to start timer", 400);
  }
}

export async function checkInTimer(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  try {
    const result = await service.checkInTimer(userId);
    sendSuccess(res, result, "Checked in successfully");
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Check-in failed", 400);
  }
}

export async function reportIncident(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  const parsed = IncidentReportDto.safeParse(req.body);
  if (!parsed.success) { sendError(res, parsed.error.errors[0]?.message ?? "Validation error", 422); return; }
  try {
    const incident = await service.reportIncident(userId, parsed.data);
    sendSuccess(res, incident, "Incident reported", 201);
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Report failed", 400);
  }
}
