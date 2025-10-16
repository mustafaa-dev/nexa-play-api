import { ICommand, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { AuthService } from '@core/services/auth.service';

export class GenerateOtpCommand implements ICommand {
  constructor(public readonly userId: string) {}
}

@Injectable()
@CommandHandler(GenerateOtpCommand)
export class GenerateOtpCommandHandler
  implements ICommandHandler<GenerateOtpCommand, { otp: string }>
{
  constructor(private readonly authService: AuthService) {}

  async execute(command: GenerateOtpCommand): Promise<{ otp: string }> {
    const { userId } = command;

    // Generate OTP for the user
    const otp = await this.authService.generateOtp(userId);

    return { otp };
  }
}
