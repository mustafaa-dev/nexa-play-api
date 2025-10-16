import { CreateSystemNotificationDto } from '@application/dtos/notification/create-system-notification.dto';
import { Notification } from '@core/entities/notification.entity';
import { INotificationRepository } from '@core/repositories/notification.repository.interface';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SocketMessagingService } from '@presentation/modules/socket/socket-messaging.service';
import { SocketNotificationTypeEnum } from '@shared/constants/socket.constants';
import { IApiResponse } from '@shared/interfaces/api-response.interface';

export class CreateSystemNotificationCommand {
  constructor(public readonly dto: CreateSystemNotificationDto) {}
}

@CommandHandler(CreateSystemNotificationCommand)
export class CreateSystemNotificationCommandHandler
  implements ICommandHandler<CreateSystemNotificationCommand, IApiResponse<Notification>>
{
  constructor(
    @Inject('NotificationRepository')
    private readonly notificationRepository: INotificationRepository,
    private readonly socketMessaging: SocketMessagingService,
  ) {}

  async execute(command: CreateSystemNotificationCommand): Promise<IApiResponse<Notification>> {
    const { dto } = command;

    const notification = new Notification({
      title: dto.title,
      message: dto.message,
      type: SocketNotificationTypeEnum.SYSTEM,
      status: dto.status,
      isVisible: dto.isVisible,
    });

    const createdNotification = await this.notificationRepository.createFromDomain(notification);

    if (dto.isVisible) {
      await this.socketMessaging.broadcastNotification({
        title: createdNotification.title,
        message: createdNotification.message,
        status: createdNotification.status,
        type: SocketNotificationTypeEnum.SYSTEM,
      });
    }

    return {
      message: 'System notification created',
      data: createdNotification,
    };
  }
}
