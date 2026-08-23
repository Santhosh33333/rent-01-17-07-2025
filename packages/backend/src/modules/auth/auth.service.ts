import { AuthRepository } from './auth.repository';

export class AuthService {
  constructor(private readonly repo: AuthRepository) {}

  async checkEmailAvailable(email: string): Promise<void> {
    const existing = await this.repo.findByEmail(email);
    if (existing) {
      throw Object.assign(new Error('Email already registered'), {
        code: 'EMAIL_ALREADY_REGISTERED',
        status: 409,
      });
    }
  }

  async checkPhoneAvailable(phone: string): Promise<void> {
    const existing = await this.repo.findByPhone(phone);
    if (existing) {
      throw Object.assign(new Error('Phone already registered'), {
        code: 'PHONE_ALREADY_REGISTERED',
        status: 409,
      });
    }
  }

  async getUserByEmail(email: string) {
    return this.repo.findByEmail(email);
  }

  async getUserById(id: string) {
    return this.repo.findById(id);
  }
}
