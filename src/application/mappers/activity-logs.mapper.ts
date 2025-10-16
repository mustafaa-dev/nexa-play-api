import {
  IActivityLogBaseResponse,
  IActivityLogDetailResponse,
} from '@application/dtos/responses/activity-logs.response';

import { ActivityLog } from '@core/entities/activity-log.entity';
import { UserMapper } from './user.mapper';

export class ActivityLogsMapper {
  /**
   * Maps a Role entity to a RoleDetailResponse DTO
   */
  static toBaseResponse(activityLog: ActivityLog): IActivityLogBaseResponse {
    return {
      id: activityLog.id,
      action: activityLog.action,
      resourceId: activityLog.resourceId,
      resourceType: activityLog.resourceType,
      properties: activityLog.properties,
      description: activityLog.description,
      ipAddress: activityLog.ipAddress,
      userAgent: activityLog.userAgent,
      createdAt: activityLog.createdAt,
    };
  }

  static toDetailUserResponse(activityLog: ActivityLog): IActivityLogDetailResponse {
    return {
      id: activityLog.id,
      action: activityLog.action,
      resourceId: activityLog.resourceId,
      resourceType: activityLog.resourceType,
      properties: activityLog.properties,
      description: activityLog.description,
      ipAddress: activityLog.ipAddress,
      userAgent: activityLog.userAgent,
      createdAt: activityLog.createdAt,
      user: UserMapper.toDetailResponse(activityLog.user),
    };
  }

  static toDetailAdminResponse(activityLog: ActivityLog): IActivityLogDetailResponse {
    return {
      ...this.toDetailUserResponse(activityLog),
      user: UserMapper.toDetailResponse(activityLog.user),
    };
  }
}
