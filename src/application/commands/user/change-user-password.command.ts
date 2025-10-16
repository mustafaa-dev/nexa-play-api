import { User } from '@core/entities/user.entity';
import { UserService } from '@core/services/user.service';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IApiResponse } from '@shared/interfaces/api-response.interface';

export class ChangeUserPasswordCommand {
  constructor(
    public readonly userId: string,
    public readonly newPassword: string,
  ) {}
}

@CommandHandler(ChangeUserPasswordCommand)
export class ChangeUserPasswordCommandHandler
  implements ICommandHandler<ChangeUserPasswordCommand, IApiResponse<User>>
{
  constructor(private readonly userService: UserService) {}

  async execute(command: ChangeUserPasswordCommand): Promise<IApiResponse<User>> {
    const { userId, newPassword } = command;

    const user = await this.userService.changePassword(userId, newPassword);

    return {
      data: user,
      message: 'Password changed successfully',
    };
  }
}
