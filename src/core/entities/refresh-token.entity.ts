import { BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export interface IRefreshTokenProps {
  id?: string;
  userId?: string;
  token?: string;
  expiresAt?: Date;
  revokedAt?: Date;
  createdAt?: Date;
}

export class RefreshToken {
  private readonly _id: string;
  private readonly _userId: string;
  private readonly _token: string;
  private readonly _expiresAt: Date;
  private _revokedAt?: Date;
  private readonly _createdAt: Date;

  constructor(refreshToken?: Partial<IRefreshTokenProps>) {
    this.validateProps(refreshToken);
    const now = new Date();

    this._id = refreshToken?.id ?? uuidv4();
    this._userId = refreshToken?.userId ? refreshToken.userId : '';
    this._token = refreshToken?.token ? refreshToken.token : '';
    this._expiresAt = refreshToken?.expiresAt ?? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    this._revokedAt = refreshToken?.revokedAt ?? undefined;
    this._createdAt = refreshToken?.createdAt ?? now;
  }

  get userId(): string {
    return this._userId;
  }

  static fromStore(refreshToken: IRefreshTokenProps): RefreshToken {
    return new RefreshToken({
      id: refreshToken.id,
      userId: refreshToken.userId,
      token: refreshToken.token,
      expiresAt: refreshToken.expiresAt,
    });
  }

  isExpired(): boolean {
    return new Date() > this._expiresAt;
  }

  isTokenValid(token: string): boolean {
    return this._token === token;
  }

  isRevoked(): boolean {
    return !!this._revokedAt;
  }

  revoke(): void {
    this._revokedAt = new Date();
  }

  toJSON(): IRefreshTokenProps {
    return {
      id: this._id,
      userId: this._userId.toString(),
      token: this._token.toString(),
      expiresAt: this._expiresAt,
      revokedAt: this._revokedAt,
      createdAt: this._createdAt,
    };
  }

  private validateProps(refreshToken?: Partial<IRefreshTokenProps>): void {
    if (refreshToken?.expiresAt && refreshToken.expiresAt < new Date()) {
      throw new BadRequestException('Refresh token expiration date is in the past');
    }
  }
}
