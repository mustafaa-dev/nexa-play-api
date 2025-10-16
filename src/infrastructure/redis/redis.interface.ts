import { ILogInSession } from './redis.service';

export interface IRedisService {
  getVerificationSession(userId: string, id: 'email' | 'phone'): Promise<string | null>;
  getResetPasswordSession(userId: string): Promise<string | null>;
  getLogInSession(userId: string): Promise<ILogInSession[] | null>;
}
