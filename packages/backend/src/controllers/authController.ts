import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../config/database";
import { env } from "../config/env";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { generateOTP, hashOTP, verifyOTP, sendOTP } from "../utils/otp";
import { sendSuccess, sendError } from "../utils/response";
import { AuthedRequest } from "../middleware/authTypes";
import { getFirebaseAuth, verifyIdToken, getUserByPhone, getUserByEmail, createUserWithPhone, createUserWithEmail } from "../services/firebaseAuthService";

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

async function createOrGetUserFromFirebase(uid: string, email?: string, phone?: string, fullName?: string) {
  let user = await prisma.user.findUnique({ where: { id: uid } });
  
  if (!user) {
    // Check if user exists with same email or phone
    if (email) {
      user = await prisma.user.findUnique({ where: { email } });
    }
    if (!user && phone) {
      user = await prisma.user.findUnique({ where: { phone } });
    }
    
    if (user) {
      // Link Firebase UID to existing user
      await prisma.user.update({
        where: { id: user.id },
        data: { id: uid } // This won't work due to primary key, need different approach
      });
    } else {
      // Create new user
      const passwordHash = await bcrypt.hash(generateOTP(32), env.BCRYPT_SALT_ROUNDS); // Random password
      user = await prisma.user.create({
        data: {
          id: uid,
          email: email || `${uid}@firebase.placeholder`,
          phone: phone || `+91${uid.slice(0, 10)}`,
          passwordHash,
          fullName: fullName || "Firebase User",
          dateOfBirth: new Date("2000-01-01"),
          gender: "OTHER",
          emailVerified: !!email,
          mobileVerified: !!phone,
        },
      });
      
      await prisma.wallet.create({ data: { userId: user.id } });
    }
  }
  
  return user;
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
      select: { id: true, email: true, phone: true, fullName: true, status: true, role: true },
    });

    await prisma.wallet.create({ data: { userId: user.id } });

    const otp = setOtp(`email:${user.id}`);
    sendOTP(otp, { email: user.email });

    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken(user.id);
    await prisma.session.create({
      data: { userId: user.id, refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    sendSuccess(res, { accessToken, refreshToken, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } }, "Registration successful. OTP sent for email verification.", 201);
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

// Phone OTP - Send OTP
export async function sendPhoneOTP(req: Request, res: Response): Promise<void> {
  try {
    const { phone } = req.body;
    
    const firebaseAuth = getFirebaseAuth();
    if (!firebaseAuth) {
      // Fallback to local OTP if Firebase not configured
      const otp = setOtp(`phone:${phone}`);
      sendOTP(otp, { phone });
      const isDev = process.env.NODE_ENV !== "production";
      sendSuccess(res, { sent: true, ...(isDev ? { otp } : {}) }, "OTP sent via fallback.");
      return;
    }

    // Check if user exists in Firebase
    const firebaseUser = await getUserByPhone(phone);
    if (!firebaseUser) {
      // Create user in Firebase
      await createUserWithPhone(phone);
    }

    // In production, Firebase handles OTP sending via client SDK
    // Here we just confirm the phone number is valid
    sendSuccess(res, { sent: true }, "OTP sent. Please check your phone.");
  } catch (err) {
    console.error("sendPhoneOTP error:", err);
    sendError(res, "Failed to send OTP.", 500, "INTERNAL_ERROR");
  }
}

// Phone OTP - Verify OTP
export async function verifyPhoneOTP(req: Request, res: Response): Promise<void> {
  try {
    const { phone, otp } = req.body;
    
    const firebaseAuth = getFirebaseAuth();
    if (!firebaseAuth) {
      // Fallback to local OTP verification
      const record = getOtp(`phone:${phone}`);
      if (!record || !verifyOTP(otp, record.otpHash)) {
        sendError(res, "Invalid or expired OTP.", 400, "INVALID_OTP");
        return;
      }
      otpStore.delete(`phone:${phone}`);
      
      // Find or create user
      let user = await prisma.user.findUnique({ where: { phone } });
      if (!user) {
        const passwordHash = await bcrypt.hash(generateOTP(32), env.BCRYPT_SALT_ROUNDS);
        user = await prisma.user.create({
          data: {
            phone,
            email: `${phone.replace(/\D/g, '')}@phone.placeholder`,
            passwordHash,
            fullName: "Phone User",
            dateOfBirth: new Date("2000-01-01"),
            gender: "OTHER",
            mobileVerified: true,
          },
        });
        await prisma.wallet.create({ data: { userId: user.id } });
      } else {
        await prisma.user.update({ where: { id: user.id }, data: { mobileVerified: true } });
      }

      if (!user) {
        sendError(res, "Failed to create or find user.", 500, "INTERNAL_ERROR");
        return;
      }

      const accessToken = generateAccessToken({ userId: user.id, email: user.email });
      const refreshToken = generateRefreshToken(user.id);
      await prisma.session.create({
        data: { userId: user.id, refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      });
      await recordLogin(user.id, req);

      sendSuccess(res, { accessToken, refreshToken, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } }, "Phone verified and logged in.");
      return;
    }

    // Firebase verification would be done client-side with Firebase SDK
    // Server verifies the ID token from Firebase
    sendError(res, "Use Firebase client SDK for phone auth verification.", 400, "USE_CLIENT_SDK");
  } catch (err) {
    console.error("verifyPhoneOTP error:", err);
    sendError(res, "Phone verification failed.", 500, "INTERNAL_ERROR");
  }
}

// Google Sign-In
export async function googleSignIn(req: Request, res: Response): Promise<void> {
  try {
    const { idToken } = req.body;

    // Try Firebase first, fall back to google-auth-library
    const firebaseAuth = getFirebaseAuth();
    let email: string | undefined;
    let name: string | undefined;
    let picture: string | undefined;
    let uid: string | undefined;
    let phone_number: string | undefined;

    if (firebaseAuth) {
      try {
        const decoded = await verifyIdToken(idToken);
        uid = decoded.uid;
        email = decoded.email;
        phone_number = decoded.phone_number;
        name = decoded.name;
        picture = decoded.picture;
      } catch {
        // Firebase verification failed, try google-auth-library
      }
    }

    if (!uid) {
      // Use google-auth-library to verify the ID token directly
      const { OAuth2Client } = require("google-auth-library");
      const clientId = env.GOOGLE_CLIENT_ID;
      const client = new OAuth2Client(clientId);
      try {
        const ticket = await client.verifyIdToken({
          idToken,
          audience: clientId,
        });
        const payload = ticket.getPayload();
        if (!payload) {
          sendError(res, "Invalid Google token.", 401, "INVALID_TOKEN");
          return;
        }
        uid = payload.sub;
        email = payload.email;
        name = payload.name;
        picture = payload.picture;
      } catch {
        sendError(res, "Google token verification failed.", 401, "INVALID_TOKEN");
        return;
      }
    }

    if (!uid) {
      sendError(res, "Could not verify Google identity.", 401, "INVALID_TOKEN");
      return;
    }

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone_number ? [{ phone: phone_number }] : []),
        ],
      },
    });

    if (user) {
      // Update avatar if new
      if (picture && user.avatarUrl !== picture) {
        await prisma.user.update({ where: { id: user.id }, data: { avatarUrl: picture } });
      }
    } else {
      const passwordHash = await bcrypt.hash(generateOTP(32), env.BCRYPT_SALT_ROUNDS);
      user = await prisma.user.create({
        data: {
          email: email || `google-${uid}@rentbuddy.app`,
          phone: phone_number || `+91${uid.slice(0, 10)}`,
          passwordHash,
          fullName: name || "Google User",
          dateOfBirth: new Date("2000-01-01"),
          gender: "OTHER",
          emailVerified: true,
          mobileVerified: !!phone_number,
          avatarUrl: picture,
        },
      });
      await prisma.wallet.create({ data: { userId: user.id } });
    }

    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken(user.id);
    await prisma.session.create({
      data: { userId: user.id, refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });
    await recordLogin(user.id, req);

    sendSuccess(res, { accessToken, refreshToken, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } }, "Google sign-in successful.");
  } catch (err) {
    console.error("googleSignIn error:", err);
    sendError(res, "Google sign-in failed.", 500, "INTERNAL_ERROR");
  }
}

