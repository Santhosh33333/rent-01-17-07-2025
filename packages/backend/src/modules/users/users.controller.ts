import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/response';
import { UpdateProfileDto, EmergencyContactDto, FriendRequestDto, BlockUserDto } from './users.dto';

export async function getProfile(req: Request, res: Response): Promise<void> {
  const userId = (req as any).user?.userId;
  if (!userId) { sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED'); return; }
  sendSuccess(res, { userId }, 'Profile fetched');
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const parsed = UpdateProfileDto.safeParse(req.body);
  if (!parsed.success) { sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR'); return; }
  sendSuccess(res, parsed.data, 'Profile updated');
}

export async function addEmergencyContact(req: Request, res: Response): Promise<void> {
  const parsed = EmergencyContactDto.safeParse(req.body);
  if (!parsed.success) { sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR'); return; }
  sendSuccess(res, {}, 'Emergency contact added', 201);
}

export async function getEmergencyContacts(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, [], 'Emergency contacts fetched');
}

export async function deleteEmergencyContact(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, {}, 'Emergency contact deleted');
}

export async function getFriends(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, [], 'Friends fetched');
}

export async function sendFriendRequest(req: Request, res: Response): Promise<void> {
  const parsed = FriendRequestDto.safeParse(req.body);
  if (!parsed.success) { sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR'); return; }
  sendSuccess(res, {}, 'Friend request sent', 201);
}

export async function acceptFriendRequest(req: Request, res: Response): Promise<void> {
  sendSuccess(res, { id: req.params.id }, 'Friend request accepted');
}

export async function removeFriend(req: Request, res: Response): Promise<void> {
  sendSuccess(res, { id: req.params.id }, 'Friend removed');
}

export async function blockUser(req: Request, res: Response): Promise<void> {
  const parsed = BlockUserDto.safeParse(req.body);
  if (!parsed.success) { sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR'); return; }
  sendSuccess(res, { userId: req.params.userId }, 'User blocked', 201);
}

export async function unblockUser(req: Request, res: Response): Promise<void> {
  sendSuccess(res, { userId: req.params.userId }, 'User unblocked');
}

export async function getSessions(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, [], 'Sessions fetched');
}

export async function deleteSession(req: Request, res: Response): Promise<void> {
  sendSuccess(res, { id: req.params.id }, 'Session deleted');
}

export async function deactivateAccount(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, {}, 'Account deactivated');
}
