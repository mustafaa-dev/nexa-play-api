import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

// DTOs
import {
  SendVerificationEmailDto,
  VerifyEmailDto,
} from '@application/dtos/auth/email-verification.dto';
import { LoginDto } from '@application/dtos/auth/login.dto';
import {
  RequestPasswordResetDto,
  ResetPasswordDto,
} from '@application/dtos/auth/password-reset.dto';
import { RefreshTokenDto } from '@application/dtos/auth/refresh-token.dto';
import { RegisterDto } from '@application/dtos/auth/register.dto';
import { VerifyOtpDto } from '@application/dtos/auth/verify-otp.dto';

// Commands
import { LoginCommand } from '@application/commands/auth/login.command';
import { LogoutCommand } from '@application/commands/auth/logout.command';
import { RefreshTokenCommand } from '@application/commands/auth/refresh-token.command';
import { RegisterUserCommand } from '@application/commands/auth/register-user.command';
import { RequestPasswordResetCommand } from '@application/commands/auth/request-password-reset.command';
import { ResetPasswordCommand } from '@application/commands/auth/reset-password.command';
import { SendVerificationEmailCommand } from '@application/commands/auth/send-verification-email.command';
import { VerifyEmailCommand } from '@application/commands/auth/verify-email.command';
import { VerifyOtpCommand } from '@application/commands/auth/verify-otp.command';

// Guards & Decorators
import { User } from '@core/entities/user.entity';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import { APIVersions } from '@shared/constants/api-versions.constants';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { Public } from '@shared/decorators/public.decorator';
import { SkipThrottle } from '@shared/decorators/throttle.decorator';

// @Loggable()
// @Throttle(60, 15)
@UseGuards(JwtAuthGuard)
@Controller(APIVersions.General('auth'))
export class AuthController {
  constructor(private readonly commandBus: CommandBus) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.commandBus.execute(new RegisterUserCommand(registerDto));
    await this.commandBus.execute(new SendVerificationEmailCommand({ email: user.email }));
    return { user, message: 'User registered successfully, verification email sent' };
  }

  @Public()
  @SkipThrottle()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.commandBus.execute(new LoginCommand(loginDto));
  }

  @Public()
  @SkipThrottle()
  @Post('verify-otp')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.commandBus.execute(new VerifyOtpCommand(verifyOtpDto));
  }

  @Public()
  @SkipThrottle()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.commandBus.execute(new RefreshTokenCommand(refreshTokenDto));
  }

  @Post('logout')
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: User) {
    return this.commandBus.execute(new LogoutCommand(user.id, user.accessToken));
  }

  @Get('me')
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  async me(@CurrentUser() user: User) {
    return {
      data: user.buildUserData(),
    };
  }

  @Public()
  @Post('email/send-verification')
  @HttpCode(HttpStatus.OK)
  async sendVerificationEmail(@Body() sendVerificationEmailDto: SendVerificationEmailDto) {
    return this.commandBus.execute(new SendVerificationEmailCommand(sendVerificationEmailDto));
  }

  @Public()
  @Post('email/verify')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.commandBus.execute(new VerifyEmailCommand(verifyEmailDto));
  }

  @Public()
  @Post('password/request-reset')
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(@Body() requestPasswordResetDto: RequestPasswordResetDto) {
    return this.commandBus.execute(new RequestPasswordResetCommand(requestPasswordResetDto));
  }

  @Public()
  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.commandBus.execute(new ResetPasswordCommand(resetPasswordDto));
  }
}
