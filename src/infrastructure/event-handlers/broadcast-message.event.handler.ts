import { BroadcastMessageEvent } from '@core/events/user.events';
import { LoggingService } from '@infrastructure/logging/logging.service';
import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { SocketMessagingService } from '@presentation/modules/socket/socket-messaging.service';

@Injectable()
@EventsHandler(BroadcastMessageEvent)
export class BroadcastMessageEventHandler implements IEventHandler<BroadcastMessageEvent> {
  constructor(private socketMessaging: SocketMessagingService) {}

  async handle(event: BroadcastMessageEvent): Promise<void> {
    LoggingService.debug(`Broadcasting ${event.event} message to ${event.userIds.length} users`, {
      context: 'BroadcastMessageEventHandler::handle',
    });

    await this.socketMessaging.sendToUsers(event.userIds, event.event, event.data);
  }
}
