import { UsersRepository } from './users.repository';
import { UpdateProfileDtoType, EmergencyContactDtoType } from './users.dto';

export class UsersService {
  constructor(private readonly repo: UsersRepository) {}

  async getProfile(userId: string) {
    const user = await this.repo.findById(userId);
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
    return user;
  }

  async updateProfile(userId: string, data: UpdateProfileDtoType) {
    return this.repo.updateProfile(userId, data);
  }

  async manageEmergencyContacts(userId: string, action: 'add' | 'get' | 'delete', data?: EmergencyContactDtoType) {
    if (action === 'add' && data) {
      await this.repo.addEmergencyContact(userId, {
        emergencyContactName: data.name,
        emergencyContactPhone: data.phone,
        emergencyContactRelation: data.relation,
      });
      return { success: true };
    }
    if (action === 'get') {
      return this.repo.getEmergencyContacts(userId);
    }
    if (action === 'delete') {
      await this.repo.deleteEmergencyContact(userId);
      return { success: true };
    }
  }

  async manageFriendship(userId: string, action: 'list' | 'request' | 'accept' | 'remove', targetId?: string) {
    if (action === 'list') return this.repo.getFriends(userId);
    return { userId, action, targetId };
  }

  async manageBlocking(blockerId: string, action: 'block' | 'unblock', blockedId: string, reason?: string) {
    if (action === 'block') return this.repo.blockUser(blockerId, blockedId, reason);
    await this.repo.unblockUser(blockerId, blockedId);
    return { success: true };
  }

  async manageSession(userId: string, action: 'list' | 'delete', sessionId?: string) {
    if (action === 'list') return this.repo.getSessions(userId);
    if (action === 'delete' && sessionId) {
      await this.repo.deleteSession(sessionId, userId);
      return { success: true };
    }
  }
}
