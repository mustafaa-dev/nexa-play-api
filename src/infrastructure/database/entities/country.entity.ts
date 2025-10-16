import { Column, Entity } from 'typeorm';

import { BaseEntity } from './baseEntity';

@Entity('countries')
export class CountryEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 255, name: 'name', nullable: false })
  name: string;

  @Column({
    type: 'varchar',
    length: 45,
    nullable: false,
    unique: true,
    name: 'iso_code',
  })
  isoCode: string;

  @Column({ type: 'varchar', length: 255, name: 'flag', nullable: false })
  flag: string;

  @Column({ type: 'varchar', length: 255, name: 'code', nullable: false })
  code: string;
}
