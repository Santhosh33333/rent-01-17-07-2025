import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AuthPayload } from "../types";

interface AccessTokenPayload {
  userId: string;
  email: string;
  type: "access";
}

interface RefreshTokenPayload {
  userId: string;
  type: "refresh";
}

export function generateAccessToken(user: AuthPayload): string {
  const payload: AccessTokenPayload = {
    userId: user.userId,
    email: user.email,
    type: "access",
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY as jwt.SignOptions["expiresIn"],
  });
}

export function generateRefreshToken(userId: string): string {
  const payload: RefreshTokenPayload = { userId, type: "refresh" };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload;
  if (decoded.type !== "access") {
    throw new Error("Invalid token type");
  }
  return decoded as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as jwt.JwtPayload;
  if (decoded.type !== "refresh") {
    throw new Error("Invalid token type");
  }
  return decoded as RefreshTokenPayload;
}
