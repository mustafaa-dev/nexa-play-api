import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { CreateUserDto } from '@application/dtos/user/create-user.dto';
import { User } from '@core/entities/user.entity';
import { UserService } from '@core/services/user.service';
import { IApiResponse } from '@shared/interfaces/api-response.interface';

export class CreateUserCommand {
  constructor(public readonly createUserDto: CreateUserDto) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserCommandHandler
  implements ICommandHandler<CreateUserCommand, IApiResponse<User>>
{
  constructor(private readonly userService: UserService) {}

  async execute(command: CreateUserCommand): Promise<IApiResponse<User>> {
    const { password, firstName, lastName, phoneNumber, email } = command.createUserDto;

    const user = await this.userService.createUser(
      password,
      firstName,
      lastName,
      phoneNumber,
      email,
    );

    return {
      data: user,
      message: 'User created successfully',
    };
  }
}
