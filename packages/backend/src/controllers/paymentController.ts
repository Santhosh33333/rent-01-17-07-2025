import { Response, Request } from "express"
import { prisma } from "../config/database"
import { sendSuccess, sendError } from "../utils/response"
import { AuthedRequest } from "../middleware/authTypes"
import * as razorpayService from "../services/razorpayService"

// ============================================================================
// CREATE RAZORPAY ORDER
// ============================================================================

export async function createOrder(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { amount } = req.body
    if (!amount || amount < 10) {
      sendError(res, "Amount must be at least ₹10.", 400, "INVALID_AMOUNT")
      return
    }

    const userId = req.user!.userId

    // Create Razorpay order
    const order = await razorpayService.createOrder(
      amount,
      "INR",
      `topup_${userId}_${Date.now()}`,
      "Wallet Top-Up",
      { userId, type: "TOPUP" }
    )

    // Create record in database
    const wallet = await prisma.wallet.findUnique({ where: { userId } })
    if (!wallet) {
      sendError(res, "Wallet not found.", 404, "WALLET_NOT_FOUND")
      return
    }

    await prisma.paymentOrder.create({
      data: {
        razorpayOrderId: order.id,
        userId,
        walletId: wallet.id,
        amount,
        currency: "INR",
        status: "CREATED",
        type: "TOPUP",
        metadata: JSON.stringify({ type: "TOPUP" }),
      },
    })

    sendSuccess(
      res,
      {
        orderId: order.id,
        amount: Number(order.amount) / 100,
        currency: order.currency,
      },
      "Order created."
    )
  } catch (err: any) {
    console.error("Razorpay order creation failed:", err)
    sendError(res, "Failed to create payment order.", 500, "PAYMENT_ORDER_FAILED")
  }
}

// ============================================================================
// VERIFY PAYMENT & CREDIT WALLET
// ============================================================================

export async function verifyPayment(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, amount } = req.body

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      sendError(res, "Missing payment verification details.", 400, "MISSING_PARAMS")
      return
    }

    const userId = req.user!.userId

    // Verify signature
    const isValid = razorpayService.verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature)
    if (!isValid) {
      await prisma.auditLog.create({
        data: {
          actorId: userId,
          actorType: "USER",
          action: "PAYMENT_VERIFICATION_FAILED",
          entityType: "Payment",
          entityId: razorpayPaymentId,
          metadata: JSON.stringify({ reason: "Invalid signature" }),
        },
      })
      sendError(res, "Payment verification failed.", 400, "INVALID_SIGNATURE")
      return
    }

    // Fetch payment details from Razorpay to verify amount
    const paymentDetails = await razorpayService.fetchPayment(razorpayPaymentId)
    if (!paymentDetails || paymentDetails.status !== "captured") {
      sendError(res, "Payment not captured.", 400, "PAYMENT_NOT_CAPTURED")
      return
    }

    const amountInRupees = Number(paymentDetails.amount) / 100 // Convert from paise

    // Find wallet
    const wallet = await prisma.wallet.findUnique({ where: { userId } })
    if (!wallet) {
      sendError(res, "Wallet not found.", 404, "WALLET_NOT_FOUND")
      return
    }

    // Update in transaction
    const [updatedWallet, transaction, paymentOrder] = await prisma.$transaction([
      prisma.wallet.update({
        where: { userId },
        data: { balance: { increment: amountInRupees } },
      }),
      prisma.transaction.create({
        data: {
          walletId: wallet.id,
          userId,
          type: "CREDIT",
          status: "COMPLETED",
          amount: amountInRupees,
          description: `Wallet top-up via Razorpay`,
          referenceId: razorpayPaymentId,
        },
      }),
      prisma.paymentOrder.updateMany({
        where: { razorpayOrderId },
        data: {
          status: "COMPLETED",
          razorpayPaymentId,
          completedAt: new Date(),
        },
      }),
    ])

    // Log action
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        actorType: "USER",
        action: "PAYMENT_VERIFIED",
        entityType: "Wallet",
        entityId: wallet.id,
        metadata: JSON.stringify({
          razorpayPaymentId,
          amount: amountInRupees,
          newBalance: updatedWallet.balance,
        }),
      },
    })

    // Send notification
    await prisma.notification.create({
      data: {
        userId,
        title: "Payment Successful",
        body: `₹${amountInRupees} has been credited to your wallet.`,
        data: JSON.stringify({ paymentId: razorpayPaymentId, amount: amountInRupees }),
      },
    })

    sendSuccess(
      res,
      {
        balance: updatedWallet.balance,
        paymentId: razorpayPaymentId,
        transactionId: transaction.id,
      },
      "Payment verified and wallet credited."
    )
  } catch (err: any) {
    console.error("Payment verification error:", err)
    sendError(res, "Failed to verify payment.", 500, "PAYMENT_VERIFICATION_FAILED")
  }
}

