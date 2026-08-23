import * as crypto from "crypto";
import { Response } from "express";
import { prisma } from "../config/database";
import { sendSuccess, sendError } from "../utils/response";
import { AuthedRequest } from "../middleware/authTypes";
import * as partnerMatching from "../services/partnerMatchingEngine";

export async function applyAsPartner(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { providesWalking, providesCarry, bankAccountName, bankAccountNumber, bankIfsc, upiId } = req.body;

    const partner = await prisma.partner.upsert({
      where: { userId },
      create: {
        userId,
        status: "APPLIED",
        providesWalking,
        providesCarry,
        bankAccountName,
        bankAccountNumber,
        bankIfsc,
        upiId,
      },
      update: {
        status: "APPLIED",
        providesWalking,
        providesCarry,
        bankAccountName,
        bankAccountNumber,
        bankIfsc,
        upiId,
      },
    });

    await prisma.roleApplication.upsert({
      where: { userId_role: { userId, role: "PARTNER" } },
      create: { userId, role: "PARTNER", status: "PENDING" },
      update: { status: "PENDING" },
    });

    sendSuccess(res, partner, "Partner application submitted.", 201);
  } catch (err) {
    sendError(res, "Failed to submit partner application.", 500, "INTERNAL_ERROR");
  }
}

export async function getPartnerStatus(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const partner = await prisma.partner.findUnique({ where: { userId: req.user!.userId } });

    if (!partner) {
      sendSuccess(res, { status: "NONE" });
      return;
    }

    sendSuccess(res, {
      status: partner.status,
      providesWalking: partner.providesWalking,
      providesCarry: partner.providesCarry,
      isAvailable: partner.isAvailable,
      rating: partner.rating,
      averageRating: partner.averageRating,
      totalJobs: partner.totalJobs,
      completedJobs: partner.completedJobs,
      cancelledJobs: partner.cancelledJobs,
      totalEarnings: partner.totalEarnings,
      bankAccountName: partner.bankAccountName,
      bankAccountNumber: partner.bankAccountNumber,
      bankIfsc: partner.bankIfsc,
      upiId: partner.upiId,
      latitude: partner.latitude,
      longitude: partner.longitude,
      createdAt: partner.createdAt,
    });
  } catch (err) {
    sendError(res, "Failed to retrieve partner status.", 500, "INTERNAL_ERROR");
  }
}

export async function getNearbyBookings(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const partner = await prisma.partner.findUnique({ where: { userId: req.user!.userId } });
    if (!partner || partner.status !== "APPROVED") {
      sendError(res, "Partner not approved.", 403, "PARTNER_NOT_APPROVED");
      return;
    }

    const where: any = {
      status: { in: ["PARTNER_SEARCHING", "PAYMENT_SUCCESSFUL"] },
    };

    if (partner.providesWalking && !partner.providesCarry) {
      where.serviceType = "WALKING";
    } else if (!partner.providesWalking && partner.providesCarry) {
      where.serviceType = "CARRY_BUDDY";
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true, city: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    sendSuccess(res, bookings, "Nearby bookings retrieved.");
  } catch (err) {
    sendError(res, "Failed to retrieve nearby bookings.", 500, "INTERNAL_ERROR");
  }
}

export async function acceptBooking(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const partner = await prisma.partner.findUnique({ where: { userId: req.user!.userId } });

    if (!partner || partner.status !== "APPROVED") {
      sendError(res, "Partner not approved.", 403, "PARTNER_NOT_APPROVED");
      return;
    }

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      sendError(res, "Booking not found.", 404, "BOOKING_NOT_FOUND");
      return;
    }

    if (booking.status !== "PARTNER_SEARCHING") {
      sendError(res, "Booking is not available for acceptance.", 400, "INVALID_STATUS");
      return;
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        partnerId: partner.id,
        status: "PARTNER_ACCEPTED",
      },
    });

    sendSuccess(res, updated, "Booking accepted.");
  } catch (err) {
    sendError(res, "Failed to accept booking.", 500, "INTERNAL_ERROR");
  }
}

