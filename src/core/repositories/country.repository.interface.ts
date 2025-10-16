import { Country } from '@core/entities/country.entity';
import { CountryEntity } from '@infrastructure/database/entities/country.entity';
import { IBaseRepository } from './base.repository.interface';

export type ICountryRepository = IBaseRepository<Country, CountryEntity>;
