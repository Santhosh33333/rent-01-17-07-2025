export interface ICreateBookingInput {
  serviceType: 'WALKING' | 'CARRY_BUDDY';
  startLocation: string;
  endLocation: string;
  scheduledAt: string;
  durationMinutes?: number;
  itemType?: string;
  itemDescription?: string;
  couponCode?: string;
  notes?: string;
}

export interface IBookingEstimate {
  estimatedAmount: number;
  platformFee: number;
  partnerEarning: number;
  discountAmount: number;
  finalAmount: number;
}

export interface IRateBookingInput {
  score: number;
  comment?: string;
}

export enum BookingStatus {
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAYMENT_INITIATED = 'PAYMENT_INITIATED',
  PAYMENT_SUCCESSFUL = 'PAYMENT_SUCCESSFUL',
  PARTNER_SEARCHING = 'PARTNER_SEARCHING',
  PARTNER_ASSIGNED = 'PARTNER_ASSIGNED',
  PARTNER_ACCEPTED = 'PARTNER_ACCEPTED',
  OTP_GENERATED = 'OTP_GENERATED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUND_INITIATED = 'REFUND_INITIATED',
  REFUND_COMPLETED = 'REFUND_COMPLETED',
}

export enum ServiceType {
  WALKING = 'WALKING',
  CARRY_BUDDY = 'CARRY_BUDDY',
}
