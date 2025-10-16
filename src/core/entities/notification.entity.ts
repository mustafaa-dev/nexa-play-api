import { NotificationEntity } from '@infrastructure/database/entities/notification.entity';
import {
  SocketNotificationStatusEnum,
  SocketNotificationTypeEnum,
} from '@shared/constants/socket.constants';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

interface INotificationProps {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  type?: SocketNotificationTypeEnum;
  title?: string;
  message?: string;
  data?: Record<string, unknown>;
  readAt?: Date;
  user?: User;
  isRead?: boolean;
  status?: SocketNotificationStatusEnum;
  isVisible?: boolean;
}

export class Notification extends BaseEntity<NotificationEntity> {
  constructor(notification: Partial<INotificationProps>) {
    super({
      id: notification.id,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
      deletedAt: notification.deletedAt,
    });
    this._type = notification.type;
    this._title = notification.title;
    this._message = notification.message;
    this._data = notification.data;
    this._readAt = notification.readAt;
    this._user = notification?.user ? notification.user : null;
    this._isRead = notification.isRead;
    this._status = notification.status;
    this._isVisible = notification.isVisible;
  }

  private _type: string;

  get type(): string {
    return this._type;
  }

  set type(type: string) {
    this._type = type;
  }

  private _title: string;

  get title(): string {
    return this._title;
  }

  set title(title: string) {
    this._title = title;
  }

  private _message: string;

  get message(): string {
    return this._message;
  }

  set message(message: string) {
    this._message = message;
  }

  private _data: Record<string, unknown>;

  get data(): Record<string, unknown> {
    return this._data;
  }

  set data(data: Record<string, unknown>) {
    this._data = data;
  }

  private _readAt: Date;

  get readAt(): Date {
    return this._readAt;
  }

  set readAt(readAt: Date) {
    this._readAt = readAt;
  }

  private _user: User;

  get user(): User {
    return this._user;
  }

  set user(user: User) {
    this._user = user;
  }

  private _isRead: boolean;

  get isRead(): boolean {
    return this._isRead;
  }

  set isRead(isRead: boolean) {
    this._isRead = isRead;
  }

  private _status: SocketNotificationStatusEnum;

  get status(): SocketNotificationStatusEnum {
    return this._status;
  }

  set status(status: SocketNotificationStatusEnum) {
    this._status = status;
  }

  private _isVisible: boolean;

  get isVisible(): boolean {
    return this._isVisible;
  }

  set isVisible(isVisible: boolean) {
    this._isVisible = isVisible;
  }

  static fromStore(notification: NotificationEntity): Notification {
    return new Notification({
      id: notification.id,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
      deletedAt: notification.deletedAt,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      readAt: notification.readAt,
      user: notification.user ? User.fromStore(notification.user) : null,
      isRead: notification.isRead,
      status: notification.status,
      isVisible: notification.isVisible,
    });
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      title: this.title,
      message: this.message,
      data: this.data,
      readAt: this.readAt,
      isRead: this.isRead,
      status: this.status,
      isVisible: this.isVisible,
    };
  }

  toStore(): NotificationEntity {
    return Object.assign(new NotificationEntity(), {
      id: this.id,
      type: this.type,
      title: this.title,
      message: this.message,
      user: this.user?.toStore(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      isRead: this.isRead,
      readAt: this.readAt,
      status: this.status,
      isVisible: this.isVisible,
    });
  }
}
