import { z } from 'zod';

export const CreateBookingDto = z.object({
  serviceType: z.enum(['WALKING', 'CARRY_BUDDY']),
  startLocation: z.string().min(1).max(500),
  endLocation: z.string().min(1).max(500),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().min(15).max(480).optional(),
  itemType: z.string().max(100).optional(),
  itemDescription: z.string().max(500).optional(),
  couponCode: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
});

export const BookingEstimateDto = z.object({
  serviceType: z.enum(['WALKING', 'CARRY_BUDDY']),
  startLocation: z.string().min(1),
  endLocation: z.string().min(1),
  durationMinutes: z.number().int().min(15).max(480).optional(),
  couponCode: z.string().max(50).optional(),
});

export const CancelBookingDto = z.object({
  reason: z.string().min(1).max(500),
});

export const StartOtpDto = z.object({
  otp: z.string().length(6),
});

export const EndOtpDto = z.object({
  otp: z.string().length(6),
});

export const RateBookingDto = z.object({
  score: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export type CreateBookingDtoType = z.infer<typeof CreateBookingDto>;
export type BookingEstimateDtoType = z.infer<typeof BookingEstimateDto>;
export type CancelBookingDtoType = z.infer<typeof CancelBookingDto>;
export type RateBookingDtoType = z.infer<typeof RateBookingDto>;
