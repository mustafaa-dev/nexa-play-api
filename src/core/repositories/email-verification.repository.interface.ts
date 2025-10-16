import { Email } from '@core/value-objects/email.vo';

export interface IEmailVerificationRepository {
  create(email: Email, code: string): Promise<void>;
  findByEmail(email: Email): Promise<string | null>;
  findByEmailAndCode(email: Email, code: string): Promise<string | null>;
  delete(email: Email): Promise<void>;
}
