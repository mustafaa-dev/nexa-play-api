import { Column, Entity, OneToOne } from 'typeorm';

import { BaseEntity } from '@infrastructure/database/entities/baseEntity';
import { UserEntity } from './user.entity';

@Entity('files')
export class FileEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  key: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mime_type: string;

  @Column({ type: 'bigint', nullable: true })
  size: number;

  @Column({ type: 'boolean', default: false })
  is_used: boolean;

  @OneToOne(() => UserEntity, user => user.avatar, { nullable: true })
  userAvatar: UserEntity;
}
