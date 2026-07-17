import { Request } from "express";

export interface AuthenticatedUser {
  userId: string;
  email: string;
  isAdmin?: boolean;
  adminRole?: "ADMIN" | "SUPER_ADMIN";
}

export interface AuthedRequest extends Request {
  user?: AuthenticatedUser;
}
