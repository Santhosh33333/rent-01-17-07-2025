import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import { prisma } from "../config/database";
import { verifyToken } from "../middleware/auth";

type AuthSocket = Socket & { userId?: string; userRole?: string };

// Store active connections
interface UserConnection {
  userId: string;
  socketId: string;
  role?: string;
}

interface BookingUpdate {
  bookingId: string;
  status: string;
  partnerId?: string;
  latitude?: number;
  longitude?: number;
  eta?: number;
  distance?: number;
}

interface LocationUpdate {
  bookingId: string;
  partnerId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
}

const activeConnections = new Map<string, UserConnection>(); // socketId -> UserConnection
const userSockets = new Map<string, string[]>(); // userId -> [socketIds]
const bookingRooms = new Map<string, Set<string>>(); // bookingId -> Set of socketIds

export function initializeSocket(httpServer: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
      credentials: true,
    },
    transports: ["websocket", "polling"],
    pingInterval: 25000,
    pingTimeout: 60000,
  });

  // Middleware: Authenticate socket connection
  io.use((socket: AuthSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error: Missing token"));
      }

      // Verify token (synchronous check)
      const decoded = verifyToken(token);
      if (!decoded) {
        return next(new Error("Authentication error: Invalid token"));
      }

      socket.userId = decoded.userId;
      socket.userRole = decoded.role || "USER";
      next();
    } catch (err) {
      next(new Error("Authentication error: " + (err as Error).message));
    }
  });

  // Connection handler
  io.on("connection", (socket: AuthSocket) => {
    const userId = socket.userId as string;
    console.log(`[SOCKET] User ${userId} connected: ${socket.id}`);

    // Store connection
    activeConnections.set(socket.id, {
      userId,
      socketId: socket.id,
      role: socket.userRole,
    });

    // Add socket to user's socket list
    if (!userSockets.has(userId)) {
      userSockets.set(userId, []);
    }
    userSockets.get(userId)!.push(socket.id);

    // =====================================================================
    // BOOKING TRACKING EVENTS
    // =====================================================================

    /**
     * Partner joins booking tracking room
     * Allows real-time location and status updates
     */
    socket.on("join_booking", (bookingId: string) => {
      const room = `booking_${bookingId}`;
      socket.join(room);

      if (!bookingRooms.has(bookingId)) {
        bookingRooms.set(bookingId, new Set());
      }
      bookingRooms.get(bookingId)!.add(socket.id);

      console.log(`[SOCKET] ${userId} joined booking ${bookingId}`);
      socket.emit("joined_booking", { bookingId, success: true });
    });

    /**
     * Partner leaves booking tracking room
     */
    socket.on("leave_booking", (bookingId: string) => {
      const room = `booking_${bookingId}`;
      socket.leave(room);

      const sockets = bookingRooms.get(bookingId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          bookingRooms.delete(bookingId);
        }
      }

      console.log(`[SOCKET] ${userId} left booking ${bookingId}`);
    });

    /**
     * Partner sends live location update
     * Broadcast to all users watching this booking
     */
    socket.on("location_update", async (data: LocationUpdate) => {
      try {
        const { bookingId, latitude, longitude, heading, speed } = data;

        // Update partner location in database (async, non-blocking)
        prisma.partnerLocation
          .upsert({
            where: { partnerId: data.partnerId },
            update: {
              latitude,
              longitude,
              heading,
              speed,
              updatedAt: new Date(),
            },
            create: {
              partnerId: data.partnerId,
              latitude,
              longitude,
              heading,
              speed,
            },
          })
          .catch((err) => console.error("[SOCKET] Location update DB error:", err));

        // Broadcast to all users in booking room
        io.to(`booking_${bookingId}`).emit("partner_location", {
          bookingId,
          latitude,
          longitude,
          heading,
          speed,
          timestamp: Date.now(),
        });

        console.log(`[SOCKET] Location update for booking ${bookingId}: ${latitude}, ${longitude}`);
      } catch (err) {
        console.error("[SOCKET] Location update error:", err);
        socket.emit("error", { message: "Location update failed" });
      }
    });

    /**
     * User/Partner sends booking status update
     * Status changes: ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED
     */
    socket.on("booking_status_update", async (data: BookingUpdate) => {
      try {
        const { bookingId, status } = data;

        // Verify user has permission to update this booking
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          select: { id: true, userId: true, partnerId: true },
        });

        if (!booking) {
          socket.emit("error", { message: "Booking not found" });
          return;
        }

        // Check if user is booking owner or assigned partner
        const isOwner = booking.userId === userId;
        const isPartner = booking.partnerId && booking.partnerId.includes(userId);

        if (!isOwner && !isPartner) {
          socket.emit("error", { message: "Unauthorized to update this booking" });
          return;
        }

        // Broadcast to all users in booking room
        io.to(`booking_${bookingId}`).emit("booking_status_changed", {
          bookingId,
          status,
          updatedBy: userId,
          timestamp: Date.now(),
        });

        console.log(`[SOCKET] Booking ${bookingId} status changed to ${status} by ${userId}`);
      } catch (err) {
        console.error("[SOCKET] Status update error:", err);
        socket.emit("error", { message: "Status update failed" });
      }
    });

    /**
     * User requests ETA from partner
     */
    socket.on("request_eta", (bookingId: string) => {
      // Send to partner in the booking room
      io.to(`booking_${bookingId}`).emit("eta_requested", {
        bookingId,
        requestedBy: userId,
        timestamp: Date.now(),
      });
    });

    /**
     * Partner sends ETA response
     */
    socket.on("send_eta", (data: { bookingId: string; minutes: number; distance: number }) => {
      io.to(`booking_${data.bookingId}`).emit("eta_update", {
        bookingId: data.bookingId,
        eta: data.minutes,
        distance: data.distance,
        timestamp: Date.now(),
      });
    });

    // =====================================================================
    // CHAT EVENTS (Real-time messaging)
    // =====================================================================

    /**
     * User sends a message in chat
     */
    socket.on("send_message", async (data: { conversationId: string; content: string }) => {
      try {
        const { conversationId, content } = data;

        // Save message to database
        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId: userId,
            receiverId: "", // Will be set based on conversation
            content,
            status: "SENT",
          },
        });

        // Get conversation to find receiver
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          select: { participant1Id: true, participant2Id: true },
        });

        if (conversation) {
          const receiverId = userId === conversation.participant1Id
            ? conversation.participant2Id
            : conversation.participant1Id;

          // Update message with correct receiverId
          await prisma.message.update({
            where: { id: message.id },
            data: { receiverId },
          });

          // Broadcast to both participants
          io.to(`chat_${conversationId}`).emit("new_message", {
            conversationId,
            messageId: message.id,
            senderId: userId,
            content,
            timestamp: message.createdAt,
          });

          // Send read receipt to sender
          socket.emit("message_sent", { messageId: message.id });
        }
      } catch (err) {
        console.error("[SOCKET] Message send error:", err);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    /**
     * User joins chat conversation room
     */
    socket.on("join_chat", (conversationId: string) => {
      const room = `chat_${conversationId}`;
      socket.join(room);
      console.log(`[SOCKET] ${userId} joined chat ${conversationId}`);

      // Notify others that user is now active
      socket.to(room).emit("user_active", { userId, timestamp: Date.now() });
    });

    /**
     * User leaves chat conversation room
     */
    socket.on("leave_chat", (conversationId: string) => {
      const room = `chat_${conversationId}`;
      socket.leave(room);

      // Notify others that user is offline
      socket.to(room).emit("user_inactive", { userId, timestamp: Date.now() });
    });

    /**
     * User typing indicator
     */
    socket.on("typing", (conversationId: string) => {
      const room = `chat_${conversationId}`;
      socket.to(room).emit("user_typing", { userId, timestamp: Date.now() });
    });

    /**
     * User stopped typing
     */
    socket.on("stop_typing", (conversationId: string) => {
      const room = `chat_${conversationId}`;
      socket.to(room).emit("user_stopped_typing", { userId, timestamp: Date.now() });
    });

    /**
     * User marks messages as read
     */
    socket.on("mark_read", async (data: { conversationId: string; messageIds: string[] }) => {
      try {
        const { conversationId, messageIds } = data;

        await prisma.message.updateMany({
          where: { id: { in: messageIds } },
          data: { status: "READ", readAt: new Date() },
        });

        io.to(`chat_${conversationId}`).emit("messages_read", {
          conversationId,
          messageIds,
          readBy: userId,
        });
      } catch (err) {
        console.error("[SOCKET] Mark read error:", err);
      }
    });

    // =====================================================================
    // NOTIFICATIONS
    // =====================================================================

    /**
     * User subscribes to notifications
     */
    socket.on("subscribe_notifications", () => {
      const room = `notifications_${userId}`;
      socket.join(room);
      console.log(`[SOCKET] ${userId} subscribed to notifications`);
    });

    /**
     * Server sends notification to user
     * Called from controllers/services
     */
    socket.on("unsubscribe_notifications", () => {
      const room = `notifications_${userId}`;
      socket.leave(room);
    });

    // =====================================================================
    // CALL EVENTS (Voice/Video calling)
    // =====================================================================

    /**
     * Initiate a call
     */
    socket.on("initiate_call", (data: { recipientId: string; callType: "VOICE" | "VIDEO" }) => {
      const recipientSockets = userSockets.get(data.recipientId) || [];

      recipientSockets.forEach((recipientSocketId) => {
        io.to(recipientSocketId).emit("incoming_call", {
          callerId: userId,
          callType: data.callType,
          timestamp: Date.now(),
        });
      });

      console.log(`[SOCKET] Call initiated from ${userId} to ${data.recipientId}`);
    });

    /**
     * Accept call
     */
    socket.on("accept_call", (data: { callerId: string }) => {
      const callerSockets = userSockets.get(data.callerId) || [];

      callerSockets.forEach((callerSocketId) => {
        io.to(callerSocketId).emit("call_accepted", {
          recipientId: userId,
          timestamp: Date.now(),
        });
      });
    });

    /**
     * Reject call
     */
    socket.on("reject_call", (data: { callerId: string; reason?: string }) => {
      const callerSockets = userSockets.get(data.callerId) || [];

      callerSockets.forEach((callerSocketId) => {
        io.to(callerSocketId).emit("call_rejected", {
          rejectedBy: userId,
          reason: data.reason,
          timestamp: Date.now(),
        });
      });
    });

    /**
     * End call
     */
    socket.on("end_call", (data: { otherUserId: string; duration: number }) => {
      const otherUserSockets = userSockets.get(data.otherUserId) || [];

      otherUserSockets.forEach((otherSocketId) => {
        io.to(otherSocketId).emit("call_ended", {
          endedBy: userId,
          duration: data.duration,
          timestamp: Date.now(),
        });
      });
    });

    // =====================================================================
    // DISCONNECTION HANDLER
    // =====================================================================

    socket.on("disconnect", () => {
      console.log(`[SOCKET] User ${userId} disconnected: ${socket.id}`);

      // Remove from active connections
      activeConnections.delete(socket.id);

      // Remove from user sockets
      if (userSockets.has(userId)) {
        const sockets = userSockets.get(userId)!;
        const index = sockets.indexOf(socket.id);
        if (index > -1) {
          sockets.splice(index, 1);
        }
        if (sockets.length === 0) {
          userSockets.delete(userId);
        }
      }

      // Remove from all booking rooms
      bookingRooms.forEach((sockets) => {
        sockets.delete(socket.id);
      });

      // Notify chat rooms that user is offline
      socket.broadcast.emit("user_offline", { userId, timestamp: Date.now() });
    });

    socket.on("error", (error) => {
      console.error(`[SOCKET] Error for user ${userId}:`, error);
    });
  });

  return io;
}

/**
 * Send notification to a user through Socket.io
 * Called from controllers/services
 */
export function sendNotificationToUser(
  io: SocketIOServer,
  userId: string,
  notification: {
    title: string;
    body: string;
    data?: Record<string, any>;
  }
) {
  io.to(`notifications_${userId}`).emit("notification", {
    ...notification,
    timestamp: Date.now(),
  });
}

/**
 * Send booking update to all users watching a booking
 */
export function sendBookingUpdate(
  io: SocketIOServer,
  bookingId: string,
  update: BookingUpdate
) {
  io.to(`booking_${bookingId}`).emit("booking_update", {
    ...update,
    timestamp: Date.now(),
  });
}

/**
 * Get active connections count
 */
export function getActiveConnectionsCount(): number {
  return activeConnections.size;
}

/**
 * Check if user is online
 */
export function isUserOnline(userId: string): boolean {
  return userSockets.has(userId) && (userSockets.get(userId) || []).length > 0;
}
