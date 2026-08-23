import crypto from "crypto"
import { Response } from "express"
import { prisma } from "../config/database"
import { sendSuccess, sendError } from "../utils/response"
import { AuthedRequest } from "../middleware/authTypes"
import * as bookingEngine from "../services/bookingEngine"
import * as razorpayService from "../services/razorpayService"
import * as partnerMatching from "../services/partnerMatchingEngine"

// ============================================================================
// CREATE BOOKING
// ============================================================================

export async function createBooking(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { serviceType, startLocation, endLocation, scheduledAt, durationMinutes, itemType, itemDescription, notes, startLatitude, startLongitude, endLatitude, endLongitude, couponCode } = req.body;

    if (!serviceType || !startLocation || !endLocation) {
      sendError(res, "Service type, start location, and end location are required.", 400, "VALIDATION_ERROR");
      return;
    }

    const booking = await bookingEngine.createBooking(userId, {
      serviceType,
      startLocation,
      endLocation,
      scheduledAt,
      durationMinutes,
      itemType,
      itemDescription,
      notes,
      startLatitude,
      startLongitude,
      endLatitude,
      endLongitude,
      couponCode,
    });

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        actorType: "USER",
        action: "BOOKING_CREATE",
        entityType: "Booking",
        entityId: booking.id,
        metadata: JSON.stringify({ serviceType }),
      },
    });

    sendSuccess(res, booking, "Booking created.", 201);
  } catch (err: any) {
    sendError(res, "Failed to create booking.", 500, "INTERNAL_ERROR");
  }
}

// ============================================================================
// GET MY BOOKINGS
// ============================================================================

export async function getMyBookings(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const status = req.query.status as string | undefined;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const where: any = { userId };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          partner: {
            select: {
              user: { select: { id: true, fullName: true, avatarUrl: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    sendSuccess(res, { items, total, page, limit });
  } catch (err: any) {
    sendError(res, "Failed to retrieve bookings.", 500, "INTERNAL_ERROR");
  }
}

// ============================================================================
// GET BOOKING DETAIL
// ============================================================================

export async function getBookingDetail(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true, phone: true, city: true } },
        partner: {
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true, phone: true } },
          },
        },
      },
    });

    if (!booking) {
      sendError(res, "Booking not found.", 404, "BOOKING_NOT_FOUND");
      return;
    }

    const userId = req.user!.userId;
    const partnerUserId = booking.partner?.userId;

    if (booking.userId !== userId && partnerUserId !== userId) {
      sendError(res, "Unauthorized.", 403, "FORBIDDEN");
      return;
    }

    sendSuccess(res, booking, "Booking details retrieved.");
  } catch (err: any) {
    sendError(res, "Failed to retrieve booking details.", 500, "INTERNAL_ERROR");
  }
}

// ============================================================================
// INITIATE PAYMENT
// ============================================================================

export async function initiatePayment(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params

    const booking = await prisma.booking.findUnique({ where: { id } })

    if (!booking) {
      sendError(res, "Booking not found.", 404, "BOOKING_NOT_FOUND")
      return
    }

    if (booking.userId !== req.user!.userId) {
      sendError(res, "Unauthorized.", 403, "FORBIDDEN")
      return
    }

    if (booking.status !== "PAYMENT_PENDING") {
      sendError(res, "Payment already initiated or booking is not in payment pending state.", 400, "INVALID_STATUS")
      return
    }

    const amount = booking.estimatedAmount ?? 0

    // Create Razorpay order
    const razorpayOrder = await razorpayService.createOrder(
      amount,
      "INR",
      `booking_${id}_${Date.now()}`,
      `Booking for ${booking.serviceType}`,
      {
        bookingId: id,
        userId: req.user!.userId,
        serviceType: booking.serviceType,
      }
    )

    // Update booking with razorpay order ID
    await prisma.booking.update({
      where: { id },
      data: {
        razorpayOrderId: razorpayOrder.id,
        status: "PAYMENT_INITIATED",
      },
    })

    // Log action
    await prisma.auditLog.create({
      data: {
        actorId: req.user!.userId,
        actorType: "USER",
        action: "PAYMENT_INITIATED",
        entityType: "Booking",
        entityId: id,
        metadata: JSON.stringify({ 
          razorpayOrderId: razorpayOrder.id,
          amount,
        }),
      },
    })

    sendSuccess(
      res,
      {
        orderId: razorpayOrder.id,
        amount: Number(razorpayOrder.amount) / 100,
        currency: razorpayOrder.currency,
        bookingId: id,
      },
      "Order created. Proceed to payment."
    )
  } catch (err: any) {
    console.error("Payment initiation failed:", err)
    sendError(res, "Failed to initiate payment.", 500, "PAYMENT_INITIATION_FAILED")
  }
}

