import { INotificationRepository } from '@core/repositories/notification.repository.interface';
import { LocalizedNotFoundException } from '@infrastructure/i18n';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IApiResponse } from '@shared/interfaces/api-response.interface';

export class DeleteSystemNotificationCommand {
  constructor(public readonly id: string) {}
}

@CommandHandler(DeleteSystemNotificationCommand)
export class DeleteSystemNotificationCommandHandler
  implements ICommandHandler<DeleteSystemNotificationCommand, IApiResponse<void>>
{
  constructor(
    @Inject('NotificationRepository')
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(command: DeleteSystemNotificationCommand): Promise<IApiResponse<void>> {
    const { id } = command;

    const notification = await this.notificationRepository.findById(id);

    if (!notification) {
      throw new LocalizedNotFoundException({
        property: 'notification',
        value: id,
      });
    }

    await this.notificationRepository.delete(id);

    return {
      message: 'System notification deleted',
    };
  }
}
