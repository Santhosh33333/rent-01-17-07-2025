import { Request } from "express";

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role?: "USER" | "WALKING_PARTNER" | "ADMIN" | "SUPER_ADMIN" | "MODERATOR" | "SUPPORT" | "FINANCE";
}

export interface AuthedRequest extends Request {
  user?: AuthenticatedUser;
}
