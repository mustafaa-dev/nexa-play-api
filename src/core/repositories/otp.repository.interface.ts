import { Otp } from '@core/entities/otp.entity';
import { IBaseRepository } from './base.repository.interface';

export interface IOtpRepository extends IBaseRepository<Otp, Record<string, unknown>> {
  // OTP specific methods
  findByUserId(userId: string): Promise<Otp | null>;
}
