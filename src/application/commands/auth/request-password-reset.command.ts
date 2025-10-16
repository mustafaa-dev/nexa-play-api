import { RequestPasswordResetDto } from '@application/dtos/auth/password-reset.dto';
import { AuthService } from '@core/services/auth.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs';
import { EmailProvider } from '@presentation/modules/auth/providers/email.provider';
import { I18nContext } from 'nestjs-i18n';

export class RequestPasswordResetCommand implements ICommand {
  constructor(public readonly dto: RequestPasswordResetDto) {}
}

@Injectable()
@CommandHandler(RequestPasswordResetCommand)
export class RequestPasswordResetCommandHandler
  implements ICommandHandler<RequestPasswordResetCommand, { message: string }>
{
  constructor(
    private readonly authService: AuthService,
    private readonly emailProvider: EmailProvider,
  ) {}

  async execute(command: RequestPasswordResetCommand): Promise<{ message: string }> {
    const { email } = command.dto;

    try {
      // Generate a reset token
      const token = await this.authService.createPasswordResetToken(email);

      // Send the password reset email
      await this.emailProvider.sendPasswordResetEmail(email, token);

      return {
        message: I18nContext.current()?.translate(
          'messages.password_reset_email_sent_successfully',
        ),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        // For security reasons, we don't want to reveal whether an email exists in our system
        return {
          message: I18nContext.current()?.translate(
            'messages.password_reset_email_sent_successfully',
          ),
        };
      }
      throw error;
    }
  }
}