// ============================================================================
// VERIFY PAYMENT
// ============================================================================

export async function verifyPayment(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body

    if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      sendError(res, "Missing payment details.", 400, "MISSING_PAYMENT_DETAILS")
      return
    }

    const booking = await prisma.booking.findUnique({ where: { id } })

    if (!booking) {
      sendError(res, "Booking not found.", 404, "BOOKING_NOT_FOUND")
      return
    }

    if (booking.userId !== req.user!.userId) {
      sendError(res, "Unauthorized.", 403, "FORBIDDEN")
      return
    }

    if (booking.status !== "PAYMENT_INITIATED") {
      sendError(res, "Booking is not in correct state for payment verification.", 400, "INVALID_STATE")
      return
    }

    // Verify Razorpay signature
    const isValid = razorpayService.verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature)
    if (!isValid) {
      // Log failed verification attempt
      await prisma.auditLog.create({
        data: {
          actorId: req.user!.userId,
          actorType: "USER",
          action: "PAYMENT_VERIFICATION_FAILED",
          entityType: "Booking",
          entityId: id,
          metadata: JSON.stringify({ razorpayPaymentId, reason: "Invalid signature" }),
        },
      })
      sendError(res, "Payment signature verification failed.", 400, "INVALID_SIGNATURE")
      return
    }

    // Fetch actual payment details from Razorpay to double-check
    const paymentDetails = await razorpayService.fetchPayment(razorpayPaymentId)
    
    if (!paymentDetails || paymentDetails.status !== "captured") {
      sendError(res, "Payment not captured in Razorpay.", 400, "PAYMENT_NOT_CAPTURED")
      return
    }

    const amount = Number(paymentDetails.amount) / 100 // Convert from paise
    
    if (amount !== booking.estimatedAmount) {
      sendError(res, "Payment amount mismatch.", 400, "AMOUNT_MISMATCH")
      return
    }

    // Payment is valid - update booking and wallet
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    if (!user) {
      sendError(res, "User not found.", 404, "USER_NOT_FOUND")
      return
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId: req.user!.userId } })
    if (!wallet) {
      sendError(res, "Wallet not found.", 404, "WALLET_NOT_FOUND")
      return
    }

    // Begin transaction: Update booking, create transaction record, update wallet
    const result = await prisma.$transaction([
      prisma.booking.update({
        where: { id },
        data: {
          status: "PARTNER_SEARCHING",
          paymentVerifiedAt: new Date(),
          finalAmount: amount,
          razorpayPaymentId,
        },
      }),
      prisma.transaction.create({
        data: {
          walletId: wallet.id,
          userId: req.user!.userId,
          type: "DEBIT",
          status: "COMPLETED",
          amount,
          description: `Booking payment for ${booking.serviceType}`,
          referenceId: razorpayPaymentId,
          bookingId: id,
        },
      }),
      prisma.auditLog.create({
        data: {
          actorId: req.user!.userId,
          actorType: "USER",
          action: "PAYMENT_VERIFIED",
          entityType: "Booking",
          entityId: id,
          metadata: JSON.stringify({ 
            razorpayPaymentId,
            amount,
            status: "COMPLETED",
          }),
        },
      }),
    ])

    // Send notification to user
    await prisma.notification.create({
      data: {
        userId: req.user!.userId,
        title: "Payment Successful",
        body: `Payment of ₹${amount} for your booking has been confirmed. We're searching for a partner.`,
        data: JSON.stringify({ bookingId: id, paymentId: razorpayPaymentId }),
      },
    })

    // Trigger partner matching in the background
    partnerMatching.assignPartnerToBooking(id, {
      serviceType: booking.serviceType as "WALKING" | "CARRY_BUDDY",
      startLocation: booking.startLocation,
      endLocation: booking.endLocation,
      startLatitude: booking.startLatitude || undefined,
      startLongitude: booking.startLongitude || undefined,
      endLatitude: booking.endLatitude || undefined,
      endLongitude: booking.endLongitude || undefined,
      durationMinutes: booking.durationMinutes || undefined,
      userId: booking.userId,
    }).catch(err => console.error("[BOOKING] Partner matching error:", err));

    sendSuccess(
      res,
      {
        bookingId: id,
        paymentId: razorpayPaymentId,
        amount,
        status: "COMPLETED",
      },
      "Payment verified successfully. Searching for partners."
    )
  } catch (err: any) {
    console.error("Payment verification error:", err)
    sendError(res, "Failed to verify payment.", 500, "PAYMENT_VERIFICATION_ERROR")
  }
}

