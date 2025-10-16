import { Country } from '@core/entities/country.entity';
import { ICountryRepository } from '@core/repositories/country.repository.interface';
import { CountryEntity } from '@infrastructure/database/entities/country.entity';
import { Inject } from '@nestjs/common';
import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  FilterOperator,
  paginate,
  PaginateConfig,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';

export class GetCountriesQuery implements IQuery {
  constructor(public readonly paginateQuery: PaginateQuery) {}
}

@QueryHandler(GetCountriesQuery)
export class GetCountriesQueryHandler implements IQueryHandler<GetCountriesQuery> {
  constructor(
    @Inject('CountryRepository')
    private readonly countryRepository: ICountryRepository,
  ) {}

  async execute(query: GetCountriesQuery): Promise<Paginated<Country>> {
    const { paginateQuery } = query;

    const data = await paginate(
      paginateQuery,
      this.countryRepository.repo,
      this.getPaginationConfig(),
    );

    return {
      ...data,
      data: data.data.map(country => Country.fromStore(country)),
    } as Paginated<Country>;
  }

  private getPaginationConfig(): PaginateConfig<CountryEntity> {
    const config: PaginateConfig<CountryEntity> = {
      defaultSortBy: [['createdAt', 'DESC']],
      sortableColumns: ['createdAt'],
      filterableColumns: {
        name: [FilterOperator.EQ],
        isoCode: [FilterOperator.EQ],
        flag: [FilterOperator.EQ],
        code: [FilterOperator.EQ],
      },
      ignoreSelectInQueryParam: true,
    };

    return config;
  }
}
