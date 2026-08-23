import { Router } from "express";
import { body } from "express-validator";
import { authenticateToken } from "../middleware/auth";
import { validateRequest } from "../middleware/validation";
import * as partnerController from "../controllers/partnerController";

const router = Router();
router.use(authenticateToken);

router.post(
  "/apply",
  [body("providesWalking").isBoolean(), body("providesCarry").isBoolean()],
  validateRequest,
  partnerController.applyAsPartner
);

router.get("/status", partnerController.getPartnerStatus);
router.get("/nearby-bookings", partnerController.getNearbyBookings);
router.get("/bookings", partnerController.getPartnerBookings);
router.get("/performance", partnerController.getPerformance);

router.put(
  "/availability",
  [body("isAvailable").isBoolean()],
  validateRequest,
  partnerController.toggleAvailability
);

router.put(
  "/location",
  [body("latitude").isFloat(), body("longitude").isFloat()],
  validateRequest,
  partnerController.updateLocation
);

router.put(
  "/services",
  [body("providesWalking").isBoolean(), body("providesCarry").isBoolean()],
  validateRequest,
  partnerController.updateServices
);

router.post("/bookings/:id/accept", partnerController.acceptBooking);
router.post("/bookings/:id/reject", partnerController.rejectBooking);
router.post("/bookings/:id/otp/generate", partnerController.generateOTP);
router.post(
  "/bookings/:id/otp/verify",
  [body("otp").notEmpty()],
  validateRequest,
  partnerController.verifyOTP
);
router.post("/bookings/:id/complete", partnerController.completeBooking);

export default router;
