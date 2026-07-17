import { Response } from "express";
import { prisma } from "../config/database";
import { sendSuccess, sendError } from "../utils/response";
import { AuthedRequest } from "../middleware/authTypes";

async function upsertVerification(userId: string) {
  const existing = await prisma.verification.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.verification.create({ data: { userId, status: "UNVERIFIED" } });
}

export async function submitSelfie(req: AuthedRequest, res: Response): Promise<void> {
  try {
    if (!req.file) {
      sendError(res, "Selfie image is required.", 400, "NO_FILE");
      return;
    }
    const verification = await upsertVerification(req.user!.userId);
    await prisma.verification.update({
      where: { id: verification.id },
      data: { selfieUrl: `/uploads/${req.file.filename}`, status: "PENDING" },
    });
    sendSuccess(res, undefined, "Selfie submitted for review.");
  } catch (err) {
    sendError(res, "Failed to submit selfie.", 500, "INTERNAL_ERROR");
  }
}

export async function submitGovId(req: AuthedRequest, res: Response): Promise<void> {
  try {
    if (!req.file) {
      sendError(res, "Government ID image is required.", 400, "NO_FILE");
      return;
    }
    const { govIdType } = req.body;
    const verification = await upsertVerification(req.user!.userId);
    await prisma.verification.update({
      where: { id: verification.id },
      data: { govIdUrl: `/uploads/${req.file.filename}`, govIdType, status: "PENDING" },
    });
    sendSuccess(res, undefined, "Government ID submitted for review.");
  } catch (err) {
    sendError(res, "Failed to submit government ID.", 500, "INTERNAL_ERROR");
  }
}

export async function submitAddressProof(req: AuthedRequest, res: Response): Promise<void> {
  try {
    if (!req.file) {
      sendError(res, "Address proof image is required.", 400, "NO_FILE");
      return;
    }
    const verification = await upsertVerification(req.user!.userId);
    await prisma.verification.update({
      where: { id: verification.id },
      data: { addressProofUrl: `/uploads/${req.file.filename}`, status: "PENDING" },
    });
    sendSuccess(res, undefined, "Address proof submitted for review.");
  } catch (err) {
    sendError(res, "Failed to submit address proof.", 500, "INTERNAL_ERROR");
  }
}

export async function submitEmergencyContact(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { name, phone, relation } = req.body;
    const verification = await upsertVerification(req.user!.userId);
    await prisma.verification.update({
      where: { id: verification.id },
      data: {
        emergencyContactName: name,
        emergencyContactPhone: phone,
        emergencyContactRelation: relation,
      },
    });
    sendSuccess(res, undefined, "Emergency contact submitted.");
  } catch (err) {
    sendError(res, "Failed to submit emergency contact.", 500, "INTERNAL_ERROR");
  }
}

export async function getVerificationStatus(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const verification = await prisma.verification.findUnique({
      where: { userId: req.user!.userId },
      select: {
        status: true,
        selfieUrl: true,
        govIdUrl: true,
        addressProofUrl: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        rejectionReason: true,
        updatedAt: true,
      },
    });
    if (!verification) {
      sendSuccess(res, { status: "UNVERIFIED" }, "Verification status retrieved.");
      return;
    }
    sendSuccess(res, verification, "Verification status retrieved.");
  } catch (err) {
    sendError(res, "Failed to retrieve verification status.", 500, "INTERNAL_ERROR");
  }
}

export async function getVerificationHistory(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const verification = await prisma.verification.findUnique({ where: { userId: req.user!.userId } });
    if (!verification) {
      sendSuccess(res, [], "No verification history.");
      return;
    }
    const history = await prisma.verificationHistory.findMany({
      where: { verificationId: verification.id },
      orderBy: { createdAt: "desc" },
    });
    sendSuccess(res, history, "Verification history retrieved.");
  } catch (err) {
    sendError(res, "Failed to retrieve verification history.", 500, "INTERNAL_ERROR");
  }
}
