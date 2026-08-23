import { Response } from "express";
import { prisma } from "../config/database";
import { sendSuccess, sendError } from "../utils/response";
import { AuthedRequest } from "../middleware/authTypes";

export async function createRequest(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { itemType, itemDescription, startLocation, endLocation, startTime, durationMinutes, fare, notes } = req.body;
    const request = await prisma.carryBuddyRequest.create({
      data: {
        requesterId: req.user!.userId,
        itemType,
        itemDescription,
        startLocation,
        endLocation,
        startTime: new Date(startTime),
        durationMinutes,
        fare,
        notes,
        status: "OPEN",
      },
    });
    sendSuccess(res, request, "Carry buddy request created.", 201);
  } catch (err) {
    sendError(res, "Failed to create carry buddy request.", 500, "INTERNAL_ERROR");
  }
}

export async function getRequests(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const [items, total] = await Promise.all([
      prisma.carryBuddyRequest.findMany({
        where: { status: "OPEN" },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { requester: { select: { id: true, fullName: true, avatarUrl: true } } },
      }),
      prisma.carryBuddyRequest.count({ where: { status: "OPEN" } }),
    ]);
    sendSuccess(res, { items, page, limit, total });
  } catch (err) {
    sendError(res, "Failed to retrieve carry buddy requests.", 500, "INTERNAL_ERROR");
  }
}

export async function acceptRequest(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const request = await prisma.carryBuddyRequest.findUnique({ where: { id } });
    if (!request) {
      sendError(res, "Request not found.", 404, "REQUEST_NOT_FOUND");
      return;
    }
    if (request.status !== "OPEN") {
      sendError(res, "Request is no longer open.", 400, "INVALID_STATUS");
      return;
    }
    if (request.requesterId === req.user!.userId) {
      sendError(res, "Cannot accept your own request.", 400, "INVALID_ACTION");
      return;
    }
    const updated = await prisma.carryBuddyRequest.update({
      where: { id },
      data: { status: "ACCEPTED", acceptedById: req.user!.userId },
    });
    sendSuccess(res, updated, "Carry buddy request accepted.");
  } catch (err) {
    sendError(res, "Failed to accept carry buddy request.", 500, "INTERNAL_ERROR");
  }
}

export async function completeRequest(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const request = await prisma.carryBuddyRequest.findUnique({ where: { id } });
    if (!request) {
      sendError(res, "Request not found.", 404, "REQUEST_NOT_FOUND");
      return;
    }
    const userId = req.user!.userId;
    if (request.requesterId !== userId && request.acceptedById !== userId) {
      sendError(res, "Not part of this request.", 403, "FORBIDDEN");
      return;
    }
    if (request.status !== "ACCEPTED") {
      sendError(res, "Request must be accepted before completing.", 400, "INVALID_STATUS");
      return;
    }
    const updated = await prisma.carryBuddyRequest.update({
      where: { id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    sendSuccess(res, updated, "Carry buddy request completed.");
  } catch (err) {
    sendError(res, "Failed to complete carry buddy request.", 500, "INTERNAL_ERROR");
  }
}

export async function getMyRequests(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const [items, total] = await Promise.all([
      prisma.carryBuddyRequest.findMany({
        where: { requesterId: userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { acceptedBy: { select: { id: true, fullName: true, avatarUrl: true } } },
      }),
      prisma.carryBuddyRequest.count({ where: { requesterId: userId } }),
    ]);
    sendSuccess(res, { items, page, limit, total });
  } catch (err) {
    sendError(res, "Failed to retrieve your carry buddy requests.", 500, "INTERNAL_ERROR");
  }
}

export async function getMyJobs(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const [items, total] = await Promise.all([
      prisma.carryBuddyRequest.findMany({
        where: { acceptedById: userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { requester: { select: { id: true, fullName: true, avatarUrl: true } } },
      }),
      prisma.carryBuddyRequest.count({ where: { acceptedById: userId } }),
    ]);
    sendSuccess(res, { items, page, limit, total });
  } catch (err) {
    sendError(res, "Failed to retrieve your carry buddy jobs.", 500, "INTERNAL_ERROR");
  }
}
