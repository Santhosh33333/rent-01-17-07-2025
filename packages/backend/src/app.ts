import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";

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

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(morgan(env.isProduction ? "combined" : "dev"));
  app.use(generalRateLimiter);

  app.use("/uploads", express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));

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

  return app;
}
