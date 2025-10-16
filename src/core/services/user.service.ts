import { UserSocketMessageEvent } from '@core/events/user.events';

import { Email } from '@core/value-objects/email.vo';

import { Password } from '@core/value-objects/password.vo';

import { Username } from '@core/value-objects/username.vo';

import { LoggingService } from '@infrastructure/logging/logging.service';

import { Inject, Injectable } from '@nestjs/common';

import {
  SocketEventsEnum,
  SocketNotificationStatusEnum,
  SocketUserEventTypesEnum,
} from '@shared/constants/socket.constants';

import { User } from '@core/entities/user.entity';

import { IUserRepository } from '@core/repositories/user.repository.interface';

import { EventBusService } from './event-bus.service';

import {
  LocalizedConflictException,
  LocalizedInvalidInputException,
  LocalizedNotFoundException,
} from '@infrastructure/i18n';
import { RolesEnum } from '@shared/constants/roles.constants';
import { SocketEventService } from './socket-event.service';

@Injectable()
export class UserService {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: IUserRepository,
    private readonly eventBusService: EventBusService,
    private readonly socketEventService: SocketEventService,
  ) {}

  /**
   * Creates a new user with validation and event publishing
   */
  async createUser(
    passwordStr: string,
    firstName: string,
    lastName: string,
    phoneNumber: string,
    email: string,
  ): Promise<User> {
    // Validate email format using value object
    const emailVO = new Email(email);

    // Check if user already exists
    await this.ensureUserDoesNotExist(emailVO.getValue());

    // Create a new user
    const user = this.buildUserEntity({
      passwordStr,
      firstName,
      lastName,
      email,
      phoneNumber,
    });
    user.role = RolesEnum.USER;

    // Save the user
    const savedUser = await this.userRepository.createFromDomain(user);

    // Publish domain events and send notifications
    await this.handleUserCreationEvents(savedUser);

    return savedUser;
  }

  /**
   * Validates user credentials for authentication
   */
  async validateCredentials(username: string, passwordStr: string): Promise<User | null> {
    try {
      // Validate input
      if (!username || !passwordStr) {
        return null;
      }

      // Validate email format using value object
      const usernameVO = new Username(username);

      // Find user with role and permissions
      const user = await this.findUserWithRoleAndPermissions(usernameVO.getValue());

      if (!user) {
        return null;
      }

      // Validate password
      const isPasswordValid = await Password.compare(passwordStr, user.passwordHash);
      if (!isPasswordValid) {
        return null;
      }

      return user;
    } catch (error) {
      // Log error but don't expose internal details
      LoggingService.error('Credential validation error:', error);
      return null;
    }
  }

  /**
   * Updates user details with validation
   */
  async updateUserDetails(
    userId: string,
    firstName?: string,
    lastName?: string,
    emailStr?: string,
  ): Promise<User> {
    // Validate user exists
    const user = await this.findUserByIdOrThrow(userId);

    // Validate email if provided
    if (emailStr) {
      await this.validateEmailUpdate(userId, emailStr);
    }

    // Update user fields
    this.updateUserFields(user, { firstName, lastName, emailStr });

    // Save and return updated user
    return this.userRepository.updateFromDomain(user);
  }

  /**
   * Verifies current password for security operations
   */
  async verifyCurrentPassword(userId: string, currentPassword: string): Promise<boolean> {
    const user = await this.findUserByIdOrThrow(userId);
    return Password.compare(currentPassword, user.passwordHash);
  }

  /**
   * Changes user password with validation
   */
  async changePassword(
    userId: string,
    newPasswordStr: string,
    currentPassword?: string,
  ): Promise<User> {
    const user = await this.findUserByIdOrThrow(userId);

    // Validate current password if provided
    if (currentPassword) {
      await this.validateCurrentPassword(user, currentPassword);
    }

    // Update password
    user.setPassword(newPasswordStr);
    user.touch();

    return this.userRepository.updateFromDomain(user);
  }

  /**
   * Activates a user account
   */
  async activateUser(userId: string): Promise<User> {
    const user = await this.findUserByIdOrThrow(userId);
    user.activate();
    return this.userRepository.updateFromDomain(user);
  }

  /**
   * Deactivates a user account
   */
  async deactivateUser(userId: string): Promise<User> {
    const user = await this.findUserByIdOrThrow(userId);
    user.deactivate();
    return this.userRepository.updateFromDomain(user);
  }

  private async ensureUserDoesNotExist(email: string): Promise<void> {
    const existingUser = await this.userRepository.findOne({
      where: { email },
      relations: {
        avatar: true,
      },
    });

    if (existingUser) {
      throw new LocalizedConflictException('errors.already_exists', {
        property: 'email',
        value: email,
      });
    }
  }

  private buildUserEntity(userData: {
    passwordStr: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  }): User {
    return new User({
      passwordHash: userData.passwordStr,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phoneNumber: userData.phoneNumber,
    });
  }

  private async handleUserCreationEvents(user: User): Promise<void> {
    // Publish domain events from the aggregate
    await this.eventBusService.publish(
      new UserSocketMessageEvent(user.id, SocketEventsEnum.USER, {
        type: SocketUserEventTypesEnum.AUTHENTICATION,
        data: {
          userId: user.id,
          socketId: '123',
          connectionInfo: {
            ip: '127.0.0.1',
            userAgent: 'test',
          },
        },
      }),
    );

    // Send welcome notification via socket
    await this.socketEventService.publishUserNotification(
      user.id,
      'Welcome!',
      `Welcome ${user.firstName}! Your account has been created successfully.`,
      SocketNotificationStatusEnum.SUCCESS,
    );
  }

  private async findUserWithRoleAndPermissions(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
      relations: {
        avatar: true,
      },
    });
  }

  private async findUserByIdOrThrow(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new LocalizedNotFoundException({
        property: 'user',
        value: userId,
      });
    }
    return user;
  }

  private async validateEmailUpdate(userId: string, emailStr: string): Promise<void> {
    const email = new Email(emailStr);

    const existingUser = await this.userRepository.findOne({
      where: { email: email.getValue() },
      relations: {
        avatar: true,
      },
    });
    if (existingUser && existingUser.id !== userId) {
      throw new LocalizedConflictException('email', {
        property: 'email',
        value: email.getValue(),
      });
    }
  }

  private updateUserFields(
    user: User,
    updates: { firstName?: string; lastName?: string; emailStr?: string },
  ): void {
    if (updates.firstName) {
      user.firstName = updates.firstName;
    }

    if (updates.lastName) {
      user.lastName = updates.lastName;
    }

    user.touch();
  }

  private async validateCurrentPassword(user: User, currentPassword: string): Promise<void> {
    const isCurrentPasswordValid = await Password.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new LocalizedInvalidInputException('current_password_incorrect');
    }
  }
}
