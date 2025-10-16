import { LoggingService } from '@infrastructure/logging/logging.service';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { SocketConnectionHandler } from './socket.connection-handler';

@Injectable()
export class GlobalSocketManager implements OnModuleDestroy {
  private userConnections = new Map<string, Map<string, SocketConnectionHandler>>();
  private socketToUser = new Map<string, string>(); // socketId -> userId
  private connectionStats = {
    totalConnections: 0,
    totalUsers: 0,
    lastCleanup: new Date(),
  };

  /**
   * Called when the module is being destroyed
   */
  async onModuleDestroy(): Promise<void> {
    LoggingService.info('GlobalSocketManager: Starting graceful shutdown...', {
      context: 'GlobalSocketManager::onModuleDestroy',
    });

    await this.cleanupAllConnections();
  }

  /**
   * Cleanup all active socket connections
   */
  private async cleanupAllConnections(): Promise<void> {
    try {
      const totalConnections = this.getTotalConnectionCount();
      LoggingService.info(`Cleaning up ${totalConnections} active socket connections...`, {
        context: 'GlobalSocketManager::cleanupAllConnections',
      });

      // Get all active connections
      const allConnections: SocketConnectionHandler[] = [];
      for (const [, connections] of this.userConnections) {
        for (const [, handler] of connections) {
          allConnections.push(handler);
        }
      }

      // Close all connections
      let successCount = 0;
      let errorCount = 0;

      for (const handler of allConnections) {
        try {
          await handler.cleanup();
          successCount++;
        } catch (error) {
          LoggingService.error(`Error cleaning up socket ${handler.SocketID}: ${error.message}`, {
            context: 'GlobalSocketManager::cleanupAllConnections',
          });
          errorCount++;
        }
      }

      // Clear all maps
      this.userConnections.clear();
      this.socketToUser.clear();

      LoggingService.info(
        `Socket cleanup completed: ${successCount} successful, ${errorCount} errors`,
        {
          context: 'GlobalSocketManager::cleanupAllConnections',
        },
      );
    } catch (error) {
      LoggingService.error(`Error during socket cleanup: ${error.message}`, {
        context: 'GlobalSocketManager::cleanupAllConnections',
      });
    }
  }

  registerConnection(handler: SocketConnectionHandler) {
    try {
      // Validate handler state and user
      if (!handler || !handler.IsAuthenticated || !handler.User) {
        LoggingService.warn(
          `Attempting to register invalid connection: ${handler?.SocketID || 'unknown'}`,
          {
            context: 'GlobalSocketManager::registerConnection',
            socketId: handler?.SocketID,
            isAuthenticated: handler?.IsAuthenticated,
            hasUser: !!handler?.User,
          },
        );
        throw new WsException('Cannot register unauthenticated or invalid connection');
      }

      const userId = handler.User.id;
      const socketId = handler.SocketID;

      // Check if socket is already registered
      if (this.socketToUser.has(socketId)) {
        LoggingService.warn(
          `Socket ${socketId} is already registered for user ${this.socketToUser.get(socketId)}`,
          {
            context: 'GlobalSocketManager::registerConnection',
            socketId,
            existingUserId: this.socketToUser.get(socketId),
            newUserId: userId,
          },
        );
        // Clean up existing registration
        this.unregisterConnection(socketId);
      }

      // Initialize user's connections map if it doesn't exist
      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, new Map());
      }

      // Add the connection
      this.userConnections.get(userId)!.set(socketId, handler);
      this.socketToUser.set(socketId, userId);

      // Update stats
      this.connectionStats.totalConnections = this.socketToUser.size;
      this.connectionStats.totalUsers = this.userConnections.size;

