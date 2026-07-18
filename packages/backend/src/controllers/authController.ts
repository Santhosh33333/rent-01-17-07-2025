import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../config/database";
import { env } from "../config/env";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { generateOTP, hashOTP, verifyOTP, sendOTP } from "../utils/otp";
import { sendSuccess, sendError } from "../utils/response";
import { AuthedRequest } from "../middleware/authTypes";

interface OtpRecord {
  otpHash: string;
  expiresAt: Date;
  verified: boolean;
}

const otpStore = new Map<string, OtpRecord>();

function setOtp(key: string): string {
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);
  otpStore.set(key, { otpHash: hashOTP(otp), expiresAt, verified: false });
  return otp;
}

function getOtp(key: string): OtpRecord | undefined {
  const record = otpStore.get(key);
  if (!record) return undefined;
  if (record.expiresAt.getTime() < Date.now()) {
    otpStore.delete(key);
    return undefined;
  }
  return record;
}

async function recordLogin(userId: string, req: Request): Promise<void> {
  const ip = req.ip ?? req.socket.remoteAddress ?? null;
  const userAgent = req.headers["user-agent"] ?? null;
  await prisma.loginHistory.create({
    data: { userId, ipAddress: ip, userAgent },
  });
  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, phone, password, fullName, dateOfBirth, gender } = req.body;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });
    if (existing) {
      sendError(res, "Email or phone already registered.", 409, "DUPLICATE_USER");
      return;
    }

    const passwordHash = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        passwordHash,
        fullName,
        dateOfBirth: new Date(dateOfBirth),
        gender,
      },
      select: { id: true, email: true, phone: true, fullName: true, status: true },
    });

    await prisma.wallet.create({ data: { userId: user.id } });

    const otp = setOtp(`email:${user.id}`);
    sendOTP(otp, { email: user.email });

    sendSuccess(res, { userId: user.id }, "Registration successful. OTP sent for email verification.", 201);
  } catch (err) {
    sendError(res, "Registration failed.", 500, "INTERNAL_ERROR");
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { identifier, password, email, phone } = req.body;
    const loginIdentifier = identifier || email || phone;
    if (!loginIdentifier || !password) {
      sendError(res, "Email/phone and password are required.", 400, "MISSING_FIELDS");
      return;
    }
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: loginIdentifier }, { phone: loginIdentifier }] },
    });
    if (!user) {
      sendError(res, "Invalid credentials.", 401, "INVALID_CREDENTIALS");
      return;
    }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      sendError(res, "Invalid credentials.", 401, "INVALID_CREDENTIALS");
      return;
    }
    if (user.status !== "ACTIVE") {
      sendError(res, "Account is not active.", 403, "ACCOUNT_INACTIVE");
      return;
    }

    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken(user.id);
    await prisma.session.create({
      data: { userId: user.id, refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });
    await recordLogin(user.id, req);

    sendSuccess(res, { accessToken, refreshToken, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } }, "Login successful.");
  } catch (err) {
    sendError(res, "Login failed.", 500, "INTERNAL_ERROR");
  }
}

