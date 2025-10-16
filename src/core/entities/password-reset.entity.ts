import { Email } from '@core/value-objects/email.vo';
import { UserId } from '@core/value-objects/user-id.vo';
import { v4 as uuid } from 'uuid';

interface IPasswordReset {
  id: string;
  userId: string;
  email: string;
  otp: number;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export class PasswordReset {
  id: string;
  userId: UserId;
  email: Email;
  otp: number;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;

  constructor(
    userId: UserId,
    email: Email,
    expirationMinutes: number = 60,
    otp: number,
    id?: string,
  ) {
    this.id = id || uuid();
    this.userId = userId;
    this.email = email;
    this.otp = otp;

    // Set expiration time (default: 60 minutes)
    const now = new Date();
    this.expiresAt = new Date(now.getTime() + expirationMinutes * 60000);

    this.usedAt = null;
    this.createdAt = now;
  }

  static fromStore(passwordReset: IPasswordReset): PasswordReset {
    return new PasswordReset(
      new UserId(passwordReset.userId),
      new Email(passwordReset.email),
      passwordReset.otp,
      passwordReset.expiresAt.getTime(),
    );
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isUsed(): boolean {
    return this.usedAt !== null;
  }

  markAsUsed(): void {
    this.usedAt = new Date();
  }

  toPrisma(): IPasswordReset {
    return {
      id: this.id,
      userId: this.userId.toString(),
      email: this.email.toString(),
      otp: this.otp,
      expiresAt: this.expiresAt,
      usedAt: this.usedAt,
      createdAt: this.createdAt,
    };
  }
}
