import { Otp } from '@core/entities/otp.entity';
import { PasswordReset } from '@core/entities/password-reset.entity';
import { RefreshToken } from '@core/entities/refresh-token.entity';
import { IEmailVerificationRepository } from '@core/repositories/email-verification.repository.interface';
import { Email } from '@core/value-objects/email.vo';
import { UserId } from '@core/value-objects/user-id.vo';
import { LocalizedInvalidInputException, LocalizedNotFoundException } from '@infrastructure/i18n';
import { LoggingService } from '@infrastructure/logging/logging.service';
import { RedisService } from '@infrastructure/redis/redis.service';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import * as speakeasy from 'speakeasy';
import { User } from '../entities/user.entity';
import { IOtpRepository } from '../repositories/otp.repository.interface';
import { IPasswordResetRepository } from '../repositories/password-reset.repository.interface';
import { IRefreshTokenRepository } from '../repositories/refresh-token.repository.interface';
import { IUserRepository } from '../repositories/user.repository.interface';

@Injectable()
export class AuthService {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('OtpRepository')
    private readonly otpRepository: IOtpRepository,
    @Inject('RefreshTokenRepository')
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject('EmailVerificationRepository')
    private readonly emailVerificationRepository: IEmailVerificationRepository,
    @Inject('PasswordResetRepository')
    private readonly passwordResetRepository: IPasswordResetRepository,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  private get otpConfig() {
    return {
      secret: this.configService.get<string>('OTP_SECRET'),
      expiration: this.configService.get<number>('OTP_EXPIRATION', 5),
      step: this.configService.get<number>('OTP_STEP', 30),
      digits: this.configService.get<number>('OTP_DIGITS', 6),
    };
  }

  private get tokenConfig() {
    return {
      refreshExpiration: parseInt(
        this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d').replace('d', ''),
        10,
      ),
    };
  }

