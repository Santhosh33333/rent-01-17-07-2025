import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/response';
import { NearbyPartnersDto, UpdateAvailabilityDto, UpdateBankDetailsDto, ApplyPartnerDto } from './partners.dto';

export async function getNearbyPartners(req: Request, res: Response): Promise<void> {
  const parsed = NearbyPartnersDto.safeParse(req.query);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR');
    return;
  }
  sendSuccess(res, [], 'Nearby partners fetched');
}

export async function getPartnerDashboard(req: Request, res: Response): Promise<void> {
  sendSuccess(res, {}, 'Dashboard fetched');
}

export async function updateAvailability(req: Request, res: Response): Promise<void> {
  const parsed = UpdateAvailabilityDto.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR');
    return;
  }
  sendSuccess(res, {}, 'Availability updated');
}

export async function getJobs(req: Request, res: Response): Promise<void> {
  sendSuccess(res, { jobs: [], total: 0 }, 'Jobs fetched');
}

export async function getJobById(req: Request, res: Response): Promise<void> {
  sendSuccess(res, {}, 'Job fetched');
}

export async function applyAsPartner(req: Request, res: Response): Promise<void> {
  const parsed = ApplyPartnerDto.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR');
    return;
  }
  sendSuccess(res, {}, 'Partner application submitted', 201);
}

export async function updateBankDetails(req: Request, res: Response): Promise<void> {
  const parsed = UpdateBankDetailsDto.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR');
    return;
  }
  sendSuccess(res, {}, 'Bank details updated');
}

export async function getPartnerProfile(req: Request, res: Response): Promise<void> {
  sendSuccess(res, {}, 'Partner profile fetched');
}
