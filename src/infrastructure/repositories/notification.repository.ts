import { Notification } from '@core/entities/notification.entity';
import { INotificationRepository } from '@core/repositories/notification.repository.interface';
import { NotificationEntity } from '@infrastructure/database/entities/notification.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from './base.repository';

@Injectable()
export class NotificationRepository
  extends BaseRepository<Notification, NotificationEntity>
  implements INotificationRepository
{
  constructor(
    @InjectRepository(NotificationEntity)
    readonly notificationRepository: Repository<NotificationEntity>,
  ) {
    super(notificationRepository);
  }

  protected mapToDomain(entity: NotificationEntity): Notification {
    return Notification.fromStore(entity);
  }
}
