import { UserStatusUpdateEvent } from '@core/events/user.events';
import { LoggingService } from '@infrastructure/logging/logging.service';
import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { SocketMessagingService } from '@presentation/modules/socket/socket-messaging.service';
import { SocketEventsEnum, SocketUserEventTypesEnum } from '@shared/constants/socket.constants';

@Injectable()
@EventsHandler(UserStatusUpdateEvent)
export class UserStatusUpdateEventHandler implements IEventHandler<UserStatusUpdateEvent> {
  constructor(private socketMessaging: SocketMessagingService) {}

  async handle(event: UserStatusUpdateEvent): Promise<void> {
    LoggingService.debug(`User status update for user ${event.userId}`, {
      context: 'UserStatusUpdateEventHandler::handle',
      status: event.status,
    });

    await this.socketMessaging.sendToUser(event.userId, SocketEventsEnum.USER, {
      type: SocketUserEventTypesEnum.UPDATE,
      status: event.status,
      data: event.data,
      timestamp: new Date().toISOString(),
    });
  }
}
