import crypto from "crypto";
import { prisma } from "../config/database";

const WALKING_BASE_RATE = 50;
const CARRY_BUDDY_BASE_RATE = 80;
const PER_MINUTE_RATE = 2;
const PLATFORM_FEE_PERCENT = 0.1;

function calculatePrice(serviceType: "WALKING" | "CARRY_BUDDY", durationMinutes: number = 30) {
  const basePrice = serviceType === "WALKING" ? WALKING_BASE_RATE : CARRY_BUDDY_BASE_RATE;
  const timeCharge = durationMinutes * PER_MINUTE_RATE;
  const total = basePrice + timeCharge;
  const platformFee = Math.round(total * PLATFORM_FEE_PERCENT * 100) / 100;
  const partnerEarning = Math.round((total - platformFee) * 100) / 100;
  return { estimatedAmount: total, platformFee, partnerEarning, basePrice, timeCharge };
}

export async function createBooking(
  userId: string,
  data: {
    serviceType: "WALKING" | "CARRY_BUDDY";
    startLocation: string;
    endLocation: string;
    scheduledAt: string;
    durationMinutes?: number;
    itemType?: string;
    itemDescription?: string;
    notes?: string;
    startLatitude?: number;
    startLongitude?: number;
    endLatitude?: number;
    endLongitude?: number;
    couponCode?: string;
  }
) {
  const duration = data.durationMinutes ?? 30;
  const pricing = calculatePrice(data.serviceType, duration);

  const booking = await prisma.booking.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      serviceType: data.serviceType,
      status: "PAYMENT_PENDING",
      startLocation: data.startLocation,
      endLocation: data.endLocation,
      startLatitude: data.startLatitude,
      startLongitude: data.startLongitude,
      endLatitude: data.endLatitude,
      endLongitude: data.endLongitude,
      scheduledAt: new Date(data.scheduledAt),
      durationMinutes: duration,
      itemType: data.itemType,
      itemDescription: data.itemDescription,
      notes: data.notes,
      estimatedAmount: pricing.estimatedAmount,
      platformFee: pricing.platformFee,
      partnerEarning: pricing.partnerEarning,
      couponCode: data.couponCode,
    },
  });

  return booking;
}

export async function getPriceEstimate(data: {
  serviceType: "WALKING" | "CARRY_BUDDY";
  startLatitude?: number;
  startLongitude?: number;
  endLatitude?: number;
  endLongitude?: number;
  durationMinutes?: number;
}) {
  const duration = data.durationMinutes ?? 30;
  const pricing = calculatePrice(data.serviceType, duration);
  const distanceKm = data.startLatitude && data.startLongitude && data.endLatitude && data.endLongitude
    ? 0
    : undefined;
  return { ...pricing, distanceKm };
}

export async function updateBookingStatus(bookingId: string, status: string, extra?: Record<string, any>) {
  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status,
      ...(extra || {}),
    },
  });
  return booking;
}

export async function getBookingById(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      user: {
        select: { id: true, fullName: true, avatarUrl: true, phone: true },
      },
      partner: {
        include: {
          user: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
        },
      },
    },
  });
  return booking;
}

export async function cancelBooking(bookingId: string, cancelledBy: "USER" | "PARTNER", reason?: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error("Booking not found");

  let refundProcessed = false;
  const refundableStatuses = ["PAYMENT_PENDING", "PAYMENT_SUCCESSFUL", "PARTNER_SEARCHING"];
  const partialRefundStatuses = ["PARTNER_ACCEPTED"];

  if (refundableStatuses.includes(booking.status)) {
    const refundAmount = booking.estimatedAmount ?? 0;
    if (refundAmount > 0) {
      await prisma.refundLog.create({
        data: {
          bookingId,
          userId: booking.userId,
          amount: refundAmount,
          reason: reason || "Cancelled by " + cancelledBy,
          type: "FULL",
          status: "INITIATED",
          initiatedBy: cancelledBy,
        },
      });
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          refundStatus: "REFUND_INITIATED",
          refundAmount,
          refundInitiatedAt: new Date(),
        },
      });
      refundProcessed = true;
    }
  } else if (partialRefundStatuses.includes(booking.status) && !booking.otpGeneratedAt) {
    const refundAmount = booking.estimatedAmount ? Math.round(booking.estimatedAmount * 0.8 * 100) / 100 : 0;
    if (refundAmount > 0) {
      await prisma.refundLog.create({
        data: {
          bookingId,
          userId: booking.userId,
          amount: refundAmount,
          reason: reason || "Cancelled by " + cancelledBy,
          type: "PARTIAL",
          status: "INITIATED",
          initiatedBy: cancelledBy,
        },
      });
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          refundStatus: "REFUND_INITIATED",
          refundAmount,
          refundInitiatedAt: new Date(),
        },
      });
      refundProcessed = true;
    }
  }

  const updatedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: "CANCELLED",
      cancelledBy,
      cancelReason: reason,
      cancelledAt: new Date(),
    },
  });

  return { booking: updatedBooking, refundProcessed };
}

export async function processTimeoutBookings() {
  const timeouts = await prisma.bookingTimeout.findMany({
    where: {
      isProcessed: false,
      timeoutAt: { lte: new Date() },
    },
    include: { booking: true },
  });

  for (const timeout of timeouts) {
    try {
      await cancelBooking(timeout.bookingId, "USER", "Booking timeout");
      await prisma.bookingTimeout.update({
        where: { id: timeout.id },
        data: { isProcessed: true },
      });
    } catch {
      continue;
    }
  }

  return timeouts.length;
}
