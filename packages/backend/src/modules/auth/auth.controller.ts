import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/response';
import {
  RegisterDto,
  LoginDto,
  VerifyOtpDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  RefreshTokenDto,
} from './auth.dto';

export async function register(req: Request, res: Response): Promise<void> {
  const parsed = RegisterDto.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR');
    return;
  }
  sendSuccess(res, { message: 'OTP sent to phone' }, 'Registration initiated', 201);
}

export async function verifyOtp(req: Request, res: Response): Promise<void> {
  const parsed = VerifyOtpDto.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR');
    return;
  }
  sendSuccess(res, { verified: true }, 'Phone verified');
}

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = LoginDto.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR');
    return;
  }
  sendSuccess(res, {}, 'Login successful');
}

export async function refreshToken(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, {}, 'Token refreshed');
}

export async function logout(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, {}, 'Logged out');
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const parsed = ForgotPasswordDto.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR');
    return;
  }
  sendSuccess(res, {}, 'OTP sent');
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const parsed = ResetPasswordDto.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR');
    return;
  }
  sendSuccess(res, {}, 'Password reset successful');
}

export async function getMe(req: Request, res: Response): Promise<void> {
  sendSuccess(res, (req as any).user, 'User profile');
}
