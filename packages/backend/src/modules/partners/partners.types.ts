export interface IPartnerProfile {
  id: string;
  userId: string;
  status: string;
  providesWalking: boolean;
  providesCarry: boolean;
  rating: number;
  totalJobs: number;
  totalEarnings: number;
  isAvailable: boolean;
  latitude: number | null;
  longitude: number | null;
}

export interface INearbyPartnersQuery {
  latitude: number;
  longitude: number;
  serviceType: 'WALKING' | 'CARRY_BUDDY';
  radius?: number;
}

export interface IUpdateAvailabilityInput {
  isAvailable: boolean;
  latitude?: number;
  longitude?: number;
}

export interface IBankDetailsInput {
  bankAccountName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  upiId?: string;
}

export enum PartnerStatus {
  NONE = 'NONE',
  APPLIED = 'APPLIED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}
