import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { IUserDataResponse } from '@application/dtos/responses/user.response';
import { UpdateUserDto } from '@application/dtos/user/update-user.dto';
import { IUserRepository } from '@core/repositories/user.repository.interface';
import { LocalizedNotFoundException } from '@infrastructure/i18n';
import { Inject } from '@nestjs/common';
import { SocketMessagingService } from '@presentation/modules/socket/socket-messaging.service';
import { RolesEnum } from '@shared/constants/roles.constants';
import { SocketEventsEnum, SocketUserEventTypesEnum } from '@shared/constants/socket.constants';
import { IApiResponse } from '@shared/interfaces/api-response.interface';

export class UpdateUserCommand {
  constructor(
    public readonly userId: string,
    public readonly updateUserDto: UpdateUserDto,
  ) {}
}

@CommandHandler(UpdateUserCommand)
export class UpdateUserCommandHandler
  implements ICommandHandler<UpdateUserCommand, IApiResponse<IUserDataResponse>>
{
  constructor(
    @Inject('UserRepository') private readonly userRepository: IUserRepository,
    private readonly socketMessagingService: SocketMessagingService,
  ) {}

  async execute(command: UpdateUserCommand): Promise<IApiResponse<IUserDataResponse>> {
    const { userId, updateUserDto } = command;

    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
      relations: {
        avatar: true,
      },
    });

    if (!user) {
      throw new LocalizedNotFoundException({
        property: 'user',
        value: userId,
      });
    }

    user.updateFromDto(updateUserDto);

    if (updateUserDto.roleId) {
      const role = updateUserDto.roleId as RolesEnum;

      if (!role) {
        throw new LocalizedNotFoundException({
          property: 'role',
          value: updateUserDto.roleId,
        });
      } else {
        user.role = role;
      }
    } else {
      user.role = RolesEnum.USER;
    }

    await this.userRepository.updateFromDomain(user);

    await this.socketMessagingService.sendToUser(userId, SocketEventsEnum.USER, {
      type: SocketUserEventTypesEnum.DATA,
      data: user.buildUserData(),
    });

    return {
      message: 'User updated successfully',
      data: user.buildUserData(),
    };
  }
}
