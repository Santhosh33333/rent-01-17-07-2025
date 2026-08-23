import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/response';
import { CreateBookingDto, BookingEstimateDto, CancelBookingDto, RateBookingDto, StartOtpDto, EndOtpDto } from './bookings.dto';

export async function createBooking(req: Request, res: Response): Promise<void> {
  const parsed = CreateBookingDto.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR');
    return;
  }
  sendSuccess(res, {}, 'Booking created', 201);
}

export async function getBooking(req: Request, res: Response): Promise<void> {
  sendSuccess(res, {}, 'Booking fetched');
}

export async function getHistory(req: Request, res: Response): Promise<void> {
  sendSuccess(res, { bookings: [], total: 0 }, 'Booking history fetched');
}

export async function getActiveBookings(req: Request, res: Response): Promise<void> {
  sendSuccess(res, [], 'Active bookings fetched');
}

export async function acceptBooking(req: Request, res: Response): Promise<void> {
  sendSuccess(res, {}, 'Booking accepted');
}

export async function rejectBooking(req: Request, res: Response): Promise<void> {
  sendSuccess(res, {}, 'Booking rejected');
}

export async function startBookingWithOtp(req: Request, res: Response): Promise<void> {
  const parsed = StartOtpDto.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR');
    return;
  }
  sendSuccess(res, {}, 'Booking started');
}

export async function endBookingWithOtp(req: Request, res: Response): Promise<void> {
  const parsed = EndOtpDto.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR');
    return;
  }
  sendSuccess(res, {}, 'Booking completed');
}

export async function cancelBooking(req: Request, res: Response): Promise<void> {
  const parsed = CancelBookingDto.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR');
    return;
  }
  sendSuccess(res, {}, 'Booking cancelled');
}

export async function rateBooking(req: Request, res: Response): Promise<void> {
  const parsed = RateBookingDto.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR');
    return;
  }
  sendSuccess(res, {}, 'Rating submitted');
}

export async function getInvoice(req: Request, res: Response): Promise<void> {
  sendSuccess(res, {}, 'Invoice fetched');
}

export async function estimateBooking(req: Request, res: Response): Promise<void> {
  const parsed = BookingEstimateDto.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR');
    return;
  }
  sendSuccess(res, { estimatedAmount: 100, platformFee: 10, partnerEarning: 90 }, 'Estimate calculated');
}
