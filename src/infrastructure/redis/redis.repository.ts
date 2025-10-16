import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import Keyv from 'keyv';
import { REDIS_CLIENT, REDIS_PREFIX } from './types';

@Injectable()
export class RedisRepository implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: Keyv) {}

  onModuleDestroy(): void {
    this.redisClient.disconnect();
  }

  async get<T>(prefix: REDIS_PREFIX, key: string): Promise<T | null> {
    return await this.redisClient.get<T>(`${prefix}${key}`);
  }

  async set<T>(prefix: REDIS_PREFIX, key: string, value: T): Promise<void> {
    await this.redisClient.set(`${prefix}${key}`, value);
  }

  async delete(prefix: REDIS_PREFIX, key: string): Promise<void> {
    await this.redisClient.delete(`${prefix}${key}`);
  }

  async deleteAll(prefix: REDIS_PREFIX, keys: string[]): Promise<void> {
    await this.redisClient.delete(keys.map(key => `${prefix}${key}`));
  }

  async setWithExpiry<T>(
    prefix: REDIS_PREFIX,
    key: string,
    value: T,
    expiry: number,
  ): Promise<boolean> {
    return await this.redisClient.set<T>(`${prefix}${key}`, value, expiry * 1000);
  }
}
