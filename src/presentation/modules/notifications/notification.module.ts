import { CreateSystemNotificationCommandHandler } from '@application/commands/notifications/create-system-notification.command';
import { DeleteSystemNotificationCommandHandler } from '@application/commands/notifications/delete-system-notification.command';
import { ReadNotificationCommandHandler } from '@application/commands/notifications/read-notification.command';
import { UpdateSystemNotificationCommandHandler } from '@application/commands/notifications/update-system-notification.command';
import { GetNotificationsQueryHandler } from '@application/queries/notifications/get-notification.query';
import { GetSystemNotificationsQueryHandler } from '@application/queries/notifications/get-system-notification.query';
import { NotificationRepository } from '@infrastructure/repositories/notification.repository';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { NotificationAdminController } from './notification.admin.controller';
import { NotificationController } from './notification.controller';

const QueryHandlers = [GetNotificationsQueryHandler, GetSystemNotificationsQueryHandler];
const CommandHandlers = [
  ReadNotificationCommandHandler,
  CreateSystemNotificationCommandHandler,
  UpdateSystemNotificationCommandHandler,
  DeleteSystemNotificationCommandHandler,
];
@Module({
  imports: [CqrsModule],
  controllers: [NotificationAdminController, NotificationController],
  providers: [
    { provide: 'NotificationRepository', useClass: NotificationRepository },
    ...QueryHandlers,
    ...CommandHandlers,
  ],
})
export class NotificationModule {}