      LoggingService.debug(
        `Registered socket ${socketId} for user ${userId} : ${this.connectionStats.totalConnections} - ${this.connectionStats.totalUsers} - ${handler.SocketID}`,
        {
          context: 'GlobalSocketManager::registerConnection',
        },
      );
    } catch (error) {
      LoggingService.error(`Error registering connection: ${error.message}`, {
        context: 'GlobalSocketManager::registerConnection',
        socketId: handler?.SocketID,
        error: error.stack,
      });
      throw error; // Re-throw to allow caller to handle
    }
  }

  unregisterConnection(socketId: string) {
    try {
      const userId = this.socketToUser.get(socketId);
      if (!userId) {
        LoggingService.warn(`Attempting to unregister unknown socket: ${socketId}`, {
          context: 'GlobalSocketManager::unregisterConnection',
        });
        return;
      }

      const userConnections = this.userConnections.get(userId);
      if (userConnections) {
        const handler = userConnections.get(socketId);

        // Clean up the handler if it exists
        if (handler) {
          try {
            // Don't call cleanup here as it might cause deadlock
            // The cleanup should be handled by the disconnect handler
            LoggingService.debug(`Removing handler for socket ${socketId}`, {
              context: 'GlobalSocketManager::unregisterConnection',
            });
          } catch (cleanupError) {
            LoggingService.error(`Error during handler cleanup: ${cleanupError.message}`, {
              context: 'GlobalSocketManager::unregisterConnection',
              socketId,
            });
          }
        }

        userConnections.delete(socketId);

        // Clean up empty user connections
        if (userConnections.size === 0) {
          this.userConnections.delete(userId);
        }
      }

      this.socketToUser.delete(socketId);

      // Update stats
      this.connectionStats.totalConnections = this.socketToUser.size;
      this.connectionStats.totalUsers = this.userConnections.size;

      LoggingService.debug(`Unregistered socket ${socketId} for user ${userId}`, {
        context: 'GlobalSocketManager::unregisterConnection',
      });
    } catch (error) {
      LoggingService.error(`Error unregistering connection: ${error.message}`, {
        context: 'GlobalSocketManager::unregisterConnection',
        socketId,
        error: error.stack,
      });
    }
  }

  getUserConnections(userId: string): SocketConnectionHandler[] {
    try {
      const connections = this.userConnections.get(userId);
      if (!connections) {
        return [];
      }

      // Filter out invalid connections
      const validConnections: SocketConnectionHandler[] = [];
      const connectionsToCheck = Array.from(connections.entries());

      for (const [socketId, handler] of connectionsToCheck) {
        if (handler && this.isValidConnection(handler)) {
          validConnections.push(handler);
        } else {
          // Clean up invalid connection
          LoggingService.warn(`Removing invalid connection: ${socketId}`, {
            context: 'GlobalSocketManager::getUserConnections',
          });
          this.unregisterConnection(socketId);
        }
      }

      return validConnections;
    } catch (error) {
      LoggingService.error(`Error getting user connections: ${error.message}`, {
        context: 'GlobalSocketManager::getUserConnections',
      });
      return [];
    }
  }

  getConnectionBySocketId(socketId: string): SocketConnectionHandler | null {
    try {
      const userId = this.socketToUser.get(socketId);
      if (!userId) return null;

      const userConnections = this.userConnections.get(userId);
      const handler = userConnections?.get(socketId);

      // Validate handler
      if (handler && !this.isValidConnection(handler)) {
        LoggingService.warn(`Found invalid connection: ${socketId}`, {
          context: 'GlobalSocketManager::getConnectionBySocketId',
        });
        this.unregisterConnection(socketId);
        return null;
      }

      return handler || null;
    } catch (error) {
      LoggingService.error(`Error getting connection by socket ID: ${error.message}`, {
        context: 'GlobalSocketManager::getConnectionBySocketId',
      });
      return null;
    }
  }

  /**
   * Validate if a connection is still valid
   */
  private isValidConnection(handler: SocketConnectionHandler): boolean {
    try {
      return (
        handler &&
        handler.IsValid &&
        handler.IsAuthenticated &&
        handler.User !== null &&
        !!handler.SocketID
      );
    } catch (error) {
      LoggingService.error(`Error validating connection: ${error.message}`, {
        context: 'GlobalSocketManager::isValidConnection',
        socketId: handler?.SocketID,
      });
      return false;
    }
  }

  // Global emit to all user's sockets
  emitToUser(userId: string, event: string, data: unknown): boolean {
    try {
      const connections = this.getUserConnections(userId);

      if (connections.length === 0) {
        LoggingService.debug(`No active connections for user ${userId}`, {
          context: 'GlobalSocketManager::emitToUser',
          event,
        });
        return false;
      }

      let successCount = 0;

      connections.forEach(handler => {
        try {
          if (this.isValidConnection(handler)) {
            handler.safeEmit(event, data);
            successCount++;
          } else {
            LoggingService.warn(`Skipping invalid connection: ${handler.SocketID}`, {
              context: 'GlobalSocketManager::emitToUser',
              event,
            });
            this.unregisterConnection(handler.SocketID);
          }
        } catch (error) {
          LoggingService.error(`Failed to emit to socket ${handler.SocketID}: ${error.message}`, {
            context: 'GlobalSocketManager::emitToUser',
            event,
          });
          this.unregisterConnection(handler.SocketID);
        }
      });

      LoggingService.debug(
        `Emitted ${event} to ${successCount}/${connections.length} connections for user ${userId} - ${connections.length}`,
        {
          context: 'GlobalSocketManager::emitToUser',
        },
      );

      return successCount > 0;
    } catch (error) {
      LoggingService.error(`Error emitting to user: ${error.message}`, {
        context: 'GlobalSocketManager::emitToUser',
      });
      return false;
    }
  }

  // Emit to multiple users
  emitToUsers(userIds: string[], event: string, data: unknown): number {
    try {
      let successCount = 0;
      let errorCount = 0;

      userIds.forEach(userId => {
        try {
          if (this.emitToUser(userId, event, data)) {
            successCount++;
          }
        } catch (error) {
          LoggingService.error(`Error emitting to user ${userId}: ${error.message}`, {
            context: 'GlobalSocketManager::emitToUsers',
            userId,
            event,
          });
          errorCount++;
        }
      });

      LoggingService.debug(`Emitted ${event} to ${successCount}/${userIds.length} users`, {
        context: 'GlobalSocketManager::emitToUsers',
        event,
        successCount,
        errorCount,
      });

      return successCount;
    } catch (error) {
      LoggingService.error(`Error emitting to users: ${error.message}`, {
        context: 'GlobalSocketManager::emitToUsers',
        event,
        userIds,
      });
      return 0;
    }
  }

  isUserOnline(userId: string): boolean {
    try {
      const connections = this.getUserConnections(userId);
      return connections.length > 0;
    } catch (error) {
      LoggingService.error(`Error checking if user is online: ${error.message}`, {
        context: 'GlobalSocketManager::isUserOnline',
        userId,
      });
      return false;
    }
  }

  getUserConnectionCount(userId: string): number {
    try {
      const connections = this.getUserConnections(userId);
      return connections.length;
    } catch (error) {
      LoggingService.error(`Error getting user connection count: ${error.message}`, {
        context: 'GlobalSocketManager::getUserConnectionCount',
        userId,
      });
      return 0;
    }
  }

  getOnlineUserIds(): string[] {
    try {
      return Array.from(this.userConnections.keys()).filter(id => {
        const connections = this.getUserConnections(id);
        return connections.length > 0;
      });
    } catch (error) {
      LoggingService.error(`Error getting online user IDs: ${error.message}`, {
        context: 'GlobalSocketManager::getOnlineUserIds',
      });
      return [];
    }
  }

  getTotalConnectionCount(): number {
    return this.connectionStats.totalConnections;
  }

  // Cleanup stale connections
  async cleanupStaleConnections(): Promise<number> {
    try {
      const beforeCount = this.getTotalConnectionCount();
      let cleanedCount = 0;

      // Create a copy of the entries to avoid modification during iteration
      const entriesToCheck = Array.from(this.userConnections.entries());

      for (const [userId, connections] of entriesToCheck) {
        const connectionsToCheck = Array.from(connections.entries());

        for (const [socketId, handler] of connectionsToCheck) {
          if (!handler || !handler.IsAuthenticated) {
            this.unregisterConnection(socketId);
            cleanedCount++;
          }
        }
      }

      const afterCount = this.getTotalConnectionCount();
      this.connectionStats.lastCleanup = new Date();

      LoggingService.info(`Cleaned up ${cleanedCount} stale connections`, {
        context: 'GlobalSocketManager::cleanupStaleConnections',
        beforeCount,
        afterCount,
        cleanedCount,
      });

      return cleanedCount;
    } catch (error) {
      LoggingService.error(`Error cleaning up stale connections: ${error.message}`, {
        context: 'GlobalSocketManager::cleanupStaleConnections',
      });
      return 0;
    }
  }

  // Get stats for monitoring
  getStats() {
    try {
      const onlineUsers = this.getOnlineUserIds();
      const connectionsPerUser = onlineUsers.map(userId => ({
        userId,
        connectionCount: this.getUserConnectionCount(userId),
      }));

      return {
        totalConnections: this.getTotalConnectionCount(),
        onlineUsers: onlineUsers.length,
        connectionsPerUser,
        lastCleanup: this.connectionStats.lastCleanup,
        totalUsers: this.connectionStats.totalUsers,
      };
    } catch (error) {
      LoggingService.error(`Error getting stats: ${error.message}`, {
        context: 'GlobalSocketManager::getStats',
      });
      return {
        totalConnections: 0,
        onlineUsers: 0,
        connectionsPerUser: [],
        lastCleanup: this.connectionStats.lastCleanup,
        totalUsers: 0,
      };
    }
  }
}
