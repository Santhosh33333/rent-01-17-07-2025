import { Request, Response } from "express";
import { prisma } from "../config/database";
import { sendSuccess, sendError } from "../utils/response";
import { AuthedRequest } from "../middleware/authTypes";

// ============================================================================
// SECTION 1: DASHBOARD & ANALYTICS
// ============================================================================

export async function getDashboardStats(_req: AuthedRequest, res: Response): Promise<void> {
  try {
    const [
      totalUsers,
      activeUsers,
      verifiedUsers,
      totalCommunities,
      totalEvents,
      openWalkRequests,
      totalWalletBalance,
      pendingWithdrawals,
      pendingKyc,
      totalPartners,
      activePartners,
      pendingPartnerApprovals,
      totalBookings,
      activeBookings,
      completedBookings,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { emailVerified: true } }),
      prisma.community.count(),
      prisma.event.count(),
      prisma.walkingRequest.count({ where: { status: "OPEN" } }),
      prisma.wallet.aggregate({ _sum: { balance: true } }),
      prisma.withdrawalRequest.count({ where: { status: "PENDING" } }),
      prisma.verification.count({ where: { status: "PENDING" } }),
      prisma.partner.count(),
      prisma.partner.count({ where: { status: "APPROVED" } }),
      prisma.partner.count({ where: { status: "PENDING" } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: { in: ["PARTNER_SEARCHING", "PARTNER_ACCEPTED", "OTP_GENERATED", "IN_PROGRESS"] } } }),
      prisma.booking.count({ where: { status: "COMPLETED" } }),
    ]);
    sendSuccess(res, {
      totalUsers,
      activeUsers,
      verifiedUsers,
      totalCommunities,
      totalEvents,
      openWalkRequests,
      totalWalletBalance: totalWalletBalance._sum.balance ?? 0,
      pendingWithdrawals,
      pendingKyc,
      totalPartners,
      activePartners,
      pendingPartnerApprovals,
      totalBookings,
      activeBookings,
      completedBookings,
    }, "Dashboard stats retrieved.");
  } catch (err) {
    sendError(res, "Failed to retrieve dashboard stats.", 500, "INTERNAL_ERROR");
  }
}

export async function getUsers(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const where: any = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.search) {
      where.OR = [
        { email: { contains: req.query.search, mode: "insensitive" } },
        { fullName: { contains: req.query.search, mode: "insensitive" } },
        { phone: { contains: req.query.search } },
      ];
    }
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: { id: true, email: true, phone: true, fullName: true, status: true, emailVerified: true, mobileVerified: true, createdAt: true },
      }),
      prisma.user.count({ where }),
    ]);
    sendSuccess(res, { items, page, limit, total });
  } catch (err) {
    sendError(res, "Failed to retrieve users.", 500, "INTERNAL_ERROR");
  }
}

export async function getUserById(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, phone: true, fullName: true, dateOfBirth: true, gender: true,
        role: true, activeRole: true, status: true, avatarUrl: true, bio: true, city: true, country: true,
        emailVerified: true, mobileVerified: true, trustScore: true, createdAt: true, updatedAt: true,
        verification: {
          select: {
            status: true, selfieUrl: true, govIdUrl: true, govIdType: true, addressProofUrl: true,
            rejectionReason: true, reviewedAt: true, createdAt: true,
          },
        },
        partner: {
          select: { id: true, status: true, providesWalking: true, providesCarry: true, bankAccountName: true, bankAccountNumber: true, bankIfsc: true, upiId: true, totalJobs: true, totalEarnings: true, completedJobs: true, createdAt: true },
        },
        wallet: {
          select: { balance: true },
        },
      },
    });
    if (!user) {
      sendError(res, "User not found.", 404, "USER_NOT_FOUND");
      return;
    }
    sendSuccess(res, user, "User retrieved.");
  } catch (err) {
    sendError(res, "Failed to retrieve user.", 500, "INTERNAL_ERROR");
  }
}

export async function updateUserStatus(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = await prisma.user.update({ where: { id }, data: { status } });
    await prisma.auditLog.create({
      data: { actorId: req.user!.userId, actorType: "ADMIN", action: "UPDATE_USER_STATUS", entityType: "User", entityId: id, metadata: JSON.stringify({ status }) },
    });
    sendSuccess(res, { id: user.id, status: user.status }, "User status updated.");
  } catch (err) {
    sendError(res, "Failed to update user status.", 500, "INTERNAL_ERROR");
  }
}

