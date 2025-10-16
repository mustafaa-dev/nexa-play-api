import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { IUserRepository } from '@core/repositories/user.repository.interface';
import { LocalizedNotFoundException } from '@infrastructure/i18n';
import { Inject } from '@nestjs/common';
import { IApiResponse } from '@shared/interfaces/api-response.interface';

export class DeleteUserCommand {
  constructor(public readonly userId: string) {}
}

@CommandHandler(DeleteUserCommand)
export class DeleteUserCommandHandler
  implements ICommandHandler<DeleteUserCommand, IApiResponse<void>>
{
  constructor(@Inject('UserRepository') private readonly userRepository: IUserRepository) {}

  async execute(command: DeleteUserCommand): Promise<IApiResponse<void>> {
    const { userId } = command;

    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new LocalizedNotFoundException({
        property: 'user',
        value: userId,
      });
    }

    await this.userRepository.repo.softDelete(userId);

    return {
      message: 'User deleted successfully',
    };
  }
}
