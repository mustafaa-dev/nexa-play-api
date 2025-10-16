import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';

import { RolesEnum } from '@shared/constants/roles.constants';
import { UserStatus } from '@shared/constants/user.constants';
import { ActivityLogEntity } from './activity-log.entity';
import { BaseEntity } from './baseEntity';
import { FileEntity } from './file.entity';
import { NotificationEntity } from './notification.entity';

@Entity('users')
export class UserEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 255, name: 'first_name' })
  firstName: string;

  @Column({ type: 'varchar', length: 255, name: 'last_name' })
  lastName: string;

  @Column({ type: 'varchar', length: 255, name: 'email' })
  email: string;

  @Column({ type: 'timestamp', nullable: true, name: 'email_verified_at' })
  emailVerifiedAt: Date;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'varchar', length: 255, name: 'phone_number' })
  phoneNumber: string;

  @Column({ type: 'enum', enum: UserStatus, name: 'status', default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ type: 'timestamp', nullable: true, name: 'last_login_at' })
  lastLoginAt: Date;

  @Column({ type: 'enum', enum: RolesEnum, name: 'role', default: RolesEnum.USER })
  role: RolesEnum;

  @OneToMany(() => ActivityLogEntity, log => log.user)
  activityLogs: ActivityLogEntity[];

  @OneToOne(() => FileEntity, file => file.userAvatar, { nullable: true })
  @JoinColumn({ name: 'avatar_id' })
  avatar: FileEntity;

  @OneToMany(() => NotificationEntity, notification => notification.user)
  notifications: NotificationEntity[];
}
