import { Router } from "express";
import { body } from "express-validator";
import { authenticateToken } from "../middleware/auth";
import { sanitizeInput, validateRequest } from "../middleware/validation";
import { upload } from "../middleware/upload";
import * as verificationController from "../controllers/verificationController";

const router = Router();

router.use(authenticateToken);

router.post("/selfie", upload.single("selfie"), verificationController.submitSelfie);
router.post("/gov-id", upload.single("govId"), verificationController.submitGovId);
router.post("/address", upload.single("addressProof"), verificationController.submitAddressProof);
router.post(
  "/emergency-contact",
  [body("name").notEmpty().withMessage("Name is required"), body("phone").isMobilePhone("any").withMessage("Valid phone is required"), body("relation").notEmpty()],
  sanitizeInput,
  validateRequest,
  verificationController.submitEmergencyContact
);
router.get("/status", verificationController.getVerificationStatus);
router.get("/history", verificationController.getVerificationHistory);

export default router;
