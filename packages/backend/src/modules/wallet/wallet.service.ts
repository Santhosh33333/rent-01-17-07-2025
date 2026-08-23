import crypto from "crypto";
import { Wallet, Transaction, WithdrawalRequest } from "@prisma/client";
import { WalletRepository } from "./wallet.repository";
import type { TopupDtoType, TopupVerifyDtoType, WithdrawDtoType, TransactionQueryDtoType } from "./wallet.dto";

export class WalletService {
  constructor(private repo: WalletRepository) {}

  async getWallet(userId: string): Promise<Wallet> {
    return this.repo.findOrCreateWallet(userId);
  }

  async initiateTopup(userId: string, data: TopupDtoType): Promise<{ orderId: string; amount: number; currency: string }> {
    const wallet = await this.repo.findOrCreateWallet(userId);
    // In production: create Razorpay order via SDK
    const fakeOrderId = `order_${crypto.randomBytes(10).toString("hex")}`;
    await this.repo.createPaymentOrder({
      razorpayOrderId: fakeOrderId,
      userId,
      walletId: wallet.id,
      amount: data.amount,
      type: "TOPUP",
    });
    return { orderId: fakeOrderId, amount: data.amount, currency: "INR" };
  }

  async verifyTopup(userId: string, data: TopupVerifyDtoType): Promise<Transaction> {
    const wallet = await this.repo.findOrCreateWallet(userId);
    // In production: verify Razorpay signature using HMAC
    const secret = process.env["RAZORPAY_KEY_SECRET"] ?? "";
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(`${data.razorpayOrderId}|${data.razorpayPaymentId}`)
      .digest("hex");
    if (expectedSig !== data.razorpaySignature) {
      throw new Error("Invalid payment signature");
    }
    await this.repo.updatePaymentOrder(data.razorpayOrderId, {
      razorpayPaymentId: data.razorpayPaymentId,
      status: "COMPLETED",
      completedAt: new Date(),
    });
    // Retrieve amount from payment order
    const order = await this.repo.createPaymentOrder({
      razorpayOrderId: `dup_${data.razorpayOrderId}`,
      userId,
      walletId: wallet.id,
      amount: 0,
      type: "TOPUP_VERIFY",
    });
    return this.repo.credit(userId, Number(order.amount), "Wallet topup", data.razorpayPaymentId);
  }

  async getTransactions(userId: string, params: TransactionQueryDtoType): Promise<{ transactions: Transaction[]; total: number }> {
    return this.repo.getTransactions({ userId, ...params });
  }

  async requestWithdrawal(userId: string, data: WithdrawDtoType): Promise<WithdrawalRequest> {
    const wallet = await this.repo.findOrCreateWallet(userId);
    if (!wallet || wallet.balance.lessThan(data.amount)) {
      throw new Error("Insufficient wallet balance");
    }
    return this.repo.createWithdrawal({
      userId,
      walletId: wallet.id,
      amount: data.amount,
      method: data.method,
      accountDetail: data.accountDetail,
    });
  }

  async getWithdrawals(userId: string): Promise<WithdrawalRequest[]> {
    return this.repo.getWithdrawals(userId);
  }
}
