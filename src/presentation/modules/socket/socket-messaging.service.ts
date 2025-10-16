import { LoggingService } from '@infrastructure/logging/logging.service';
import { Injectable } from '@nestjs/common';
import {
  SocketEventsEnum,
  SocketNotificationStatusEnum,
  SocketNotificationTypeEnum,
} from '@shared/constants/socket.constants';
import { SocketGateway } from './socket.gateway';

@Injectable()
export class SocketMessagingService {
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  constructor(private readonly socketGateway: SocketGateway) {}

  // User messaging with retry mechanism
  async sendToUser(userId: string, event: string, data: any): Promise<boolean> {
    return this.sendWithRetry(() => this.socketGateway.emitToUser(userId, event, data), {
      userId,
      event,
      context: 'sendToUser',
    });
  }

  async sendToUsers(userIds: string[], event: string, data: any): Promise<number> {
    return this.sendWithRetry(() => this.socketGateway.emitToUsers(userIds, event, data), {
      userIds,
      event,
      context: 'sendToUsers',
    });
  }

  async sendNotification(
    userId: string,
    notification: {
      title: string;
      message: string;
      status?: SocketNotificationStatusEnum;
      type?: SocketNotificationTypeEnum;
      data?: any;
    },
  ): Promise<boolean> {
    try {
      const payload = {
        ...notification,
        timestamp: new Date().toISOString(),
      };

      return await this.sendToUser(userId, SocketEventsEnum.NOTIFICATION, payload);
    } catch (error) {
      LoggingService.error(`Failed to send notification to user ${userId}:`, error);
      return false;
    }
  }

  async broadcastNotification(notification: {
    title: string;
    message: string;
    status?: SocketNotificationStatusEnum;
    type?: SocketNotificationTypeEnum;
    data?: any;
  }): Promise<number> {
    try {
      const payload = {
        ...notification,
        timestamp: new Date().toISOString(),
      };

      const onlineUsers = this.getOnlineUsers();

      return await this.sendToUsers(onlineUsers, SocketEventsEnum.NOTIFICATION, payload);
    } catch (error) {
      LoggingService.error(`Failed to broadcast notification to users:`, error);
      return 0;
    }
  }

  // User status with validation
  isUserOnline(userId: string): boolean {
    try {
      return this.socketGateway.isUserOnline(userId);
    } catch (error) {
      LoggingService.error(`Error checking if user ${userId} is online:`, error);
      return false;
    }
  }

  getUserConnectionCount(userId: string): number {
    try {
      const stats = this.socketGateway.getStats();
      return stats.connectionsPerUser.find(u => u.userId === userId)?.connectionCount || 0;
    } catch (error) {
      LoggingService.error(`Error getting connection count for user ${userId}:`, error);
      return 0;
    }
  }

  getOnlineUsers(): string[] {
    try {
      const stats = this.socketGateway.getStats();
      return stats.connectionsPerUser.map(u => u.userId);
    } catch (error) {
      LoggingService.error('Error getting online users:', error);
      return [];
    }
  }

  // System messages with enhanced logging
  async sendSystemMessage(
    userId: string,
    message: string,
    level: SocketNotificationStatusEnum = SocketNotificationStatusEnum.INFO,
  ): Promise<boolean> {
    try {
      const payload = {
        message,
        level,
        timestamp: new Date().toISOString(),
      };

      return await this.sendToUser(userId, SocketEventsEnum.NOTIFICATION, payload);
    } catch (error) {
      LoggingService.error(`Failed to send system message to user ${userId}:`, error);
      return false;
    }
  }

  async broadcastSystemMessage(
    message: string,
    level: SocketNotificationStatusEnum = SocketNotificationStatusEnum.INFO,
  ): Promise<number> {
    try {
      const onlineUsers = this.getOnlineUsers();
      const payload = {
        message,
        level,
        timestamp: new Date().toISOString(),
      };

      return await this.sendToUsers(onlineUsers, SocketEventsEnum.NOTIFICATION, payload);
    } catch (error) {
      LoggingService.error('Failed to broadcast system message:', error);
      return 0;
    }
  }

  getConnectionStats() {
    try {
      return this.socketGateway.getStats();
    } catch (error) {
      LoggingService.error('Error getting connection stats:', error);
      return {
        totalConnections: 0,
        onlineUsers: 0,
        connectionsPerUser: [],
        lastCleanup: new Date(),
        totalUsers: 0,
      };
    }
  }

  // Enhanced offline handling with retry
  async sendWithOfflineHandling(
    userId: string,
    event: string,
    data: unknown,
    offlineHandler?: (userId: string, event: string, data: unknown) => Promise<void>,
  ): Promise<boolean> {
    try {
      const sent = await this.sendToUser(userId, event, data);

      if (!sent && offlineHandler) {
        await offlineHandler(userId, event, data);
      }

      return sent;
    } catch (error) {
      LoggingService.error(`Error in sendWithOfflineHandling for user ${userId}:`, error);

      if (offlineHandler) {
        try {
          await offlineHandler(userId, event, data);
        } catch (offlineError) {
          LoggingService.error(`Error in offline handler for user ${userId}:`, offlineError);
        }
      }

      return false;
    }
  }

  // Retry mechanism with exponential backoff
  private async sendWithRetry<T>(
    operation: () => T,
    metadata: { userId?: string; userIds?: string[]; event: string; context: string },
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const result = await operation();

        if (attempt > 1) {
          LoggingService.info(`Retry successful on attempt ${attempt} for ${metadata.context}`, {
            event: metadata.event,
            userId: metadata.userId,
            userIds: metadata.userIds,
          });
        }

        return result;
      } catch (error) {
        lastError = error as Error;

        LoggingService.warn(`Attempt ${attempt} failed for ${metadata.context}:`, {
          error: error.message,
          event: metadata.event,
          userId: metadata.userId,
          userIds: metadata.userIds,
        });

        if (attempt < this.MAX_RETRIES) {
          const delay = this.RETRY_DELAY * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    LoggingService.error(`All retry attempts failed for ${metadata.context}:`, {
      error: lastError?.message,
      event: metadata.event,
      userId: metadata.userId,
      userIds: metadata.userIds,
      maxRetries: this.MAX_RETRIES,
    });

    throw lastError;
  }

  // Bulk operations with chunking
  async sendToUsersInChunks(
    userIds: string[],
    event: string,
    data: any,
    chunkSize: number = 100,
  ): Promise<number> {
    try {
      let totalSent = 0;

      for (let i = 0; i < userIds.length; i += chunkSize) {
        const chunk = userIds.slice(i, i + chunkSize);
        const sent = await this.sendToUsers(chunk, event, data);
        totalSent += sent;

        // Small delay between chunks to prevent overwhelming
        if (i + chunkSize < userIds.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      return totalSent;
    } catch (error) {
      LoggingService.error('Error in sendToUsersInChunks:', error);
      return 0;
    }
  }

  // Connection health check
  async checkConnectionHealth(): Promise<{
    totalConnections: number;
    onlineUsers: number;
    healthy: boolean;
  }> {
    try {
      const stats = this.getConnectionStats();
      const healthy = stats.totalConnections > 0 && stats.onlineUsers > 0;

      return {
        totalConnections: stats.totalConnections,
        onlineUsers: stats.onlineUsers,
        healthy,
      };
    } catch (error) {
      LoggingService.error('Error checking connection health:', error);
      return {
        totalConnections: 0,
        onlineUsers: 0,
        healthy: false,
      };
    }
  }
}
