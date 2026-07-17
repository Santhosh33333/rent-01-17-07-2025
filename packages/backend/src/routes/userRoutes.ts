import { Router } from "express";
import { body } from "express-validator";
import { authenticateToken } from "../middleware/auth";
import { sanitizeInput, validateRequest } from "../middleware/validation";
import { upload } from "../middleware/upload";
import * as userController from "../controllers/userController";

const router = Router();

router.use(authenticateToken);

router.get("/profile", userController.getProfile);
router.put(
  "/profile",
  [body("fullName").optional().notEmpty(), body("bio").optional().isString(), body("city").optional().isString(), body("gender").optional().isIn(["MALE", "FEMALE", "OTHER"])],
  sanitizeInput,
  validateRequest,
  userController.updateProfile
);
router.post("/profile-photo", upload.single("photo"), userController.uploadProfilePhoto);
router.delete("/account", userController.deleteAccount);
router.get("/login-history", userController.getLoginHistory);
router.get("/devices", userController.getDevices);
router.delete("/devices/:id", userController.removeDevice);
router.get("/trust-score", userController.trustScore);

export default router;
