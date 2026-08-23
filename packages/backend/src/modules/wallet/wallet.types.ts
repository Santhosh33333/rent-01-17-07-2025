export interface IWalletBalance {
  id: string;
  userId: string;
  balance: number;
  currency: string;
}

export interface ITopupInput {
  amount: number;
  currency?: string;
}

export interface IWithdrawInput {
  amount: number;
  method: 'BANK_TRANSFER' | 'UPI';
  accountDetail?: string;
}

export interface ITransactionFilter {
  page?: number;
  limit?: number;
  type?: string;
  startDate?: string;
  endDate?: string;
}

export enum TransactionType {
  TOPUP = 'TOPUP',
  BOOKING_PAYMENT = 'BOOKING_PAYMENT',
  BOOKING_REFUND = 'BOOKING_REFUND',
  EARNING = 'EARNING',
  WITHDRAWAL = 'WITHDRAWAL',
  BONUS = 'BONUS',
}

export enum WithdrawalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
}
