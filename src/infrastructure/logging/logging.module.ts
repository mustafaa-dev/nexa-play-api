import { Global, Inject, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { transport as TransportStream } from 'winston';
import { LOG_STRATEGIES } from './logging.constants';
import { LoggingService } from './logging.service';
import { ConsoleStrategy } from './strategies/console.strategy';
import { FileStrategy } from './strategies/file.strategy';
import { TelegramStrategy } from './strategies/telegram.strategy';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    ConsoleStrategy,
    TelegramStrategy,
    FileStrategy,
    {
      provide: LOG_STRATEGIES,
      useFactory: (
        config: ConfigService,
        consoleStrategy: ConsoleStrategy,
        telegramStrategy: TelegramStrategy,
        fileStrategy: FileStrategy,
      ): TransportStream[] => {
        // Helper to check if env var is truthy
        const isEnabled = (key: string) => {
          const val = config.get<string>(key);
          return val === 'true' || val === '1';
        };

        const list: TransportStream[] = [];
        if (isEnabled('APP_CONSOLE_DEBUGGING')) {
          list.push(consoleStrategy.createTransport());
        }
        if (isEnabled('TELEGRAM_LOGGING')) {
          list.push(telegramStrategy.createTransport());
        }
        if (isEnabled('APP_FILE_DEBUGGING')) {
          list.push(...fileStrategy.createTransports());
        }

        return list;
      },
      inject: [ConfigService, ConsoleStrategy, TelegramStrategy, FileStrategy],
    },
    LoggingService,
  ],
  exports: [LoggingService],
})
export class LoggingModule {
  constructor(@Inject(LOG_STRATEGIES) private readonly transports: TransportStream[]) {
    LoggingService.init(this.transports);
  }
}
