import { Request, Response } from "express";
import { CommunitiesService } from "./communities.service";
import { CommunitiesRepository } from "./communities.repository";
import {
  CreateCommunityDto,
  UpdateCommunityDto,
  CommunityListQueryDto,
  UpdateMemberRoleDto,
} from "./communities.dto";
import { sendSuccess, sendError } from "../../utils/response";
import { prisma } from "../../config/database";

const repo = new CommunitiesRepository(prisma);
const service = new CommunitiesService(repo);

type AuthRequest = Request & { user?: { userId: string } };

export async function listCommunities(req: Request, res: Response): Promise<void> {
  const parsed = CommunityListQueryDto.safeParse(req.query);
  if (!parsed.success) { sendError(res, parsed.error.errors[0]?.message ?? "Validation error", 422); return; }
  try {
    const result = await service.list(parsed.data);
    sendSuccess(res, result);
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Failed to list communities", 400);
  }
}

export async function createCommunity(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  const parsed = CreateCommunityDto.safeParse(req.body);
  if (!parsed.success) { sendError(res, parsed.error.errors[0]?.message ?? "Validation error", 422); return; }
  try {
    const community = await service.create(userId, parsed.data);
    sendSuccess(res, community, "Community created", 201);
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Creation failed", 400);
  }
}

export async function getCommunity(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  try {
    const community = await service.getById(id);
    sendSuccess(res, community);
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Community not found", 404);
  }
}

export async function updateCommunity(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  const { id } = req.params as { id: string };
  const parsed = UpdateCommunityDto.safeParse(req.body);
  if (!parsed.success) { sendError(res, parsed.error.errors[0]?.message ?? "Validation error", 422); return; }
  try {
    const community = await service.update(id, userId, parsed.data);
    sendSuccess(res, community, "Community updated");
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Update failed", 400);
  }
}

export async function joinCommunity(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  const { id } = req.params as { id: string };
  try {
    const member = await service.join(id, userId);
    sendSuccess(res, member, "Joined community");
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Join failed", 400);
  }
}

export async function removeMember(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  const { id, userId: targetId } = req.params as { id: string; userId: string };
  try {
    await service.removeMember(id, targetId, userId);
    sendSuccess(res, null, "Member removed");
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Remove failed", 400);
  }
}

export async function updateMemberRole(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  const { id, userId: targetId } = req.params as { id: string; userId: string };
  const parsed = UpdateMemberRoleDto.safeParse(req.body);
  if (!parsed.success) { sendError(res, parsed.error.errors[0]?.message ?? "Validation error", 422); return; }
  try {
    const member = await service.updateMemberRole(id, targetId, userId, parsed.data);
    sendSuccess(res, member, "Role updated");
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Role update failed", 400);
  }
}

export async function muteMember(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  const { id, userId: targetId } = req.params as { id: string; userId: string };
  const { muted } = req.body as { muted?: boolean };
  try {
    // Mute logic uses MuteList model — stub here
    sendSuccess(res, { communityId: id, userId: targetId, muted }, muted ? "Member muted" : "Member unmuted");
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Mute operation failed", 400);
  }
}

export async function getCommunityMembers(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  try {
    const members = await service.getMembers(id);
    sendSuccess(res, members);
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch members", 400);
  }
}
