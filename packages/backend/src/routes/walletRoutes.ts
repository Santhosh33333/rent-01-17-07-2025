import { Router } from "express";
import { body } from "express-validator";
import { authenticateToken } from "../middleware/auth";
import { sanitizeInput, validateRequest } from "../middleware/validation";
import * as walletController from "../controllers/walletController";

const router = Router();

router.use(authenticateToken);

// Get wallet
router.get("/", walletController.getWallet);

// Topup wallet
router.post(
  "/topup",
  [
    body("amount").isFloat({ gt: 0, max: 100000 }).withMessage("Invalid topup amount"),
    body("paymentMethodId").optional().isString(),
  ],
  sanitizeInput,
  validateRequest,
  walletController.topupWallet
);

// Get transactions
router.get("/transactions", walletController.getTransactions);

// Get withdrawals
router.get("/withdrawals", walletController.getWithdrawalHistory);

// Request withdrawal
router.post(
  "/withdraw",
  [
    body("amount").isFloat({ gt: 99, lt: 500001 }).withMessage("Withdrawal amount must be between 100 and 500000"),
    body("method").notEmpty().isIn(["BANK_TRANSFER", "UPI"]).withMessage("Invalid withdrawal method"),
    body("accountDetail").notEmpty().withMessage("Account details required"),
  ],
  sanitizeInput,
  validateRequest,
  walletController.requestWithdrawal
);

// Cancel withdrawal
router.delete("/withdraw/:id", walletController.cancelWithdrawal);

// Get earnings summary
router.get("/earnings", walletController.getEarningsSummary);

// Get earnings details
router.get("/earnings/details", walletController.getEarningDetails);

// Get earnings chart
router.get("/earnings/chart", walletController.getEarningsChart);

export default router;
