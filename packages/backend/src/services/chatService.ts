import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database";
import { env } from "../config/env";

export const onlineUsers = new Map<string, string>();
const accessSecret = env.JWT_ACCESS_SECRET ?? env.JWT_SECRET;

export function setupChat(io: Server): void {
  io.use((socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token as string | undefined;
      if (!token) {
        return next(new Error("Authentication token required"));
      }
      const decoded = jwt.verify(token, accessSecret) as jwt.JwtPayload & { userId?: string; email?: string };
      if (!decoded.userId) {
        return next(new Error("Invalid token payload"));
      }
      (socket as any).userId = decoded.userId;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = (socket as any).userId as string;
    console.log(`Socket connected: ${userId}`);
    onlineUsers.set(userId, socket.id);

    io.emit("user_online", { userId, online: true });

    socket.on("join_conversation", async (data: { conversationId: string }) => {
      try {
        socket.join(data.conversationId);
        socket.emit("joined_conversation", { conversationId: data.conversationId });
      } catch (err) {
        socket.emit("error", { message: "Failed to join conversation" });
      }
    });

    socket.on("send_message", async (data: { receiverId: string; content: string }) => {
      try {
        const { receiverId, content } = data;
        const participantIds = [userId, receiverId].sort();
        const conversation = await prisma.conversation.upsert({
          where: {
            participant1Id_participant2Id: {
              participant1Id: participantIds[0],
              participant2Id: participantIds[1],
            },
          },
          create: {
            participant1Id: participantIds[0],
            participant2Id: participantIds[1],
          },
          update: {},
        });

        const message = await prisma.message.create({
          data: {
            senderId: userId,
            receiverId,
            conversationId: `${participantIds[0]}:${participantIds[1]}`,
            content,
          },
          include: {
            sender: { select: { id: true, fullName: true, avatarUrl: true } },
          },
        });

        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { lastMessageId: message.id },
        });

        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("new_message", message);
        }
        socket.emit("message_sent", message);
      } catch (err) {
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("typing_start", async (data: { conversationId: string }) => {
      try {
        const participantIds = [userId].sort();
        await prisma.typingStatus.upsert({
          where: { conversationId_userId: { conversationId: data.conversationId, userId } },
          create: { conversationId: data.conversationId, userId, isTyping: true },
          update: { isTyping: true, lastTypedAt: new Date() },
        });
        socket.to(data.conversationId).emit("user_typing", { userId, isTyping: true });
      } catch {
        // ignore typing errors
      }
    });

    socket.on("typing_stop", async (data: { conversationId: string }) => {
      try {
        await prisma.typingStatus.upsert({
          where: { conversationId_userId: { conversationId: data.conversationId, userId } },
          create: { conversationId: data.conversationId, userId, isTyping: false },
          update: { isTyping: false },
        });
        socket.to(data.conversationId).emit("user_typing", { userId, isTyping: false });
      } catch {
        // ignore typing errors
      }
    });

    socket.on("mark_read", async (data: { messageIds: string[] }) => {
      try {
        await prisma.message.updateMany({
          where: { id: { in: data.messageIds }, receiverId: userId },
          data: { status: "READ", readAt: new Date() },
        });
        socket.emit("messages_read", { messageIds: data.messageIds });
      } catch {
        // ignore mark read errors
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${userId}`);
      onlineUsers.delete(userId);
      io.emit("user_online", { userId, online: false });
    });
  });
}
