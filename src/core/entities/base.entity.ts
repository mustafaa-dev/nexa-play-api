import { AggregateRoot } from '@nestjs/cqrs';

export enum EntityViewEnum {
  ADMIN = 'admin',
  USER = 'user',
}

export abstract class BaseEntity<Entity> extends AggregateRoot {
  protected _view: EntityViewEnum = EntityViewEnum.USER;
  protected _paginate: boolean = false;

  protected constructor(props: Partial<Entity>) {
    super();
    Object.assign(this, props);
  }

  protected _id: string;

  // ID management
  get id(): string {
    return this._id;
  }

  set id(value: string) {
    this._id = value;
  }

  protected _createdAt: Date;

  // Timestamp management
  get createdAt(): Date {
    return this._createdAt;
  }

  set createdAt(value: Date) {}

  protected _updatedAt: Date;

  get updatedAt(): Date {
    return this._updatedAt;
  }

  set updatedAt(value: Date) {
    this._updatedAt = value;
  }

  protected _deletedAt?: Date;

  get deletedAt(): Date | undefined {
    return this._deletedAt;
  }

  set deletedAt(value: Date | undefined) {
    this._deletedAt = value;
  }

  // Factory methods
  static create<T extends BaseEntity<Entity>, Entity>(
    this: new (props: Partial<Entity>) => T,
    props: Partial<Entity>,
  ): T {
    return new this(props);
  }

  static fromJSON<T extends BaseEntity<Entity>, Entity>(
    this: new (props: Partial<Entity>) => T,
    json: Record<string, unknown>,
  ): T {
    return new this(json as Partial<Entity>);
  }

  static deserialize<T extends BaseEntity<Entity>, Entity>(
    this: new (props: Partial<Entity>) => T,
    serialized: string,
  ): T {
    const data = JSON.parse(serialized);
    return new this(data as Partial<Entity>);
  }

  toStore(): Entity {
    return this as unknown as Entity;
  }

  setView(view: EntityViewEnum): this {
    this._view = view;
    return this;
  }

  setPaginate(paginate: boolean): this {
    this._paginate = paginate;
    return this;
  }

  toJSON(): Record<string, unknown> {
    const base = {
      id: this._id,
      createdAt: this._createdAt?.toISOString(),
      updatedAt: this._updatedAt?.toISOString(),
    };

    if (this._view === EntityViewEnum.ADMIN) {
      return {
        ...base,
        deletedAt: this._deletedAt?.toISOString(),
      };
    }
    return base;
  }

  // Lifecycle methods
  touch(): void {
    this._updatedAt = new Date();
  }

  softDelete(): void {
    this._deletedAt = new Date();
    this.touch();
  }

  restore(): void {
    this._deletedAt = undefined;
    this.touch();
  }

  isDeleted(): boolean {
    return this._deletedAt !== undefined;
  }

  // Utility methods
  equals(other: BaseEntity<Entity>): boolean {
    return this._id === other._id;
  }

  clone(): this {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this);
  }

  // Validation
  isValid(): boolean {
    return this._id !== undefined && this._id !== null;
  }

  // Serialization
  serialize(): string {
    return JSON.stringify(this.toJSON());
  }

  updateFromDto(dto: Partial<Entity>): this {
    Object.assign(this, dto);
    this.touch();
    return this;
  }
}
