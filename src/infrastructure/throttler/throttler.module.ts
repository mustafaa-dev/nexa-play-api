import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerService } from '@infrastructure/services/throttler.service';
import { ThrottlerGuard } from '@presentation/guards/throttler.guard';

@Module({
  imports: [ConfigModule],
  providers: [
    ThrottlerService,
    {
      provide: 'IThrottlerService',
      useClass: ThrottlerService,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [ThrottlerService],
})
export class ThrottlerModule {}
