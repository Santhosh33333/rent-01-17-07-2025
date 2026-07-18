import { Router } from "express";
import { body } from "express-validator";
import { authRateLimiter } from "../middleware/rateLimiter";
import { sanitizeInput, validateRequest } from "../middleware/validation";
import * as authController from "../controllers/authController";

const router = Router();

router.post(
  "/register",
  authRateLimiter,
  [
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("phone").isMobilePhone("any").withMessage("Valid phone is required"),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
    body("fullName").notEmpty().withMessage("Full name is required"),
    body("dateOfBirth").isISO8601().withMessage("Valid date of birth is required"),
    body("gender").isIn(["MALE", "FEMALE", "OTHER"]).withMessage("Valid gender is required"),
  ],
  sanitizeInput,
  validateRequest,
  authController.register
);

router.post(
  "/login",
  authRateLimiter,
  [body("email").isEmail().withMessage("Valid email is required"), body("password").notEmpty().withMessage("Password is required")],
  validateRequest,
  authController.login
);

router.post("/logout", authController.logout);

router.post(
  "/refresh-token",
  [body("refreshToken").notEmpty().withMessage("Refresh token is required")],
  validateRequest,
  authController.refreshToken
);

router.post(
  "/forgot-password",
  authRateLimiter,
  [body("email").isEmail().normalizeEmail().withMessage("Valid email is required")],
  validateRequest,
  authController.forgotPassword
);

router.post(
  "/reset-password",
  authRateLimiter,
  [body("email").isEmail().normalizeEmail(), body("otp").isLength({ min: 4, max: 8 }), body("newPassword").isLength({ min: 8 })],
  validateRequest,
  authController.resetPassword
);

router.post(
  "/verify-email",
  [body("userId").notEmpty(), body("otp").isLength({ min: 4, max: 8 })],
  validateRequest,
  authController.verifyEmail
);

router.post(
  "/verify-mobile",
  [body("userId").notEmpty(), body("otp").isLength({ min: 4, max: 8 })],
  validateRequest,
  authController.verifyMobile
);

router.post(
  "/resend-otp",
  [body("userId").notEmpty(), body("channel").isIn(["email", "mobile"])],
  validateRequest,
  authController.resendOTP
);

router.post(
  "/verify-password",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  validateRequest,
  authController.verifyPassword
);

export default router;
