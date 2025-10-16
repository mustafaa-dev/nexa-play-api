import { ActivateUserCommandHandler } from '@application/commands/user/activate-user.command';
import { ChangePasswordCommandHandler } from '@application/commands/user/change-password.command';
import { CreateUserCommandHandler } from '@application/commands/user/create-user.command';
import { GetUserQueryHandler } from '@application/queries/user/get-user.query';
import { GetUsersQueryHandler } from '@application/queries/user/get-users.query';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
// Query Handlers
// Command Handlers
import { UpdateUserCommandHandler } from '@application/commands/user/update-user.command';
import { UserAdminController } from './user.admin.controller';
// Controllers
import { UserRepository } from '@infrastructure/repositories/user.repository';
// Repositories
import { UserService } from '@core/services/user.service';
// Services
import { ChangeUserPasswordCommandHandler } from '@application/commands/user/change-user-password.command';
import { DeleteUserCommandHandler } from '@application/commands/user/delete-user.command';
import { UpdateProfileCommandHandler } from '@application/commands/user/update-profile.command';
import { VerifyPasswordCommandHandler } from '@application/commands/user/verify-password.command';
import { UserUserController } from './user.user.controller';

const queryHandlers = [GetUserQueryHandler, GetUsersQueryHandler];

const commandHandlers = [
  CreateUserCommandHandler,
  UpdateUserCommandHandler,
  ChangePasswordCommandHandler,
  ActivateUserCommandHandler,
  VerifyPasswordCommandHandler,
  DeleteUserCommandHandler,
  ChangeUserPasswordCommandHandler,
  UpdateProfileCommandHandler,
];

const eventHandlers = [];

@Module({
  imports: [CqrsModule],
  controllers: [UserAdminController, UserUserController],
  providers: [
    // Services
    UserService,

    // Repository tokens
    {
      provide: 'UserRepository',
      useClass: UserRepository,
    },
    // Query handlers
    ...queryHandlers,

    // Command handlers
    ...commandHandlers,

    // Event handlers
    ...eventHandlers,
  ],
  exports: [UserService],
})
export class UserModule {}
