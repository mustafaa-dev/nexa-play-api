import { GetCountriesQuery } from '@application/queries/country/get-countries.query';
import { GetCountryQuery } from '@application/queries/country/get-country.query';
import { Country } from '@core/entities/country.entity';
import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { APIVersions } from '@shared/constants/api-versions.constants';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';

@Controller(APIVersions.General('countries'))
export class CountryController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getCountries(@Paginate() query: PaginateQuery): Promise<Paginated<Country>> {
    return this.queryBus.execute(new GetCountriesQuery(query));
  }

  @HttpCode(HttpStatus.OK)
  @Get(':id')
  async getCountry(@Param('id') id: string) {
    return this.queryBus.execute(new GetCountryQuery(id));
  }
}
