import { NotificationRepository } from '@infrastructure/repositories/notification.repository';
import { UserRepository } from '@infrastructure/repositories/user.repository';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EmailProvider } from '@presentation/modules/auth/providers/email.provider';
import { SocketModule } from '@presentation/modules/socket/socket.module';
import { UserModule } from '@presentation/modules/user/user.module';
import { BroadcastMessageEventHandler } from './broadcast-message.event.handler';
import { UserNotificationEventHandler } from './user-notification.event.handler';
import { UserSocketConnectedEventHandler } from './user-socket-connected.event.handler';
import { UserSocketMessageEventHandler } from './user-socket-message.event.handler';
import { UserStatusUpdateEventHandler } from './user-status-update.event.handler';

@Module({
  imports: [CqrsModule, SocketModule, UserModule],
  providers: [
    {
      provide: 'NotificationRepository',
      useClass: NotificationRepository,
    },
    {
      provide: 'UserRepository',
      useClass: UserRepository,
    },
    UserSocketConnectedEventHandler,
    UserSocketMessageEventHandler,
    UserNotificationEventHandler,
    BroadcastMessageEventHandler,
    UserStatusUpdateEventHandler,
    EmailProvider,
  ],
  exports: [
    UserSocketConnectedEventHandler,
    UserSocketMessageEventHandler,
    UserNotificationEventHandler,
    BroadcastMessageEventHandler,
    UserStatusUpdateEventHandler,
  ],
})
export class EventHandlersModule {}
