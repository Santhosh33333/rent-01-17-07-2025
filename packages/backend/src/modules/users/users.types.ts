export interface IUpdateProfileInput {
  fullName?: string;
  bio?: string;
  city?: string;
  country?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  gender?: string;
}

export interface IEmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface IUserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string | null;
  bio?: string | null;
  city?: string | null;
  country?: string | null;
  gender: string;
  dateOfBirth: Date;
  mobileVerified: boolean;
  emailVerified: boolean;
  createdAt: Date;
}
