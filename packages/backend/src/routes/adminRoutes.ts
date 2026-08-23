import { Router } from "express";
import { body } from "express-validator";
import { authRateLimiter } from "../middleware/rateLimiter";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import { sanitizeInput, validateRequest } from "../middleware/validation";
import * as adminController from "../controllers/adminController";

const router = Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get("/dashboard", adminController.getDashboardStats);
router.get("/users", requireAdmin, adminController.getUsers);
router.get("/users/:id", requireAdmin, adminController.getUserById);
router.put("/users/:id/status", requireAdmin, [body("status").isIn(["ACTIVE", "SUSPENDED", "BANNED", "DEACTIVATED"])], validateRequest, adminController.updateUserStatus);
router.get("/kyc-queue", requireAdmin, adminController.getKycQueue);
router.post("/kyc/:id/approve", requireAdmin, adminController.approveKyc);
router.post("/kyc/:id/reject", requireAdmin, [body("reason").optional().isString()], sanitizeInput, validateRequest, adminController.rejectKyc);
router.get("/walking-partners", requireAdmin, adminController.getWalkingPartners);
router.post("/walking-partners/:id/approve", requireAdmin, adminController.approveWalkingPartner);
router.post("/walking-partners/:id/reject", requireAdmin, [body("reason").optional().isString()], sanitizeInput, validateRequest, adminController.rejectWalkingPartner);
router.get("/bookings", requireAdmin, adminController.getBookings);
router.get("/bookings/:id", requireAdmin, adminController.getBookingDetail);
router.get("/withdrawals", requireAdmin, adminController.getWithdrawalRequests);
router.post("/withdrawals/:id/approve", requireAdmin, adminController.approveWithdrawal);
router.post("/withdrawals/:id/reject", requireAdmin, [body("reason").optional().isString()], sanitizeInput, validateRequest, adminController.rejectWithdrawal);
router.get("/reports", requireAdmin, adminController.getReports);
router.post("/reports/:id/resolve", requireAdmin, [body("note").optional().isString()], sanitizeInput, validateRequest, adminController.resolveReport);
router.get("/audit-logs", requireAdmin, adminController.getAuditLogs);
router.post("/notifications", requireAdmin, [body("userId").notEmpty(), body("title").notEmpty(), body("body").notEmpty()], sanitizeInput, validateRequest, adminController.sendNotification);

// Pricing Config
router.get("/pricing", requireAdmin, adminController.getPricingConfigs);
router.post("/pricing", requireAdmin, [body("key").notEmpty(), body("value").notEmpty()], sanitizeInput, validateRequest, adminController.createPricingConfig);
router.put("/pricing/:id", requireAdmin, adminController.updatePricingConfig);
router.delete("/pricing/:id", requireAdmin, adminController.deletePricingConfig);

// Coupons
router.get("/coupons", requireAdmin, adminController.getCoupons);
router.post("/coupons", requireAdmin, [body("code").notEmpty(), body("discountType").isIn(["PERCENTAGE", "FIXED"]), body("discountValue").isFloat({ gt: 0 }), body("validFrom").notEmpty(), body("validTo").notEmpty()], sanitizeInput, validateRequest, adminController.createCoupon);
router.put("/coupons/:id", requireAdmin, adminController.updateCoupon);
router.delete("/coupons/:id", requireAdmin, adminController.deleteCoupon);

// Service Areas
router.get("/service-areas", requireAdmin, adminController.getServiceAreas);
router.post("/service-areas", requireAdmin, [body("name").notEmpty(), body("city").notEmpty()], sanitizeInput, validateRequest, adminController.createServiceArea);
router.put("/service-areas/:id", requireAdmin, adminController.updateServiceArea);
router.delete("/service-areas/:id", requireAdmin, adminController.deleteServiceArea);

// Campaigns
router.get("/campaigns", requireAdmin, adminController.getCampaigns);
router.post("/campaigns", requireAdmin, [body("name").notEmpty(), body("discountType").isIn(["PERCENTAGE", "FIXED"]), body("discountValue").isFloat({ gt: 0 }), body("startDate").notEmpty(), body("endDate").notEmpty()], sanitizeInput, validateRequest, adminController.createCampaign);
router.put("/campaigns/:id", requireAdmin, adminController.updateCampaign);
router.delete("/campaigns/:id", requireAdmin, adminController.deleteCampaign);

// Revenue & Analytics
router.get("/revenue", requireAdmin, adminController.getRevenueAnalytics);
router.get("/partner-levels", requireAdmin, adminController.getPartnerLevels);

export default router;
