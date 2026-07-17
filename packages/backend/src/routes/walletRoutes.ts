import { Router } from "express";
import { body } from "express-validator";
import { authenticateToken } from "../middleware/auth";
import { sanitizeInput, validateRequest } from "../middleware/validation";
import * as walletController from "../controllers/walletController";

const router = Router();

router.use(authenticateToken);

router.get("/", walletController.getWallet);
router.get("/transactions", walletController.getTransactions);
router.get("/withdrawals", walletController.getWithdrawalHistory);
router.post(
  "/withdraw",
  [body("amount").isFloat({ gt: 0 }).withMessage("Amount must be greater than 0"), body("method").notEmpty(), body("accountDetail").optional().isString()],
  sanitizeInput,
  validateRequest,
  walletController.requestWithdrawal
);
router.delete("/withdraw/:id", walletController.cancelWithdrawal);

export default router;
