import { Router } from "express";
import {
  getWallet,
  initiateTopup,
  verifyTopup,
  getTransactions,
  requestWithdrawal,
  getWithdrawals,
} from "./wallet.controller";

const router = Router();

router.get("/", getWallet);
router.post("/topup", initiateTopup);
router.post("/topup/verify", verifyTopup);
router.get("/transactions", getTransactions);
router.post("/withdraw", requestWithdrawal);
router.get("/withdrawals", getWithdrawals);

export default router;
