import { ActivityLog } from '@core/entities/activity-log.entity';
import { IActivityLogRepository } from '@core/repositories/activity-log.repository.interface';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ActivityLogsService {
  constructor(
    @Inject('ActivityLogRepository')
    private readonly activityLogsRepository: IActivityLogRepository,
  ) {}

  async addLog(activityLog: ActivityLog) {
    return this.activityLogsRepository.createFromDomain(activityLog);
  }
}