export async function getKycQueue(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const status = (req.query.status as string) || "PENDING";
    const where = { status: status as any };
    const [items, total] = await Promise.all([
      prisma.verification.findMany({
        where,
        orderBy: { updatedAt: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, userId: true, status: true,
          selfieUrl: true, govIdUrl: true, govIdType: true, addressProofUrl: true,
          rejectionReason: true, reviewedBy: true, reviewedAt: true,
          emergencyContactName: true, emergencyContactPhone: true, emergencyContactRelation: true,
          createdAt: true, updatedAt: true,
          user: { select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true } },
        },
      }),
      prisma.verification.count({ where }),
    ]);
    sendSuccess(res, { items, page, limit, total });
  } catch (err) {
    sendError(res, "Failed to retrieve KYC queue.", 500, "INTERNAL_ERROR");
  }
}

async function reviewKyc(req: AuthedRequest, id: string, approve: boolean, reason?: string): Promise<void> {
  const verification = await prisma.verification.findUnique({ where: { id } });
  if (!verification) throw new Error("NOT_FOUND");
  await prisma.$transaction([
    prisma.verification.update({
      where: { id },
      data: { status: approve ? "VERIFIED" : "REJECTED", reviewedBy: req.user!.userId, reviewedAt: new Date(), rejectionReason: approve ? null : reason },
    }),
    prisma.user.update({ where: { id: verification.userId }, data: { emailVerified: verification.selfieUrl && verification.govIdUrl ? true : undefined } }),
    prisma.verificationHistory.create({ data: { verificationId: id, status: approve ? "VERIFIED" : "REJECTED", note: reason, changedBy: req.user!.userId } }),
    prisma.auditLog.create({ data: { actorId: req.user!.userId, actorType: "ADMIN", action: approve ? "KYC_APPROVE" : "KYC_REJECT", entityType: "Verification", entityId: id, metadata: reason ? JSON.stringify({ rejectionReason: reason }) : null } }),
  ]);
}

export async function approveKyc(req: AuthedRequest, res: Response): Promise<void> {
  try {
    await reviewKyc(req, req.params.id, true);
    sendSuccess(res, undefined, "KYC approved.");
  } catch (err) {
    sendError(res, "Failed to approve KYC.", 500, "INTERNAL_ERROR");
  }
}

export async function rejectKyc(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { reason } = req.body;
    await reviewKyc(req, req.params.id, false, reason);
    sendSuccess(res, undefined, "KYC rejected.");
  } catch (err) {
    sendError(res, "Failed to reject KYC.", 500, "INTERNAL_ERROR");
  }
}

export async function getWalkingPartners(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const where: any = {};
    if (req.query.status) where.status = req.query.status;
    const [items, total] = await Promise.all([
      prisma.partner.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit, include: { user: { select: { id: true, fullName: true, email: true, phone: true } } } }),
      prisma.partner.count({ where }),
    ]);
    sendSuccess(res, { items, page, limit, total });
  } catch (err) {
    sendError(res, "Failed to retrieve walking partners.", 500, "INTERNAL_ERROR");
  }
}

export async function approveWalkingPartner(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const partner = await prisma.partner.update({ where: { id }, data: { status: "APPROVED" } });
    await prisma.auditLog.create({ data: { actorId: req.user!.userId, actorType: "ADMIN", action: "PARTNER_APPROVE", entityType: "Partner", entityId: id } });
    sendSuccess(res, partner, "Walking partner approved.");
  } catch (err) {
    sendError(res, "Failed to approve walking partner.", 500, "INTERNAL_ERROR");
  }
}

export async function rejectWalkingPartner(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const partner = await prisma.partner.update({ where: { id }, data: { status: "REJECTED" } });
    await prisma.auditLog.create({ data: { actorId: req.user!.userId, actorType: "ADMIN", action: "PARTNER_REJECT", entityType: "Partner", entityId: id } });
    sendSuccess(res, partner, "Walking partner rejected.");
  } catch (err) {
    sendError(res, "Failed to reject walking partner.", 500, "INTERNAL_ERROR");
  }
}

