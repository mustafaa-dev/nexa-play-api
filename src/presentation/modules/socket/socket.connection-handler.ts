import { User } from '@core/entities/user.entity';
import { LoggingService } from '@infrastructure/logging/logging.service';
import { WsException } from '@nestjs/websockets';
import { RolesEnum } from '@shared/constants/roles.constants';
import { SocketEventsEnum, SocketUserEventTypesEnum } from '@shared/constants/socket.constants';
import { Socket } from 'socket.io';
import { SocketService } from './socket.service';

export enum ConnectionState {
  CONNECTING = 'connecting',
  AUTHENTICATING = 'authenticating',
  AUTHENTICATED = 'authenticated',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
}

export class SocketConnectionHandler {
  private user: User | null = null;
  private lastPing = Date.now();
  private connectionState: ConnectionState = ConnectionState.CONNECTING;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private authenticationTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly HEARTBEAT_INTERVAL = 30_000; // 30s
  private readonly AUTHENTICATION_TIMEOUT = 2_000; // 2s
  private readonly MAX_MISSED_PINGS = 10;
  private cleanedUp = false;

  // Keep references to bound handlers so we can remove them individually
  private boundMessageHandler: (msg: any) => void;
  private boundPingHandler: () => void;
  private boundPongHandler: () => void;
  private boundDisconnectHandler: (reason: string) => void;
  private boundErrorHandler: (err: Error) => void;
  private boundHeartbeatHandler: () => void;

  private constructor(
    private readonly socket: Socket,
    private readonly socketService: SocketService,
  ) {
    // bind early so we can remove later
    this.boundMessageHandler = (m: any) => this.handleMessage(m);
    this.boundPingHandler = () => this.handlePing();
    this.boundPongHandler = () => this.handlePong();
    this.boundDisconnectHandler = (r: string) => void this.handleDisconnect(r);
    this.boundErrorHandler = (e: Error) => this.handleError(e);
    this.boundHeartbeatHandler = () => this.handleHeartbeat();
  }

  get User() {
    return this.user;
  }

  get SocketID() {
    return this.socket.id;
  }

  get ConnectionState() {
    return this.connectionState;
  }

  get IsAuthenticated() {
    return this.connectionState === ConnectionState.AUTHENTICATED && this.user !== null;
  }

  /**
   * Check if the connection is in a valid state
   */
  get IsValid() {
    return (
      !this.cleanedUp &&
      this.connectionState !== ConnectionState.DISCONNECTED &&
      this.connectionState !== ConnectionState.ERROR &&
      this.user !== null
    );
  }

  /**
   * Factory method for creating & initializing the handler.
   */
  public static async setup(
    client: Socket,
    socketService: SocketService,
  ): Promise<SocketConnectionHandler> {
    const handler = new SocketConnectionHandler(client, socketService);
    // Bind cleanup to disconnect early to avoid leaked listeners in weird edge cases
    client.once('disconnect', () => void handler.cleanup());
    await handler.authenticateAndInitialize();
    return handler;
  }

  /**
   * Authenticate and initialize lifecycle.
   */
  public async authenticateAndInitialize(): Promise<string> {
    try {
      this.connectionState = ConnectionState.AUTHENTICATING;

      const userId = await this.authenticate();
      // Only setup listeners/heartbeat after successful authentication
      this.setupEventListeners();

      this.startHeartbeat();

      await this.sendInitialData();

      this.connectionState = ConnectionState.AUTHENTICATED;

      LoggingService.debug(`Connection initialized for user ${this.user?.id ?? 'unknown'}`, {
        context: `${this.constructor.name} :: authenticateAndInitialize`,
      });

      return userId;
    } catch (error) {
      this.connectionState = ConnectionState.ERROR;
      const msg = error instanceof Error ? error.message : String(error);
      LoggingService.error(`Initialization failed: ${msg}`, {
        context: `${this.constructor.name} :: authenticateAndInitialize`,
        socketId: this.SocketID,
        state: this.connectionState,
      });
      // ensure everything cleaned up
      await this.cleanup();
      throw error;
    }
  }

