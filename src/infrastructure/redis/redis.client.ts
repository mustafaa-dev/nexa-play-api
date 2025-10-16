import Keyv, { KeyvHooks } from 'keyv';

import { LoggingService } from '@infrastructure/logging/logging.service';
import KeyvGzip from '@keyv/compress-gzip';
import KeyvRedis from '@keyv/redis';
import { ConfigService } from '@nestjs/config';

export class RedisClient {
  private static instance: Keyv;

  private constructor() {}

  public static getInstance(configService: ConfigService): Keyv {
    if (!RedisClient.instance) {
      const redisHost = configService.getOrThrow<string>('REDIS_HOST');
      const redisPort = configService.getOrThrow<number>('REDIS_PORT');
      const redisUsername = configService.getOrThrow<string>('REDIS_USERNAME');
      const redisPassword = configService.getOrThrow<string>('REDIS_PASSWORD');
      const redisNamespace = configService.getOrThrow<string>('REDIS_NAMESPACE');

      const url = `redis://${redisUsername}:${redisPassword}@${redisHost}:${redisPort}`;

      RedisClient.instance = new Keyv(new KeyvRedis(url), {
        namespace: redisNamespace,
        emitErrors: true,
        serialize: JSON.stringify,
        deserialize: JSON.parse,
        compression: new KeyvGzip(),
      });

      const handleConnectionError = err =>
        LoggingService.error('Redis connection error', {
          context: RedisClient.name,
          error: err,
        });
      const handleClear = () =>
        LoggingService.info('Cache Cleared', {
          context: RedisClient.name,
        });
      const handleDisconnect = () =>
        LoggingService.info('Disconnected', {
          context: RedisClient.name,
        });
      RedisClient.instance.on('error', handleConnectionError);
      RedisClient.instance.on('clear', handleClear);
      RedisClient.instance.on('disconnect', handleDisconnect);
      RedisClient.instance.on('connect', () =>
        LoggingService.info('Redis connected', {
          context: RedisClient.name,
        }),
      );

      RedisClient.instance.hooks.addHandler(KeyvHooks.PRE_SET, data =>
        LoggingService.info(`Setting key ${data.key} to ${data.value}`, {
          context: RedisClient.name,
        }),
      );

      RedisClient.instance.hooks.addHandler(KeyvHooks.PRE_GET, data =>
        LoggingService.info(`Getting key ${data.key}`, {
          context: RedisClient.name,
        }),
      );

      RedisClient.instance.hooks.addHandler(KeyvHooks.PRE_DELETE, data =>
        LoggingService.info(`Deleting key ${data.key}`, {
          context: RedisClient.name,
        }),
      );
    }

    return RedisClient.instance;
  }
}
