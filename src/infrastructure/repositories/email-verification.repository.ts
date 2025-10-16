import { Email } from '@core/value-objects/email.vo';
import { RedisService } from '@infrastructure/redis/redis.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailVerificationRepository {
  constructor(private readonly redisService: RedisService) {}

  async create(email: Email, code: string): Promise<void> {
    await this.redisService.saveVerificationSession(email.getValue(), code);
  }

  async findByEmail(email: Email): Promise<string | null> {
    const code = await this.redisService.getVerificationSession(email.getValue());
    return code ? code : null;
  }

  async findByEmailAndCode(email: Email, code: string): Promise<string | null> {
    const record = await this.redisService.getVerificationSession(email.getValue());
    if (record && record.toString() === code.toString()) {
      return code;
    }

    return null;
  }

  async delete(email: Email): Promise<void> {
    await this.redisService.deleteVerificationSession(email.getValue());
  }
}