export async function rejectBooking(req: AuthedRequest, res: Response): Promise<void> {
  try {
    sendSuccess(res, undefined, "Booking rejected.");
  } catch (err) {
    sendError(res, "Failed to reject booking.", 500, "INTERNAL_ERROR");
  }
}

export async function generateOTP(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const partner = await prisma.partner.findUnique({ where: { userId: req.user!.userId } });

    if (!partner) {
      sendError(res, "Partner not found.", 404, "PARTNER_NOT_FOUND");
      return;
    }

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      sendError(res, "Booking not found.", 404, "BOOKING_NOT_FOUND");
      return;
    }

    if (booking.partnerId !== partner.id) {
      sendError(res, "Unauthorized.", 403, "FORBIDDEN");
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    await prisma.booking.update({
      where: { id },
      data: {
        otp: otpHash,
        otpGeneratedAt: new Date(),
        status: "OTP_GENERATED",
      },
    });

    sendSuccess(res, { otp }, "OTP generated.");
  } catch (err) {
    sendError(res, "Failed to generate OTP.", 500, "INTERNAL_ERROR");
  }
}

export async function verifyOTP(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { otp: submittedOtp } = req.body;
    const partner = await prisma.partner.findUnique({ where: { userId: req.user!.userId } });

    if (!partner) {
      sendError(res, "Partner not found.", 404, "PARTNER_NOT_FOUND");
      return;
    }

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      sendError(res, "Booking not found.", 404, "BOOKING_NOT_FOUND");
      return;
    }

    if (booking.partnerId !== partner.id) {
      sendError(res, "Unauthorized.", 403, "FORBIDDEN");
      return;
    }

    const submittedHash = crypto.createHash("sha256").update(submittedOtp).digest("hex");
    if (booking.otp !== submittedHash) {
      sendError(res, "Invalid OTP.", 400, "INVALID_OTP");
      return;
    }

    await prisma.booking.update({
      where: { id },
      data: {
        otpVerifiedAt: new Date(),
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    });

    sendSuccess(res, undefined, "OTP verified.");
  } catch (err) {
    sendError(res, "Failed to verify OTP.", 500, "INTERNAL_ERROR");
  }
}

export async function completeBooking(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const partner = await prisma.partner.findUnique({ where: { userId: req.user!.userId } });

    if (!partner) {
      sendError(res, "Partner not found.", 404, "PARTNER_NOT_FOUND");
      return;
    }

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      sendError(res, "Booking not found.", 404, "BOOKING_NOT_FOUND");
      return;
    }

    if (booking.partnerId !== partner.id) {
      sendError(res, "Unauthorized.", 403, "FORBIDDEN");
      return;
    }

    if (booking.status !== "IN_PROGRESS") {
      sendError(res, "Booking is not in progress.", 400, "INVALID_STATUS");
      return;
    }

    const now = new Date();
    const partnerEarning = booking.partnerEarning ?? 0;

    const result = await prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id },
        data: {
          status: "COMPLETED",
          completedAt: now,
        },
      });

      const wallet = await tx.wallet.upsert({
        where: { userId: partner.userId },
        create: { userId: partner.userId, balance: partnerEarning },
        update: { balance: { increment: partnerEarning } },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          userId: partner.userId,
          bookingId: id,
          type: "PARTNER_EARNING",
          status: "COMPLETED",
          amount: partnerEarning,
          description: `Earnings for booking ${id}`,
        },
      });

      const updatedPartner = await tx.partner.update({
        where: { id: partner.id },
        data: {
          totalJobs: { increment: 1 },
          totalEarnings: { increment: partnerEarning },
          completedJobs: { increment: 1 },
        },
      });

      await tx.partnerLevel.upsert({
        where: { userId: partner.userId },
        create: { userId: partner.userId, level: "BRONZE" },
        update: {},
      });

      const earnings = await tx.partnerEarnings.upsert({
        where: { userId: partner.userId },
        create: {
          userId: partner.userId,
          lifetimeEarnings: partnerEarning,
          todayEarnings: partnerEarning,
          weeklyEarnings: partnerEarning,
          monthlyEarnings: partnerEarning,
          completedJobs: 1,
          lastEarningAt: now,
        },
        update: {
          lifetimeEarnings: { increment: partnerEarning },
          todayEarnings: { increment: partnerEarning },
          weeklyEarnings: { increment: partnerEarning },
          monthlyEarnings: { increment: partnerEarning },
          completedJobs: { increment: 1 },
          lastEarningAt: now,
        },
      });

      await tx.earningDetail.create({
        data: {
          earningsId: earnings.id,
          bookingId: id,
          amount: partnerEarning,
          type: "JOB_COMPLETION",
          platformFee: booking.platformFee ?? 0,
          commissionDeduction: 0,
          netAmount: partnerEarning,
          status: "COMPLETED",
        },
      });

      return updatedBooking;
    });

    sendSuccess(res, result, "Booking completed.");
  } catch (err) {
    sendError(res, "Failed to complete booking.", 500, "INTERNAL_ERROR");
  }
}

