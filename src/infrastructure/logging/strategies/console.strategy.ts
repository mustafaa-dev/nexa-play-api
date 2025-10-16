import * as process from 'node:process';

import { format, transports } from 'winston';

import { Injectable } from '@nestjs/common';
import { utilities } from 'nest-winston';

@Injectable()
export class ConsoleStrategy {
  createTransport() {
    const appName = process.env.APP_NAME;
    return new transports.Console({
      level: process.env.APP_CONSOLE_LOG_LEVEL || 'debug',
      format: format.combine(
        format.errors({ stack: true }),
        format.colorize({ message: true }),
        utilities.format.nestLike(appName, {
          colors: true,
          prettyPrint: true,
          appName: true,
        }),
      ),
    });
  }
}
