import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as TelegramLogger from 'winston-telegram';

@Injectable()
export class TelegramStrategy {
  constructor(private readonly config: ConfigService) {}

  createTransport(): TelegramLogger {
    const appName = process.env.APP_NAME;
    const threadsEnabled = this.config.get<string>('TELEGRAM_THREADS') === 'true';
    const threadId = threadsEnabled ? this.config.get<number>('TELEGRAM_THREAD_ID') : undefined;

    const opts = {
      token: this.config.get<string>('TELEGRAM_BOT_TOKEN'),
      chatId: this.config.get<number>('TELEGRAM_CHAT_ID'),
      messageThreadId: threadId,
      level: 'error',
      formatMessage: (_params, info) =>
        `${appName} | ${new Date().toUTCString()} | [${info.level.toUpperCase()}] | ${info.context} : ${info.message}`,
    };

    return new TelegramLogger(opts);
  }
}
