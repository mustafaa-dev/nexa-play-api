import { Global, Module } from '@nestjs/common';

import { GetActivityLogsQueryHandler } from '@application/queries/activity-logs/get-activity-logs.query';
import { ActivityLogsService } from '@core/services/activity-logs.service';
import { ActivityLogRepository } from '@infrastructure/repositories/activity-log.repository';
import { CqrsModule } from '@nestjs/cqrs';
import { ActivityLogInterceptor } from '@presentation/interceptors/activity-log.interceptor';
import { ActivityLogsController } from '@presentation/modules/activity-logs/activity-logs.controller';

const queryHandlers = [GetActivityLogsQueryHandler];

@Global()
@Module({
  imports: [CqrsModule],
  controllers: [ActivityLogsController],
  providers: [
    ActivityLogsService,
    ActivityLogInterceptor,
    {
      provide: 'ActivityLogRepository',
      useClass: ActivityLogRepository,
    },

    ...queryHandlers,
  ],
  exports: [],
})
export class ActivityLogsModule {}
