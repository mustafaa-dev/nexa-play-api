import { SocketEventService } from '@core/services/socket-event.service';
import { LoggingService } from '@infrastructure/logging/logging.service';
import { BadRequestException } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GlobalSocketManager } from './global-socket-manager.service';
import { SocketConnectionHandler } from './socket.connection-handler';
import { SocketService } from './socket.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  transports: ['websocket'],
  // allowEIO3: true,
})
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private isShuttingDown = false;

  private readonly MAX_CONCURRENT_CONNECTIONS = 5000; // Reduced from 10000

  private readonly CONNECTION_TIMEOUT = 30000; // 30 seconds

  // private readonly PING_INTERVAL = 25000;

  // private readonly PING_TIMEOUT = 60000;

  constructor(
    private readonly socketService: SocketService,
    private readonly globalSocketManager: GlobalSocketManager,
    private readonly socketEventService: SocketEventService,
  ) {}

  afterInit(_server: Server) {
    LoggingService.info(
      `Socket.IO server initialized | Max Connections :${this.MAX_CONCURRENT_CONNECTIONS}`,
      {
        context: `${this.constructor.name}::afterInit`,
      },
    );

    // Set up periodic cleanup of stale connections
    setInterval(() => {
      this.globalSocketManager.cleanupStaleConnections().then(r =>
        LoggingService.info(`Cleaned Stale Connections ${r}`, {
          context: `${this.constructor.name}::afterInit`,
        }),
      );
    }, 300000); // Every 5 minutes
  }

  async handleConnection(socket: Socket) {
    let connectionTimeout: NodeJS.Timeout | null = null;
    let connection: SocketConnectionHandler | null = null;

    try {
      // Check if server is shutting down
      if (this.isShuttingDown) {
        LoggingService.warn('Rejecting connection during shutdown', {
          context: `${this.constructor.name}::handleConnection`,
          socketId: socket.id,
        });
        socket.disconnect(true);
        return;
      }

      // Check connection limits
      const currentConnections = this.globalSocketManager.getTotalConnectionCount();
      if (currentConnections >= this.MAX_CONCURRENT_CONNECTIONS) {
        LoggingService.warn('Connection limit reached, rejecting new connection', {
          context: `${this.constructor.name}::handleConnection`,
          socketId: socket.id,
          currentConnections,
          maxConnections: this.MAX_CONCURRENT_CONNECTIONS,
        });
        socket.emit('error', { message: 'Server at capacity, please try again later' });
        socket.disconnect(true);
        return;
      }

      // Set connection timeout
      connectionTimeout = setTimeout(() => {
        LoggingService.warn('Connection timeout, disconnecting socket', {
          context: `${this.constructor.name}::handleConnection`,
          socketId: socket.id,
          timeout: this.CONNECTION_TIMEOUT,
        });
        socket.disconnect(true);
      }, this.CONNECTION_TIMEOUT);

      connection = await SocketConnectionHandler.setup(socket, this.socketService);

      // Validate connection and user
      if (!connection || !connection.User) {
        throw new BadRequestException('Connection setup failed or user not authenticated');
      }

      // Clear timeout on successful setup
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }

      // Register with global manager
      this.globalSocketManager.registerConnection(connection);

      await this.socketEventService.publishUserConnected(connection.User.id, connection.SocketID, {
        userAgent: socket.handshake.headers['user-agent'],
        ip: socket.handshake.address,
        auth: true,
        timestamp: new Date().toISOString(),
      });

      LoggingService.info(
        `Client connected: Socket ${connection.SocketID} for user ${connection.User.id} total connections: ${this.globalSocketManager.getTotalConnectionCount()}`,
        {
          context: `${this.constructor.name}::handleConnection`,
        },
      );
    } catch (error) {
      // Ensure timeout is cleared in error cases
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }

      LoggingService.error(`Connection error: ${error.message}`, {
        context: `${this.constructor.name}::handleConnection`,
        error: error.stack,
      });

      try {
        socket.emit('error', {
          message: 'Connection failed',
          code: 'CONNECTION_ERROR',
        });
      } catch (emitError) {
        LoggingService.error(`Failed to emit error to socket: ${emitError.message}`, {
          context: `${this.constructor.name}::handleConnection`,
        });
      }

      // Clean up connection if it was partially created
      if (connection) {
        try {
          await connection.cleanup();
        } catch (cleanupError) {
          LoggingService.error(`Error during connection cleanup: ${cleanupError.message}`, {
            context: `${this.constructor.name}::handleConnection`,
          });
        }
      }

      socket.disconnect(true);
    }
  }

  /**
   * Handles socket disconnection
   * @param socket The socket that's disconnecting
   */
  async handleDisconnect(socket: Socket) {
    let connection: SocketConnectionHandler | null = null;

    try {
      connection = this.globalSocketManager.getConnectionBySocketId(socket.id);

      if (connection) {
        const userId = connection.User?.id || 'unknown';

        try {
          // Clean up the specific connection
          await connection.cleanup();

          LoggingService.info(`Client disconnected: Socket ${socket.id} for user ${userId}`, {
            context: `${this.constructor.name}::handleDisconnect`,
          });
        } catch (cleanupError) {
          LoggingService.error(
            `Error during cleanup for socket ${socket.id}: ${cleanupError.message}`,
            {
              context: `${this.constructor.name}::handleDisconnect`,
              error: cleanupError.stack,
            },
          );
        }
      } else {
        LoggingService.warn(`Disconnect received for unknown socket: ${socket.id}`, {
          context: `${this.constructor.name}::handleDisconnect`,
        });
      }
    } catch (error) {
      LoggingService.error(`Error in handleDisconnect: ${error.message}`, {
        context: `${this.constructor.name}::handleDisconnect`,
        error: error.stack,
      });
    } finally {
      // Always clean up from global manager, even if cleanup failed
      try {
        this.globalSocketManager.unregisterConnection(socket.id);
      } catch (unregisterError) {
        LoggingService.error(`Error unregistering connection: ${unregisterError.message}`, {
          context: `${this.constructor.name}::handleDisconnect`,
          socketId: socket.id,
        });
      }
    }
  }

  /**
   * Gracefully close the WebSocket server
   */
  async closeServer(): Promise<void> {
    try {
      this.isShuttingDown = true;

      LoggingService.info('Starting graceful Socket.IO server shutdown...', {
        context: `${this.constructor.name}::closeServer`,
      });

      if (this.server) {
        // Get all active sockets
        const sockets = await this.server.fetchSockets();
        const socketCount = sockets.length;

        LoggingService.info(`Closing ${socketCount} active socket connections...`, {
          context: `${this.constructor.name}::closeServer`,
        });

        // Send shutdown notification to all clients
        for (const socket of sockets) {
          try {
            socket.emit('server-shutdown', {
              message: 'Server is shutting down',
              timestamp: new Date().toISOString(),
            });
          } catch (error) {
            LoggingService.warn(
              `Failed to send shutdown notification to socket ${socket.id}: ${error.message}`,
              {
                context: `${this.constructor.name}::closeServer`,
              },
            );
          }
        }

        // Wait a bit for clients to receive the notification
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Disconnect all sockets
        for (const socket of sockets) {
          try {
            socket.disconnect(true);
          } catch (error) {
            LoggingService.warn(`Failed to disconnect socket ${socket.id}: ${error.message}`, {
              context: `${this.constructor.name}::closeServer`,
            });
          }
        }

        // Close the server
        this.server.close(() => {
          LoggingService.info('Socket.IO server closed successfully', {
            context: `${this.constructor.name}::closeServer`,
          });
        });
      }
    } catch (error) {
      LoggingService.error(`Error closing Socket.IO server: ${error.message}`, {
        context: `${this.constructor.name}::closeServer`,
        error: error.stack,
      });
    }
  }

  // Helper methods for other services to use
  emitToUser(userId: string, event: string, data: unknown): boolean {
    try {
      return this.globalSocketManager.emitToUser(userId, event, data);
    } catch (error) {
      LoggingService.error(`Error emitting to user ${userId}: ${error.message}`, {
        context: `${this.constructor.name}::emitToUser`,
        userId,
        event,
        error: error.stack,
      });
      return false;
    }
  }

  emitToUsers(userIds: string[], event: string, data: unknown): number {
    try {
      return this.globalSocketManager.emitToUsers(userIds, event, data);
    } catch (error) {
      LoggingService.error(`Error emitting to users: ${error.message}`, {
        context: `${this.constructor.name}::emitToUsers`,
        userIds,
        event,
        error: error.stack,
      });
      return 0;
    }
  }

  isUserOnline(userId: string): boolean {
    try {
      return this.globalSocketManager.isUserOnline(userId);
    } catch (error) {
      LoggingService.error(`Error checking if user ${userId} is online: ${error.message}`, {
        context: `${this.constructor.name}::isUserOnline`,
        userId,
        error: error.stack,
      });
      return false;
    }
  }

  getStats() {
    try {
      return this.globalSocketManager.getStats();
    } catch (error) {
      LoggingService.error(`Error getting socket stats: ${error.message}`, {
        context: `${this.constructor.name}::getStats`,
        error: error.stack,
      });
      return {
        totalConnections: 0,
        onlineUsers: 0,
        connectionsPerUser: [],
        lastCleanup: new Date(),
        totalUsers: 0,
      };
    }
  }

  /**
   * Get server health status
   */
  getHealthStatus(): {
    healthy: boolean;
    totalConnections: number;
    onlineUsers: number;
    isShuttingDown: boolean;
  } {
    try {
      const stats = this.getStats();
      return {
        healthy: !this.isShuttingDown && stats.totalConnections >= 0,
        totalConnections: stats.totalConnections,
        onlineUsers: stats.onlineUsers,
        isShuttingDown: this.isShuttingDown,
      };
    } catch (error) {
      LoggingService.error(`Error getting health status: ${error.message}`, {
        context: `${this.constructor.name}::getHealthStatus`,
        error: error.stack,
      });
      return {
        healthy: false,
        totalConnections: 0,
        onlineUsers: 0,
        isShuttingDown: this.isShuttingDown,
      };
    }
  }
}
