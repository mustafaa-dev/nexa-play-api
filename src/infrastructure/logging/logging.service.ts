import {
  transport as TransportStream,
  Logger as WinstonLogger,
  transports as WinstonTransports,
  addColors,
  createLogger,
  format,
} from 'winston';

import { CUSTOM_LEVELS } from './logging.constants';

export class LoggingService {
  private static _logger: WinstonLogger;

  static get isInitialized(): boolean {
    return !!LoggingService._logger;
  }

  static get logger(): WinstonLogger {
    if (!LoggingService._logger) {
      // throw new Error(
      //   'LoggingService not initialized. Make sure LoggingModule is imported and app.init() is called before using logging methods.',
      // );
    }
    return LoggingService._logger;
  }

  static init(transports: TransportStream[]) {
    if (LoggingService._logger) {
      return;
    }

    LoggingService._logger = createLogger({
      levels: CUSTOM_LEVELS.levels,
      format: format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
      transports:
        transports.length > 0 ? transports : [new WinstonTransports.Console({ silent: true })],
    });
    addColors(CUSTOM_LEVELS.colors);
  }

  static io(message: string, meta?: Record<string, unknown>): void {
    if (!this.isInitialized) {
      return;
    }
    this.logger.log('io', `⛁ ${message}`, meta);
  }

  static db(message: string, meta?: Record<string, unknown>): void {
    if (!this.isInitialized) {
      return;
    }
    this.logger.log('db', `⛁ ${message}`, meta);
  }

  static error(message: string, meta?: Record<string, unknown>): void {
    if (!this.isInitialized) {
      console.error(`🔴 ${message}`, meta);
      return;
    }
    this.logger.error(`🔴 ${message}`, meta);
  }

  static fatal(message: string, meta?: Record<string, unknown>): void {
    if (!this.isInitialized) {
      console.error(`💥 ${message}`, meta);
      return;
    }
    this.logger.log('fatal', `💥 ${message}`, meta);
  }

  static warn(message: string, meta?: Record<string, unknown>): void {
    if (!this.isInitialized) {
      console.warn(`⚠️ ${message}`, meta);
      return;
    }
    this.logger.warn(`⚠️ ${message}`, meta);
  }

  static info(message: string, meta?: Record<string, unknown>): void {
    if (!this.isInitialized) {
      return;
    }
    this.logger.info(`✅  ${message}`, meta);
  }

  static debug(message: string, meta?: Record<string, unknown>): void {
    if (!this.isInitialized) {
      return;
    }
    this.logger.debug(`🔍 ${message}`, meta);
  }
}
