import { Request, Response } from "express";
import { prisma } from "../config/database";
import { sendSuccess, sendError } from "../utils/response";
import { AuthedRequest } from "../middleware/authTypes";

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
      include: {
        verification: true,
        walkingPartner: true,
        wallet: true,
        trustScore: true,
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
    const where = { status: "PENDING" as const };
    const [items, total] = await Promise.all([
      prisma.verification.findMany({ where, orderBy: { updatedAt: "asc" }, skip: (page - 1) * limit, take: limit, include: { user: { select: { id: true, fullName: true, email: true } } } }),
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
    prisma.user.update({ where: { id: verification.userId }, data: { emailVerified: approve ? true : undefined } }),
    prisma.verificationHistory.create({ data: { verificationId: id, status: approve ? "VERIFIED" : "REJECTED", note: reason, changedBy: req.user!.userId } }),
    prisma.auditLog.create({ data: { actorId: req.user!.userId, actorType: "ADMIN", action: approve ? "KYC_APPROVE" : "KYC_REJECT", entityType: "Verification", entityId: id } }),
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
      prisma.walkingPartner.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit, include: { user: { select: { id: true, fullName: true, email: true } } } }),
      prisma.walkingPartner.count({ where }),
    ]);
    sendSuccess(res, { items, page, limit, total });
  } catch (err) {
    sendError(res, "Failed to retrieve walking partners.", 500, "INTERNAL_ERROR");
  }
}

export async function approveWalkingPartner(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const partner = await prisma.walkingPartner.update({ where: { id }, data: { status: "APPROVED", reviewedBy: req.user!.userId, reviewedAt: new Date() } });
    await prisma.auditLog.create({ data: { actorId: req.user!.userId, actorType: "ADMIN", action: "WP_APPROVE", entityType: "WalkingPartner", entityId: id } });
    sendSuccess(res, partner, "Walking partner approved.");
  } catch (err) {
    sendError(res, "Failed to approve walking partner.", 500, "INTERNAL_ERROR");
  }
}

export async function rejectWalkingPartner(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const partner = await prisma.walkingPartner.update({ where: { id }, data: { status: "REJECTED", reviewedBy: req.user!.userId, reviewedAt: new Date(), rejectionReason: reason } });
    await prisma.auditLog.create({ data: { actorId: req.user!.userId, actorType: "ADMIN", action: "WP_REJECT", entityType: "WalkingPartner", entityId: id } });
    sendSuccess(res, partner, "Walking partner rejected.");
  } catch (err) {
    sendError(res, "Failed to reject walking partner.", 500, "INTERNAL_ERROR");
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
