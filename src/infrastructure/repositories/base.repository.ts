import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';

import { BaseEntity } from '@core/entities/base.entity';
import { LocalizedNotFoundException } from '@infrastructure/i18n';
import { LoggingService } from '@infrastructure/logging/logging.service';

export abstract class BaseRepository<DomainEntity extends BaseEntity<Entity>, Entity> {
  repo: Repository<Entity>;

  protected constructor(protected readonly entityRepository: Repository<Entity>) {
    this.repo = entityRepository;
  }

  // CRUD Operations
  async createFromDomain(domainEntity: DomainEntity): Promise<DomainEntity> {
    return await this.executeWithErrorHandling('create', async () => {
      const entity = domainEntity.toStore();
      const savedEntity = await this.entityRepository.save(entity);
      return this.mapToDomain(savedEntity);
    });
  }

  async findById(id: string): Promise<DomainEntity | null> {
    return await this.executeWithErrorHandling('findById', async () => {
      const entity = await this.entityRepository.findOne({
        where: { id } as unknown as FindOneOptions<Entity>['where'],
      });
      return entity ? this.mapToDomain(entity) : null;
    });
  }

  async findByIdOrThrow(id: string): Promise<DomainEntity> {
    const entity = await this.findById(id);
    if (!entity) {
      throw new LocalizedNotFoundException({
        property: this.entityRepository.metadata.tableName,
        value: id,
      });
    }
    return entity;
  }

  async findOne(options: FindOneOptions<Entity>): Promise<DomainEntity | null> {
    return this.executeWithErrorHandling('findOne', async () => {
      const entity = await this.entityRepository.findOne(options);
      return entity ? this.mapToDomain(entity) : null;
    });
  }

  async findOneOrThrow(options: FindOneOptions<Entity>): Promise<DomainEntity> {
    const entity = await this.findOne(options);
    if (!entity) {
      throw new LocalizedNotFoundException({
        property: this.entityRepository.metadata.tableName,
        value: options.where[Object.keys(options.where)[0]],
      });
    }
    return entity;
  }

  async findMany(options?: FindManyOptions<Entity>): Promise<DomainEntity[]> {
    return await this.executeWithErrorHandling('findMany', async () => {
      const entities = await this.entityRepository.find(options);
      return entities.map(entity => this.mapToDomain(entity));
    });
  }

  async updateFromDomain(
    updates: Partial<DomainEntity> | Partial<DomainEntity>[],
  ): Promise<DomainEntity> {
    return (await this.executeWithErrorHandling('update', async () => {
      if (Array.isArray(updates)) {
        const entities = updates.map(async update => {
          const existingEntity = await this.findByIdOrThrow(update.id);
          Object.assign(existingEntity, update);
          existingEntity.touch();
          return existingEntity;
        });
        const updatedEntities = await Promise.all(entities);
        return updatedEntities.map(entity => this.mapToDomain(entity.toStore()));
      } else {
        const existingEntity = await this.findByIdOrThrow(updates.id);
        Object.assign(existingEntity, updates);
        existingEntity.touch();

        const entity = existingEntity.toStore();
        const updatedEntity = await this.entityRepository.save(entity);
        return this.mapToDomain(updatedEntity);
      }
    })) as DomainEntity;
  }

  async delete(id: string): Promise<boolean> {
    return this.executeWithErrorHandling('delete', async () => {
      const entity = await this.findByIdOrThrow(id);
      entity.softDelete();
      const softDeletedEntity = entity.toStore();
      await this.entityRepository.save(softDeletedEntity);
      return true;
    });
  }

  async forceDelete(id: string): Promise<boolean> {
    return await this.executeWithErrorHandling('forceDelete', async () => {
      const result = await this.entityRepository.delete(id);
      return result.affected ? result.affected > 0 : false;
    });
  }

  async restore(id: string): Promise<DomainEntity> {
    return await this.executeWithErrorHandling('restore', async () => {
      const entity = await this.findByIdOrThrow(id);

      entity.restore();

      const restoredEntity = entity.toStore();

      const savedEntity = await this.entityRepository.save(restoredEntity);
      return this.mapToDomain(savedEntity);
    });
  }

  async exists(id: string): Promise<boolean> {
    return await this.executeWithErrorHandling('exists', async () => {
      const count = await this.entityRepository.count({
        where: { id } as unknown as FindManyOptions<Entity>['where'],
      });
      return count > 0;
    });
  }

  async count(options?: FindManyOptions<Entity>): Promise<number> {
    return await this.executeWithErrorHandling('count', async () => {
      return await this.entityRepository.count(options);
    });
  }

  protected handleError<R>(
    operation: string,
    error: unknown,
    returnValue: R | null = null,
  ): R | null {
    if (error instanceof Error) {
      LoggingService.error(`Error in ${operation}: ${error.message}`, {
        stack: error.stack,
        context: this.constructor.name,
      });
    } else {
      LoggingService.error(`Error in ${operation}: ${String(error)}`, {
        context: this.constructor.name,
      });
    }

    return returnValue;
  }

  protected async executeWithErrorHandling<R>(
    operation: string,
    action: () => Promise<R>,
    fallbackValue?: R,
  ): Promise<R | undefined> {
    try {
      return await action();
    } catch (error) {
      return this.handleError<R>(operation, error, fallbackValue ?? null);
    }
  }

  protected abstract mapToDomain(entity: Entity): DomainEntity;
}
