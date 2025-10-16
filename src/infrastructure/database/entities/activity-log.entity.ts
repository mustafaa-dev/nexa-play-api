import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from './baseEntity';
import { UserEntity } from './user.entity';

@Entity('activity_logs')
export class ActivityLogEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 255, name: 'action' })
  action: string;

  @Column({ type: 'varchar', length: 255, name: 'resource_id' })
  resourceId: string;

  @Column({ type: 'varchar', length: 255, name: 'resource_type' })
  resourceType: string;

  @Column({ type: 'varchar', length: 255, name: 'ip_address' })
  ipAddress: string;

  @Column({ type: 'json', name: 'description' })
  description: Record<string, unknown>;

  @Column({ type: 'json', name: 'properties' })
  properties: Record<string, unknown>;

  @Column({ type: 'varchar', length: 255, name: 'user_agent' })
  userAgent: string;

  @ManyToOne(() => UserEntity, user => user.activityLogs)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