export async function getBookings(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const where: any = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.serviceType) where.serviceType = req.query.serviceType;
    if (req.query.search) {
      where.OR = [
        { startLocation: { contains: req.query.search, mode: "insensitive" } },
        { endLocation: { contains: req.query.search, mode: "insensitive" } },
      ];
    }
    const [items, total] = await Promise.all([
      prisma.booking.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit,
        include: { user: { select: { id: true, fullName: true, email: true } }, partner: { select: { id: true, userId: true, user: { select: { fullName: true, email: true } } } } },
      }),
      prisma.booking.count({ where }),
    ]);
    sendSuccess(res, { items, page, limit, total });
  } catch (err) {
    sendError(res, "Failed to retrieve bookings.", 500, "INTERNAL_ERROR");
  }
}

export async function getBookingDetail(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({ where: { id }, include: {
      user: { select: { id: true, fullName: true, email: true, phone: true } },
      partner: { select: { id: true, userId: true, user: { select: { fullName: true, email: true } } } },
    } });
    if (!booking) { sendError(res, "Booking not found.", 404, "NOT_FOUND"); return; }

    const [ratings, transactions] = await Promise.all([
      prisma.rating.findMany({ where: { bookingId: id } }),
      prisma.transaction.findMany({ where: { bookingId: id } }),
    ]);

    sendSuccess(res, { ...booking, ratings, transactions });
  } catch (err) {
    sendError(res, "Failed to retrieve booking.", 500, "INTERNAL_ERROR");
  }
}

export async function getWithdrawalRequests(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const where: any = {};
    if (req.query.status) where.status = req.query.status;
    const [items, total] = await Promise.all([
      prisma.withdrawalRequest.findMany({ where, orderBy: { createdAt: "asc" }, skip: (page - 1) * limit, take: limit, include: { user: { select: { id: true, fullName: true, email: true } } } }),
      prisma.withdrawalRequest.count({ where }),
    ]);
    sendSuccess(res, { items, page, limit, total });
  } catch (err) {
    sendError(res, "Failed to retrieve withdrawal requests.", 500, "INTERNAL_ERROR");
  }
}

export async function approveWithdrawal(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const request = await prisma.withdrawalRequest.findUnique({ where: { id } });
    if (!request) {
      sendError(res, "Withdrawal request not found.", 404, "WITHDRAWAL_NOT_FOUND");
      return;
    }
    if (request.status !== "PENDING") {
      sendError(res, "Withdrawal already processed.", 400, "INVALID_STATUS");
      return;
    }
    await prisma.$transaction([
      prisma.withdrawalRequest.update({ where: { id }, data: { status: "APPROVED", reviewedBy: req.user!.userId, reviewedAt: new Date() } }),
      prisma.wallet.update({ where: { id: request.walletId }, data: { balance: { decrement: request.amount } } }),
      prisma.transaction.create({ data: { walletId: request.walletId, userId: request.userId, type: "DEBIT", amount: request.amount, description: "Withdrawal approved", referenceId: id } }),
      prisma.auditLog.create({ data: { actorId: req.user!.userId, actorType: "ADMIN", action: "WITHDRAWAL_APPROVE", entityType: "WithdrawalRequest", entityId: id } }),
    ]);
    sendSuccess(res, undefined, "Withdrawal approved.");
  } catch (err) {
    sendError(res, "Failed to approve withdrawal.", 500, "INTERNAL_ERROR");
  }
}

export async function rejectWithdrawal(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const request = await prisma.withdrawalRequest.findUnique({ where: { id } });
    if (!request) {
      sendError(res, "Withdrawal request not found.", 404, "WITHDRAWAL_NOT_FOUND");
      return;
    }
    await prisma.withdrawalRequest.update({ where: { id }, data: { status: "REJECTED", reviewedBy: req.user!.userId, reviewedAt: new Date(), rejectionReason: reason } });
    await prisma.auditLog.create({ data: { actorId: req.user!.userId, actorType: "ADMIN", action: "WITHDRAWAL_REJECT", entityType: "WithdrawalRequest", entityId: id } });
    sendSuccess(res, undefined, "Withdrawal rejected.");
  } catch (err) {
    sendError(res, "Failed to reject withdrawal.", 500, "INTERNAL_ERROR");
  }
}

export async function getReports(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const where: any = {};
    if (req.query.status) where.status = req.query.status;
    const [items, total] = await Promise.all([
      prisma.report.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit, include: { reporter: { select: { id: true, fullName: true } }, target: { select: { id: true, fullName: true } } } }),
      prisma.report.count({ where }),
    ]);
    sendSuccess(res, { items, page, limit, total });
  } catch (err) {
    sendError(res, "Failed to retrieve reports.", 500, "INTERNAL_ERROR");
  }
}

