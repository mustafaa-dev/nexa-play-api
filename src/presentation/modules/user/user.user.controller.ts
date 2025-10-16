import { Body, Controller, HttpCode, HttpStatus, Patch, Put, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { UpdateProfileDto } from '@application/dtos/user/update-user.dto';
import { User } from '@core/entities/user.entity';
import { UserEntity } from '@infrastructure/database/entities/user.entity';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import { APIVersions } from '@shared/constants/api-versions.constants';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { UpdateProfileCommand } from '@application/commands/user/update-profile.command';
import { ChangePasswordCommand } from '@application/commands/user/change-password.command';
import { ChangePasswordDto } from '@application/dtos/user/change-password.dto';
import { VerifyPasswordCommand } from '@application/commands/user/verify-password.command';

@Controller(APIVersions.User('users'))
@UseGuards(JwtAuthGuard)
export class UserUserController {
  constructor(private readonly commandBus: CommandBus) {}

  @HttpCode(HttpStatus.OK)
  @Put('me')
  async updateProfile(
    @Body() updateUserDto: UpdateProfileDto,
    @CurrentUser() user: User,
  ): Promise<UserEntity> {
    return this.commandBus.execute(new UpdateProfileCommand(user, updateUserDto));
  }

  @HttpCode(HttpStatus.OK)
  @Patch('me/change-password')
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @CurrentUser() user: User,
  ): Promise<UserEntity> {
    return this.commandBus.execute(new ChangePasswordCommand(user, changePasswordDto));
  }

  @HttpCode(HttpStatus.OK)
  @Patch('me/verify-password')
  async verifyPassword(
    @Body('password') password: string,
    @CurrentUser() user: User,
  ): Promise<UserEntity> {
    return this.commandBus.execute(new VerifyPasswordCommand(user, password));
  }
}