export async function logout(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(" ")[1];
      try {
        const payload = verifyRefreshToken(token);
        await prisma.session.deleteMany({ where: { refreshToken: token, userId: payload.userId } });
      } catch {
        await prisma.session.deleteMany({ where: { userId: req.user!.userId } });
      }
    }
    sendSuccess(res, undefined, "Logged out successfully.");
  } catch (err) {
    sendError(res, "Logout failed.", 500, "INTERNAL_ERROR");
  }
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      sendError(res, "Refresh token required.", 400, "MISSING_TOKEN");
      return;
    }
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      sendError(res, "Invalid refresh token.", 401, "INVALID_TOKEN");
      return;
    }

    const session = await prisma.session.findUnique({ where: { refreshToken: token } });
    if (!session || session.expiresAt.getTime() < Date.now()) {
      sendError(res, "Refresh token expired or revoked.", 401, "TOKEN_EXPIRED");
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { id: true, email: true, status: true } });
    if (!user || user.status !== "ACTIVE") {
      sendError(res, "User not available.", 401, "UNAUTHORIZED");
      return;
    }

    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const newRefreshToken = generateRefreshToken(user.id);
    await prisma.session.update({ where: { id: session.id }, data: { refreshToken: newRefreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });

    sendSuccess(res, { accessToken, refreshToken: newRefreshToken }, "Token refreshed.");
  } catch (err) {
    sendError(res, "Token refresh failed.", 500, "INTERNAL_ERROR");
  }
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const otp = setOtp(`reset:${user.id}`);
      sendOTP(otp, { email });
    }
    sendSuccess(res, undefined, "If the account exists, a reset OTP has been sent.");
  } catch (err) {
    sendError(res, "Request failed.", 500, "INTERNAL_ERROR");
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      sendError(res, "Invalid request.", 400, "INVALID_REQUEST");
      return;
    }
    const record = getOtp(`reset:${user.id}`);
    if (!record || !verifyOTP(otp, record.otpHash)) {
      sendError(res, "Invalid or expired OTP.", 400, "INVALID_OTP");
      return;
    }
    const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_SALT_ROUNDS);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    otpStore.delete(`reset:${user.id}`);
    sendSuccess(res, undefined, "Password reset successful.");
  } catch (err) {
    sendError(res, "Password reset failed.", 500, "INTERNAL_ERROR");
  }
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  try {
    const { userId, otp } = req.body;
    const record = getOtp(`email:${userId}`);
    if (!record) {
      const otpValue = setOtp(`email:${userId}`);
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
      if (user) sendOTP(otpValue, { email: user.email });
      sendSuccess(res, { sent: true }, "OTP (re)sent for email verification.");
      return;
    }
    if (!verifyOTP(otp, record.otpHash)) {
      sendError(res, "Invalid or expired OTP.", 400, "INVALID_OTP");
      return;
    }
    await prisma.user.update({ where: { id: userId }, data: { emailVerified: true } });
    otpStore.delete(`email:${userId}`);
    sendSuccess(res, undefined, "Email verified successfully.");
  } catch (err) {
    sendError(res, "Email verification failed.", 500, "INTERNAL_ERROR");
  }
}

export async function verifyMobile(req: Request, res: Response): Promise<void> {
  try {
    const { userId, otp } = req.body;
    const record = getOtp(`mobile:${userId}`);
    if (!record) {
      const otpValue = setOtp(`mobile:${userId}`);
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { phone: true } });
      if (user) sendOTP(otpValue, { phone: user.phone });
      sendSuccess(res, { sent: true }, "OTP (re)sent for mobile verification.");
      return;
    }
    if (!verifyOTP(otp, record.otpHash)) {
      sendError(res, "Invalid or expired OTP.", 400, "INVALID_OTP");
      return;
    }
    await prisma.user.update({ where: { id: userId }, data: { mobileVerified: true } });
    otpStore.delete(`mobile:${userId}`);
    sendSuccess(res, undefined, "Mobile verified successfully.");
  } catch (err) {
    sendError(res, "Mobile verification failed.", 500, "INTERNAL_ERROR");
  }
}

export async function resendOTP(req: Request, res: Response): Promise<void> {
  try {
    const { userId, channel } = req.body;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, phone: true } });
    if (!user) {
      sendError(res, "User not found.", 404, "USER_NOT_FOUND");
      return;
    }
    const key = channel === "mobile" ? `mobile:${userId}` : `email:${userId}`;
    const otp = setOtp(key);
    sendOTP(otp, channel === "mobile" ? { phone: user.phone } : { email: user.email });
    sendSuccess(res, undefined, `OTP resent to ${channel}.`);
  } catch (err) {
    sendError(res, "Failed to resend OTP.", 500, "INTERNAL_ERROR");
  }
}

export async function verifyPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      sendError(res, "Invalid credentials.", 401, "INVALID_CREDENTIALS");
      return;
    }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      sendError(res, "Invalid credentials.", 401, "INVALID_CREDENTIALS");
      return;
    }
    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken(user.id);
    sendSuccess(res, { accessToken, refreshToken, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } }, "Password verified.");
  } catch (err) {
    sendError(res, "Password verification failed.", 500, "INTERNAL_ERROR");
  }
}