export async function resolveReport(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const report = await prisma.report.update({ where: { id }, data: { status: "RESOLVED", resolvedBy: req.user!.userId, resolvedAt: new Date() } });
    await prisma.auditLog.create({ data: { actorId: req.user!.userId, actorType: "ADMIN", action: "REPORT_RESOLVE", entityType: "Report", entityId: id, metadata: note ? JSON.stringify({ note }) : null } });
    sendSuccess(res, report, "Report resolved.");
  } catch (err) {
    sendError(res, "Failed to resolve report.", 500, "INTERNAL_ERROR");
  }
}

export async function getAuditLogs(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      prisma.auditLog.count(),
    ]);
    sendSuccess(res, { items, page, limit, total });
  } catch (err) {
    sendError(res, "Failed to retrieve audit logs.", 500, "INTERNAL_ERROR");
  }
}

export async function sendNotification(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { userId, title, body, data } = req.body;
    const notification = await prisma.notification.create({
      data: { userId, title, body, data: data ? JSON.stringify(data) : null },
    });
    sendSuccess(res, notification, "Notification sent.", 201);
  } catch (err) {
    sendError(res, "Failed to send notification.", 500, "INTERNAL_ERROR");
  }
}

// ============================================================================
// SECTION 2: PRICING CONFIG MANAGEMENT
// ============================================================================

export async function getPricingConfigs(_req: AuthedRequest, res: Response): Promise<void> {
  try {
    const configs = await prisma.pricingConfig.findMany({ orderBy: { category: "asc" } });
    sendSuccess(res, configs, "Pricing configs retrieved.");
  } catch (err) {
    sendError(res, "Failed to retrieve pricing configs.", 500, "INTERNAL_ERROR");
  }
}

export async function updatePricingConfig(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { value, description, isActive } = req.body;
    const data: any = {};
    if (value !== undefined) data.value = String(value);
    if (description !== undefined) data.description = description;
    if (isActive !== undefined) data.isActive = isActive;
    const config = await prisma.pricingConfig.update({ where: { id }, data });
    await prisma.auditLog.create({
      data: { actorId: req.user!.userId, actorType: "ADMIN", action: "PRICING_UPDATE", entityType: "PricingConfig", entityId: id, metadata: JSON.stringify(data) },
    });
    sendSuccess(res, config, "Pricing config updated.");
  } catch (err) {
    sendError(res, "Failed to update pricing config.", 500, "INTERNAL_ERROR");
  }
}

export async function createPricingConfig(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { key, value, description, category } = req.body;
    const existing = await prisma.pricingConfig.findUnique({ where: { key } });
    if (existing) {
      sendError(res, "Config key already exists.", 400, "CONFIG_EXISTS");
      return;
    }
    const config = await prisma.pricingConfig.create({
      data: { key, value: String(value), description, category: category || "GENERAL" },
    });
    await prisma.auditLog.create({
      data: { actorId: req.user!.userId, actorType: "ADMIN", action: "PRICING_CREATE", entityType: "PricingConfig", entityId: config.id, metadata: JSON.stringify({ key, value }) },
    });
    sendSuccess(res, config, "Pricing config created.", 201);
  } catch (err) {
    sendError(res, "Failed to create pricing config.", 500, "INTERNAL_ERROR");
  }
}

export async function deletePricingConfig(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.pricingConfig.delete({ where: { id } });
    await prisma.auditLog.create({
      data: { actorId: req.user!.userId, actorType: "ADMIN", action: "PRICING_DELETE", entityType: "PricingConfig", entityId: id },
    });
    sendSuccess(res, undefined, "Pricing config deleted.");
  } catch (err) {
    sendError(res, "Failed to delete pricing config.", 500, "INTERNAL_ERROR");
  }
}

// ============================================================================
// SECTION 3: COUPON MANAGEMENT
// ============================================================================

export async function getCoupons(_req: AuthedRequest, res: Response): Promise<void> {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    sendSuccess(res, coupons, "Coupons retrieved.");
  } catch (err) {
    sendError(res, "Failed to retrieve coupons.", 500, "INTERNAL_ERROR");
  }
}

