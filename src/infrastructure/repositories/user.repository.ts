import { File } from '@core/entities/file.entity';
import { User } from '@core/entities/user.entity';
import { IUserRepository } from '@core/repositories/user.repository.interface';
import { UserEntity } from '@infrastructure/database/entities/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from './base.repository';

@Injectable()
export class UserRepository extends BaseRepository<User, UserEntity> implements IUserRepository {
  constructor(@InjectRepository(UserEntity) private repository: Repository<UserEntity>) {
    super(repository);
  }

  protected mapToDomain(entity: UserEntity): User {
    const user = User.fromStore(entity);
    if (entity.avatar) {
      user.avatar = File.fromStore(entity.avatar);
    }
    return user;
  }
}
