import { Request, Response } from "express";
import { WalletService } from "./wallet.service";
import { WalletRepository } from "./wallet.repository";
import { TopupDto, TopupVerifyDto, WithdrawDto, TransactionQueryDto } from "./wallet.dto";
import { sendSuccess, sendError } from "../../utils/response";
import { prisma } from "../../config/database";

const repo = new WalletRepository(prisma);
const service = new WalletService(repo);

type AuthRequest = Request & { user?: { userId: string } };

export async function getWallet(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  try {
    const wallet = await service.getWallet(userId);
    sendSuccess(res, wallet);
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch wallet", 400);
  }
}

export async function initiateTopup(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  const parsed = TopupDto.safeParse(req.body);
  if (!parsed.success) { sendError(res, parsed.error.errors[0]?.message ?? "Validation error", 422); return; }
  try {
    const result = await service.initiateTopup(userId, parsed.data);
    sendSuccess(res, result, "Topup initiated", 201);
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Topup initiation failed", 400);
  }
}

export async function verifyTopup(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  const parsed = TopupVerifyDto.safeParse(req.body);
  if (!parsed.success) { sendError(res, parsed.error.errors[0]?.message ?? "Validation error", 422); return; }
  try {
    const tx = await service.verifyTopup(userId, parsed.data);
    sendSuccess(res, tx, "Topup completed");
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Topup verification failed", 400);
  }
}

export async function getTransactions(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  const parsed = TransactionQueryDto.safeParse(req.query);
  if (!parsed.success) { sendError(res, parsed.error.errors[0]?.message ?? "Validation error", 422); return; }
  try {
    const result = await service.getTransactions(userId, parsed.data);
    sendSuccess(res, result);
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch transactions", 400);
  }
}

export async function requestWithdrawal(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  const parsed = WithdrawDto.safeParse(req.body);
  if (!parsed.success) { sendError(res, parsed.error.errors[0]?.message ?? "Validation error", 422); return; }
  try {
    const withdrawal = await service.requestWithdrawal(userId, parsed.data);
    sendSuccess(res, withdrawal, "Withdrawal requested", 201);
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Withdrawal request failed", 400);
  }
}

export async function getWithdrawals(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) { sendError(res, "Unauthorized", 401); return; }
  try {
    const withdrawals = await service.getWithdrawals(userId);
    sendSuccess(res, withdrawals);
  } catch (err: unknown) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch withdrawals", 400);
  }
}
