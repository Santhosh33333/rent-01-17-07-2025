import { Prisma, PrismaClient, Wallet, Transaction, WithdrawalRequest, PaymentOrder } from "@prisma/client";

export class WalletRepository {
  constructor(private prisma: PrismaClient) {}

  async findOrCreateWallet(userId: string): Promise<Wallet> {
    return this.prisma.wallet.upsert({
      where: { userId },
      create: { userId, balance: 0, currency: "INR" },
      update: {},
    });
  }

  async getBalance(userId: string): Promise<Wallet | null> {
    return this.prisma.wallet.findUnique({ where: { userId } });
  }

  async credit(userId: string, amount: number, description?: string, referenceId?: string): Promise<Transaction> {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.update({
        where: { userId },
        data: { balance: { increment: amount } },
      });
      return tx.transaction.create({
        data: {
          walletId: wallet.id,
          userId,
          type: "CREDIT",
          status: "COMPLETED",
          amount,
          description,
          referenceId,
        },
      });
    });
  }

  async debit(userId: string, amount: number, description?: string, referenceId?: string): Promise<Transaction> {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet || wallet.balance.lessThan(amount)) throw new Error("Insufficient wallet balance");
      const updated = await tx.wallet.update({
        where: { userId },
        data: { balance: { decrement: new Prisma.Decimal(amount) } },
      });
      return tx.transaction.create({
        data: {
          walletId: updated.id,
          userId,
          type: "DEBIT",
          status: "COMPLETED",
          amount,
          description,
          referenceId,
        },
      });
    });
  }

  async getTransactions(params: { userId: string; type?: string; page: number; limit: number }): Promise<{ transactions: Transaction[]; total: number }> {
    const where: Record<string, unknown> = { userId: params.userId };
    if (params.type) where["type"] = params.type;
    const skip = (params.page - 1) * params.limit;
    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({ where, skip, take: params.limit, orderBy: { createdAt: "desc" } }),
      this.prisma.transaction.count({ where }),
    ]);
    return { transactions, total };
  }

  async createWithdrawal(data: {
    userId: string;
    walletId: string;
    amount: number;
    method: string;
    accountDetail: string;
  }): Promise<WithdrawalRequest> {
    return this.prisma.withdrawalRequest.create({ data: { ...data, status: "PENDING" } });
  }

  async getWithdrawals(userId: string): Promise<WithdrawalRequest[]> {
    return this.prisma.withdrawalRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createPaymentOrder(data: {
    razorpayOrderId: string;
    userId: string;
    walletId: string;
    amount: number;
    type: string;
  }): Promise<PaymentOrder> {
    return this.prisma.paymentOrder.create({
      data: { ...data, amount: new Prisma.Decimal(data.amount), currency: "INR", status: "CREATED" },
    });
  }

  async updatePaymentOrder(razorpayOrderId: string, data: {
    razorpayPaymentId?: string;
    status: string;
    completedAt?: Date;
  }): Promise<PaymentOrder> {
    return this.prisma.paymentOrder.update({ where: { razorpayOrderId }, data });
  }
}
