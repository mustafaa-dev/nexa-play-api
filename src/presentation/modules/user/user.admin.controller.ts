import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { ActivateUserCommand } from '@application/commands/user/activate-user.command';
import { ChangeUserPasswordCommand } from '@application/commands/user/change-user-password.command';
import { CreateUserCommand } from '@application/commands/user/create-user.command';
import { DeleteUserCommand } from '@application/commands/user/delete-user.command';
import { UpdateUserCommand } from '@application/commands/user/update-user.command';
import { IUserBaseResponse } from '@application/dtos/responses/user.response';
import { ChangeUserPasswordDto } from '@application/dtos/user/change-password.dto';
import { CreateUserDto } from '@application/dtos/user/create-user.dto';
import { UpdateUserDto } from '@application/dtos/user/update-user.dto';
import { GetUserQuery } from '@application/queries/user/get-user.query';
import { GetUsersQuery } from '@application/queries/user/get-users.query';
import { User } from '@core/entities/user.entity';
import { UserEntity } from '@infrastructure/database/entities/user.entity';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@presentation/guards/roles.guard';
import { APIVersions } from '@shared/constants/api-versions.constants';
import { RolesEnum } from '@shared/constants/roles.constants';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { Roles } from '@shared/decorators/roles.decorator';
import { IApiResponse } from '@shared/interfaces/api-response.interface';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';

@Controller(APIVersions.Admin('users'))
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolesEnum.ADMIN)
export class UserAdminController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto): Promise<IApiResponse<User>> {
    return this.commandBus.execute(new CreateUserCommand(createUserDto));
  }

  @Get()
  async getUsers(
    @CurrentUser() user: User,
    @Paginate() paginateQuery: PaginateQuery,
  ): Promise<Paginated<UserEntity>> {
    return this.queryBus.execute(new GetUsersQuery(user, paginateQuery));
  }

  @Get(':id')
  async getUser(@Param('id') id: string): Promise<UserEntity> {
    return this.queryBus.execute(new GetUserQuery(id));
  }

  @HttpCode(HttpStatus.OK)
  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserEntity> {
    return this.commandBus.execute(new UpdateUserCommand(id, updateUserDto));
  }

  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  async deleteUser(@Param('id') id: string): Promise<IApiResponse<void>> {
    return this.commandBus.execute(new DeleteUserCommand(id));
  }

  @HttpCode(HttpStatus.OK)
  @Patch(':id/activate/:status')
  async activateUser(
    @Param('id') id: string,
    @Param('status') status: boolean,
  ): Promise<IApiResponse<IUserBaseResponse>> {
    return this.commandBus.execute(new ActivateUserCommand(id, status));
  }

  @HttpCode(HttpStatus.OK)
  @Patch(':id/change-password')
  async updateUserPassword(
    @Param('id') id: string,
    @Body() changeUserPasswordDto: ChangeUserPasswordDto,
  ): Promise<IApiResponse<User>> {
    return this.commandBus.execute(
      new ChangeUserPasswordCommand(id, changeUserPasswordDto.newPassword),
    );
  }
}
