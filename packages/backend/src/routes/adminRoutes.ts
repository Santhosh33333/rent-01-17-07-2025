import { Router, Response, NextFunction } from "express";
import { body } from "express-validator";
import { authRateLimiter } from "../middleware/rateLimiter";
import { authenticateToken, requireAdmin, requireSuperAdmin } from "../middleware/auth";
import { sanitizeInput, validateRequest } from "../middleware/validation";
import * as adminController from "../controllers/adminController";
import { AuthedRequest } from "../middleware/authTypes";
import { prisma } from "../config/database";
import { sendError } from "../utils/response";

async function authenticateAdmin(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  await authenticateToken(req, res, () => {});
  if (!req.user) return;
  const admin = await prisma.admin.findUnique({ where: { id: req.user.userId }, select: { id: true, role: true } });
  if (!admin) {
    sendError(res, "Admin access required.", 403, "FORBIDDEN");
    return;
  }
  req.user.isAdmin = true;
  req.user.adminRole = admin.role;
  next();
}

const router = Router();

router.post(
  "/login",
  authRateLimiter,
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  validateRequest,
  adminController.adminLogin
);

router.use(authenticateAdmin);

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
router.get("/withdrawals", requireAdmin, adminController.getWithdrawalRequests);
router.post("/withdrawals/:id/approve", requireAdmin, adminController.approveWithdrawal);
router.post("/withdrawals/:id/reject", requireAdmin, [body("reason").optional().isString()], sanitizeInput, validateRequest, adminController.rejectWithdrawal);
router.get("/reports", requireAdmin, adminController.getReports);
router.post("/reports/:id/resolve", requireAdmin, [body("note").optional().isString()], sanitizeInput, validateRequest, adminController.resolveReport);
router.get("/audit-logs", requireAdmin, adminController.getAuditLogs);
router.post("/notifications", requireAdmin, [body("userId").notEmpty(), body("title").notEmpty(), body("body").notEmpty()], sanitizeInput, validateRequest, adminController.sendNotification);

export default router;
