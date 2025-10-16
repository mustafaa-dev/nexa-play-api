import { IUserDetailResponse } from './user.response';

// Basic Permission Response dto
export interface IActivityLogBaseResponse {
  id: string;

  action: string;

  resourceId: string;

  resourceType: string;

  properties: Record<string, unknown>;

  description: Record<string, unknown>;

  ipAddress: string;

  userAgent: string;

  createdAt: Date;
}

// Basic Role Response dto
export interface IActivityLogDetailResponse extends IActivityLogBaseResponse {
  id: string;

  user: IUserDetailResponse;
}

// Detailed Role Response with permissions
export interface IActivityLogDetailResponse extends IActivityLogBaseResponse {
  user: IUserDetailResponse;
}
