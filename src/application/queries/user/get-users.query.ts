import { User } from '@core/entities/user.entity';
import { IUserRepository } from '@core/repositories/user.repository.interface';
import { UserEntity } from '@infrastructure/database/entities/user.entity';
import { Inject, Injectable } from '@nestjs/common';
import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { RolesEnum } from '@shared/constants/roles.constants';
import {
  FilterOperator,
  paginate,
  PaginateConfig,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { Not } from 'typeorm';

export class GetUsersQuery implements IQuery {
  constructor(
    public readonly user: User,
    public readonly paginateQuery: PaginateQuery,
  ) {}
}

@Injectable()
@QueryHandler(GetUsersQuery)
export class GetUsersQueryHandler implements IQueryHandler<GetUsersQuery> {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(query: GetUsersQuery): Promise<Paginated<User>> {
    const { user, paginateQuery } = query;

    const data = await paginate(
      paginateQuery,
      this.userRepository.repo,
      this.getPaginationConfig(user),
    );

    return {
      ...data,
      data: data.data.map(user => User.fromStore(user)),
    } as Paginated<User>;
  }

  private getPaginationConfig(user: User): PaginateConfig<UserEntity> {
    const config: PaginateConfig<UserEntity> = {
      defaultSortBy: [['createdAt', 'DESC']],
      sortableColumns: ['createdAt'],
      filterableColumns: {
        isActive: [FilterOperator.EQ],
        status: [FilterOperator.EQ, FilterOperator.IN],
        role: [FilterOperator.EQ, FilterOperator.IN],
      },
      relations: [
        'subscriptions',
        'subscriptions.plan',
        'subscriptions.instances',
        'subscriptions.user',
      ],
      searchableColumns: ['firstName', 'lastName', 'email', 'phoneNumber'],

      ignoreSelectInQueryParam: true,
    };

    if (user && user.role === RolesEnum.ADMIN) {
      config.where = {
        id: Not(user.id),
      };
    }

    return config;
  }
}
