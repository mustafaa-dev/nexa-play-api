import { User } from '@core/entities/user.entity';
import { UserSocketConnectedEvent } from '@core/events/user.events';
import { INotificationRepository } from '@core/repositories/notification.repository.interface';
import { IUserRepository } from '@core/repositories/user.repository.interface';
import { LoggingService } from '@infrastructure/logging/logging.service';
import { Inject, Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { SocketMessagingService } from '@presentation/modules/socket/socket-messaging.service';
import {
  SocketEventsEnum,
  SocketNotificationTypeEnum,
  SocketUserEventTypesEnum,
} from '@shared/constants/socket.constants';

@Injectable()
@EventsHandler(UserSocketConnectedEvent)
export class UserSocketConnectedEventHandler implements IEventHandler<UserSocketConnectedEvent> {
  constructor(
    private socketMessaging: SocketMessagingService,
    @Inject('UserRepository') private userRepository: IUserRepository,
    @Inject('NotificationRepository')
    private notificationRepository: INotificationRepository,
  ) {}

  async handle(event: UserSocketConnectedEvent): Promise<void> {
    try {
      LoggingService.debug(
        `Processing socket connected event for user ${event.userId} (eventId: ${event.eventId}) ${event.occurredOn} `,
        {
          context: 'UserSocketConnectedEventHandler::handle',
        },
      );

      const user = await this.userRepository.findOne({
        where: { id: event.userId },
        relations: { avatar: true },
      });

      if (!user) {
        LoggingService.error(
          `User not found for socket connected event for user ${event.userId} (eventId: ${event.eventId})`,
          {
            context: 'UserSocketConnectedEventHandler::handle',
          },
        );
        return;
      }

      await this.sendConnectionNotification(event);
      await this.sendClientData(event, user);
      await this.sendSystemNotification(event);

      LoggingService.info(
        `Socket connected event processed successfully for user ${event.userId} (eventId: ${event.eventId})`,
        {
          context: 'UserSocketConnectedEventHandler::handle',
          eventId: event.eventId,
        },
      );
    } catch (error) {
      LoggingService.error(
        `Failed to process socket connected event: ${error.message} ${event.eventId}`,
        {
          context: 'UserSocketConnectedEventHandler::handle',
          error: error.stack,
        },
      );
    }
  }

  private async sendConnectionNotification(event: UserSocketConnectedEvent): Promise<void> {
    try {
      await this.socketMessaging.sendToUser(event.userId, SocketEventsEnum.USER, {
        type: SocketUserEventTypesEnum.AUTHENTICATION,
        status: 'connected',
        timestamp: new Date().toISOString(),
        eventId: event.eventId,
      });

      LoggingService.debug(
        `Connection notification sent to user ${event.userId} for event ${event.eventId}`,
        {
          context: 'UserSocketConnectedEventHandler::sendConnectionNotification',
        },
      );
    } catch (error) {
      LoggingService.error(`Failed to send connection notification: ${error.message}`, {
        context: 'UserSocketConnectedEventHandler::sendConnectionNotification',
        eventId: event.eventId,
        userId: event.userId,
        socketId: event.socketId,
      });
      throw error;
    }
  }

  private async sendClientData(event: UserSocketConnectedEvent, user: User): Promise<void> {
    await this.socketMessaging.sendToUser(event.userId, SocketEventsEnum.USER, {
      type: SocketUserEventTypesEnum.DATA,
      data: user.buildUserData(),
    });

    LoggingService.debug(`Client data sent to user ${event.userId} for event ${event.eventId}`, {
      context: 'UserSocketConnectedEventHandler::sendClientData',
    });
  }

  private async sendSystemNotification(event: UserSocketConnectedEvent): Promise<void> {
    const notifications = await this.notificationRepository.findMany({
      where: {
        type: SocketNotificationTypeEnum.SYSTEM,
        isVisible: true,
      },
    });

    for (const notification of notifications) {
      await this.socketMessaging.sendToUser(event.userId, SocketEventsEnum.NOTIFICATION, {
        title: notification.title,
        message: notification.message,
        status: notification.status,
        type: notification.type,
      });
    }
  }
}
