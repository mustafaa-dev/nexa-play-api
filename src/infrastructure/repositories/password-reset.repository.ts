import { IPasswordResetRepository } from '@core/repositories/password-reset.repository.interface';
import { Email } from '@core/value-objects/email.vo';
import { RedisService } from '@infrastructure/redis/redis.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PasswordResetRepository implements IPasswordResetRepository {
  constructor(private readonly redisService: RedisService) {}

  async create(email: Email, otp: number): Promise<void> {
    await this.redisService.saveResetPasswordSession(email.getValue(), otp);
  }

  async findByEmail(email: Email): Promise<number | null> {
    const otp = await this.redisService.getResetPasswordSession(email.getValue());
    return otp ? otp : null;
  }

  async findByEmailAndOtp(email: Email, otp: number): Promise<number | null> {
    const record = await this.redisService.getResetPasswordSession(email.getValue());
    if (record && +record === +otp) {
      return otp;
    }

    return null;
  }

  async delete(email: Email): Promise<void> {
    await this.redisService.deleteResetPasswordSession(email.getValue());
  }
}
