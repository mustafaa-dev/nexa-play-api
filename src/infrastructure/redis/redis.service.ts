import { timeStringToSeconds } from '@infrastructure/utils/time';
import { Injectable } from '@nestjs/common';
import { RedisRepository } from './redis.repository';
import { REDIS_PREFIX } from './types';

const TEN_MINUTES_IN_SECONDS = 60 * 10;

export interface ILogInSession {
  userId: string;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class RedisService {
  constructor(private readonly redisRepository: RedisRepository) {}

  async close(): Promise<void> {
    this.redisRepository.onModuleDestroy();
  }

  async saveLogInSession(userId: string, session: ILogInSession): Promise<boolean> {
    return await this.redisRepository.setWithExpiry<string>(
      REDIS_PREFIX.LOGIN_SESSION,
      `${userId}:${session.accessToken}`,
      JSON.stringify(session),
      timeStringToSeconds(process.env.JWT_ACCESS_EXPIRATION),
    );
  }

  async getLogInSession(userId: string, accessToken: string): Promise<ILogInSession[] | null> {
    const sessions = await this.redisRepository.get<string>(
      REDIS_PREFIX.LOGIN_SESSION,
      `${userId}:${accessToken}`,
    );
    return sessions ? JSON.parse(sessions) : [];
  }

  async deleteLogInSession(userId: string, accessToken: string): Promise<void> {
    return await this.redisRepository.delete(
      REDIS_PREFIX.LOGIN_SESSION,
      `${userId}:${accessToken}`,
    );
  }

  async saveRefreshToken(
    userId: string,
    accessToken: string,
    refreshToken: string,
  ): Promise<boolean> {
    return await this.redisRepository.setWithExpiry(
      REDIS_PREFIX.REFRESH_TOKEN,
      `${userId}:${accessToken}`,
      refreshToken,
      timeStringToSeconds(process.env.JWT_REFRESH_EXPIRATION),
    );
  }

  async getRefreshToken(userId: string, accessToken: string): Promise<string | null> {
    return await this.redisRepository.get<string>(
      REDIS_PREFIX.REFRESH_TOKEN,
      `${userId}:${accessToken}`,
    );
  }

  async deleteRefreshToken(userId: string, accessToken: string): Promise<void> {
    await this.redisRepository.delete(REDIS_PREFIX.REFRESH_TOKEN, `${userId}:${accessToken}`);
  }

  async deleteUserRefreshTokens(userId: string): Promise<void> {
    await this.redisRepository.delete(REDIS_PREFIX.REFRESH_TOKEN, userId);
  }

  async saveVerificationSession(userId: string, otp: string): Promise<void> {
    await this.redisRepository.setWithExpiry(
      REDIS_PREFIX.VERIFICATION_SESSION,
      userId,
      otp,
      TEN_MINUTES_IN_SECONDS,
    );
  }

  async saveResetPasswordSession(userId: string, otp: number): Promise<void> {
    await this.redisRepository.setWithExpiry(
      REDIS_PREFIX.RESET_PASSWORD_SESSION,
      userId,
      otp.toString(),
      TEN_MINUTES_IN_SECONDS,
    );
  }

  async getVerificationSession(userId: string): Promise<string | null> {
    const session = await this.redisRepository.get(
      REDIS_PREFIX.VERIFICATION_SESSION,
      userId.toString(),
    );
    return session ? JSON.parse(<string>session) : null;
  }

  async getResetPasswordSession(userId: string): Promise<any | null> {
    const session = await this.redisRepository.get(
      REDIS_PREFIX.RESET_PASSWORD_SESSION,
      userId.toString(),
    );
    return JSON.parse(<string>session);
  }

  async deleteLogInSessions(accessTokens: string[]): Promise<void> {
    return await this.redisRepository.deleteAll(REDIS_PREFIX.LOGIN_SESSION, accessTokens);
  }

  async deleteVerificationSession(userId: string): Promise<void> {
    return await this.redisRepository.delete(REDIS_PREFIX.VERIFICATION_SESSION, userId);
  }

  async deleteResetPasswordSession(userId: string): Promise<void> {
    return await this.redisRepository.delete(
      REDIS_PREFIX.RESET_PASSWORD_SESSION,
      userId.toString(),
    );
  }

  async saveUser2FASecret(sessionId: string, secret: any): Promise<void> {
    await this.redisRepository.setWithExpiry(
      REDIS_PREFIX.USER_2FA,
      sessionId,
      JSON.stringify(secret),
      TEN_MINUTES_IN_SECONDS,
    );
  }

  async getUser2FASecret(sessionId: string): Promise<any | null> {
    const session = await this.redisRepository.get(REDIS_PREFIX.USER_2FA, sessionId);
    return JSON.parse(<string>session);
  }

  async deleteUser2FASecret(sessionId: string): Promise<any | null> {
    await this.redisRepository.delete(REDIS_PREFIX.USER_2FA, sessionId);
  }

  async saveInstanceQrCode(instanceId: string, qrCodeData: string): Promise<any> {
    await this.redisRepository.setWithExpiry(
      REDIS_PREFIX.INSTANCE_QR_CODE,
      instanceId,
      qrCodeData,
      TEN_MINUTES_IN_SECONDS,
    );
  }

  async getInstanceQrCode(instanceId: string): Promise<any | null> {
    const qr = await this.redisRepository.get(REDIS_PREFIX.INSTANCE_QR_CODE, instanceId);
    return qr;
  }

  async deleteInstanceQrCode(instanceId: string): Promise<any | null> {
    await this.redisRepository.delete(REDIS_PREFIX.INSTANCE_QR_CODE, instanceId);
  }
}
