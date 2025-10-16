import { GetActivityLogsQuery } from '@application/queries/activity-logs/get-activity-logs.query';
import { User } from '@core/entities/user.entity';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import { APIVersions } from '@shared/constants/api-versions.constants';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { PaginateQuery } from 'nestjs-paginate';

@Controller(APIVersions.General('activity-logs'))
@UseGuards(JwtAuthGuard)
export class ActivityLogsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async getActivityLogs(@CurrentUser() user: User, @Query() paginationQuery: PaginateQuery) {
    return await this.queryBus.execute(new GetActivityLogsQuery(user, paginationQuery));
  }
}
