import { z } from 'zod';

export const RegisterDto = z.object({
  fullName: z.string().min(1).max(100),
  email: z.string().email().max(254),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Phone must be E.164 format'),
  password: z.string().min(8).max(128),
  dateOfBirth: z.string(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']),
});
export const LoginDto = z.object({ email: z.string().email(), password: z.string().min(1) });
export const VerifyOtpDto = z.object({ phone: z.string(), otp: z.string().length(6) });
export const RefreshTokenDto = z.object({ refreshToken: z.string().min(1) });
export const ForgotPasswordDto = z.object({ phone: z.string() });
export const ResetPasswordDto = z.object({ phone: z.string(), otp: z.string().length(6), newPassword: z.string().min(8) });

export type RegisterDtoType = z.infer<typeof RegisterDto>;
export type LoginDtoType = z.infer<typeof LoginDto>;
export type VerifyOtpDtoType = z.infer<typeof VerifyOtpDto>;