// ============================================================================
// ACCEPT BOOKING (Partner)
// ============================================================================

export async function acceptBooking(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({ where: { id } });

    if (!booking) {
      sendError(res, "Booking not found.", 404, "BOOKING_NOT_FOUND");
      return;
    }

    if (booking.status !== "PARTNER_SEARCHING") {
      sendError(res, "Booking is not open for partner acceptance.", 400, "INVALID_STATUS");
      return;
    }

    const partner = await prisma.partner.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!partner) {
      sendError(res, "You are not registered as a partner.", 403, "NOT_PARTNER");
      return;
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        partnerId: partner.id,
        status: "PARTNER_ACCEPTED",
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user!.userId,
        actorType: "USER",
        action: "BOOKING_ACCEPT",
        entityType: "Booking",
        entityId: id,
      },
    });

    sendSuccess(res, updated, "Booking accepted.");
  } catch (err: any) {
    sendError(res, "Failed to accept booking.", 500, "INTERNAL_ERROR");
  }
}

// ============================================================================
// REJECT BOOKING (Partner)
// ============================================================================

export async function rejectBooking(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await prisma.booking.findUnique({ where: { id } });

    if (!booking) {
      sendError(res, "Booking not found.", 404, "BOOKING_NOT_FOUND");
      return;
    }

    if (booking.status !== "PARTNER_SEARCHING" && booking.status !== "PARTNER_ACCEPTED") {
      sendError(res, "Booking cannot be rejected at this stage.", 400, "INVALID_STATUS");
      return;
    }

    await prisma.booking.update({
      where: { id },
      data: {
        status: "CANCELLED",
        partnerId: null,
        cancelReason: reason || "Partner rejected",
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user!.userId,
        actorType: "USER",
        action: "BOOKING_REJECT",
        entityType: "Booking",
        entityId: id,
      },
    });

    sendSuccess(res, undefined, "Booking rejected.");
  } catch (err: any) {
    sendError(res, "Failed to reject booking.", 500, "INTERNAL_ERROR");
  }
}

// ============================================================================
// START BOOKING (Partner)
// ============================================================================

export async function startBooking(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({ where: { id } });

    if (!booking) {
      sendError(res, "Booking not found.", 404, "BOOKING_NOT_FOUND");
      return;
    }

    if (booking.status !== "PARTNER_ACCEPTED") {
      sendError(res, "Booking cannot be started at this stage.", 400, "INVALID_STATUS");
      return;
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user!.userId,
        actorType: "USER",
        action: "BOOKING_START",
        entityType: "Booking",
        entityId: id,
      },
    });

    sendSuccess(res, updated, "Booking started.");
  } catch (err: any) {
    sendError(res, "Failed to start booking.", 500, "INTERNAL_ERROR");
  }
}

// ============================================================================
// COMPLETE BOOKING (Partner)
// ============================================================================

export async function completeBooking(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { endLatitude, endLongitude } = req.body;

    const booking = await prisma.booking.findUnique({ where: { id } });

    if (!booking) {
      sendError(res, "Booking not found.", 404, "BOOKING_NOT_FOUND");
      return;
    }

    if (booking.status !== "IN_PROGRESS") {
      sendError(res, "Booking is not in progress.", 400, "INVALID_STATUS");
      return;
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        endLatitude: endLatitude || undefined,
        endLongitude: endLongitude || undefined,
      },
    });

    // Credit partner earnings
    const partner = await prisma.partner.findUnique({
      where: { id: booking.partnerId! },
    });

    if (partner) {
      const earnings = booking.finalAmount ?? booking.estimatedAmount ?? 0;
      await prisma.partnerEarnings.upsert({
        where: { userId: partner.userId },
        update: {
          lifetimeEarnings: { increment: earnings },
          completedJobs: { increment: 1 },
        },
        create: {
          userId: partner.userId,
          lifetimeEarnings: earnings,
          completedJobs: 1,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        actorId: req.user!.userId,
        actorType: "USER",
        action: "BOOKING_COMPLETE",
        entityType: "Booking",
        entityId: id,
      },
    });

    sendSuccess(res, updated, "Booking completed.");
  } catch (err: any) {
    sendError(res, "Failed to complete booking.", 500, "INTERNAL_ERROR");
  }
}

