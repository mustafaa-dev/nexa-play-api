import { ActivityLogEntity } from '@infrastructure/database/entities/activity-log.entity';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

interface IActivityLogProps {
  request: Request;
  user?: User;
}

export class ActivityLog extends BaseEntity<ActivityLogEntity> {
  private readonly _properties: Record<string, unknown>;
  private readonly _description: Record<string, unknown>;
  private readonly _ipAddress: string;
  private readonly _userAgent: string;
  private readonly _resourceId: string | null;
  private readonly _resourceType: string;
  private readonly _action: string;

  constructor(
    id: string,
    action: string,
    resourceId: string | null,
    resourceType: string,
    properties: Record<string, unknown>,
    description: Record<string, unknown>,
    ipAddress: string,
    userAgent: string,
    createdAt: Date,
  ) {
    super({ id, createdAt, updatedAt: createdAt });
    this._action = action;
    this._resourceId = resourceId;
    this._resourceType = resourceType;
    this._properties = properties;
    this._description = description;
    this._ipAddress = ipAddress;
    this._userAgent = userAgent;
  }

  get action(): string {
    return this._action;
  }

  get resourceId(): string | null {
    return this._resourceId;
  }

  get resourceType(): string {
    return this._resourceType;
  }

  private _user: User;

  get user(): User {
    return this._user;
  }

  set user(user: User) {
    this._user = user;
  }

  get properties(): Record<string, unknown> {
    return this._properties;
  }

  get description(): Record<string, unknown> {
    return this._description;
  }

  get ipAddress(): string {
    return this._ipAddress;
  }

  get userAgent(): string {
    return this._userAgent;
  }

  static fromRequest(requestProps: IActivityLogProps): ActivityLog {
    const user = requestProps.user as User;
    const req = requestProps.request;
    const id = uuidv4();
    const action = req.path;
    const resourceId =
      Object.entries(req.params).find(([key]) => key.includes('id'))?.[1] ?? 'unknown';
    const resourceType = req.path.split('/')[3] ?? 'unknown';
    const properties = { body: { ...req.body, password: undefined } };
    const description = { method: req.method };
    const ipAddress = req.ip || req.socket?.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const createdAt = new Date();

    const activityLog = new ActivityLog(
      id,
      action,
      resourceId,
      resourceType,
      properties,
      description,
      ipAddress,
      userAgent,
      createdAt,
    );

    if (user) {
      activityLog.user = user;
    }
    return activityLog;
  }

  static fromStore(data: ActivityLogEntity): ActivityLog {
    const activityLog = new ActivityLog(
      data.id,
      data.action,
      data.resourceId,
      data.resourceType,
      data.properties,
      data.description,
      data.ipAddress,
      data.userAgent,
      data.createdAt,
    );

    if (data.user) {
      activityLog.user = User.fromStore(data.user);
    }

    return activityLog;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      action: this.action,
      resourceId: this.resourceId,
      resourceType: this.resourceType,
      properties: this.properties,
      description: this.description,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      user: this.user?.toJSON(),
    };
  }

  toStore(): ActivityLogEntity {
    return Object.assign(new ActivityLogEntity(), {
      id: this.id,
      user: this?._user?.toStore(),
      action: this.action,
      resourceId: this.resourceId,
      resourceType: this.resourceType,
      properties: this.properties,
      description: this.description,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    });
  }
}
