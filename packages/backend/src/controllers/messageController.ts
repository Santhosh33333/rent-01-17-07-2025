import { Response } from "express";
import { prisma } from "../config/database";
import { sendSuccess, sendError } from "../utils/response";
import { AuthedRequest } from "../middleware/authTypes";

function conversationId(a: string, b: string): string {
  return [a, b].sort().join(":");
}

export async function sendMessage(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { receiverId, content } = req.body;
    if (receiverId === req.user!.userId) {
      sendError(res, "Cannot send message to yourself.", 400, "INVALID_RECEIVER");
      return;
    }
    const receiver = await prisma.user.findUnique({ where: { id: receiverId }, select: { id: true } });
    if (!receiver) {
      sendError(res, "Receiver not found.", 404, "RECEIVER_NOT_FOUND");
      return;
    }
    const message = await prisma.message.create({
      data: {
        senderId: req.user!.userId,
        receiverId,
        conversationId: conversationId(req.user!.userId, receiverId),
        content,
      },
    });
    sendSuccess(res, message, "Message sent.", 201);
  } catch (err) {
    sendError(res, "Failed to send message.", 500, "INTERNAL_ERROR");
  }
}

export async function getConversations(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const convs = await prisma.message.groupBy({
      by: ["conversationId"],
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      _max: { createdAt: true },
      orderBy: { _max: { createdAt: "desc" } },
    });
    const conversations = await Promise.all(
      convs.map(async (c) => {
        const last = await prisma.message.findFirst({
          where: { conversationId: c.conversationId },
          orderBy: { createdAt: "desc" },
          include: {
            sender: { select: { id: true, fullName: true, avatarUrl: true } },
            receiver: { select: { id: true, fullName: true, avatarUrl: true } },
          },
        });
        return { conversationId: c.conversationId, lastMessage: last };
      })
    );
    sendSuccess(res, conversations, "Conversations retrieved.");
  } catch (err) {
    sendError(res, "Failed to retrieve conversations.", 500, "INTERNAL_ERROR");
  }
}

export async function getMessages(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { conversationId } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const userId = req.user!.userId;
    const [items, total] = await Promise.all([
      prisma.message.findMany({
        where: {
          conversationId,
          OR: [{ senderId: userId }, { receiverId: userId }],
        },
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.message.count({
        where: {
          conversationId,
          OR: [{ senderId: userId }, { receiverId: userId }],
        },
      }),
    ]);
    sendSuccess(res, { items, page, limit, total });
  } catch (err) {
    sendError(res, "Failed to retrieve messages.", 500, "INTERNAL_ERROR");
  }
}

export async function markAsRead(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const message = await prisma.message.findUnique({ where: { id } });
    if (!message || message.receiverId !== req.user!.userId) {
      sendError(res, "Message not found.", 404, "MESSAGE_NOT_FOUND");
      return;
    }
    await prisma.message.update({
      where: { id },
      data: { status: "READ", readAt: new Date() },
    });
    sendSuccess(res, undefined, "Message marked as read.");
  } catch (err) {
    sendError(res, "Failed to mark message as read.", 500, "INTERNAL_ERROR");
  }
}

export async function deleteMessage(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const message = await prisma.message.findUnique({ where: { id } });
    if (!message || message.senderId !== req.user!.userId) {
      sendError(res, "Message not found.", 404, "MESSAGE_NOT_FOUND");
      return;
    }
    await prisma.message.update({ where: { id }, data: { status: "DELETED", content: "[deleted]" } });
    sendSuccess(res, undefined, "Message deleted.");
  } catch (err) {
    sendError(res, "Failed to delete message.", 500, "INTERNAL_ERROR");
  }
}