// ============================================================================
// PAYMENT WEBHOOK (Razorpay)
// ============================================================================

export async function webhookPayment(req: Request, res: Response): Promise<void> {
  try {
    const signature = req.headers["x-razorpay-signature"] as string
    const payload = JSON.stringify(req.body)

    // Verify webhook signature
    const isValid = razorpayService.verifyWebhookSignature(payload, signature)
    if (!isValid) {
      console.warn("Invalid webhook signature")
      res.status(400).json({ error: "Invalid signature" })
      return
    }

    const event = req.body

    if (event.event === "payment.authorized") {
      // Payment authorized - capture it
      const paymentId = event.payload.payment.entity.id
      const orderId = event.payload.payment.entity.order_id

      await prisma.paymentOrder.update({
        where: { razorpayOrderId: orderId },
        data: {
          status: "AUTHORIZED",
          razorpayPaymentId: paymentId,
        },
      })
    } else if (event.event === "payment.captured") {
      // Payment captured successfully
      const paymentId = event.payload.payment.entity.id
      const orderId = event.payload.payment.entity.order_id
      const amount = Number(event.payload.payment.entity.amount) / 100

      const paymentOrder = await prisma.paymentOrder.findUnique({
        where: { razorpayOrderId: orderId },
      })

      if (paymentOrder && paymentOrder.status !== "COMPLETED") {
        // Update wallet
        await prisma.$transaction([
          prisma.wallet.update({
            where: { id: paymentOrder.walletId },
            data: { balance: { increment: amount } },
          }),
          prisma.transaction.create({
            data: {
              walletId: paymentOrder.walletId,
              userId: paymentOrder.userId,
              type: "CREDIT",
              status: "COMPLETED",
              amount,
              description: `Wallet top-up via Razorpay webhook`,
              referenceId: paymentId,
            },
          }),
          prisma.paymentOrder.update({
            where: { razorpayOrderId: orderId },
            data: {
              status: "COMPLETED",
              razorpayPaymentId: paymentId,
              completedAt: new Date(),
            },
          }),
          prisma.notification.create({
            data: {
              userId: paymentOrder.userId,
              title: "Payment Confirmed",
              body: `₹${amount} has been added to your wallet.`,
              data: JSON.stringify({ paymentId, amount }),
            },
          }),
        ])
      }
    } else if (event.event === "payment.failed") {
      // Payment failed
      const paymentId = event.payload.payment.entity.id
      const orderId = event.payload.payment.entity.order_id

      const paymentOrder = await prisma.paymentOrder.findUnique({
        where: { razorpayOrderId: orderId },
      })

      if (paymentOrder) {
        await prisma.$transaction([
          prisma.paymentOrder.update({
            where: { razorpayOrderId: orderId },
            data: {
              status: "FAILED",
              razorpayPaymentId: paymentId,
            },
          }),
          prisma.notification.create({
            data: {
              userId: paymentOrder.userId,
              title: "Payment Failed",
              body: `Your payment of ₹${paymentOrder.amount} failed. Please try again.`,
              data: JSON.stringify({ paymentId }),
            },
          }),
        ])
      }
    } else if (event.event === "refund.created") {
      // Refund initiated
      const paymentId = event.payload.refund.entity.payment_id
      const refundId = event.payload.refund.entity.id
      const amount = Number(event.payload.refund.entity.amount) / 100

      const transaction = await prisma.transaction.findFirst({
        where: { referenceId: paymentId },
      })

      if (transaction) {
        await prisma.$transaction([
          prisma.wallet.update({
            where: { id: transaction.walletId },
            data: { balance: { increment: amount } },
          }),
          prisma.transaction.create({
            data: {
              walletId: transaction.walletId,
              userId: transaction.userId,
              type: "CREDIT",
              status: "COMPLETED",
              amount,
              description: `Refund for booking cancellation`,
              referenceId: refundId,
            },
          }),
          prisma.notification.create({
            data: {
              userId: transaction.userId,
              title: "Refund Processed",
              body: `₹${amount} refunded to your wallet.`,
              data: JSON.stringify({ refundId, amount }),
            },
          }),
        ])
      }
    }

    res.json({ success: true })
  } catch (err: any) {
    console.error("Webhook error:", err)
    res.status(500).json({ error: "Webhook processing failed" })
  }
}

// ============================================================================
// GET PAYMENT HISTORY
// ============================================================================

export async function getPaymentHistory(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 20

    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId: req.user!.userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { wallet: true },
      }),
      prisma.transaction.count({ where: { userId: req.user!.userId } }),
    ])

    sendSuccess(
      res,
      {
        items,
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      "Payment history retrieved."
    )
  } catch (err: any) {
    console.error("Get payment history error:", err)
    sendError(res, "Failed to retrieve payment history.", 500, "INTERNAL_ERROR")
  }
}