// Apple Sign-In
export async function appleSignIn(req: Request, res: Response): Promise<void> {
  try {
    const { idToken, fullName } = req.body;
    
    // Apple ID token verification would go here
    // For now, return not implemented
    sendError(res, "Apple sign-in not yet implemented.", 501, "NOT_IMPLEMENTED");
  } catch (err) {
    console.error("appleSignIn error:", err);
    sendError(res, "Apple sign-in failed.", 500, "INTERNAL_ERROR");
  }
}

export async function logout(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const bodyToken = (req.body as { refreshToken?: string })?.refreshToken;
    if (bodyToken) {
      try {
        const payload = verifyRefreshToken(bodyToken);
        await prisma.session.deleteMany({ where: { refreshToken: bodyToken, userId: payload.userId } });
        sendSuccess(res, undefined, "Logged out successfully.");
        return;
      } catch {
        // Token invalid, fall through
      }
    }

    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(" ")[1];
      if (token) {
        try {
          const payload = verifyRefreshToken(token);
          await prisma.session.deleteMany({ where: { refreshToken: token, userId: payload.userId } });
          sendSuccess(res, undefined, "Logged out successfully.");
          return;
        } catch {
          // Token invalid, fall through
        }
      }
    }
    if (req.user?.userId) {
      await prisma.session.deleteMany({ where: { userId: req.user.userId } });
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
      const isDev = process.env.NODE_ENV !== "production";
      sendSuccess(res, { userId: user.id, ...(isDev ? { otp } : {}) }, "If the account exists, a reset OTP has been sent.");
    } else {
      sendSuccess(res, undefined, "If the account exists, a reset OTP has been sent.");
    }
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
