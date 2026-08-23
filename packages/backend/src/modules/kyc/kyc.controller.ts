import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/response';
import { SubmitKycDto, ReviewKycDto, ResubmitKycDto } from './kyc.dto';

export async function submitKyc(req: Request, res: Response): Promise<void> {
  const parsed = SubmitKycDto.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR');
    return;
  }
  sendSuccess(res, {}, 'KYC submitted for review', 201);
}

export async function getKycStatus(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, { status: 'NOT_STARTED' }, 'KYC status fetched');
}

export async function approveKyc(req: Request, res: Response): Promise<void> {
  const parsed = ReviewKycDto.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR');
    return;
  }
  sendSuccess(res, { id: req.params.id, status: 'APPROVED' }, 'KYC approved');
}

export async function rejectKyc(req: Request, res: Response): Promise<void> {
  const parsed = ReviewKycDto.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR');
    return;
  }
  sendSuccess(res, { id: req.params.id, status: 'REJECTED' }, 'KYC rejected');
}

export async function getKycQueue(req: Request, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  sendSuccess(res, { items: [], meta: { page, limit, total: 0 } }, 'KYC queue fetched');
}

export async function resubmitKyc(req: Request, res: Response): Promise<void> {
  const parsed = ResubmitKycDto.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR');
    return;
  }
  sendSuccess(res, {}, 'KYC resubmitted');
}
