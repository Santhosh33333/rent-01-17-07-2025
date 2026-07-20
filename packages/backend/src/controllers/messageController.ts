import { Response } from "express";
import { prisma } from "../config/database";
import { sendSuccess, sendError } from "../utils/response";
import { AuthedRequest } from "../middleware/authTypes";

function conversationId(a: string, b: string): string {
  return [a, b].sort().join(":");
}

// ============================================================================
// SEND MESSAGE
// ============================================================================

export async function sendMessage(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { receiverId, content } = req.body;

    if (!content) {
      sendError(res, "Message content is required.", 400, "VALIDATION_ERROR");
      return;
    }

    if (receiverId === req.user!.userId) {
      sendError(res, "Cannot send message to yourself.", 400, "INVALID_RECEIVER");
      return;
    }

    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true },
    });

    if (!receiver) {
      sendError(res, "Receiver not found.", 404, "RECEIVER_NOT_FOUND");
      return;
    }

    const convId = conversationId(req.user!.userId, receiverId);

    const message = await prisma.message.create({
      data: {
        senderId: req.user!.userId,
        receiverId,
        conversationId: convId,
        content,
        status: "SENT",
      },
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user!.userId,
        actorType: "USER",
        action: "MESSAGE_SEND",
        entityType: "Message",
        entityId: message.id,
      },
    });

    sendSuccess(res, message, "Message sent.", 201);
  } catch (err: any) {
    sendError(res, "Failed to send message.", 500, "INTERNAL_ERROR");
  }
}

// ============================================================================
// GET CONVERSATIONS
// ============================================================================

export async function getConversations(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const convs = await prisma.message.groupBy({
      by: ["conversationId"],
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      _max: { createdAt: true },
      orderBy: { _max: { createdAt: "desc" } },
      skip: (page - 1) * limit,
      take: limit,
    });

    if (convs.length === 0) {
      sendSuccess(res, { items: [], page, limit, total: 0 });
      return;
    }

    const convIds = convs.map(c => c.conversationId);
    const lastMessages = await prisma.message.findMany({
      where: { conversationId: { in: convIds } },
      orderBy: { createdAt: "desc" },
      distinct: ["conversationId"],
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
        receiver: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    const lastMsgMap = new Map(lastMessages.map(m => [m.conversationId, m]));
    const conversations = convs.map(c => ({
      conversationId: c.conversationId,
      lastMessage: lastMsgMap.get(c.conversationId) || null,
    }));

    const total = await prisma.message.groupBy({
      by: ["conversationId"],
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    });

    sendSuccess(res, { items: conversations, page, limit, total: total.length });
  } catch (err: any) {
    sendError(res, "Failed to retrieve conversations.", 500, "INTERNAL_ERROR");
  }
}

// ============================================================================
// GET MESSAGES IN CONVERSATION
// ============================================================================

export async function getMessages(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { conversationId } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const userId = req.user!.userId;

    // Verify user is part of conversation
    const hasAccess = await prisma.message.findFirst({
      where: {
        conversationId,
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
    });

    if (!hasAccess) {
      sendError(res, "Access denied to this conversation.", 403, "FORBIDDEN");
      return;
    }

    const [items, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          sender: { select: { id: true, fullName: true, avatarUrl: true } },
        },
      }),
      prisma.message.count({ where: { conversationId } }),
    ]);

    sendSuccess(res, { items, page, limit, total });
  } catch (err: any) {
    sendError(res, "Failed to retrieve messages.", 500, "INTERNAL_ERROR");
  }
}

// ============================================================================
// MARK MESSAGE AS READ
// ============================================================================

export async function markAsRead(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const message = await prisma.message.findUnique({ where: { id } });

    if (!message || message.receiverId !== req.user!.userId) {
      sendError(res, "Message not found.", 404, "MESSAGE_NOT_FOUND");
      return;
    }

    const updated = await prisma.message.update({
      where: { id },
      data: { status: "READ", readAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user!.userId,
        actorType: "USER",
        action: "MESSAGE_READ",
        entityType: "Message",
        entityId: id,
      },
    });

    sendSuccess(res, updated, "Message marked as read.");
  } catch (err: any) {
    sendError(res, "Failed to mark message as read.", 500, "INTERNAL_ERROR");
  }
}

// ============================================================================
// DELETE MESSAGE
// ============================================================================

export async function deleteMessage(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const message = await prisma.message.findUnique({ where: { id } });

    if (!message || message.senderId !== req.user!.userId) {
      sendError(res, "Message not found.", 404, "MESSAGE_NOT_FOUND");
      return;
    }

    const updated = await prisma.message.update({
      where: { id },
      data: { status: "DELETED", content: "[deleted]" },
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user!.userId,
        actorType: "USER",
        action: "MESSAGE_DELETE",
        entityType: "Message",
        entityId: id,
      },
    });

    sendSuccess(res, updated, "Message deleted.");
  } catch (err: any) {
    sendError(res, "Failed to delete message.", 500, "INTERNAL_ERROR");
  }
}
