import { Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { prisma } from "../config/database";
import { sendError } from "../utils/response";
import { AuthedRequest, AuthenticatedUser } from "./authTypes";

export async function authenticateToken(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      sendError(res, "Authentication token is missing.", 401, "UNAUTHORIZED");
      return;
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, status: true, role: true },
    });

    if (!user) {
      sendError(res, "User no longer exists.", 401, "UNAUTHORIZED");
      return;
    }

    if (user.status !== "ACTIVE") {
      sendError(res, "Account is not active.", 403, "ACCOUNT_INACTIVE");
      return;
    }

    req.user = { userId: user.id, email: user.email, role: user.role as AuthenticatedUser["role"] };
    next();
  } catch (err) {
    sendError(res, "Invalid or expired token.", 401, "INVALID_TOKEN");
  }
}

export async function requireVerification(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, "Authentication required.", 401, "UNAUTHORIZED");
      return;
    }
    const verification = await prisma.verification.findUnique({
      where: { userId: req.user.userId },
      select: { status: true },
    });
    if (!verification || verification.status !== "VERIFIED") {
      sendError(res, "Account verification required.", 403, "VERIFICATION_REQUIRED");
      return;
    }
    next();
  } catch {
    sendError(res, "Verification check failed.", 500, "INTERNAL_ERROR");
  }
}

export async function requireWalkingPartner(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, "Authentication required.", 401, "UNAUTHORIZED");
      return;
    }
    const partner = await prisma.walkingPartner.findUnique({
      where: { userId: req.user.userId },
      select: { status: true },
    });
    if (!partner || partner.status !== "APPROVED") {
      sendError(res, "Approved walking partner status required.", 403, "WALKING_PARTNER_REQUIRED");
      return;
    }
    next();
  } catch {
    sendError(res, "Walking partner check failed.", 500, "INTERNAL_ERROR");
  }
}

export async function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.role || !["SUPER_ADMIN", "ADMIN", "MODERATOR", "SUPPORT", "FINANCE"].includes(req.user.role)) {
      sendError(res, "Admin access required.", 403, "FORBIDDEN");
      return;
    }
    next();
  } catch {
    sendError(res, "Authorization check failed.", 500, "INTERNAL_ERROR");
  }
}

export async function requireSuperAdmin(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.role || req.user.role !== "SUPER_ADMIN") {
      sendError(res, "Super admin access required.", 403, "FORBIDDEN");
      return;
    }
    next();
  } catch {
    sendError(res, "Authorization check failed.", 500, "INTERNAL_ERROR");
  }
}
