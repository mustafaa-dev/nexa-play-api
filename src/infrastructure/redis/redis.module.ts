import { Global, Module, OnModuleDestroy } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { RedisClient } from './redis.client';
import { RedisRepository } from './redis.repository';
import { RedisService } from './redis.service';
import { REDIS_CLIENT } from './types';

@Global()
@Module({
  providers: [
    RedisRepository,
    RedisService,
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) => RedisClient.getInstance(configService),
      inject: [ConfigService],
    },
  ],
  exports: [RedisService, REDIS_CLIENT],
})
export class RedisModule implements OnModuleDestroy {
  constructor(private readonly redisService: RedisService) {}

  async onModuleDestroy(): Promise<void> {
    await this.redisService.close();
  }
}
