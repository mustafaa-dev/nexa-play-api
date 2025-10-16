import { BaseDomainEvent } from '@core/events/base.event';
import { SocketNotificationStatusEnum } from '@shared/constants/socket.constants';

export class NotificationEvent extends BaseDomainEvent {
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

export class BroadcastNotificationEvent extends BaseDomainEvent {
  constructor(
    public readonly userIds: string[],
    public readonly event: string,
    public readonly data: unknown,
  ) {
    super();
  }
}
