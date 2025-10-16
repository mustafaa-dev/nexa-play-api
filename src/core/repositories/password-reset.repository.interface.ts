import { Email } from '@core/value-objects/email.vo';

export interface IPasswordResetRepository {
  create(email: Email, otp: number): Promise<void>;
  findByEmail(email: Email): Promise<number | null>;
  findByEmailAndOtp(email: Email, otp: number): Promise<number | null>;
  delete(email: Email): Promise<void>;
}
