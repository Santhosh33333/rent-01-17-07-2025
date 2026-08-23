import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import http from "http";

import { env } from "./config/env";
import { generalRateLimiter } from "./middleware/rateLimiter";
import { sendError } from "./utils/response";

import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import verificationRoutes from "./routes/verificationRoutes";
import walkingPartnerRoutes from "./routes/walkingPartnerRoutes";
import walletRoutes from "./routes/walletRoutes";
import walkingRequestRoutes from "./routes/walkingRequestRoutes";
import communityRoutes from "./routes/communityRoutes";
import eventRoutes from "./routes/eventRoutes";
import messageRoutes from "./routes/messageRoutes";
import adminRoutes from "./routes/adminRoutes";
import pricingRoutes from "./routes/pricingRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import settingsRoutes from "./routes/settingsRoutes";
import appContentRoutes from "./routes/appContentRoutes";
import callRoutes from "./routes/callRoutes";
import carryBuddyRoutes from "./routes/carryBuddyRoutes";
import friendshipRoutes from "./routes/friendshipRoutes";
import roleRoutes from "./routes/roleRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import roleApplicationsRoutes from "./routes/roleApplicationsRoutes";
import locationRoutes from "./routes/locationRoutes";
import chatRequestRoutes from "./routes/chatRequestRoutes";
import privacyRoutes from "./routes/privacyRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import partnerRoutes from "./routes/partnerRoutes";
import searchRoutes from "./routes/searchRoutes";

export function createApp(): http.Server {
  const app = express();
  const allowedOrigins = (env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  app.use(helmet());
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  }));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(morgan(env.isProduction ? "combined" : "dev"));
  app.use(generalRateLimiter);

  app.use("/uploads", express.static(path.resolve(process.cwd(), env.UPLOAD_DIR), {
    maxAge: "7d",
    etag: true,
    lastModified: true,
  }));

  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    next();
  });

  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ success: true, data: { status: "ok", timestamp: new Date().toISOString() } });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/verification", verificationRoutes);
  app.use("/api/walking-partner", walkingPartnerRoutes);
  app.use("/api/wallet", walletRoutes);
  app.use("/api/walking-requests", walkingRequestRoutes);
  app.use("/api/communities", communityRoutes);
  app.use("/api/events", eventRoutes);
  app.use("/api/messages", messageRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/pricing", pricingRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/settings", settingsRoutes);
  app.use("/api/content", appContentRoutes);
  app.use("/api/calls", callRoutes);
  app.use("/api/carry-buddy", carryBuddyRoutes);
  app.use("/api/friendships", friendshipRoutes);
  app.use("/api/roles", roleRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/role-applications", roleApplicationsRoutes);
  app.use("/api/location", locationRoutes);
  app.use("/api/chat-requests", chatRequestRoutes);
  app.use("/api/privacy", privacyRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/partner", partnerRoutes);
  app.use("/api", searchRoutes);

  app.use((req: Request, res: Response) => {
    sendError(res, `Route not found: ${req.method} ${req.path}`, 404, "NOT_FOUND");
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Unhandled error:", err);
    if (err.type === "entity.too.large") {
      sendError(res, "Payload too large.", 413, "PAYLOAD_TOO_LARGE");
      return;
    }
    if (err.message && /image/i.test(err.message)) {
      sendError(res, err.message, 400, "FILE_UPLOAD_ERROR");
      return;
    }
    sendError(res, "Internal server error.", 500, "INTERNAL_ERROR");
  });

  const server = http.createServer(app);
  return server;
}
