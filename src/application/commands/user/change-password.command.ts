import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserService } from '@core/services/user.service';
import { User } from '@core/entities/user.entity';
import { ChangePasswordDto } from '@application/dtos/user/change-password.dto';
import { IApiResponse } from '@shared/interfaces/api-response.interface';

export class ChangePasswordCommand {
  constructor(
    public readonly user: User,
    public readonly changePasswordDto: ChangePasswordDto,
  ) {}
}

@CommandHandler(ChangePasswordCommand)
export class ChangePasswordCommandHandler
  implements ICommandHandler<ChangePasswordCommand, IApiResponse<string>>
{
  constructor(private readonly userService: UserService) {}

  async execute(command: ChangePasswordCommand): Promise<IApiResponse<string>> {
    const { user, changePasswordDto } = command;

    await this.userService.changePassword(
      user.id,
      changePasswordDto.newPassword,
      changePasswordDto.currentPassword,
    );

    return {
      message: 'Password changed successfully',
    };
  }
}
