import { Country } from '@core/entities/country.entity';
import { ICountryRepository } from '@core/repositories/country.repository.interface';
import { LocalizedNotFoundException } from '@infrastructure/i18n';
import { Inject } from '@nestjs/common';
import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';

export class GetCountryQuery implements IQuery {
  constructor(public readonly id: string) {}
}

@QueryHandler(GetCountryQuery)
export class GetCountryQueryHandler implements IQueryHandler<GetCountryQuery> {
  constructor(
    @Inject('CountryRepository')
    private readonly countryRepository: ICountryRepository,
  ) {}

  async execute(query: GetCountryQuery): Promise<Country> {
    const { id } = query;
    const country = await this.countryRepository.findById(id);

    if (!country) {
      throw new LocalizedNotFoundException({
        property: 'country',
        value: id,
      });
    }

    return country;
  }
}
