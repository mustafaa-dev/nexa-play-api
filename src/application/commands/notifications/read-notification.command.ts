import { User } from '@core/entities/user.entity';
import { INotificationRepository } from '@core/repositories/notification.repository.interface';
import { LocalizedNotFoundException } from '@infrastructure/i18n';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class ReadNotificationCommand {
  constructor(
    public readonly id: string,
    public readonly user: User,
  ) {}
}

@CommandHandler(ReadNotificationCommand)
export class ReadNotificationCommandHandler
  implements ICommandHandler<ReadNotificationCommand, void>
{
  constructor(
    @Inject('NotificationRepository')
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(command: ReadNotificationCommand): Promise<void> {
    const { id, user } = command;

    const notification = await this.notificationRepository.findOne({
      where: { id, user: { id: user.id } },
    });

    if (!notification) {
      throw new LocalizedNotFoundException({
        property: 'notification',
        value: id,
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();

    await this.notificationRepository.updateFromDomain(notification);
  }
}
