export type KycStatus =
  | 'NOT_STARTED'
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING_REVIEW'
  | 'UNDER_VERIFICATION'
  | 'APPROVED'
  | 'REJECTED'
  | 'RESUBMIT_REQUIRED';

export interface IKycSubmitInput {
  selfieUrl?: string;
  govIdUrl?: string;
  govIdType?: string;
  addressProofUrl?: string;
}

export interface IKycReviewInput {
  status: KycStatus;
  note?: string;
  rejectionReason?: string;
}

export interface IKycRecord {
  id: string;
  userId: string;
  status: KycStatus;
  selfieUrl?: string | null;
  govIdUrl?: string | null;
  govIdType?: string | null;
  addressProofUrl?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: Date | null;
  rejectionReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
