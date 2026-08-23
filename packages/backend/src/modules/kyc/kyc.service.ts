import { KycRepository } from './kyc.repository';
import { SubmitKycDtoType, ReviewKycDtoType } from './kyc.dto';

export class KycService {
  constructor(private readonly repo: KycRepository) {}

  async getStatus(userId: string) {
    const kyc = await this.repo.findByUserId(userId);
    if (!kyc) return { status: 'NOT_STARTED' };
    return kyc;
  }

  async submitDocuments(userId: string, data: SubmitKycDtoType) {
    const existing = await this.repo.findByUserId(userId);
    if (existing && existing.status === 'APPROVED') {
      throw Object.assign(new Error('KYC already approved'), { status: 400 });
    }
    if (existing) {
      return this.repo.updateStatus(existing.id, { status: 'SUBMITTED', ...data });
    }
    return this.repo.create({ userId, ...data });
  }

  async updateStatus(verificationId: string, status: 'APPROVED' | 'REJECTED', reviewedBy: string, data: ReviewKycDtoType) {
    const updated = await this.repo.updateStatus(verificationId, {
      status,
      reviewedBy,
      reviewedAt: new Date(),
      rejectionReason: data.rejectionReason,
    });
    await this.repo.addHistory(verificationId, { status, note: data.note, changedBy: reviewedBy });
    return updated;
  }

  async getReviewQueue(page = 1, limit = 20) {
    return this.repo.getQueue(page, limit);
  }
}
