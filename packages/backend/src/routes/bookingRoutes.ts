import { Router } from "express";
import { body } from "express-validator";
import { authenticateToken } from "../middleware/auth";
import { sanitizeInput, validateRequest } from "../middleware/validation";
import * as bookingController from "../controllers/bookingController";

const router = Router();

router.use(authenticateToken);

// Create booking
router.post(
  "/",
  [
    body("serviceType").notEmpty().isIn(["WALKING", "CARRY_BUDDY"]),
    body("startLocation").notEmpty().trim().isLength({ min: 2, max: 200 }),
    body("endLocation").notEmpty().trim().isLength({ min: 2, max: 200 }),
    body("scheduledAt").notEmpty().isISO8601(),
    body("durationMinutes").optional().isInt({ min: 1, max: 480 }),
    body("itemType").optional().isString().trim(),
    body("itemDescription").optional().isString().trim().isLength({ max: 500 }),
    body("notes").optional().isString().trim().isLength({ max: 500 }),
  ],
  sanitizeInput,
  validateRequest,
  bookingController.createBooking
);

// Get price estimate
router.get("/price-estimate", bookingController.getPriceEstimate);

// Get my bookings
router.get("/", bookingController.getMyBookings);

// Get booking detail
router.get("/:id", bookingController.getBookingDetail);

// Initiate payment
router.post("/:id/pay", bookingController.initiatePayment);

// Verify payment
router.post("/:id/verify-payment", bookingController.verifyPayment);

// Accept booking (partner)
router.post("/:id/accept", bookingController.acceptBooking);

// Reject booking (partner)
router.post(
  "/:id/reject",
  [body("reason").optional().isString().trim().isLength({ max: 500 })],
  sanitizeInput,
  validateRequest,
  bookingController.rejectBooking
);

// Start booking (partner)
router.post("/:id/start", bookingController.startBooking);

// Complete booking (partner)
router.post(
  "/:id/complete",
  [
    body("endLatitude").optional().isFloat({ min: -90, max: 90 }),
    body("endLongitude").optional().isFloat({ min: -180, max: 180 }),
  ],
  sanitizeInput,
  validateRequest,
  bookingController.completeBooking
);

// Cancel booking
router.post(
  "/:id/cancel",
  [body("reason").optional().isString().trim().isLength({ max: 500 })],
  sanitizeInput,
  validateRequest,
  bookingController.cancelBookingHandler
);

// Rate booking
router.post(
  "/:id/rate",
  [
    body("score").notEmpty().isInt({ min: 1, max: 5 }),
    body("comment").optional().isString().trim().isLength({ max: 500 }),
  ],
  sanitizeInput,
  validateRequest,
  bookingController.rateBooking
);

// Select payment method (after partner accepts)
router.post(
  '/:id/select-payment-method',
  [body('paymentMethod').notEmpty().isIn(['ONLINE', 'CASH'])],
  sanitizeInput,
  validateRequest,
  bookingController.selectPaymentMethod
);

// Partner confirms cash received
router.post('/:id/confirm-cash', bookingController.confirmCashReceived);

export default router;
