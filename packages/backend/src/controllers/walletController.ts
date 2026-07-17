import { Response } from "express";
import { prisma } from "../config/database";
import { sendSuccess, sendError } from "../utils/response";
import { AuthedRequest } from "../middleware/authTypes";

export async function getWallet(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const wallet = await prisma.wallet.findUnique({ where: { userId: req.user!.userId } });
    if (!wallet) {
      sendError(res, "Wallet not found.", 404, "WALLET_NOT_FOUND");
      return;
    }
    sendSuccess(res, wallet, "Wallet retrieved.");
  } catch (err) {
    sendError(res, "Failed to retrieve wallet.", 500, "INTERNAL_ERROR");
  }
}

export async function getTransactions(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId: req.user!.userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where: { userId: req.user!.userId } }),
    ]);
    sendSuccess(res, { items, page, limit, total });
  } catch (err) {
    sendError(res, "Failed to retrieve transactions.", 500, "INTERNAL_ERROR");
  }
}

export async function getWithdrawalHistory(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const [items, total] = await Promise.all([
      prisma.withdrawalRequest.findMany({
        where: { userId: req.user!.userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.withdrawalRequest.count({ where: { userId: req.user!.userId } }),
    ]);
    sendSuccess(res, { items, page, limit, total });
  } catch (err) {
    sendError(res, "Failed to retrieve withdrawal history.", 500, "INTERNAL_ERROR");
  }
}

export async function requestWithdrawal(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { amount, method, accountDetail } = req.body;
    const wallet = await prisma.wallet.findUnique({ where: { userId: req.user!.userId } });
    if (!wallet) {
      sendError(res, "Wallet not found.", 404, "WALLET_NOT_FOUND");
      return;
    }
    if (amount > wallet.balance) {
      sendError(res, "Insufficient wallet balance.", 400, "INSUFFICIENT_FUNDS");
      return;
    }
    const withdrawal = await prisma.withdrawalRequest.create({
      data: {
        userId: req.user!.userId,
        walletId: wallet.id,
        amount,
        method,
        accountDetail,
      },
    });
    sendSuccess(res, withdrawal, "Withdrawal request submitted.", 201);
  } catch (err) {
    sendError(res, "Failed to request withdrawal.", 500, "INTERNAL_ERROR");
  }
}

export async function cancelWithdrawal(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const withdrawal = await prisma.withdrawalRequest.findUnique({ where: { id } });
    if (!withdrawal || withdrawal.userId !== req.user!.userId) {
      sendError(res, "Withdrawal request not found.", 404, "WITHDRAWAL_NOT_FOUND");
      return;
    }
    if (withdrawal.status !== "PENDING") {
      sendError(res, "Only pending withdrawals can be cancelled.", 400, "INVALID_STATUS");
      return;
    }
    await prisma.withdrawalRequest.update({ where: { id }, data: { status: "REJECTED", rejectionReason: "Cancelled by user" } });
    sendSuccess(res, undefined, "Withdrawal cancelled.");
  } catch (err) {
    sendError(res, "Failed to cancel withdrawal.", 500, "INTERNAL_ERROR");
  }
}
