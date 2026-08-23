import { Router } from 'express';
import * as bookingsController from './bookings.controller';

const router = Router();

router.post('/', bookingsController.createBooking);
router.post('/estimate', bookingsController.estimateBooking);
router.get('/history', bookingsController.getHistory);
router.get('/active', bookingsController.getActiveBookings);
router.get('/:id', bookingsController.getBooking);
router.post('/:id/accept', bookingsController.acceptBooking);
router.post('/:id/reject', bookingsController.rejectBooking);
router.post('/:id/start-otp', bookingsController.startBookingWithOtp);
router.post('/:id/end-otp', bookingsController.endBookingWithOtp);
router.post('/:id/cancel', bookingsController.cancelBooking);
router.post('/:id/rate', bookingsController.rateBooking);
router.get('/:id/invoice', bookingsController.getInvoice);

export default router;
