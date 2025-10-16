import { ActivityLog } from '@core/entities/activity-log.entity';
import { IActivityLogRepository } from '@core/repositories/activity-log.repository.interface';
import { ActivityLogEntity } from '@infrastructure/database/entities/activity-log.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from './base.repository';

@Injectable()
export class ActivityLogRepository
  extends BaseRepository<ActivityLog, ActivityLogEntity>
  implements IActivityLogRepository
{
  constructor(
    @InjectRepository(ActivityLogEntity) private repository: Repository<ActivityLogEntity>,
  ) {
    super(repository);
  }

  async findByUserID(userId: string): Promise<ActivityLog[] | null> {
    return this.executeWithErrorHandling('findByUserID', async () => {
      const logRecords = await this.repository.find({
        where: { user: { id: userId } },
        relations: {
          user: true,
        },
      });

      if (!logRecords) {
        return null;
      }
      return logRecords.map(logRecord => this.mapToDomain(logRecord));
    });
  }

  protected mapToDomain(entity: ActivityLogEntity): ActivityLog {
    return ActivityLog.fromStore(entity);
  }
}
