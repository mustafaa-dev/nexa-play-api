import { ICommand, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { AuthService } from '@core/services/auth.service';

export class Verify2FACommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly token: string,
  ) {}
}

@Injectable()
@CommandHandler(Verify2FACommand)
export class Verify2FACommandHandler
  implements ICommandHandler<Verify2FACommand, { verified: boolean }>
{
  constructor(private readonly authService: AuthService) {}

  async execute(command: Verify2FACommand): Promise<{ verified: boolean }> {
    const { userId, token } = command;

    // Verify the 2FA token
    const isVerified = await this.authService.verifyTwoFactorToken(userId, token);

    return { verified: isVerified };
  }
}
