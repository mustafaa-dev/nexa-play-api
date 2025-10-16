import { ReadNotificationCommand } from '@application/commands/notifications/read-notification.command';
import { GetNotificationsQuery } from '@application/queries/notifications/get-notification.query';
import { User } from '@core/entities/user.entity';
import { Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import { APIVersions } from '@shared/constants/api-versions.constants';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { Paginate, PaginateQuery } from 'nestjs-paginate';

@Controller(APIVersions.General('notifications'))
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get()
  async getNotifications(@CurrentUser() user: User, @Paginate() query: PaginateQuery) {
    return await this.queryBus.execute(new GetNotificationsQuery(user, query));
  }

  @HttpCode(HttpStatus.OK)
  @Post(':id/read')
  async readNotification(@Param('id') id: string, @CurrentUser() user: User) {
    return await this.commandBus.execute(new ReadNotificationCommand(id, user));
  }
}
