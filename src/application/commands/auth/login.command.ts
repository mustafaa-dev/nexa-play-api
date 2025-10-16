import { LoginDto } from '@application/dtos/auth/login.dto';
import { AuthResponse } from '@application/dtos/responses/user.response';
import { UserMapper } from '@application/mappers/user.mapper';
import { AuthService } from '@core/services/auth.service';
import { UserService } from '@core/services/user.service';
import { LocalizedUnauthorizedException } from '@infrastructure/i18n/localized-exceptions';
import { LoggingService } from '@infrastructure/logging/logging.service';
import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs';
import { TokenProvider } from '@presentation/modules/auth/providers/token.provider';
import { I18nContext } from 'nestjs-i18n';

export class LoginCommand implements ICommand {
  constructor(public readonly loginDto: LoginDto) {}
}

@Injectable()
@CommandHandler(LoginCommand)
export class LoginCommandHandler implements ICommandHandler<LoginCommand> {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly tokenProvider: TokenProvider,
  ) {}

  async execute(command: LoginCommand): Promise<AuthResponse> {
    const { email } = command.loginDto;

    LoggingService.info(`Login attempt for ${email}`, { context: 'LoginCommandHandler' });

    // Validate credentials
    const user = await this.userService.validateCredentials(email, command.loginDto.password);

    if (!user) {
      LoggingService.warn(`Login failed - invalid credentials for ${email}`);
      throw new LocalizedUnauthorizedException('errors.invalid_credentials');
    }

    LoggingService.info(`Credentials validated successfully for ${email}`);

    await this.authService.updateLastLogin(user);

    if (user.isActive === false) {
      LoggingService.warn(`Login failed - user is not active for ${email}`);
      throw new LocalizedUnauthorizedException('errors.user_not_active');
    }

    if (!user.emailVerifiedAt) {
      LoggingService.warn(`Login failed - user email is not verified for ${email}`);

      return {
        requiresEmailVerification: true,
        userId: user.id,
        email: user.email.getValue(),
        message: I18nContext.current()?.translate('messages.please_verify_your_email'),
      };
    }

    // Generate JWT tokens
    const { accessToken, refreshToken } = await this.tokenProvider.generateTokens(user, [], true);

    LoggingService.info(`Login successful for ${email}`);

    return {
      accessToken,
      refreshToken,
      user: UserMapper.toAuthResponse(user, true),
      message: I18nContext.current()?.translate('messages.login_successful'),
    };
  }
}
