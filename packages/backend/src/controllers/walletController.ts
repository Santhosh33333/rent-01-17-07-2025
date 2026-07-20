import { Response } from "express";
import { prisma } from "../config/database";
import { sendSuccess, sendError } from "../utils/response";
import { AuthedRequest } from "../middleware/authTypes";
import { getPartnerEarnings } from "../services/pricingEngine";

// ============================================================================
// GET WALLET
// ============================================================================

export async function getWallet(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!wallet) {
      sendError(res, "Wallet not found.", 404, "WALLET_NOT_FOUND");
      return;
    }

    sendSuccess(res, wallet, "Wallet retrieved.");
  } catch (err: any) {
    sendError(res, "Failed to retrieve wallet.", 500, "INTERNAL_ERROR");
  }
}

// ============================================================================
// TOPUP WALLET
// ============================================================================

export async function topupWallet(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { amount, paymentMethodId } = req.body;

    if (!amount || amount <= 0) {
      sendError(res, "Invalid topup amount.", 400, "VALIDATION_ERROR");
      return;
    }

    if (amount > 100000) {
      sendError(res, "Maximum topup amount is 100,000.", 400, "AMOUNT_EXCEEDS_LIMIT");
      return;
    }

    // TODO: Integrate with Razorpay payment gateway
    // For now, create pending transaction pending payment

    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!wallet) {
      sendError(res, "Wallet not found.", 404, "WALLET_NOT_FOUND");
      return;
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: req.user!.userId,
        walletId: wallet.id,
        type: "TOPUP",
        amount,
        status: "PENDING",
        description: `Wallet topup - ${amount}`,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user!.userId,
        actorType: "USER",
        action: "WALLET_TOPUP",
        entityType: "Wallet",
        entityId: wallet.id,
        metadata: JSON.stringify({ amount }),
      },
    });

    sendSuccess(res, transaction, "Topup request created.", 201);
  } catch (err: any) {
    sendError(res, "Failed to topup wallet.", 500, "INTERNAL_ERROR");
  }
}

// ============================================================================
// GET TRANSACTIONS
// ============================================================================

export async function getTransactions(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const type = req.query.type as string;

    const where: any = { userId: req.user!.userId };
    if (type) where.type = type;

    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    sendSuccess(res, { items, page, limit, total });
  } catch (err: any) {
    sendError(res, "Failed to retrieve transactions.", 500, "INTERNAL_ERROR");
  }
}

// ============================================================================
// GET WITHDRAWAL HISTORY
// ============================================================================

export async function getWithdrawalHistory(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const status = req.query.status as string;

    const where: any = { userId: req.user!.userId };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.withdrawalRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.withdrawalRequest.count({ where }),
    ]);

    sendSuccess(res, { items, page, limit, total });
  } catch (err: any) {
    sendError(res, "Failed to retrieve withdrawal history.", 500, "INTERNAL_ERROR");
  }
}

// ============================================================================
// REQUEST WITHDRAWAL
// ============================================================================

export async function requestWithdrawal(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { amount, method, accountDetail } = req.body;

    const validMethods = ["BANK_TRANSFER", "UPI"];
    if (!method || !validMethods.includes(method)) {
      sendError(res, "Invalid withdrawal method.", 400, "INVALID_METHOD");
      return;
    }

    if (!amount || amount <= 0 || amount < 100) {
      sendError(res, "Minimum withdrawal amount is 100.", 400, "VALIDATION_ERROR");
      return;
    }

    if (amount > 500000) {
      sendError(res, "Maximum withdrawal amount is 500,000.", 400, "AMOUNT_EXCEEDS_LIMIT");
      return;
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!wallet) {
      sendError(res, "Wallet not found.", 404, "WALLET_NOT_FOUND");
      return;
    }

    if (amount > wallet.balance) {
      sendError(res, "Insufficient wallet balance.", 400, "INSUFFICIENT_FUNDS");
      return;
    }

    const withdrawal = await prisma.$transaction(async (tx) => {
      const lockedWallet = await tx.wallet.findUnique({ where: { id: wallet.id } });

      if (!lockedWallet || amount > lockedWallet.balance) {
        throw new Error("INSUFFICIENT_FUNDS");
      }

      // Deduct from wallet balance immediately
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      });

      return tx.withdrawalRequest.create({
        data: {
          userId: req.user!.userId,
          walletId: wallet.id,
          amount,
          method,
          accountDetail,
          status: "PENDING",
        },
      });
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user!.userId,
        actorType: "USER",
        action: "WITHDRAWAL_REQUEST",
        entityType: "WithdrawalRequest",
        entityId: withdrawal.id,
        metadata: JSON.stringify({ amount, method }),
      },
    });

    sendSuccess(res, withdrawal, "Withdrawal request submitted.", 201);
  } catch (err: any) {
    if (err?.message === "INSUFFICIENT_FUNDS") {
      sendError(res, "Insufficient wallet balance.", 400, "INSUFFICIENT_FUNDS");
    } else {
      sendError(res, "Failed to request withdrawal.", 500, "INTERNAL_ERROR");
    }
  }
}

