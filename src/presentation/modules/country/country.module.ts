import { CqrsModule } from '@nestjs/cqrs';
// Command Handlers
import { Module } from '@nestjs/common';
// Query Handlers
// Controllers
// Repositories
// Services
import { GetCountriesQueryHandler } from '@application/queries/country/get-countries.query';
import { GetCountryQueryHandler } from '@application/queries/country/get-country.query';
import { CountryRepository } from '@infrastructure/repositories/country.repository';
import { CountryController } from './country.controller';

const queryHandlers = [GetCountriesQueryHandler, GetCountryQueryHandler];

const commandHandlers = [];

@Module({
  imports: [CqrsModule],
  controllers: [CountryController],
  providers: [
    {
      provide: 'CountryRepository',
      useClass: CountryRepository,
    },

    // Query handlers
    ...queryHandlers,

    // Command handlers
    ...commandHandlers,
  ],
})
export class CountryModule {}
