import { VerifyEmailDto } from '@application/dtos/auth/email-verification.dto';
import { IAuthTokenResponse } from '@application/dtos/responses/user.response';
import { UserMapper } from '@application/mappers/user.mapper';
import { IUserRepository } from '@core/repositories/user.repository.interface';
import { AuthService } from '@core/services/auth.service';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { I18nContext } from 'nestjs-i18n';
import { v4 as uuidv4 } from 'uuid';

export class VerifyEmailCommand implements ICommand {
  constructor(public readonly dto: VerifyEmailDto) {}
}

@Injectable()
@CommandHandler(VerifyEmailCommand)
export class VerifyEmailCommandHandler
  implements ICommandHandler<VerifyEmailCommand, IAuthTokenResponse | { verified: boolean }>
{
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject('UserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    command: VerifyEmailCommand,
  ): Promise<IAuthTokenResponse | { verified: boolean; message: string }> {
    const { email, otp } = command.dto;

    // Verify the email code
    const verified = await this.authService.verifyEmailCode(email, otp);

    if (!verified) {
      return { verified: false, message: 'Invalid OTP' };
    }

    // If verification succeeded, we can immediately login the user
    // 1. Find the user by email
    const user = await this.userRepository.findOne({
      where: { email },
      relations: {
        avatar: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // 2. Update last login
    await this.authService.updateLastLogin(user);

    // 4. Generate JWT tokens
    const payload = {
      sub: user.id,
      email: user.email.getValue(),
      emailVerified: true,
      // roles: user.roles.map(role => role.name),
      // permissions: Array.from(userPermissions),
      roles: [user.role],
      permissions: [],
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION'),
    });

    const refreshToken = uuidv4();
    await this.authService.createRefreshToken(user.id, accessToken, refreshToken);

    // 5. Return tokens and user information
    return {
      accessToken,
      refreshToken,
      user: UserMapper.toAuthResponse(user, true),
      message: I18nContext.current()?.translate('messages.email_verified_successfully'),
    };
  }
}
