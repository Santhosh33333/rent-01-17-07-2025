import { PartnersRepository } from './partners.repository';
import { UpdateAvailabilityDtoType, UpdateBankDetailsDtoType, ApplyPartnerDtoType } from './partners.dto';

export class PartnersService {
  constructor(private readonly repo: PartnersRepository) {}

  async getNearby(latitude: number, longitude: number, serviceType: 'WALKING' | 'CARRY_BUDDY', radius?: number) {
    return this.repo.getNearby(latitude, longitude, serviceType, radius);
  }

  async getDashboard(userId: string) {
    const partner = await this.repo.findByUserId(userId);
    if (!partner) throw Object.assign(new Error('Partner profile not found'), { code: 'PARTNER_NOT_FOUND' });
    return partner;
  }

  async updateAvailability(userId: string, data: UpdateAvailabilityDtoType) {
    return this.repo.updateAvailability(userId, data.isAvailable, data.latitude, data.longitude);
  }

  async getJobs(userId: string, page: number, limit: number) {
    const partner = await this.repo.findByUserId(userId);
    if (!partner) throw Object.assign(new Error('Partner profile not found'), { code: 'PARTNER_NOT_FOUND' });
    return this.repo.getPartnerJobs(partner.id, page, limit);
  }

  async getJobById(jobId: string, userId: string) {
    const partner = await this.repo.findByUserId(userId);
    if (!partner) throw Object.assign(new Error('Partner profile not found'), { code: 'PARTNER_NOT_FOUND' });
    return this.repo.getJobById(jobId, partner.id);
  }

  async apply(userId: string, data: ApplyPartnerDtoType) {
    const existing = await this.repo.findByUserId(userId);
    if (existing) throw Object.assign(new Error('Already applied'), { code: 'ALREADY_APPLIED' });
    return this.repo.create({ userId, ...data });
  }

  async updateBankDetails(userId: string, data: UpdateBankDetailsDtoType) {
    return this.repo.updateBankDetails(userId, data);
  }

  async getPartnerProfile(partnerId: string) {
    const partner = await this.repo.findById(partnerId);
    if (!partner) throw Object.assign(new Error('Partner not found'), { code: 'PARTNER_NOT_FOUND' });
    return partner;
  }
}