  /**
   * Idempotent cleanup
   */
  public async cleanup() {
    if (this.cleanedUp) return;
    this.cleanedUp = true;

    try {
      this.connectionState = ConnectionState.DISCONNECTED;

      LoggingService.info(`Cleaning up connection for session ${this.SocketID}`, {
        context: `${this.constructor.name} :: cleanup`,
      });

      // Clear timers
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
      if (this.authenticationTimeout) {
        clearTimeout(this.authenticationTimeout);
        this.authenticationTimeout = null;
      }

      // Remove listeners we added specifically
      try {
        this.socket.off('message', this.boundMessageHandler);
        this.socket.off('ping', this.boundPingHandler);
        this.socket.off('pong', this.boundPongHandler);
        this.socket.off('disconnect', this.boundDisconnectHandler);
        this.socket.off('error', this.boundErrorHandler);
        this.socket.off('heartbeat', this.boundHeartbeatHandler);
      } catch (e) {
        // swallow errors removing listeners
      }

      // Don't disconnect the socket here as it might cause deadlock
      // The socket will be disconnected by the gateway's disconnect handler

      // Clear references
      this.user = null;
      this.lastPing = 0;

      LoggingService.info(`Connection cleanup completed for session ${this.SocketID}`, {
        context: `${this.constructor.name} :: cleanup`,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      LoggingService.error(`Error during connection cleanup: ${msg}`, {
        context: `${this.constructor.name} :: cleanup`,
      });
    }
  }

  /**
   * Unified emit method with safety checks.
   */
  public safeEmit(event: string, payload: unknown) {
    if (!this.IsAuthenticated) {
      LoggingService.warn(`Attempted to emit to unauthenticated socket: ${event}`, {
        context: `${this.constructor.name} :: safeEmit`,
      });
      return;
    }
    try {
      const payloadStr = (() => {
        try {
          return JSON.stringify(payload);
        } catch {
          return String(payload);
        }
      })();

      LoggingService.debug(
        `Emitting ${event} to user ${this.user?.id ?? 'unknown'}: ${payloadStr}`,
        {
          context: `${this.constructor.name} :: safeEmit`,
        },
      );

      this.socket.emit(event, payload);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      LoggingService.error(`Failed to emit to socket: ${msg}`, {
        context: `${this.constructor.name} :: safeEmit`,
        event,
      });
    }
  }

  /**
   * Authenticate using multiple handshake sources and fallback to auth event.
   * Returns user.id on success.
   */
  private async authenticate(): Promise<string> {
    try {
      const token = await this.getTokenFromHandshake();

      this.user = await this.socketService.decodeToken(token);

      if (!this.user) {
        this.socket.emit(SocketEventsEnum.USER, {
          type: SocketUserEventTypesEnum.AUTHENTICATION,
          reason: 'Invalid user',
        });
        throw new WsException('Invalid user');
      }

      if (!this.user.isActive) {
        this.socket.emit(SocketEventsEnum.USER, {
          type: SocketUserEventTypesEnum.AUTHENTICATION,
          reason: 'User account is inactive',
        });
        throw new WsException('User account is inactive');
      }

      LoggingService.info(`User authenticated successfully: ${this.user.id}`, {
        context: `${this.constructor.name} :: authenticate`,
      });

      return this.user.id;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      LoggingService.error(`Authentication failed: ${msg}`, {
        context: `${this.constructor.name} :: authenticate`,
      });
      // ensure disconnect
      try {
        this.socket.emit(SocketEventsEnum.USER, {
          type: SocketUserEventTypesEnum.AUTHENTICATION,
          reason: 'Authentication failed',
        });
      } catch {}
      try {
        // disconnect but don't throw synchronous errors
        this.socket.disconnect(true);
      } catch {}
      throw err;
    } finally {
      // clear any authentication timeout if set
      if (this.authenticationTimeout) {
        clearTimeout(this.authenticationTimeout);
        this.authenticationTimeout = null;
      }
    }
  }

  /**
   * Look synchronously in multiple handshake locations for token before
   * waiting for CLIENT_AUTHENTICATION event.
   */
  private async getTokenFromHandshake(): Promise<string> {
    // Check header first
    const headersAuth =
      (this.socket.handshake?.headers?.authorization as string | undefined) ?? undefined;
    if (headersAuth && headersAuth.startsWith('Bearer ')) {
      const t = headersAuth.substring(7);
      if (t) {
        LoggingService.debug('Token found in handshake headers', {
          context: `${this.constructor.name} :: getTokenFromHandshake`,
        });
        return t;
      }
    }

    // Check socket.handshake.auth (socket.io client can send auth in handshake)
    const authToken = (this.socket.handshake as any)?.auth?.token as string | undefined;
    if (authToken) {
      LoggingService.debug('Token found in handshake.auth', {
        context: `${this.constructor.name} :: getTokenFromHandshake`,
      });
      return authToken;
    }

    // Check query string (less recommended, but sometimes used)
    const queryToken = (this.socket.handshake as any)?.query?.token as string | undefined;
    if (queryToken) {
      LoggingService.debug('Token found in handshake.query', {
        context: `${this.constructor.name} :: getTokenFromHandshake`,
      });
      return queryToken;
    }

    // Fallback to waiting for client auth event
    return await new Promise((resolve, reject) => {
      const onAuth = (data: { token?: string; type: SocketUserEventTypesEnum } | string) => {
        try {
          let t: string | undefined;
          if (!data) t = undefined;
          else if (typeof data === 'string') t = data;
          else t = (data as any).token;

          if (t) {
            if (this.authenticationTimeout) {
              clearTimeout(this.authenticationTimeout);
              this.authenticationTimeout = null;
            }
            this.socket.off(SocketEventsEnum.USER, onAuth);
            LoggingService.debug('Token received via AUTHENTICATION event', {
              context: `${this.constructor.name} :: getTokenFromHandshake`,
            });
            if ((data as any).type === SocketUserEventTypesEnum.AUTHENTICATION) {
              resolve(t);
              return;
            } else {
              reject(new WsException('Invalid message format: type is missing or invalid'));
            }
          } else {
            // ignore empty payloads
          }
        } catch (e) {
          // swallow and let timeout handle
        }
      };

      // Use once to avoid multiple triggers
      this.socket.once(SocketEventsEnum.USER, onAuth);

      // authentication timeout
      this.authenticationTimeout = setTimeout(() => {
        this.socket.off(SocketEventsEnum.USER, onAuth);
        try {
          this.socket.emit(SocketEventsEnum.USER, {
            type: SocketUserEventTypesEnum.AUTHENTICATION,
            reason: 'Authentication timeout',
          });
        } catch {}
        reject(new WsException('Authentication timeout'));
      }, this.AUTHENTICATION_TIMEOUT);
    });
  }

  /**
   * Register event listeners after authentication.
   */
  private setupEventListeners() {
    // Use the bound handlers so we can remove them specifically later
    this.socket.on('message', this.boundMessageHandler);
    this.socket.on('ping', this.boundPingHandler);
    this.socket.on('pong', this.boundPongHandler);
    this.socket.on('disconnect', this.boundDisconnectHandler);
    this.socket.on('error', this.boundErrorHandler);
    this.socket.on('heartbeat', this.boundHeartbeatHandler);

    LoggingService.debug('Event listeners setup completed', {
      context: `${this.constructor.name} :: setupEventListeners`,
    });
  }

  /**
   * Heartbeat monitor — disconnect immediately when overdue.
   */
  private startHeartbeat() {
    // store last ping as now
    this.lastPing = Date.now();
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.heartbeatInterval = setInterval(() => this.checkHeartbeat(), this.HEARTBEAT_INTERVAL);
    LoggingService.debug('Heartbeat monitoring started', {
      context: `${this.constructor.name} :: startHeartbeat`,
    });
  }

  private checkHeartbeat() {
    if (this.cleanedUp) return;
    const now = Date.now();
    const timeSinceLastPing = now - this.lastPing;

    // If client hasn't pinged within allowed window (HEARTBEAT_INTERVAL * MAX_MISSED_PINGS), disconnect
    if (timeSinceLastPing > this.HEARTBEAT_INTERVAL * this.MAX_MISSED_PINGS) {
      LoggingService.warn(
        `Client not responding to heartbeats: lastPing=${this.lastPing}, now=${now}, diff=${timeSinceLastPing}`,
        {
          context: `${this.constructor.name} :: checkHeartbeat : ${this.SocketID}`,
        },
      );
      try {
        this.socket.disconnect(true);
      } catch (e) {
        // ignore
      }
    }
  }

  /**
   * Send client initial payload
   */
  private async sendInitialData() {
    await this.sendClientData();
  }

  private async sendClientData() {
    try {
      if (!this.user) return;

      const payload: any = {
        name: this.user.name,
        role: this.user.role,
        email: this.user.email?.getValue ? this.user.email.getValue() : this.user.email,
        isEmailVerified: !!this.user.emailVerifiedAt,
        isActive: this.user.isActive,
        isAdmin: this.user?.role === RolesEnum.ADMIN,
      };

      this.safeEmit('client-data', payload);

      LoggingService.info(`Sent client data to client ${this.user.id}`, {
        context: `${this.constructor.name} :: sendClientData`,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      LoggingService.error(`Failed to send client data: ${msg}`, {
        context: `${this.constructor.name} :: sendClientData`,
      });
    }
  }

  /**
   * Message handling
   */
  private async handleMessage(message: any) {
    try {
      const rawMessage = typeof message === 'string' ? message : JSON.stringify(message);
      const parsedMessage = JSON.parse(rawMessage);

      if (!parsedMessage.type || typeof parsedMessage.type !== 'number') {
        throw new WsException('Invalid message format: type is missing or invalid');
      }

      LoggingService.debug(
        `Received message from client ${this.user?.name ?? 'unknown'}: ${rawMessage}`,
        {
          context: `${this.constructor.name} :: handleMessage`,
        },
      );

      // TODO: actual message routing/processing
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      LoggingService.error(`Error processing message: ${msg}`, {
        context: `${this.constructor.name} :: handleMessage`,
      });
    }
  }

  private handlePing() {
    this.lastPing = Date.now();
    // respond immediately to ping with pong (if desired). socket.io already supports ping/pong internally
    try {
      this.socket.emit('pong');
    } catch {}
  }

  private handlePong() {
    this.lastPing = Date.now();
  }

  private handleHeartbeat() {
    this.lastPing = Date.now();
    try {
      this.socket.emit('heartbeat-ack');
    } catch {}
  }

  private async handleDisconnect(reason: string) {
    LoggingService.warn(`Client ${this.SocketID} disconnected: ${reason}`, {
      context: `${this.constructor.name} :: handleDisconnect`,
      reason,
    });

    await this.cleanup();
  }

  private handleError(error: Error) {
    const msg = error instanceof Error ? error.message : String(error);
    LoggingService.error(`Socket error for ${this.SocketID}: ${msg}`, {
      context: `${this.constructor.name} :: handleError`,
      error: error?.stack ?? String(error),
    });
  }
}
