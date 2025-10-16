import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from '@core/services/auth.service';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthController } from './auth.controller';
import { EmailProvider } from './providers/email.provider';
// Controllers
import { EmailVerificationRepository } from '@infrastructure/repositories/email-verification.repository';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
// Strategies
import { LoginCommandHandler } from '@application/commands/auth/login.command';
import { LogoutCommandHandler } from '@application/commands/auth/logout.command';
import { RefreshTokenCommandHandler } from '@application/commands/auth/refresh-token.command';
import { OtpRepository } from '@infrastructure/repositories/otp.repository';
import { PasswordResetRepository } from '@infrastructure/repositories/password-reset.repository';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
// Command Handlers
import { RegisterUserCommandHandler } from '@application/commands/auth/register-user.command';
import { RequestPasswordResetCommandHandler } from '@application/commands/auth/request-password-reset.command';
import { ResetPasswordCommandHandler } from '@application/commands/auth/reset-password.command';
import { SendVerificationEmailCommandHandler } from '@application/commands/auth/send-verification-email.command';
import { UserRepository } from '@infrastructure/repositories/user.repository';
import { TokenProvider } from './providers/token.provider';
// Repositories
import { UserService } from '@core/services/user.service';
// Services
import { VerifyEmailCommandHandler } from '@application/commands/auth/verify-email.command';
import { VerifyOtpCommandHandler } from '@application/commands/auth/verify-otp.command';
import { RefreshTokenRepository } from '@infrastructure/repositories/refresh-token.repository';

const commandHandlers = [
  RegisterUserCommandHandler,
  LoginCommandHandler,
  VerifyOtpCommandHandler,
  RefreshTokenCommandHandler,
  LogoutCommandHandler,
  SendVerificationEmailCommandHandler,
  VerifyEmailCommandHandler,
  RequestPasswordResetCommandHandler,
  ResetPasswordCommandHandler,
];

@Module({
  imports: [
    CqrsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_ACCESS_EXPIRATION', '15m'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    // Services
    UserService,
    AuthService,

    // Repository tokens
    {
      provide: 'UserRepository',
      useClass: UserRepository,
    },
    {
      provide: 'OtpRepository',
      useClass: OtpRepository,
    },
    {
      provide: 'RefreshTokenRepository',
      useClass: RefreshTokenRepository,
    },
    {
      provide: 'EmailVerificationRepository',
      useClass: EmailVerificationRepository,
    },
    {
      provide: 'PasswordResetRepository',
      useClass: PasswordResetRepository,
    },

    // Providers
    EmailProvider,
    TokenProvider,

    // Strategy
    JwtStrategy,

    // Command handlers
    ...commandHandlers,
  ],
  exports: [AuthService, TokenProvider],
})
export class AuthModule {}
