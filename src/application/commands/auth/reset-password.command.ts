import { Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs';

import { ResetPasswordDto } from '@application/dtos/auth/password-reset.dto';
import { AuthService } from '@core/services/auth.service';
import { UserService } from '@core/services/user.service';
import { Password } from '@core/value-objects/password.vo';
import {
  LocalizedInternalServerErrorException,
  LocalizedUnauthorizedException,
} from '@infrastructure/i18n';
import { I18nContext } from 'nestjs-i18n';

export class ResetPasswordCommand implements ICommand {
  constructor(public readonly dto: ResetPasswordDto) {}
}

@Injectable()
@CommandHandler(ResetPasswordCommand)
export class ResetPasswordCommandHandler
  implements ICommandHandler<ResetPasswordCommand, { success: boolean; message: string }>
{
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  async execute(command: ResetPasswordCommand): Promise<{ success: boolean; message: string }> {
    const { email, otp, password } = command.dto;

    try {
      // Hash the new password
      const passwordHash = Password.Hash(password);

      // Reset the password
      await this.authService.resetPassword(email, otp, passwordHash);

      return {
        success: true,
        message: I18nContext.current()?.translate('messages.password_reset_successful'),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new LocalizedUnauthorizedException('errors.invalid_or_expired_otp');
      }
      throw new LocalizedInternalServerErrorException('errors.failed_to_reset_password');
    }
  }
}
