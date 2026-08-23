import { z } from 'zod';

export const NearbyPartnersDto = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  serviceType: z.enum(['WALKING', 'CARRY_BUDDY']),
  radius: z.number().min(1).max(50).optional(),
});

export const UpdateAvailabilityDto = z.object({
  isAvailable: z.boolean(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const UpdateBankDetailsDto = z.object({
  bankAccountName: z.string().min(1).max(100),
  bankAccountNumber: z.string().min(8).max(20),
  bankIfsc: z.string().length(11),
  upiId: z.string().max(100).optional(),
});

export const ApplyPartnerDto = z.object({
  providesWalking: z.boolean(),
  providesCarry: z.boolean(),
  notes: z.string().max(500).optional(),
});

export type NearbyPartnersDtoType = z.infer<typeof NearbyPartnersDto>;
export type UpdateAvailabilityDtoType = z.infer<typeof UpdateAvailabilityDto>;
export type UpdateBankDetailsDtoType = z.infer<typeof UpdateBankDetailsDto>;
export type ApplyPartnerDtoType = z.infer<typeof ApplyPartnerDto>;
