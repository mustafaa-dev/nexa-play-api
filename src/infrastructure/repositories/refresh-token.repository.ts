import { IRefreshTokenRepository } from '@core/repositories/refresh-token.repository.interface';
import { RedisService } from '@infrastructure/redis/redis.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly redisService: RedisService) {}

  async deleteByUserId(userId: string): Promise<boolean> {
    return true;
  }

  protected mapToDomain(entity: undefined): undefined {
    return undefined;
  }
}
