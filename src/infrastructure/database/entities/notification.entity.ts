import {
  SocketNotificationStatusEnum,
  SocketNotificationTypeEnum,
} from '@shared/constants/socket.constants';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './baseEntity';
import { UserEntity } from './user.entity';

@Entity('notifications')
export class NotificationEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: false })
  type: SocketNotificationTypeEnum;

  @ManyToOne(() => UserEntity, user => user.notifications)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  message: string;

  @Column({ type: 'json', nullable: true })
  data: Record<string, unknown>;

  @Column({ type: 'timestamp', nullable: true, default: null, name: 'read_at' })
  readAt: Date;

  @Column({ type: 'boolean', default: false, name: 'is_read', nullable: true })
  isRead: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  status: SocketNotificationStatusEnum;

  @Column({ type: 'boolean', default: false, name: 'is_visible', nullable: true })
  isVisible: boolean;
}
