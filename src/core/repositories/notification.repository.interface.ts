import { Notification } from '@core/entities/notification.entity';
import { NotificationEntity } from '@infrastructure/database/entities/notification.entity';
import { IBaseRepository } from './base.repository.interface';

export interface INotificationRepository
  extends IBaseRepository<Notification, NotificationEntity> {}
