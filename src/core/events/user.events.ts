import { BaseDomainEvent } from '@core/events/base.event';
import { SocketEventsEnum, SocketNotificationStatusEnum } from '@shared/constants/socket.constants';
export class UserSocketConnectedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly socketId: string,
    public readonly connectionInfo: unknown,
  ) {
    super();
  }
}

export class UserSocketMessageEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly event: SocketEventsEnum,
    public readonly data: unknown,
  ) {
    super();
  }
}

export class UserSocketDisconnectedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly socketId: string,
    public readonly reason?: string,
  ) {
    super();
  }
}

export class UserNotificationEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly title: string,
    public readonly message: string,
    public readonly type?: SocketNotificationStatusEnum,
    public readonly data?: unknown,
  ) {
    super();
  }
}

export class UserStatusUpdateEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly status: 'online' | 'offline' | 'away',
    public readonly data?: unknown,
  ) {
    super();
  }
}

export class BroadcastMessageEvent extends BaseDomainEvent {
  constructor(
    public readonly userIds: string[],
    public readonly event: string,
    public readonly data: unknown,
  ) {
    super();
  }
}
