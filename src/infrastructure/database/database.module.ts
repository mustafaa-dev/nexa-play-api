import { Global, Module } from '@nestjs/common';

import { getDataSourceOptions } from '@infrastructure/config/datasource.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLogEntity } from './entities/activity-log.entity';
import { CountryEntity } from './entities/country.entity';
import { FileEntity } from './entities/file.entity';
import { NotificationEntity } from './entities/notification.entity';
import { UserEntity } from './entities/user.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...getDataSourceOptions(),
    }),

    TypeOrmModule.forFeature([
      UserEntity,
      NotificationEntity,
      ActivityLogEntity,
      CountryEntity,
      FileEntity,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
