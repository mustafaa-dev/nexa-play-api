import { ActivityLog } from '@core/entities/activity-log.entity';
import { User } from '@core/entities/user.entity';
import { IActivityLogRepository } from '@core/repositories/activity-log.repository.interface';
import { ActivityLogEntity } from '@infrastructure/database/entities/activity-log.entity';
import { Inject, Injectable } from '@nestjs/common';
import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { RolesEnum } from '@shared/constants/roles.constants';
import { paginate, PaginateConfig, Paginated, PaginateQuery } from 'nestjs-paginate';

export class GetActivityLogsQuery implements IQuery {
  constructor(
    public readonly user: User,
    public readonly paginationQuery: PaginateQuery,
  ) {}
}

@Injectable()
@QueryHandler(GetActivityLogsQuery)
export class GetActivityLogsQueryHandler implements IQueryHandler<GetActivityLogsQuery> {
  constructor(
    @Inject('ActivityLogRepository')
    private readonly activityLogsRepository: IActivityLogRepository,
  ) {}

  async execute(query: GetActivityLogsQuery): Promise<Paginated<ActivityLog>> {
    const { user, paginationQuery } = query;

    const data = await paginate(
      paginationQuery,
      this.activityLogsRepository.repo,
      this.getPaginationConfig(user),
    );
    return {
      ...data,
      data: data.data.map(log => ActivityLog.fromStore(log)),
    } as Paginated<ActivityLog>;
  }

  private getPaginationConfig(user: User): PaginateConfig<ActivityLogEntity> {
    const config: PaginateConfig<ActivityLogEntity> = {
      sortableColumns: ['createdAt'],
      defaultSortBy: [['createdAt', 'DESC']],
      relations: {
        user: true,
      },
      searchableColumns: ['action', 'resourceType', 'description'],
      filterableColumns: {
        resourceType: true,
        action: true,
        description: true,
        ipAddress: true,
        userAgent: true,
        'user.id': true,
      },
    };

    if (user && user.role === RolesEnum.USER) {
      config.where = {
        user: {
          id: user.id,
        },
      };
    }

    return config;
  }
}