export async function getPartnerBookings(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const partner = await prisma.partner.findUnique({ where: { userId: req.user!.userId } });
    if (!partner) {
      sendError(res, "Partner not found.", 404, "PARTNER_NOT_FOUND");
      return;
    }

    const status = req.query.status as string | undefined;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const where: any = { partnerId: partner.id };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    sendSuccess(res, { items, total, page, limit });
  } catch (err) {
    sendError(res, "Failed to retrieve partner bookings.", 500, "INTERNAL_ERROR");
  }
}

export async function getPerformance(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const partner = await prisma.partner.findUnique({ where: { userId: req.user!.userId } });
    if (!partner) {
      sendError(res, "Partner not found.", 404, "PARTNER_NOT_FOUND");
      return;
    }

    const earnings = await prisma.partnerEarnings.findUnique({ where: { userId: partner.userId } });
    const partnerLevel = await prisma.partnerLevel.findUnique({ where: { userId: partner.userId } });

    // Date boundaries
    const now = new Date();
    const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);

    // Fetch all completed bookings for this partner
    const allCompleted = await prisma.booking.findMany({
      where: { partnerId: partner.id, status: "COMPLETED" },
      select: { id: true, partnerEarning: true, completedAt: true },
      orderBy: { completedAt: "asc" },
    });

    const allCancelled = await prisma.booking.count({ where: { partnerId: partner.id, status: "CANCELLED" } });

    // Today / week / month earnings
    const todayEarnings = allCompleted
      .filter(b => b.completedAt && b.completedAt >= startOfToday)
      .reduce((s, b) => s + (b.partnerEarning ?? 0), 0);
    const weeklyEarnings = allCompleted
      .filter(b => b.completedAt && b.completedAt >= startOfWeek)
      .reduce((s, b) => s + (b.partnerEarning ?? 0), 0);
    const monthlyEarnings = allCompleted
      .filter(b => b.completedAt && b.completedAt >= startOfMonth)
      .reduce((s, b) => s + (b.partnerEarning ?? 0), 0);

    // Today / week jobs
    const todayJobs = allCompleted.filter(b => b.completedAt && b.completedAt >= startOfToday).length;
    const weeklyJobs = allCompleted.filter(b => b.completedAt && b.completedAt >= startOfWeek).length;

    // Build last-7-months bar chart data
    const monthlyJobCounts: number[] = [];
    const monthlyEarningsList: number[] = [];
    const monthLabels: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      const y = d.getFullYear(); const m = d.getMonth();
      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0, 23, 59, 59);
      const jobsInMonth = allCompleted.filter(b => b.completedAt && b.completedAt >= start && b.completedAt <= end);
      monthlyJobCounts.push(jobsInMonth.length);
      monthlyEarningsList.push(jobsInMonth.reduce((s, b) => s + (b.partnerEarning ?? 0), 0));
      monthLabels.push(d.toLocaleString("default", { month: "short" }));
    }

    // Completion rate
    const totalAttempted = partner.completedJobs + allCancelled;
    const completionRate = totalAttempted > 0 ? Math.round((partner.completedJobs / totalAttempted) * 100) : 100;

    // Recent ratings for this partner
    const recentRatings = await prisma.rating.findMany({
      where: { ratedId: partner.userId, targetType: "PARTNER" },
      include: { rater: { select: { fullName: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Determine level label
    const levelMap: Record<string, string> = {
      BRONZE: "Bronze",
      SILVER: "Silver",
      GOLD: "Gold",
      PLATINUM: "Platinum",
      DIAMOND: "Diamond",
    };
    const level = levelMap[partnerLevel?.level ?? "BRONZE"] ?? "Bronze";
    const levelPoints = partnerLevel?.points ?? 0;

    sendSuccess(res, {
      // Earnings
      todayEarnings,
      weeklyEarnings,
      monthlyEarnings,
      lifetimeEarnings: partner.totalEarnings,
      pendingEarnings: earnings?.pendingEarnings ?? 0,
      withdrawableBalance: earnings?.withdrawableBalance ?? 0,
      // Jobs
      todayJobs,
      weeklyJobs,
      totalJobs: partner.totalJobs,
      completedJobs: partner.completedJobs,
      cancelledJobs: allCancelled,
      completionRate,
      // Chart
      monthlyJobs: monthlyJobCounts,
      monthlyEarningsChart: monthlyEarningsList,
      monthLabels,
      // Rating & Level
      averageRating: partner.averageRating,
      level,
      levelPoints,
      recentRatings: recentRatings.map(r => ({
        id: r.id,
        userName: r.rater.fullName,
        userAvatar: r.rater.avatarUrl,
        rating: r.score,
        comment: r.comment ?? "",
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    sendError(res, "Failed to retrieve performance stats.", 500, "INTERNAL_ERROR");
  }
}

export async function toggleAvailability(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const partner = await prisma.partner.findUnique({ where: { userId: req.user!.userId } });
    if (!partner) {
      sendError(res, "Partner not found.", 404, "PARTNER_NOT_FOUND");
      return;
    }

    const { isAvailable } = req.body;
    const updated = await prisma.partner.update({
      where: { id: partner.id },
      data: { isAvailable },
    });

    sendSuccess(res, updated, "Availability updated.");
  } catch (err) {
    sendError(res, "Failed to update availability.", 500, "INTERNAL_ERROR");
  }
}

export async function updateLocation(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const partner = await prisma.partner.findUnique({ where: { userId: req.user!.userId } });
    if (!partner) {
      sendError(res, "Partner not found.", 404, "PARTNER_NOT_FOUND");
      return;
    }

    const { latitude, longitude } = req.body;

    const updated = await prisma.partner.update({
      where: { id: partner.id },
      data: { latitude, longitude },
    });

    await (async () => {
      const existing = await prisma.partnerLocation.findFirst({ where: { partnerId: partner.id } });
      if (existing) {
        await prisma.partnerLocation.update({
          where: { id: existing.id },
          data: { latitude, longitude, updatedAt: new Date() },
        });
      } else {
        await prisma.partnerLocation.create({
          data: { partnerId: partner.id, latitude, longitude },
        });
      }
    })();

    sendSuccess(res, updated, "Location updated.");
  } catch (err) {
    sendError(res, "Failed to update location.", 500, "INTERNAL_ERROR");
  }
}

export async function updateServices(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const partner = await prisma.partner.findUnique({ where: { userId: req.user!.userId } });
    if (!partner) {
      sendError(res, "Partner not found.", 404, "PARTNER_NOT_FOUND");
      return;
    }

    const { providesWalking, providesCarry } = req.body;
    const updated = await prisma.partner.update({
      where: { id: partner.id },
      data: { providesWalking, providesCarry },
    });

    sendSuccess(res, updated, "Services updated.");
  } catch (err) {
    sendError(res, "Failed to update services.", 500, "INTERNAL_ERROR");
  }
}