export async function createCoupon(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { code, description, discountType, discountValue, minAmount, maxDiscount, validFrom, validTo, usageLimit } = req.body;
    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (existing) {
      sendError(res, "Coupon code already exists.", 400, "COUPON_EXISTS");
      return;
    }
    const coupon = await prisma.coupon.create({
      data: { code, description, discountType, discountValue, minAmount: minAmount || 0, maxDiscount, validFrom: new Date(validFrom), validTo: new Date(validTo), usageLimit },
    });
    await prisma.auditLog.create({
      data: { actorId: req.user!.userId, actorType: "ADMIN", action: "COUPON_CREATE", entityType: "Coupon", entityId: coupon.id, metadata: JSON.stringify({ code }) },
    });
    sendSuccess(res, coupon, "Coupon created.", 201);
  } catch (err) {
    sendError(res, "Failed to create coupon.", 500, "INTERNAL_ERROR");
  }
}

export async function updateCoupon(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { description, discountType, discountValue, minAmount, maxDiscount, validFrom, validTo, usageLimit, isActive } = req.body;
    const data: any = {};
    if (description !== undefined) data.description = description;
    if (discountType !== undefined) data.discountType = discountType;
    if (discountValue !== undefined) data.discountValue = discountValue;
    if (minAmount !== undefined) data.minAmount = minAmount;
    if (maxDiscount !== undefined) data.maxDiscount = maxDiscount;
    if (validFrom !== undefined) data.validFrom = new Date(validFrom);
    if (validTo !== undefined) data.validTo = new Date(validTo);
    if (usageLimit !== undefined) data.usageLimit = usageLimit;
    if (isActive !== undefined) data.isActive = isActive;
    const coupon = await prisma.coupon.update({ where: { id }, data });
    sendSuccess(res, coupon, "Coupon updated.");
  } catch (err) {
    sendError(res, "Failed to update coupon.", 500, "INTERNAL_ERROR");
  }
}

export async function deleteCoupon(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.coupon.delete({ where: { id } });
    sendSuccess(res, undefined, "Coupon deleted.");
  } catch (err) {
    sendError(res, "Failed to delete coupon.", 500, "INTERNAL_ERROR");
  }
}

// ============================================================================
// SECTION 4: SERVICE AREA MANAGEMENT
// ============================================================================

export async function getServiceAreas(_req: AuthedRequest, res: Response): Promise<void> {
  try {
    const areas = await prisma.serviceArea.findMany({ orderBy: { name: "asc" } });
    sendSuccess(res, areas, "Service areas retrieved.");
  } catch (err) {
    sendError(res, "Failed to retrieve service areas.", 500, "INTERNAL_ERROR");
  }
}

export async function createServiceArea(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { name, city, state, baseFeeMultiplier } = req.body;
    const area = await prisma.serviceArea.create({
      data: { name, city, state, baseFeeMultiplier: baseFeeMultiplier || 1.0 },
    });
    sendSuccess(res, area, "Service area created.", 201);
  } catch (err) {
    sendError(res, "Failed to create service area.", 500, "INTERNAL_ERROR");
  }
}

export async function updateServiceArea(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, city, state, isActive, baseFeeMultiplier } = req.body;
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (city !== undefined) data.city = city;
    if (state !== undefined) data.state = state;
    if (isActive !== undefined) data.isActive = isActive;
    if (baseFeeMultiplier !== undefined) data.baseFeeMultiplier = baseFeeMultiplier;
    const area = await prisma.serviceArea.update({ where: { id }, data });
    sendSuccess(res, area, "Service area updated.");
  } catch (err) {
    sendError(res, "Failed to update service area.", 500, "INTERNAL_ERROR");
  }
}

export async function deleteServiceArea(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.serviceArea.delete({ where: { id } });
    sendSuccess(res, undefined, "Service area deleted.");
  } catch (err) {
    sendError(res, "Failed to delete service area.", 500, "INTERNAL_ERROR");
  }
}

// ============================================================================
// SECTION 5: PROMOTIONAL CAMPAIGNS
// ============================================================================

export async function getCampaigns(_req: AuthedRequest, res: Response): Promise<void> {
  try {
    const campaigns = await prisma.promotionalCampaign.findMany({ orderBy: { createdAt: "desc" } });
    sendSuccess(res, campaigns, "Campaigns retrieved.");
  } catch (err) {
    sendError(res, "Failed to retrieve campaigns.", 500, "INTERNAL_ERROR");
  }
}

