import { IJwtPayload } from '@application/dtos/responses/user.response';
import { User } from '@core/entities/user.entity';
import { AuthService } from '@core/services/auth.service';
import { RedisService } from '@infrastructure/redis/redis.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TokenProvider {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Generate a JWT payload with user information
   */
  buildPayload(user: User, permissions: string[], isEmailVerified: boolean): IJwtPayload {
    return {
      sub: user.id,
      email: user.email.getValue(),
      emailVerified: isEmailVerified,
      role: user?.role,
      permissions: permissions,
    };
  }

  /**
   * Generate an access token
   */
  generateAccessToken(payload: IJwtPayload): string {
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION'),
    });

    return accessToken;
  }

  /**
   * Generate a refresh token and store it
   */
  async generateRefreshToken(userId: string, accessToken: string): Promise<string> {
    const refreshToken = uuidv4();
    await this.authService.createRefreshToken(userId, accessToken, refreshToken);

    return refreshToken;
  }

  /**
   * Generate both access and refresh tokens for a user
   */
  async generateTokens(user: User, permissions: string[], isEmailVerified: boolean) {
    const payload = this.buildPayload(user, permissions, isEmailVerified);
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = await this.generateRefreshToken(user.id, accessToken);

    await this.redisService.saveRefreshToken(user.id, accessToken, refreshToken);

    await this.redisService.saveLogInSession(user.id, {
      userId: user.id,
      accessToken,
      refreshToken,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async decodeToken(token: string): Promise<IJwtPayload> {
    return this.jwtService.verify(token);
  }
}