// ============================================================================
// CANCEL BOOKING
// ============================================================================

export async function cancelBookingHandler(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await prisma.booking.findUnique({ where: { id } });

    if (!booking) {
      sendError(res, "Booking not found.", 404, "BOOKING_NOT_FOUND");
      return;
    }

    const userId = req.user!.userId;

    if (booking.userId !== userId && booking.partnerId !== userId) {
      sendError(res, "Unauthorized.", 403, "FORBIDDEN");
      return;
    }

    const cancelledBy = booking.userId === userId ? "USER" : "PARTNER";
    const result = await bookingEngine.cancelBooking(id, cancelledBy, reason);

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        actorType: "USER",
        action: "BOOKING_CANCEL",
        entityType: "Booking",
        entityId: id,
      },
    });

    sendSuccess(res, result, "Booking cancelled.");
  } catch (err: any) {
    sendError(res, "Failed to cancel booking.", 500, "INTERNAL_ERROR");
  }
}

// ============================================================================
// RATE BOOKING
// ============================================================================

export async function rateBooking(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { score, comment } = req.body;

    if (!score || score < 1 || score > 5) {
      sendError(res, "Rating score must be between 1 and 5.", 400, "VALIDATION_ERROR");
      return;
    }

    const booking = await prisma.booking.findUnique({ where: { id } });

    if (!booking) {
      sendError(res, "Booking not found.", 404, "BOOKING_NOT_FOUND");
      return;
    }

    if (booking.userId !== req.user!.userId) {
      sendError(res, "Unauthorized.", 403, "FORBIDDEN");
      return;
    }

    if (booking.status !== "COMPLETED") {
      sendError(res, "Booking is not completed yet.", 400, "INVALID_STATUS");
      return;
    }

    const partner = await prisma.partner.findUnique({
      where: { id: booking.partnerId! },
    });

    if (!partner) {
      sendError(res, "Partner not found.", 404, "PARTNER_NOT_FOUND");
      return;
    }

    await prisma.rating.create({
      data: {
        raterId: req.user!.userId,
        ratedId: partner.userId,
        targetType: "PARTNER",
        ratingType: "BOOKING",
        bookingId: id,
        score,
        comment,
      },
    });

    const ratings = await prisma.rating.findMany({
      where: { ratedId: partner.userId, targetType: "PARTNER" },
      select: { score: true },
    });

    const averageRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length) * 10) / 10
        : 0;

    await prisma.partner.update({
      where: { id: partner.id },
      data: { averageRating, rating: averageRating },
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user!.userId,
        actorType: "USER",
        action: "BOOKING_RATE",
        entityType: "Booking",
        entityId: id,
        metadata: JSON.stringify({ score }),
      },
    });

    sendSuccess(res, undefined, "Rating submitted successfully.");
  } catch (err: any) {
    sendError(res, "Failed to submit rating.", 500, "INTERNAL_ERROR");
  }
}

// ============================================================================
// GET PRICE ESTIMATE
// ============================================================================

export async function getPriceEstimate(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { serviceType, durationMinutes, startLatitude, startLongitude, endLatitude, endLongitude } = req.query;

    if (!serviceType) {
      sendError(res, "Service type is required.", 400, "MISSING_PARAMS");
      return;
    }

    const estimate = await bookingEngine.getPriceEstimate({
      serviceType: serviceType as "WALKING" | "CARRY_BUDDY",
      durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
      startLatitude: startLatitude ? Number(startLatitude) : undefined,
      startLongitude: startLongitude ? Number(startLongitude) : undefined,
      endLatitude: endLatitude ? Number(endLatitude) : undefined,
      endLongitude: endLongitude ? Number(endLongitude) : undefined,
    });

    sendSuccess(res, estimate, "Price estimate calculated.");
  } catch (err: any) {
    sendError(res, "Failed to calculate price estimate.", 500, "INTERNAL_ERROR");
  }
}

