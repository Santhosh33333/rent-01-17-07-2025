import { z } from "zod";

export const TopupDto = z.object({
  amount: z.number().int().min(10, "Minimum topup is ₹10").max(100000, "Maximum topup is ₹1,00,000"),
});

export const TopupVerifyDto = z.object({
  razorpayOrderId: z.string().min(1, "Order ID is required"),
  razorpayPaymentId: z.string().min(1, "Payment ID is required"),
  razorpaySignature: z.string().min(1, "Signature is required"),
});

export const WithdrawDto = z.object({
  amount: z.number().min(100, "Minimum withdrawal is ₹100"),
  method: z.enum(["BANK_TRANSFER", "UPI"]),
  accountDetail: z.string().min(1, "Account detail is required"),
});

export const TransactionQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(["CREDIT", "DEBIT"]).optional(),
});

export type TopupDtoType = z.infer<typeof TopupDto>;
export type TopupVerifyDtoType = z.infer<typeof TopupVerifyDto>;
export type WithdrawDtoType = z.infer<typeof WithdrawDto>;
export type TransactionQueryDtoType = z.infer<typeof TransactionQueryDto>;