export async function createCampaign(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { name, description, discountType, discountValue, minAmount, maxDiscount, startDate, endDate, budget, usageLimit } = req.body;
    const campaign = await prisma.promotionalCampaign.create({
      data: {
        name,
        description,
        discountType,
        discountValue,
        minAmount: minAmount || 0,
        maxDiscount,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        budget,
        usageLimit,
        createdBy: req.user!.userId,
      },
    });
    sendSuccess(res, campaign, "Campaign created.", 201);
  } catch (err) {
    sendError(res, "Failed to create campaign.", 500, "INTERNAL_ERROR");
  }
}

export async function updateCampaign(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, description, discountType, discountValue, minAmount, maxDiscount, startDate, endDate, budget, usageLimit, isActive } = req.body;
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (discountType !== undefined) data.discountType = discountType;
    if (discountValue !== undefined) data.discountValue = discountValue;
    if (minAmount !== undefined) data.minAmount = minAmount;
    if (maxDiscount !== undefined) data.maxDiscount = maxDiscount;
    if (startDate !== undefined) data.startDate = new Date(startDate);
    if (endDate !== undefined) data.endDate = new Date(endDate);
    if (budget !== undefined) data.budget = budget;
    if (usageLimit !== undefined) data.usageLimit = usageLimit;
    if (isActive !== undefined) data.isActive = isActive;
    const campaign = await prisma.promotionalCampaign.update({ where: { id }, data });
    sendSuccess(res, campaign, "Campaign updated.");
  } catch (err) {
    sendError(res, "Failed to update campaign.", 500, "INTERNAL_ERROR");
  }
}

export async function deleteCampaign(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.promotionalCampaign.delete({ where: { id } });
    sendSuccess(res, undefined, "Campaign deleted.");
  } catch (err) {
    sendError(res, "Failed to delete campaign.", 500, "INTERNAL_ERROR");
  }
}

// ============================================================================
// SECTION 6: REVENUE & ANALYTICS
// ============================================================================

export async function getRevenueAnalytics(_req: AuthedRequest, res: Response): Promise<void> {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayRevenue, weeklyRevenue, monthlyRevenue, totalRevenue, totalPlatformFees, totalPartnerEarnings, totalCompletedJobs] = await Promise.all([
      prisma.earningDetail.aggregate({ _sum: { netAmount: true }, where: { createdAt: { gte: startOfToday }, status: "COMPLETED" } }),
      prisma.earningDetail.aggregate({ _sum: { netAmount: true }, where: { createdAt: { gte: startOfWeek }, status: "COMPLETED" } }),
      prisma.earningDetail.aggregate({ _sum: { netAmount: true }, where: { createdAt: { gte: startOfMonth }, status: "COMPLETED" } }),
      prisma.earningDetail.aggregate({ _sum: { netAmount: true }, where: { status: "COMPLETED" } }),
      prisma.earningDetail.aggregate({ _sum: { platformFee: true }, where: { status: "COMPLETED" } }),
      prisma.partnerEarnings.aggregate({ _sum: { lifetimeEarnings: true } }),
      prisma.walkingRequest.count({ where: { status: "COMPLETED" } }),
    ]);

    sendSuccess(res, {
      todayRevenue: todayRevenue._sum.netAmount || 0,
      weeklyRevenue: weeklyRevenue._sum.netAmount || 0,
      monthlyRevenue: monthlyRevenue._sum.netAmount || 0,
      totalRevenue: totalRevenue._sum.netAmount || 0,
      totalPlatformFees: totalPlatformFees._sum.platformFee || 0,
      totalPartnerEarnings: totalPartnerEarnings._sum.lifetimeEarnings || 0,
      totalCompletedJobs,
    }, "Revenue analytics retrieved.");
  } catch (err) {
    sendError(res, "Failed to retrieve revenue analytics.", 500, "INTERNAL_ERROR");
  }
}

export async function getPartnerLevels(_req: AuthedRequest, res: Response): Promise<void> {
  try {
    const levels = await prisma.partnerLevel.findMany({
      orderBy: { points: "desc" },
      include: { user: { select: { id: true, fullName: true, email: true } } },
    });
    sendSuccess(res, levels, "Partner levels retrieved.");
  } catch (err) {
    sendError(res, "Failed to retrieve partner levels.", 500, "INTERNAL_ERROR");
  }
}