// ============================================================================
// SELECT PAYMENT METHOD (after partner accepts)
// ============================================================================
export async function selectPaymentMethod(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body; // 'ONLINE' | 'CASH'

    if (!['ONLINE', 'CASH'].includes(paymentMethod)) {
      sendError(res, 'Payment method must be ONLINE or CASH.', 400, 'VALIDATION_ERROR');
      return;
    }

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) { sendError(res, 'Booking not found.', 404, 'BOOKING_NOT_FOUND'); return; }
    if (booking.userId !== req.user!.userId) { sendError(res, 'Unauthorized.', 403, 'FORBIDDEN'); return; }
    if (!['PARTNER_ACCEPTED', 'OTP_GENERATED'].includes(booking.status)) {
      sendError(res, 'Payment method can only be selected after partner accepts.', 400, 'INVALID_STATUS');
      return;
    }
    if ((booking as any).paymentStatus === 'PAID' || (booking as any).paymentMethod) {
      sendError(res, 'Payment method already selected.', 400, 'ALREADY_SELECTED');
      return;
    }

    const updated = await (prisma.booking as any).update({
      where: { id },
      data: {
        notes: JSON.stringify({ ...(booking.notes ? JSON.parse(booking.notes) : {}), paymentMethod }),
        paymentStatus: paymentMethod === 'CASH' ? 'PENDING_CASH' : (booking as any).paymentStatus,
        status: paymentMethod === 'CASH' ? 'OTP_GENERATED' : booking.status,
      },
    });

    await prisma.auditLog.create({
      data: { actorId: req.user!.userId, actorType: 'USER', action: 'PAYMENT_METHOD_SELECTED', entityType: 'Booking', entityId: id, metadata: JSON.stringify({ paymentMethod }) },
    });

    await prisma.notification.create({
      data: { userId: booking.userId, title: paymentMethod === 'CASH' ? 'Cash Payment Selected' : 'Proceed to Online Payment', body: paymentMethod === 'CASH' ? `Pay ₹${booking.estimatedAmount} directly to your partner after the service.` : `Complete your online payment to confirm booking.`, data: JSON.stringify({ bookingId: id }) },
    });

    sendSuccess(res, { ...updated, paymentMethod }, paymentMethod === 'CASH' ? 'Cash payment selected. Booking confirmed.' : 'Online payment method selected. Please complete payment.');
  } catch (err: any) {
    console.error('selectPaymentMethod error:', err);
    sendError(res, 'Failed to select payment method.', 500, 'INTERNAL_ERROR');
  }
}

// ============================================================================
// CONFIRM CASH RECEIVED (Partner confirms after service completion)
// ============================================================================
export async function confirmCashReceived(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({ where: { id }, include: { partner: { select: { userId: true, id: true } } } });
    if (!booking) { sendError(res, 'Booking not found.', 404, 'BOOKING_NOT_FOUND'); return; }
    if (booking.partner?.userId !== req.user!.userId) { sendError(res, 'Only the assigned partner can confirm cash receipt.', 403, 'FORBIDDEN'); return; }

    const bookingNotes = booking.notes ? JSON.parse(booking.notes) : {};
    if (bookingNotes.paymentMethod !== 'CASH') { sendError(res, 'This booking does not use cash payment.', 400, 'NOT_CASH_BOOKING'); return; }
    if (booking.status !== 'COMPLETED') { sendError(res, 'Booking must be completed before confirming cash.', 400, 'INVALID_STATUS'); return; }

    const amount = booking.finalAmount ?? booking.estimatedAmount ?? 0;
    const platformFee = booking.platformFee ?? Math.ceil(amount * 0.1);
    const partnerEarning = amount - platformFee;

    await prisma.$transaction([
      (prisma.booking as any).update({ where: { id }, data: { paymentStatus: 'CASH_RECEIVED', notes: JSON.stringify({ ...bookingNotes, cashConfirmedAt: new Date().toISOString() }) } }),
      prisma.partnerEarnings.upsert({ where: { userId: booking.partner!.userId }, update: { lifetimeEarnings: { increment: partnerEarning }, completedJobs: { increment: 0 } }, create: { userId: booking.partner!.userId, lifetimeEarnings: partnerEarning, completedJobs: 0 } }),
      prisma.notification.create({ data: { userId: booking.userId, title: 'Cash Confirmed', body: `Your partner confirmed receipt of ₹${amount} cash.`, data: JSON.stringify({ bookingId: id }) } }),
      prisma.auditLog.create({ data: { actorId: req.user!.userId, actorType: 'USER', action: 'CASH_CONFIRMED', entityType: 'Booking', entityId: id, metadata: JSON.stringify({ amount, partnerEarning }) } }),
    ]);

    sendSuccess(res, { confirmed: true, amount, partnerEarning }, 'Cash receipt confirmed.');
  } catch (err: any) {
    console.error('confirmCashReceived error:', err);
    sendError(res, 'Failed to confirm cash receipt.', 500, 'INTERNAL_ERROR');
  }
}
