import * as process from 'node:process';

import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';

import { ActivityLog } from '@core/entities/activity-log.entity';
import { ActivityLogsService } from '@core/services/activity-logs.service';
import { LoggingService } from '@infrastructure/logging/logging.service';
import { Reflector } from '@nestjs/core';
import { LOGGABLE_KEY } from '@shared/decorators/loggable.decorator';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  constructor(
    private readonly activityLogsService: ActivityLogsService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const isLoggable =
      this.reflector.get<boolean>(LOGGABLE_KEY, context.getHandler()) ||
      this.reflector.get<boolean>(LOGGABLE_KEY, context.getClass());
    if (!isLoggable) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return next.handle().pipe(
      tap(async () => {
        if (user) {
          try {
            await this.activityLogsService.addLog(ActivityLog.fromRequest({ request, user }));
          } catch (error) {
            if (process.env.NODE_ENV === 'development')
              LoggingService.error('Error logging activity:', error);
          }
        }
      }),
    );
  }
}
