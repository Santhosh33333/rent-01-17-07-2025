import { Router } from "express";
import { body } from "express-validator";
import { authenticateToken } from "../middleware/auth";
import { sanitizeInput, validateRequest } from "../middleware/validation";
import * as eventController from "../controllers/eventController";

const router = Router();

router.use(authenticateToken);

router.post(
  "/",
  [body("title").notEmpty(), body("startTime").isISO8601(), body("endTime").optional().isISO8601(), body("capacity").optional().isInt({ min: 1 }), body("communityId").optional().isString()],
  sanitizeInput,
  validateRequest,
  eventController.createEvent
);
router.get("/", eventController.getEvents);
router.get("/:id", eventController.getEventById);
router.post("/:id/register", eventController.registerForEvent);
router.post("/:id/cancel", eventController.cancelRegistration);
router.post("/:id/checkin", eventController.checkInEvent);

export default router;
