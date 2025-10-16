import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { User } from '@core/entities/user.entity';
import { UserService } from '@core/services/user.service';
import { LocalizedInvalidInputException } from '@infrastructure/i18n';
import { IApiResponse } from '@shared/interfaces/api-response.interface';

export class ActivateUserCommand {
  constructor(
    public readonly userId: string,
    public readonly active: boolean,
  ) {}
}

@CommandHandler(ActivateUserCommand)
export class ActivateUserCommandHandler
  implements ICommandHandler<ActivateUserCommand, IApiResponse<User>>
{
  constructor(private readonly userService: UserService) {}

  async execute(command: ActivateUserCommand): Promise<IApiResponse<User>> {
    const { userId, active } = command;

    let user: User;
    let message: string;
    if (active === true) {
      user = await this.userService.activateUser(userId);
      message = 'User activated successfully';
    } else if (active === false) {
      user = await this.userService.deactivateUser(userId);
      message = 'User deactivated successfully';
    } else {
      throw new LocalizedInvalidInputException('user');
    }

    return {
      data: user,
      message,
    };
  }
}