  async generateOtp(userId: string): Promise<string> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new LocalizedNotFoundException({
        property: 'user',
        value: userId,
      });
    }

    // Generate a temporary secret
    const secret = speakeasy.generateSecret({
      length: 20,
      name: `App:${user.email}`,
    }).base32;

    // Create a new OTP entity
    const otp = new Otp(new UserId(userId), secret, this.otpConfig.expiration);

    // Save the OTP
    await this.otpRepository.createFromDomain(otp);

    // Generate a token using the secret
    return speakeasy.totp({
      secret,
      encoding: 'base32',
      step: this.otpConfig.step,
      digits: this.otpConfig.digits,
    });
  }

  async verifyOtp(userId: string, token: string): Promise<boolean> {
    LoggingService.debug(`Verifying OTP for user: ${userId}`);

    const user = await this.userRepository.findById(userId);
    if (!user) {
      LoggingService.warn(`User not found during OTP verification for user: ${userId}`);
      throw new LocalizedNotFoundException({
        property: 'user',
        value: userId,
      });
    }

    const otp = await this.otpRepository.findByUserId(userId);
    if (!otp) {
      LoggingService.warn(`OTP not found for user: ${userId}`);
      throw new LocalizedNotFoundException({
        property: 'otp',
        value: userId,
      });
    }

    if (otp.isExpired()) {
      LoggingService.warn(`OTP has expired for user: ${userId}`);
      throw new LocalizedInvalidInputException('otp');
    }

    const isValid = speakeasy.totp.verify({
      secret: otp.secret,
      encoding: 'base32',
      token,
      step: this.otpConfig.step,
      digits: this.otpConfig.digits,
    });

    if (isValid) {
      LoggingService.info(`OTP verified successfully for user: ${userId}`);
      otp.markAsVerified();
      await this.otpRepository.updateFromDomain(otp);

      return true;
    } else {
      LoggingService.warn(`Invalid OTP provided for user: ${userId}`);
      throw new LocalizedInvalidInputException('otp');
    }
  }

  async setupTwoFactorAuth(userId: string): Promise<{ secret: string; qrCodeUrl: string }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new LocalizedNotFoundException({
        property: 'user',
        value: userId,
      });
    }

    // Generate a new secret
    const secret = speakeasy.generateSecret({
      length: 20,
      name: `App:${user.email}`,
    });

    // Save the secret to the user
    // user.enableOtp(secret.base32);
    await this.userRepository.updateFromDomain(user);

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCodeUrl,
    };
  }

  async verifyTwoFactorToken(userId: string, token: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new LocalizedNotFoundException({
        property: 'user',
        value: userId,
      });
    }

    // if (!user.otpEnabled || !user.otpSecret) {
    //   throw new AuthenticationException('Two-factor authentication is not enabled for this user');
    // }

    const isValid = speakeasy.totp.verify({
      secret: 'user.otpSecret',
      encoding: 'base32',
      token,
      step: this.otpConfig.step,
      digits: this.otpConfig.digits,
    });

    if (!isValid) {
      throw new LocalizedInvalidInputException('otp');
    }

    return true;
  }

  async disableTwoFactorAuth(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new LocalizedNotFoundException({
        property: 'user',
        value: userId,
      });
    }

    // user.disableOtp();

    return this.userRepository.updateFromDomain(user);
  }

  async createRefreshToken(
    userId: string,
    accessToken: string,
    token: string,
  ): Promise<RefreshToken> {
    // Delete any existing refresh tokens for this user
    // await this.refreshTokenRepository.deleteByUserId(userId);
    // Create a new refresh token
    const refreshToken = new RefreshToken({
      userId,
      token,
    });

    return refreshToken;
  }

  async validateRefreshToken(userId: string, token: string): Promise<RefreshToken> {
    LoggingService.debug(`Validating refresh token: ${token}`, { context: AuthService.name });

    const refreshToken = await this.redisService.getRefreshToken(userId, token);
    if (!refreshToken) {
      LoggingService.warn(`Invalid refresh token, token not found in database: ${token}`, {
        context: AuthService.name,
      });
      throw new LocalizedInvalidInputException('refresh_token');
    }

    LoggingService.debug(`Refresh token validated successfully: ${token}`, {
      context: AuthService.name,
    });

    return new RefreshToken({ userId, token: refreshToken });
  }

  async revokeRefreshToken(userId: string, accessToken: string): Promise<void> {
    await this.redisService.deleteRefreshToken(userId, accessToken);
  }

  async revokeAllRefreshTokens(userId: string): Promise<void> {
    // Check if user exists
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
      relations: {
        avatar: true,
      },
    });
    if (!user) {
      throw new LocalizedNotFoundException({
        property: 'user',
        value: userId,
      });
    }

    await this.refreshTokenRepository.deleteByUserId(userId);
  }

  async updateLastLogin(user: User): Promise<User> {
    if (!user) {
      throw new LocalizedNotFoundException({
        property: 'user',
        value: user.id,
      });
    }

    user.updateLastLogin();

    return this.userRepository.updateFromDomain(user);
  }

  /**
   * Generate a verification code for email verification
   * @param email The email to send verification to
   * @returns The generated verification code
   */
  async generateEmailVerificationCode(email: string): Promise<string> {
    try {
      // Validate email format
      new Email(email);

      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // Create and save the verification entity
      await this.emailVerificationRepository.create(new Email(email), code);

      return code;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify an email verification code
   * @param email The email to verify
   * @param code The verification code
   * @returns Boolean indicating if verification was successful
   */
  async verifyEmailCode(email: string, code: string): Promise<boolean> {
    try {
      // Validate email format
      const emailVo = new Email(email);

      // Find the verification record
      const verificationCode = await this.emailVerificationRepository.findByEmailAndCode(
        emailVo,
        code,
      );

      if (!verificationCode) {
        throw new LocalizedInvalidInputException('otp');
      }

      // Mark as verified
      await this.emailVerificationRepository.delete(emailVo);

      // Update the user's emailVerified field
      const user = await this.userRepository.findOne({
        where: { email },
        relations: {
          avatar: true,
        },
      });
      if (!user) {
        throw new LocalizedNotFoundException({
          property: 'user',
          value: email,
        });
      }
      user.emailVerifiedAt = new Date();
      await this.userRepository.updateFromDomain(user);
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a password reset token for a user
   * @param email The email of the user
   * @returns The generated password reset token
   * @throws EntityNotFoundException if user not found
   */
  async createPasswordResetToken(email: string): Promise<number> {
    try {
      // Validate email format
      new Email(email);

      // Find the user
      const user = await this.userRepository.findOne({
        where: { email },
        relations: {
          avatar: true,
        },
      });
      if (!user) {
        throw new LocalizedNotFoundException({
          property: 'user',
          value: email,
        });
      }

      // Delete any existing password reset tokens for this user
      await this.passwordResetRepository.delete(new Email(email));

      // Create a new password reset token
      const passwordReset = new PasswordReset(
        new UserId(user.id),
        new Email(email),
        60, // 1-hour expiration
        process.env.NODE_ENV === 'development'
          ? 111111
          : Math.floor(100000 + Math.random() * 900000),
      );

      await this.passwordResetRepository.create(new Email(email), passwordReset.otp);

      return passwordReset.otp;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate a password reset token
   * @param email The email of the user
   * @param token The password reset token
   * @returns The user associated with the token
   * @throws EntityNotFoundException if token not found
   * @throws OtpExpiredException if token is expired
   * @throws OtpInvalidException if token is already used
   */
  async validatePasswordResetToken(email: string, otp: number): Promise<User> {
    // Find the password reset record
    const passwordReset = await this.passwordResetRepository.findByEmailAndOtp(
      new Email(email),
      otp,
    );
    if (!passwordReset) {
      throw new LocalizedNotFoundException({
        property: 'password_reset_otp',
        value: otp.toString(),
      });
    }

    // Find the user
    const user = await this.userRepository.findOne({
      where: { email },
      relations: {
        avatar: true,
      },
    });
    if (!user) {
      throw new LocalizedNotFoundException({
        property: 'user',
        value: email,
      });
    }

    return user;
  }

  /**
   * Reset a user's password
   * @param token The password reset token
   * @param newPassword The new password
   * @returns Boolean indicating success
   * @throws EntityNotFoundException if token not found
   * @throws OtpExpiredException if token is expired
   * @throws OtpInvalidException if token is already used
   */
  async resetPassword(email: string, otp: number, newPassword: string): Promise<boolean> {
    LoggingService.info(`Password reset requested with email: ${email}`);

    // Validate the token and get the user
    const user = await this.validatePasswordResetToken(email, otp);

    LoggingService.debug(`Password reset token validated for user: ${user.id}`, {
      context: AuthService.name,
    });

    // Get the password reset record
    await this.passwordResetRepository.delete(new Email(email));

    // Set the new password
    user.setPassword(newPassword);
    await this.userRepository.updateFromDomain(user);

    // Revoke all refresh tokens for this user
    await this.refreshTokenRepository.deleteByUserId(user.id);

    LoggingService.info(`Password reset completed successfully for user: ${user.id}`);

    return true;
  }
}
