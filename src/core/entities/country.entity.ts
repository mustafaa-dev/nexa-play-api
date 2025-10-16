import { CountryEntity } from '@infrastructure/database/entities/country.entity';
import { BaseEntity } from './base.entity';

interface ICountryProps {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  name?: string;
  isoCode?: string;
  flag?: string;
  code?: string;
}

export class Country extends BaseEntity<CountryEntity> {
  constructor(country: Partial<ICountryProps>) {
    super({
      id: country.id,
      createdAt: country.createdAt,
      updatedAt: country.updatedAt,
      deletedAt: country.deletedAt,
    });
    this._name = country.name;
    this._isoCode = country.isoCode;
    this._flag = country.flag;
    this._code = country.code;
  }

  private _name: string;

  get name(): string {
    return this._name;
  }

  set name(name: string) {
    this._name = name;
  }

  private _isoCode: string;

  get isoCode(): string {
    return this._isoCode;
  }

  set isoCode(isoCode: string) {
    this._isoCode = isoCode;
  }

  private _flag: string;

  get flag(): string {
    return this._flag;
  }

  set flag(flag: string) {
    this._flag = flag;
  }

  private _code: string;

  get code(): string {
    return this._code;
  }

  set code(code: string) {
    this._code = code;
  }

  static fromStore(country: CountryEntity): Country {
    return new Country({
      id: country.id,
      createdAt: country.createdAt,
      updatedAt: country.updatedAt,
      deletedAt: country.deletedAt,
      name: country.name,
      isoCode: country.isoCode,
      flag: country.flag,
      code: country.code,
    });
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      flag: this.flag,
      code: this.code,
    };
  }

  toStore(): CountryEntity {
    return Object.assign(new CountryEntity(), {
      id: this.id,
      name: this.name,
      isoCode: this.isoCode,
      flag: this.flag,
      code: this.code,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    });
  }
}
