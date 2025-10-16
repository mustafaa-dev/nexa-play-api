import { Injectable } from '@nestjs/common';

import { SocketEventsEnum, SocketNotificationStatusEnum } from '@shared/constants/socket.constants';
import {
  BroadcastMessageEvent,
  UserNotificationEvent,
  UserSocketConnectedEvent,
  UserSocketDisconnectedEvent,
  UserSocketMessageEvent,
  UserStatusUpdateEvent,
} from '../events/user.events';
import { EventBusService } from './event-bus.service';

@Injectable()
export class SocketEventService {
  constructor(private readonly eventBusService: EventBusService) {}

  /**
   * Publish user socket connected event
   */
  async publishUserConnected(
    userId: string,
    socketId: string,
    connectionInfo: unknown,
  ): Promise<void> {
    await this.eventBusService.publish(
      new UserSocketConnectedEvent(userId, socketId, connectionInfo),
    );
  }

  /**
   * Publish user socket message event
   */
  async publishUserMessage(userId: string, event: SocketEventsEnum, data: unknown): Promise<void> {
    await this.eventBusService.publish(new UserSocketMessageEvent(userId, event, data));
  }

  /**
   * Publish user socket disconnected event
   */
  async publishUserDisconnected(userId: string, socketId: string, reason?: string): Promise<void> {
    await this.eventBusService.publish(new UserSocketDisconnectedEvent(userId, socketId, reason));
  }

  /**
   * Publish user notification event
   */
  async publishUserNotification(
    userId: string,
    title: string,
    message: string,
    type?: SocketNotificationStatusEnum,
    data?: unknown,
  ): Promise<void> {
    await this.eventBusService.publish(
      new UserNotificationEvent(userId, title, message, type, data),
    );
  }

  /**
   * Publish user status update event
   */
  async publishUserStatusUpdate(
    userId: string,
    status: 'online' | 'offline' | 'away',
    data?: unknown,
  ): Promise<void> {
    await this.eventBusService.publish(new UserStatusUpdateEvent(userId, status, data));
  }

  /**
   * Publish broadcast message event
   */
  async publishBroadcastMessage(userIds: string[], event: string, data: unknown): Promise<void> {
    await this.eventBusService.publish(new BroadcastMessageEvent(userIds, event, data));
  }
}
