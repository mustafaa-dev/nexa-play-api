import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { IUserBaseResponse } from '@application/dtos/responses/user.response';
import { UpdateProfileDto } from '@application/dtos/user/update-user.dto';
import { User } from '@core/entities/user.entity';
import { IUserRepository } from '@core/repositories/user.repository.interface';
import { StorageService } from '@infrastructure/storage/storage.service';
import { Inject } from '@nestjs/common';
import { IApiResponse } from '@shared/interfaces/api-response.interface';

export class UpdateProfileCommand {
  constructor(
    public readonly user: User,
    public readonly updateProfileDto: UpdateProfileDto,
  ) {}
}

@CommandHandler(UpdateProfileCommand)
export class UpdateProfileCommandHandler
  implements ICommandHandler<UpdateProfileCommand, IApiResponse<IUserBaseResponse>>
{
  constructor(
    @Inject('UserRepository') private readonly userRepository: IUserRepository,
    private readonly storageService: StorageService,
  ) {}

  async execute(command: UpdateProfileCommand): Promise<IApiResponse<IUserBaseResponse>> {
    const { user, updateProfileDto } = command;

    user.updateFromDto(updateProfileDto);

    if (updateProfileDto.avatarKey) {
      user.avatar = await this.storageService.getFileEntity(updateProfileDto.avatarKey);
    }

    await this.userRepository.updateFromDomain(user);

    return {
      message: 'User profile updated successfully',
      data: user.buildUserData() as unknown as IUserBaseResponse,
    };
  }
}