// ============================================================================
// CANCEL WITHDRAWAL
// ============================================================================

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

    await prisma.$transaction([
      prisma.withdrawalRequest.update({
        where: { id },
        data: { status: "CANCELLED", rejectionReason: "Cancelled by user" },
      }),
      prisma.wallet.update({
        where: { id: withdrawal.walletId },
        data: { balance: { increment: withdrawal.amount } },
      }),
      prisma.auditLog.create({
        data: {
          actorId: req.user!.userId,
          actorType: "USER",
          action: "WITHDRAWAL_CANCEL",
          entityType: "WithdrawalRequest",
          entityId: id,
        },
      }),
    ]);

    sendSuccess(res, undefined, "Withdrawal cancelled.");
  } catch (err: any) {
    sendError(res, "Failed to cancel withdrawal.", 500, "INTERNAL_ERROR");
  }
}

// ============================================================================
// EARNINGS ENDPOINTS
// ============================================================================

export async function getEarningsSummary(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const earnings = await getPartnerEarnings(userId);

    sendSuccess(res, earnings, "Earnings summary retrieved.");
  } catch (err: any) {
    sendError(res, "Failed to retrieve earnings summary.", 500, "INTERNAL_ERROR");
  }
}

// ============================================================================
// GET EARNING DETAILS
// ============================================================================

export async function getEarningDetails(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const type = req.query.type as string | undefined;

    const earnings = await prisma.partnerEarnings.findUnique({ where: { userId } });

    if (!earnings) {
      sendSuccess(res, { items: [], page, limit, total: 0 });
      return;
    }

    const where: any = { earningsId: earnings.id };
    if (type) where.type = type;

    const [items, total] = await Promise.all([
      prisma.earningDetail.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          walkingRequest: {
            select: {
              id: true,
              startLocation: true,
              endLocation: true,
              durationMinutes: true,
            },
          },
        },
      }),
      prisma.earningDetail.count({ where }),
    ]);

    sendSuccess(res, { items, page, limit, total });
  } catch (err: any) {
    sendError(res, "Failed to retrieve earning details.", 500, "INTERNAL_ERROR");
  }
}

// ============================================================================
// GET EARNINGS CHART
// ============================================================================

export async function getEarningsChart(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const days = Number(req.query.days) || 7;

    const earnings = await prisma.partnerEarnings.findUnique({
      where: { userId },
    });

    if (!earnings) {
      sendSuccess(res, { chart: [], totalEarnings: 0 });
      return;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const details = await prisma.earningDetail.findMany({
      where: {
        earningsId: earnings.id,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: "asc" },
    });

    // Group by date
    const chartMap = new Map<
      string,
      {
        date: string;
        earnings: number;
        fees: number;
        netAmount: number;
        count: number;
      }
    >();

    details.forEach((d) => {
      const dateKey = d.createdAt.toISOString().split("T")[0];
      const existing = chartMap.get(dateKey) || {
        date: dateKey,
        earnings: 0,
        fees: 0,
        netAmount: 0,
        count: 0,
      };

      existing.earnings += d.amount;
      existing.fees += d.platformFee + d.commissionDeduction;
      existing.netAmount += d.netAmount;
      existing.count += 1;
      chartMap.set(dateKey, existing);
    });

    const chart = Array.from(chartMap.values());
    const totalEarnings = details.reduce((s, d) => s + d.netAmount, 0);

    sendSuccess(res, { chart, totalEarnings });
  } catch (err: any) {
    sendError(res, "Failed to retrieve earnings chart.", 500, "INTERNAL_ERROR");
  }
}
