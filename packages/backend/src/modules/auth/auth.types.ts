export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface IRegisterInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
}

export interface ILoginInput {
  email: string;
  password: string;
}

export interface IVerifyOtpInput {
  phone: string;
  otp: string;
}

export enum UserRole {
  USER = 'USER',
  PARTNER = 'PARTNER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}
