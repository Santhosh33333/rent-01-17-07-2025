import { Response } from "express";
import { prisma } from "../config/database";
import { sendSuccess, sendError } from "../utils/response";
import { AuthedRequest } from "../middleware/authTypes";

export async function createCommunity(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { name, description, privacy, city } = req.body;
    const community = await prisma.community.create({
      data: {
        name,
        description,
        privacy: privacy ?? "PUBLIC",
        city,
        ownerId: req.user!.userId,
        memberCount: 1,
      },
    });
    await prisma.communityMember.create({
      data: { communityId: community.id, userId: req.user!.userId, role: "ADMIN" },
    });
    sendSuccess(res, community, "Community created.", 201);
  } catch (err) {
    sendError(res, "Failed to create community.", 500, "INTERNAL_ERROR");
  }
}

export async function getCommunities(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const where: any = {};
    if (req.query.privacy) where.privacy = req.query.privacy;
    if (req.query.city) where.city = req.query.city;
    const [items, total] = await Promise.all([
      prisma.community.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { owner: { select: { id: true, fullName: true } } },
      }),
      prisma.community.count({ where }),
    ]);
    sendSuccess(res, { items, page, limit, total });
  } catch (err) {
    sendError(res, "Failed to retrieve communities.", 500, "INTERNAL_ERROR");
  }
}

export async function getCommunityById(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const community = await prisma.community.findUnique({
      where: { id },
      include: { owner: { select: { id: true, fullName: true, avatarUrl: true } } },
    });
    if (!community) {
      sendError(res, "Community not found.", 404, "COMMUNITY_NOT_FOUND");
      return;
    }
    sendSuccess(res, community, "Community retrieved.");
  } catch (err) {
    sendError(res, "Failed to retrieve community.", 500, "INTERNAL_ERROR");
  }
}

export async function joinCommunity(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const community = await prisma.community.findUnique({ where: { id } });
    if (!community) {
      sendError(res, "Community not found.", 404, "COMMUNITY_NOT_FOUND");
      return;
    }
    const existing = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: id, userId: req.user!.userId } },
    });
    if (existing) {
      sendError(res, "Already a member.", 409, "ALREADY_MEMBER");
      return;
    }
    await prisma.$transaction([
      prisma.communityMember.create({ data: { communityId: id, userId: req.user!.userId } }),
      prisma.community.update({ where: { id }, data: { memberCount: { increment: 1 } } }),
    ]);
    sendSuccess(res, undefined, "Joined community.");
  } catch (err) {
    sendError(res, "Failed to join community.", 500, "INTERNAL_ERROR");
  }
}

export async function leaveCommunity(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const member = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: id, userId: req.user!.userId } },
    });
    if (!member) {
      sendError(res, "Not a member of this community.", 404, "NOT_MEMBER");
      return;
    }
    await prisma.$transaction([
      prisma.communityMember.delete({ where: { communityId_userId: { communityId: id, userId: req.user!.userId } } }),
      prisma.community.update({ where: { id }, data: { memberCount: { decrement: 1 } } }),
    ]);
    sendSuccess(res, undefined, "Left community.");
  } catch (err) {
    sendError(res, "Failed to leave community.", 500, "INTERNAL_ERROR");
  }
}

export async function getCommunityMembers(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const [items, total] = await Promise.all([
      prisma.communityMember.findMany({
        where: { communityId: id },
        orderBy: { joinedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
      }),
      prisma.communityMember.count({ where: { communityId: id } }),
    ]);
    sendSuccess(res, { items, page, limit, total });
  } catch (err) {
    sendError(res, "Failed to retrieve community members.", 500, "INTERNAL_ERROR");
  }
}
