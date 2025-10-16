import { UserEntity } from '@infrastructure/database/entities/user.entity';
import { User } from '../entities/user.entity';
import { IBaseRepository } from './base.repository.interface';

export interface IUserRepository extends IBaseRepository<User, UserEntity> {}
