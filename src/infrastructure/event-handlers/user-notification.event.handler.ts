import { Notification } from '@core/entities/notification.entity';
import { UserNotificationEvent } from '@core/events/user.events';
import { IUserRepository } from '@core/repositories/user.repository.interface';
import { LoggingService } from '@infrastructure/logging/logging.service';
import { NotificationRepository } from '@infrastructure/repositories/notification.repository';
import { Inject, Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { SocketMessagingService } from '@presentation/modules/socket/socket-messaging.service';
import {
  SocketNotificationStatusEnum,
  SocketNotificationTypeEnum,
} from '@shared/constants/socket.constants';

@Injectable()
@EventsHandler(UserNotificationEvent)
export class UserNotificationEventHandler implements IEventHandler<UserNotificationEvent> {
  constructor(
    private socketMessaging: SocketMessagingService,
    @Inject('NotificationRepository')
    private readonly notificationRepository: NotificationRepository,
    @Inject('UserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async handle(event: UserNotificationEvent): Promise<void> {
    try {
      LoggingService.debug(
        `Processing notification event for user ${event.userId} (eventId: ${event.eventId}) - Occurred on: ${event.occurredOn} - Handler: ${this.constructor.name} - ${event.eventId} - ${event.title} - ${event.type}`,
        {
          context: 'UserNotificationEventHandler::handle',
        },
      );

      const user = await this.userRepository.findById(event.userId);

      const notification = new Notification({
        title: event.title,
        message: event.message,
        status: SocketNotificationStatusEnum.INFO,
        type: SocketNotificationTypeEnum.USER,
        data: event.data as Record<string, unknown>,
        user: user,
      });

      await this.notificationRepository.createFromDomain(notification);

      // Send notification to the user
      const success = await this.socketMessaging.sendNotification(event.userId, {
        title: event.title,
        message: event.message,
        status: SocketNotificationStatusEnum.INFO,
        type: SocketNotificationTypeEnum.USER,
        data: event.data,
      });

      if (success) {
        LoggingService.info(
          `Notification sent successfully to user ${event.userId} - eventId: ${event.eventId} - title: ${event.title} - type: ${event.type} `,
          {
            context: 'UserNotificationEventHandler::handle',
          },
        );
      } else {
        LoggingService.warn(
          `Failed to send notification to user ${event.userId} - eventId: ${event.eventId} - title: ${event.title} - type: ${event.type}`,
          {
            context: 'UserNotificationEventHandler::handle',
          },
        );
      }
    } catch (error) {
      LoggingService.error(`Error processing notification event: ${error.message}`, {
        context: 'UserNotificationEventHandler::handle',
        eventId: event.eventId,
        userId: event.userId,
        title: event.title,
        type: event.type,
        error: error.stack,
      });
    }
  }
}
