import { UserSocketMessageEvent } from '@core/events/user.events';
import { LoggingService } from '@infrastructure/logging/logging.service';
import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { SocketMessagingService } from '@presentation/modules/socket/socket-messaging.service';

@Injectable()
@EventsHandler(UserSocketMessageEvent)
export class UserSocketMessageEventHandler implements IEventHandler<UserSocketMessageEvent> {
  constructor(private socketMessaging: SocketMessagingService) {}

  async handle(event: UserSocketMessageEvent): Promise<void> {
    try {
      LoggingService.debug(
        `Processing socket message event for user ${event.userId} (eventId: ${event.eventId})`,
        {
          context: 'UserSocketMessageEventHandler::handle',
          eventId: event.eventId,
          userId: event.userId,
          eventType: event.event,
          timestamp: event.occurredOn,
        },
      );

      // Send the update to the user
      const success = await this.socketMessaging.sendToUser(event.userId, event.event, event.data);

      if (success) {
        LoggingService.info(`Socket message sent successfully for user ${event.userId}`, {
          context: 'UserSocketMessageEventHandler::handle',
          eventId: event.eventId,
          userId: event.userId,
          eventType: event.event,
        });
      } else {
        LoggingService.warn(
          `Failed to send socket message for user ${event.userId} (eventId: ${event.eventId}) - eventType: ${event.event} - data: ${JSON.stringify(event.data)}`,
          {
            context: 'UserSocketMessageEventHandler::handle',
          },
        );
      }
    } catch (error) {
      LoggingService.error(`Error processing socket message event: ${error.message}`, {
        context: 'UserSocketMessageEventHandler::handle',
        eventId: event.eventId,
        userId: event.userId,
        eventType: event.event,
        error: error.stack,
      });
    }
  }
}
