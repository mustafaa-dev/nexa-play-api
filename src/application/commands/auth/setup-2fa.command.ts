import { ICommand, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { AuthService } from '@core/services/auth.service';

export class Setup2FACommand implements ICommand {
  constructor(public readonly userId: string) {}
}

@Injectable()
@CommandHandler(Setup2FACommand)
export class Setup2FACommandHandler
  implements ICommandHandler<Setup2FACommand, { secret: string; qrCodeUrl: string }>
{
  constructor(private readonly authService: AuthService) {}

  async execute(command: Setup2FACommand): Promise<{ secret: string; qrCodeUrl: string }> {
    const { userId } = command;

    // Setup 2FA for the user
    return this.authService.setupTwoFactorAuth(userId);
  }
}
