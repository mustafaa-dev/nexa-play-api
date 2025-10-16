import { Country } from '@core/entities/country.entity';
import { ICountryRepository } from '@core/repositories/country.repository.interface';
import { CountryEntity } from '@infrastructure/database/entities/country.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from './base.repository';

@Injectable()
export class CountryRepository
  extends BaseRepository<Country, CountryEntity>
  implements ICountryRepository
{
  constructor(
    @InjectRepository(CountryEntity)
    readonly countryRepository: Repository<CountryEntity>,
  ) {
    super(countryRepository);
  }

  protected mapToDomain(entity: CountryEntity): Country {
    return Country.fromStore(entity);
  }
}
