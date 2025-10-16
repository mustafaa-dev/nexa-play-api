import { CreateSystemNotificationCommand } from '@application/commands/notifications/create-system-notification.command';
import { DeleteSystemNotificationCommand } from '@application/commands/notifications/delete-system-notification.command';
import { UpdateSystemNotificationCommand } from '@application/commands/notifications/update-system-notification.command';
import { CreateSystemNotificationDto } from '@application/dtos/notification/create-system-notification.dto';
import { UpdateSystemNotificationDto } from '@application/dtos/notification/update-system-notification.dto';
import { GetSystemNotificationsQuery } from '@application/queries/notifications/get-system-notification.query';
import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@presentation/guards/roles.guard';
import { APIVersions } from '@shared/constants/api-versions.constants';
import { Paginate, PaginateQuery } from 'nestjs-paginate';

@Controller(APIVersions.Admin('notifications'))
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationAdminController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('system')
  async getSystemNotifications(@Paginate() query: PaginateQuery) {
    return await this.queryBus.execute(new GetSystemNotificationsQuery(query));
  }

  @Post('system')
  async createSystemNotification(@Body() dto: CreateSystemNotificationDto) {
    return await this.commandBus.execute(new CreateSystemNotificationCommand(dto));
  }

  @Put('system/:id')
  async updateSystemNotification(
    @Param('id') id: string,
    @Body() dto: UpdateSystemNotificationDto,
  ) {
    return await this.commandBus.execute(new UpdateSystemNotificationCommand(id, dto));
  }

  @Delete('system/:id')
  async deleteSystemNotification(@Param('id') id: string) {
    return await this.commandBus.execute(new DeleteSystemNotificationCommand(id));
  }
}
