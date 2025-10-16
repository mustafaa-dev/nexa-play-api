import { Notification } from '@core/entities/notification.entity';
import { INotificationRepository } from '@core/repositories/notification.repository.interface';
import { NotificationEntity } from '@infrastructure/database/entities/notification.entity';
import { Inject, Injectable } from '@nestjs/common';
import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { SocketNotificationTypeEnum } from '@shared/constants/socket.constants';
import {
  FilterOperator,
  paginate,
  PaginateConfig,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';

export class GetSystemNotificationsQuery implements IQuery {
  constructor(public readonly paginateQuery: PaginateQuery) {}
}

@Injectable()
@QueryHandler(GetSystemNotificationsQuery)
export class GetSystemNotificationsQueryHandler
  implements IQueryHandler<GetSystemNotificationsQuery>
{
  constructor(
    @Inject('NotificationRepository')
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(query: GetSystemNotificationsQuery): Promise<Paginated<Notification>> {
    const { paginateQuery } = query;

    const data = await paginate(
      paginateQuery,
      this.notificationRepository.repo,
      this.getPaginationConfig(),
    );

    return {
      ...data,
      data: data.data.map(notification => Notification.fromStore(notification).toJSON()),
    } as Paginated<Notification>;
  }

  private getPaginationConfig(): PaginateConfig<NotificationEntity> {
    const config: PaginateConfig<NotificationEntity> = {
      defaultSortBy: [['createdAt', 'DESC']],
      sortableColumns: ['createdAt', 'type', 'user', 'title', 'message', 'isRead', 'isVisible'],
      filterableColumns: {
        isRead: [FilterOperator.EQ],
        isVisible: [FilterOperator.EQ],
      },
      where: {
        type: SocketNotificationTypeEnum.SYSTEM,
      },

      ignoreSelectInQueryParam: true,
    };

    return config;
  }
}
