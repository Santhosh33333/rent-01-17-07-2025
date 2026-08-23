import { Router } from "express";
import { body } from "express-validator";
import { authenticateToken } from "../middleware/auth";
import { sanitizeInput, validateRequest } from "../middleware/validation";
import * as carryBuddyController from "../controllers/carryBuddyController";

const router = Router();

router.use(authenticateToken);

router.post(
  "/",
  [
    body("itemType").notEmpty().withMessage("Item type is required"),
    body("startLocation").notEmpty().withMessage("Start location is required"),
    body("endLocation").notEmpty().withMessage("End location is required"),
    body("startTime").isISO8601().withMessage("Valid start time is required"),
  ],
  sanitizeInput,
  validateRequest,
  carryBuddyController.createRequest
);
router.get("/", carryBuddyController.getRequests);
router.get("/requests", carryBuddyController.getRequests);
router.get("/my-requests", carryBuddyController.getMyRequests);
router.get("/my-jobs", carryBuddyController.getMyJobs);
router.post("/:id/accept", carryBuddyController.acceptRequest);
router.post("/:id/complete", carryBuddyController.completeRequest);

export default router;
