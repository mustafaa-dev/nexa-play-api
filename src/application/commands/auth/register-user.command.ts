import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs';

import { RegisterDto } from '@application/dtos/auth/register.dto';
import { IUserBaseResponse } from '@application/dtos/responses/user.response';
import { UserMapper } from '@application/mappers/user.mapper';
import { UserService } from '@core/services/user.service';
import { Injectable } from '@nestjs/common';
import { EmailProvider } from '@presentation/modules/auth/providers/email.provider';

export class RegisterUserCommand implements ICommand {
  constructor(public readonly registerDto: RegisterDto) {}
}

@Injectable()
@CommandHandler(RegisterUserCommand)
export class RegisterUserCommandHandler implements ICommandHandler<RegisterUserCommand> {
  constructor(
    private readonly userService: UserService,
    private readonly emailProvider: EmailProvider,
  ) {}

  async execute(command: RegisterUserCommand): Promise<IUserBaseResponse> {
    const { email, password, firstName, lastName, phoneNumber } = command.registerDto;

    const user = await this.userService.createUser(
      password,
      firstName,
      lastName,
      phoneNumber,
      email,
    );

    await this.emailProvider.sendWelcomeEmail(email, firstName);

    return UserMapper.toBaseResponse(user);
  }
}
