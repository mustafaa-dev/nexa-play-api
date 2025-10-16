import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserService } from '@core/services/user.service';
import { IApiResponse } from '@shared/interfaces/api-response.interface';
import { User } from '@core/entities/user.entity';

export class VerifyPasswordCommand {
  constructor(
    public readonly user: User,
    public readonly password: string,
  ) {}
}

@CommandHandler(VerifyPasswordCommand)
export class VerifyPasswordCommandHandler
  implements ICommandHandler<VerifyPasswordCommand, IApiResponse<boolean>>
{
  constructor(private readonly userService: UserService) {}

  async execute(command: VerifyPasswordCommand): Promise<IApiResponse<boolean>> {
    const { user, password } = command;
    const isVerified = await this.userService.verifyCurrentPassword(user.id, password);

    return {
      message: isVerified ? 'Password is correct' : 'Password is incorrect',
      data: isVerified,
    };
  }
}
