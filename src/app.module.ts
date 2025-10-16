import { APP_INTERCEPTOR } from '@nestjs/core';

import { DatabaseModule } from '@infrastructure/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { LoggingInterceptor } from '@presentation/interceptors/logging.interceptor';
// Modules
import { LoggingModule } from '@infrastructure/logging/logging.module';
import { Module, OnApplicationBootstrap } from '@nestjs/common';
// Global providers
import { RedisModule } from '@infrastructure/redis/redis.module';
import { StorageModule } from '@infrastructure/storage/storage.module';
import { TransformInterceptor } from '@presentation/interceptors/transform.interceptor';
// Config
import { GlobalProvider } from '@core/services/global.provider';
import configuration from '@infrastructure/config/configuration';
import { EventHandlersModule } from '@infrastructure/event-handlers/event-handlers.module';
import { I18nConfigModule } from '@infrastructure/i18n/i18n.module';
import { StorageService } from '@infrastructure/storage/storage.service';
import { ThrottlerModule } from '@infrastructure/throttler/throttler.module';
import { ActivityLogsModule } from '@presentation/modules/activity-logs/activity-logs.module';
import { AuthModule } from '@presentation/modules/auth/auth.module';
import { CountryModule } from '@presentation/modules/country/country.module';
import { NotificationModule } from '@presentation/modules/notifications/notification.module';
import { SocketModule } from '@presentation/modules/socket/socket.module';
import { UserModule } from '@presentation/modules/user/user.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    // Global Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
    }),

    // Monitoring - Must be loaded early!
    LoggingModule,
    ThrottlerModule,

    // Core Services
    EventHandlersModule,

    // Database
    DatabaseModule,
    RedisModule,

    // CQRS
    CqrsModule,

    // Storage
    StorageModule,

    // Internationalization
    I18nConfigModule,

    SocketModule,

    // Feature Modules
    UserModule,
    AuthModule,
    ActivityLogsModule,
    CountryModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [
    // Global interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useFactory: () =>
        new TransformInterceptor({
          exclude: ['/metrics'],
        }),
    },
  ],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(private readonly storageService: StorageService) {}

  async onApplicationBootstrap() {
    GlobalProvider.setStorageService(this.storageService);
  }
}
