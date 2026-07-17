import { Response } from "express";
import { prisma } from "../config/database";
import { sendSuccess, sendError } from "../utils/response";
import { AuthedRequest } from "../middleware/authTypes";

export async function createEvent(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { title, description, communityId, location, startTime, endTime, capacity } = req.body;
    const event = await prisma.event.create({
      data: {
        title,
        description,
        communityId,
        location,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        capacity,
        organizerId: req.user!.userId,
        status: "PUBLISHED",
      },
    });
    sendSuccess(res, event, "Event created.", 201);
  } catch (err) {
    sendError(res, "Failed to create event.", 500, "INTERNAL_ERROR");
  }
}

export async function getEvents(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const where: any = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.communityId) where.communityId = req.query.communityId;
    const [items, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { startTime: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { organizer: { select: { id: true, fullName: true } } },
      }),
      prisma.event.count({ where }),
    ]);
    sendSuccess(res, { items, page, limit, total });
  } catch (err) {
    sendError(res, "Failed to retrieve events.", 500, "INTERNAL_ERROR");
  }
}

export async function getEventById(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({
      where: { id },
      include: { organizer: { select: { id: true, fullName: true, avatarUrl: true } } },
    });
    if (!event) {
      sendError(res, "Event not found.", 404, "EVENT_NOT_FOUND");
      return;
    }
    sendSuccess(res, event, "Event retrieved.");
  } catch (err) {
    sendError(res, "Failed to retrieve event.", 500, "INTERNAL_ERROR");
  }
}

export async function registerForEvent(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      sendError(res, "Event not found.", 404, "EVENT_NOT_FOUND");
      return;
    }
    if (event.capacity && event.attendeeCount >= event.capacity) {
      sendError(res, "Event is at full capacity.", 400, "EVENT_FULL");
      return;
    }
    const existing = await prisma.eventAttendee.findUnique({
      where: { eventId_userId: { eventId: id, userId: req.user!.userId } },
    });
    if (existing) {
      sendError(res, "Already registered for this event.", 409, "ALREADY_REGISTERED");
      return;
    }
    await prisma.$transaction([
      prisma.eventAttendee.create({ data: { eventId: id, userId: req.user!.userId, status: "REGISTERED" } }),
      prisma.event.update({ where: { id }, data: { attendeeCount: { increment: 1 } } }),
    ]);
    sendSuccess(res, undefined, "Registered for event.");
  } catch (err) {
    sendError(res, "Failed to register for event.", 500, "INTERNAL_ERROR");
  }
}

export async function cancelRegistration(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const attendee = await prisma.eventAttendee.findUnique({
      where: { eventId_userId: { eventId: id, userId: req.user!.userId } },
    });
    if (!attendee) {
      sendError(res, "Not registered for this event.", 404, "NOT_REGISTERED");
      return;
    }
    await prisma.$transaction([
      prisma.eventAttendee.delete({ where: { eventId_userId: { eventId: id, userId: req.user!.userId } } }),
      prisma.event.update({ where: { id }, data: { attendeeCount: { decrement: 1 } } }),
    ]);
    sendSuccess(res, undefined, "Registration cancelled.");
  } catch (err) {
    sendError(res, "Failed to cancel registration.", 500, "INTERNAL_ERROR");
  }
}

export async function checkInEvent(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const attendee = await prisma.eventAttendee.findUnique({
      where: { eventId_userId: { eventId: id, userId: req.user!.userId } },
    });
    if (!attendee) {
      sendError(res, "Not registered for this event.", 404, "NOT_REGISTERED");
      return;
    }
    await prisma.eventAttendee.update({
      where: { eventId_userId: { eventId: id, userId: req.user!.userId } },
      data: { status: "CHECKED_IN", checkedInAt: new Date() },
    });
    sendSuccess(res, undefined, "Checked in to event.");
  } catch (err) {
    sendError(res, "Failed to check in.", 500, "INTERNAL_ERROR");
  }
}
