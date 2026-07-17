import { Response } from "express";
import { prisma } from "../config/database";
import { sendSuccess, sendError } from "../utils/response";
import { AuthedRequest } from "../middleware/authTypes";

export async function getProfile(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        dateOfBirth: true,
        gender: true,
        avatarUrl: true,
        bio: true,
        city: true,
        country: true,
        status: true,
        emailVerified: true,
        mobileVerified: true,
        createdAt: true,
      },
    });
    if (!user) {
      sendError(res, "User not found.", 404, "USER_NOT_FOUND");
      return;
    }
    sendSuccess(res, user, "Profile retrieved.");
  } catch (err) {
    sendError(res, "Failed to retrieve profile.", 500, "INTERNAL_ERROR");
  }
}

export async function updateProfile(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { fullName, bio, city, country, gender } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { fullName, bio, city, country, gender },
      select: { id: true, fullName: true, bio: true, city: true, country: true, gender: true },
    });
    sendSuccess(res, updated, "Profile updated.");
  } catch (err) {
    sendError(res, "Failed to update profile.", 500, "INTERNAL_ERROR");
  }
}

export async function uploadProfilePhoto(req: AuthedRequest, res: Response): Promise<void> {
  try {
    if (!req.file) {
      sendError(res, "No file uploaded.", 400, "NO_FILE");
      return;
    }
    const avatarUrl = `/uploads/${req.file.filename}`;
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { avatarUrl },
    });
    sendSuccess(res, { avatarUrl }, "Profile photo uploaded.", 200);
  } catch (err) {
    sendError(res, "Failed to upload photo.", 500, "INTERNAL_ERROR");
  }
}

export async function deleteAccount(req: AuthedRequest, res: Response): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { status: "DEACTIVATED" },
    });
    await prisma.session.deleteMany({ where: { userId: req.user!.userId } });
    sendSuccess(res, undefined, "Account deactivated.");
  } catch (err) {
    sendError(res, "Failed to delete account.", 500, "INTERNAL_ERROR");
  }
}

export async function getLoginHistory(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const [items, total] = await Promise.all([
      prisma.loginHistory.findMany({
        where: { userId: req.user!.userId },
        orderBy: { loggedInAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.loginHistory.count({ where: { userId: req.user!.userId } }),
    ]);
    sendSuccess(res, { items, page, limit, total });
  } catch (err) {
    sendError(res, "Failed to retrieve login history.", 500, "INTERNAL_ERROR");
  }
}

export async function getDevices(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const devices = await prisma.device.findMany({
      where: { userId: req.user!.userId },
      orderBy: { lastActiveAt: "desc" },
    });
    sendSuccess(res, devices, "Devices retrieved.");
  } catch (err) {
    sendError(res, "Failed to retrieve devices.", 500, "INTERNAL_ERROR");
  }
}

export async function removeDevice(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const device = await prisma.device.findUnique({ where: { id } });
    if (!device || device.userId !== req.user!.userId) {
      sendError(res, "Device not found.", 404, "DEVICE_NOT_FOUND");
      return;
    }
    await prisma.device.delete({ where: { id } });
    sendSuccess(res, undefined, "Device removed.");
  } catch (err) {
    sendError(res, "Failed to remove device.", 500, "INTERNAL_ERROR");
  }
}

export async function trustScore(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const score = await prisma.trustScore.findUnique({
      where: { userId: req.user!.userId },
    });
    sendSuccess(res, score ?? { score: 0 }, "Trust score retrieved.");
  } catch (err) {
    sendError(res, "Failed to retrieve trust score.", 500, "INTERNAL_ERROR");
  }
}
