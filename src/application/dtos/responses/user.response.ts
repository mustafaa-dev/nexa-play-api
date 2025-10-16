// User response interfaces

import { UserStatus } from '@shared/constants/user.constants';

export interface IUserBaseResponse {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  status: string;
  emailVerified?: boolean;
  avatar?: string;
}

export interface IUserDataResponse {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  status: UserStatus;
  emailVerified: boolean;
  avatar?: string;
  role: string;
  email: string;
  isActive: boolean;
  isAdmin: boolean;
}

export interface IUserDetailResponse extends IUserBaseResponse {
  isActive: boolean;
  lastLoginAt?: Date;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  user: IUserBaseResponse;
}

export interface IOtpRequiredResponse {
  requiresOtp: true;
  userId: string;
  message: string;
}

export interface IAuthRefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface IJwtPayload {
  sub: string;
  email: string;
  emailVerified?: boolean;
  role: string;
  permissions?: string[];
  iat?: number;
  exp?: number;
}

export interface IEmailVerificationRequiredResponse {
  requiresEmailVerification: true;
  userId: string;
  email: string;
  message: string;
}

export type AuthResponse =
  | IAuthTokenResponse
  | IOtpRequiredResponse
  | IEmailVerificationRequiredResponse;
