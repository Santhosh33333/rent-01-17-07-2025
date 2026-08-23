import { BookingsRepository } from './bookings.repository';
import { CreateBookingDtoType, CancelBookingDtoType, RateBookingDtoType } from './bookings.dto';
import { IBookingEstimate } from './bookings.types';

export class BookingsService {
  constructor(private readonly repo: BookingsRepository) {}

  async createBooking(userId: string, data: CreateBookingDtoType) {
    const estimate = this.calculateEstimate(data.durationMinutes || 60);
    return this.repo.create({
      userId,
      serviceType: data.serviceType,
      startLocation: data.startLocation,
      endLocation: data.endLocation,
      scheduledAt: new Date(data.scheduledAt),
      durationMinutes: data.durationMinutes,
      itemType: data.itemType,
      itemDescription: data.itemDescription,
      couponCode: data.couponCode,
      notes: data.notes,
      estimatedAmount: estimate.estimatedAmount,
      platformFee: estimate.platformFee,
      partnerEarning: estimate.partnerEarning,
    });
  }

  async getBooking(id: string, userId: string) {
    const booking = await this.repo.findByIdAndUser(id, userId);
    if (!booking) throw Object.assign(new Error('Booking not found'), { code: 'BOOKING_NOT_FOUND' });
    return booking;
  }

  async getHistory(userId: string, page: number, limit: number) {
    return this.repo.getUserHistory(userId, page, limit);
  }

  async getActiveBookings(userId: string) {
    return this.repo.getActiveBookings(userId);
  }

  async acceptBooking(id: string) {
    return this.repo.updateStatus(id, 'PARTNER_ACCEPTED');
  }

  async rejectBooking(id: string) {
    return this.repo.updateStatus(id, 'PARTNER_SEARCHING');
  }

  async cancelBooking(id: string, cancelledBy: string, data: CancelBookingDtoType) {
    const booking = await this.repo.findById(id);
    if (!booking) throw Object.assign(new Error('Booking not found'), { code: 'BOOKING_NOT_FOUND' });
    return this.repo.cancel(id, cancelledBy, data.reason);
  }

  async rateBooking(_id: string, _raterId: string, _data: RateBookingDtoType) {
    // Rating logic handled separately via Ratings model
    return { rated: true };
  }

  async getInvoice(id: string, userId: string) {
    const booking = await this.repo.findByIdAndUser(id, userId);
    if (!booking) throw Object.assign(new Error('Booking not found'), { code: 'BOOKING_NOT_FOUND' });
    return { booking, invoice: { total: booking.finalAmount || booking.estimatedAmount } };
  }

  async estimateBooking(durationMinutes?: number): Promise<IBookingEstimate> {
    return this.calculateEstimate(durationMinutes || 60);
  }

  private calculateEstimate(durationMinutes: number): IBookingEstimate {
    const baseRate = 50; // INR per 30 min
    const estimatedAmount = Math.ceil((durationMinutes / 30) * baseRate);
    const platformFee = Math.ceil(estimatedAmount * 0.1);
    const partnerEarning = estimatedAmount - platformFee;
    return { estimatedAmount, platformFee, partnerEarning, discountAmount: 0, finalAmount: estimatedAmount };
  }
}
