import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';

export interface IBaseRepository<DomainEntity, Entity> {
  repo: Repository<Entity>;
  createFromDomain(domainEntity: DomainEntity): Promise<DomainEntity>;
  findById(id: string): Promise<DomainEntity | null>;
  findByIdOrThrow(id: string): Promise<DomainEntity>;
  findOne(options: FindOneOptions<Entity>): Promise<DomainEntity | null>;
  findOneOrThrow(options: FindOneOptions<Entity>): Promise<DomainEntity>;
  findMany(options?: FindManyOptions<Entity>): Promise<DomainEntity[]>;
  updateFromDomain(updates: Partial<DomainEntity> | Partial<DomainEntity>[]): Promise<DomainEntity>;
  delete(id: string): Promise<boolean>;
  forceDelete(id: string): Promise<boolean>;
  restore(id: string): Promise<DomainEntity>;
  exists(id: string): Promise<boolean>;
  count(options?: FindManyOptions<Entity>): Promise<number>;
}
