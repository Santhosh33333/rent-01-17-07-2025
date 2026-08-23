import { z } from 'zod';

export const SubmitKycDto = z.object({
  selfieUrl: z.string().url().optional(),
  govIdUrl: z.string().url().optional(),
  govIdType: z.string().min(1).max(50).optional(),
  addressProofUrl: z.string().url().optional(),
});

export const ReviewKycDto = z.object({
  note: z.string().max(1000).optional(),
  rejectionReason: z.string().max(500).optional(),
});

export const ResubmitKycDto = SubmitKycDto;

export type SubmitKycDtoType = z.infer<typeof SubmitKycDto>;
export type ReviewKycDtoType = z.infer<typeof ReviewKycDto>;
