import { ActivityLog } from '@core/entities/activity-log.entity';
import { ActivityLogEntity } from '@infrastructure/database/entities/activity-log.entity';
import { IBaseRepository } from './base.repository.interface';

export interface IActivityLogRepository extends IBaseRepository<ActivityLog, ActivityLogEntity> {
  // Activity log specific methods
  findByUserID(userId: string): Promise<ActivityLog[] | null>;
}
