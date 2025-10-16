import { SendVerificationEmailDto } from '@application/dtos/auth/email-verification.dto';
import { AuthService } from '@core/services/auth.service';
import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs';
import { EmailProvider } from '@presentation/modules/auth/providers/email.provider';
import { I18nContext } from 'nestjs-i18n';

export class SendVerificationEmailCommand implements ICommand {
  constructor(public readonly dto: SendVerificationEmailDto) {}
}

@Injectable()
@CommandHandler(SendVerificationEmailCommand)
export class SendVerificationEmailCommandHandler
  implements ICommandHandler<SendVerificationEmailCommand, { message: string }>
{
  constructor(
    private readonly authService: AuthService,
    private readonly emailProvider: EmailProvider,
  ) {}

  async execute(command: SendVerificationEmailCommand): Promise<{ message: string }> {
    const { email } = command.dto;

    // Generate a verification code
    const code = await this.authService.generateEmailVerificationCode(email);

    // Send the verification email
    await this.emailProvider.sendVerificationCode(email, code);

    return {
      message: I18nContext.current()?.translate('messages.verification_email_sent_successfully'),
    };
  }
}
