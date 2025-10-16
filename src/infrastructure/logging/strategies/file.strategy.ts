import 'winston-daily-rotate-file';

import { Injectable } from '@nestjs/common';
import { transports } from 'winston';

@Injectable()
export class FileStrategy {
  createTransports() {
    const appName = process.env.APP_NAME;
    const env = process.env.NODE_ENV;
    return ['fatal', 'error', 'warn'].map(
      level =>
        new transports.DailyRotateFile({
          filename: `logs/${appName}-${env}-${level.toUpperCase()}-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '30d',
          level,
        }),
    );
  }
}
