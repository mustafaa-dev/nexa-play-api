import { UpdateSystemNotificationDto } from '@application/dtos/notification/update-system-notification.dto';
import { Notification } from '@core/entities/notification.entity';
import { INotificationRepository } from '@core/repositories/notification.repository.interface';
import { LocalizedNotFoundException } from '@infrastructure/i18n';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SocketMessagingService } from '@presentation/modules/socket/socket-messaging.service';
import { SocketNotificationTypeEnum } from '@shared/constants/socket.constants';
import { IApiResponse } from '@shared/interfaces/api-response.interface';

export class UpdateSystemNotificationCommand {
  constructor(
    public readonly id: string,
    public readonly dto: UpdateSystemNotificationDto,
  ) {}
}

@CommandHandler(UpdateSystemNotificationCommand)
export class UpdateSystemNotificationCommandHandler
  implements ICommandHandler<UpdateSystemNotificationCommand, IApiResponse<Notification>>
{
  constructor(
    @Inject('NotificationRepository')
    private readonly notificationRepository: INotificationRepository,
    private readonly socketMessaging: SocketMessagingService,
  ) {}

  async execute(command: UpdateSystemNotificationCommand): Promise<IApiResponse<Notification>> {
    const { id, dto } = command;

    const notification = await this.notificationRepository.findById(id);

    if (!notification) {
      throw new LocalizedNotFoundException({
        property: 'notification',
        value: id,
      });
    }

    notification.updateFromDto(dto);

    const updatedNotification = await this.notificationRepository.updateFromDomain(notification);

    if (updatedNotification.isVisible) {
      await this.socketMessaging.broadcastNotification({
        title: updatedNotification.title,
        message: updatedNotification.message,
        status: updatedNotification.status,
        type: SocketNotificationTypeEnum.SYSTEM,
      });
    }

    return {
      message: 'System notification updated',
      data: notification,
    };
  }
}
