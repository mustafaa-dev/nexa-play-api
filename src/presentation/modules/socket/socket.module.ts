import { Global, Module } from '@nestjs/common';

import { EventBusService } from '@core/services/event-bus.service';
import { SocketEventService } from '@core/services/socket-event.service';
import { UserRepository } from '@infrastructure/repositories/user.repository';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '../auth/auth.module';
import { GlobalSocketManager } from './global-socket-manager.service';
import { SocketMessagingService } from './socket-messaging.service';
import { SocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';

@Global()
@Module({
  imports: [CqrsModule, AuthModule],

  providers: [
    {
      provide: 'UserRepository',
      useClass: UserRepository,
    },
    SocketGateway,
    SocketService,
    GlobalSocketManager,
    SocketMessagingService,
    SocketEventService,
    EventBusService,
  ],
  controllers: [],
  exports: [SocketMessagingService, SocketGateway, SocketEventService, EventBusService],
})
export class SocketModule {}
