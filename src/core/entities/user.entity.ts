import { FirstName, LastName } from '@core/value-objects/name.vo';

import { IUserDataResponse } from '@application/dtos/responses/user.response';
import { Email } from '@core/value-objects/email.vo';
import { Password } from '@core/value-objects/password.vo';
import { PhoneNumber } from '@core/value-objects/phone-number.vo';
import { UserEntity } from '@infrastructure/database/entities/user.entity';
import { RolesEnum } from '@shared/constants/roles.constants';
import { UserStatus } from '@shared/constants/user.constants';
import { v4 as uuidv4 } from 'uuid';
import { BaseEntity } from './base.entity';
import { File } from './file.entity';

export interface IUserProps {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  emailVerifiedAt?: Date;
  passwordHash?: string;
  phoneNumber?: string;
  githubId?: string;
  isActive?: boolean;
  status?: UserStatus;
  role?: RolesEnum;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  isTrialUsed?: boolean;
  avatar?: File;
}

export class User extends BaseEntity<UserEntity> {
  private _status: UserStatus;

  constructor(props: IUserProps) {
    super({
      id: props.id ?? uuidv4(),
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
      deletedAt: props.deletedAt ?? undefined,
    });
    // Value objects
    this._firstName = new FirstName(props.firstName ?? '');
    this._lastName = new LastName(props.lastName ?? '');
    this._email = new Email(props.email ?? '');
    this._phoneNumber = new PhoneNumber(props.phoneNumber ?? '');

    // Password must be provided (hash if not)
    this._passwordHash = props.passwordHash
      ? Password.isHashed(props.passwordHash)
        ? props.passwordHash
        : Password.Hash(props.passwordHash)
      : '';

    this._emailVerifiedAt = props.emailVerifiedAt ?? null;
    this._lastLoginAt = props.lastLoginAt ?? undefined;
    this._githubId = props.githubId ?? undefined;

    this._status = props.status ?? UserStatus.ACTIVE;
    this._isTrialUsed = props.isTrialUsed ?? false;
    // Dates
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
    this._deletedAt = props.deletedAt ?? undefined;
    this._avatar = props.avatar ?? undefined;
  }

  private _emailVerifiedAt?: Date;

  get emailVerifiedAt(): Date | undefined {
    return this._emailVerifiedAt;
  }

  set emailVerifiedAt(value: Date) {
    this._emailVerifiedAt = value;
    this.touch();
  }

  private _email: Email;

  get email(): Email {
    return this._email;
  }

  set email(value: string) {
    this._email = new Email(value);
  }

  private _isActive: boolean;

  get isActive(): boolean {
    return this._status === UserStatus.ACTIVE;
  }

  private _phoneNumber: PhoneNumber;

  get phoneNumber(): PhoneNumber {
    return this._phoneNumber;
  }

  set phoneNumber(value: string) {
    this._phoneNumber = new PhoneNumber(value);
  }

  private _githubId?: string;

  get githubId(): string | undefined {
    return this._githubId;
  }

  set githubId(value: string) {
    this._githubId = value;
    this._updatedAt = new Date();
  }

  private _role: RolesEnum;

  get role(): RolesEnum {
    return this._role;
  }

  set role(value: RolesEnum) {
    this._role = value;
    this._updatedAt = new Date();
  }

  private _accessToken?: string;

  get accessToken(): string | undefined {
    return this._accessToken;
  }

  set accessToken(value: string) {
    this._accessToken = value;
  }

  private _isTrialUsed: boolean;

  get isTrialUsed(): boolean {
    return this._isTrialUsed;
  }

  set isTrialUsed(value: boolean) {
    this._isTrialUsed = value;
  }

  private _avatar?: File;

  get avatar(): File | undefined {
    return this._avatar;
  }

  set avatar(value: File) {
    this._avatar = value;
  }

  private _passwordHash: string;

  get passwordHash() {
    return this._passwordHash;
  }

  private _firstName: FirstName;

  get firstName(): FirstName {
    return this._firstName;
  }

  set firstName(value: string) {
    this._firstName = new FirstName(value);
    this._updatedAt = new Date();
  }

  private _lastName: LastName;

  get lastName(): LastName {
    return this._lastName;
  }

  set lastName(value: string) {
    this._lastName = new LastName(value);
    this._updatedAt = new Date();
  }

  get name(): string {
    return `${this._firstName.getValue()} ${this._lastName.getValue()}`;
  }

  get status(): UserStatus {
    return this._status;
  }

  private _lastLoginAt?: Date;

  get lastLoginAt(): Date | undefined {
    return this._lastLoginAt;
  }

  static fromStore(user: UserEntity): User {
    const userEntity = new User({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt,
      passwordHash: user.passwordHash,
      phoneNumber: user.phoneNumber,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
      avatar: user.avatar ? File.fromStore(user.avatar) : undefined,
    });

    return userEntity;
  }

  activate(): void {
    this._status = UserStatus.ACTIVE;
    this._updatedAt = new Date();
  }

  deactivate(): void {
    this._status = UserStatus.DEACTIVATED;
    this._updatedAt = new Date();
  }

  toStore(): UserEntity {
    return Object.assign(new UserEntity(), {
      id: this._id,
      firstName: this._firstName.getValue(),
      lastName: this._lastName.getValue(),
      email: this._email.getValue(),
      emailVerifiedAt: this._emailVerifiedAt,
      passwordHash: this._passwordHash,
      phoneNumber: this._phoneNumber.getValue(),
      status: this._status,
      lastLoginAt: this._lastLoginAt,
      role: this?._role,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
      avatar: this._avatar?.toStore(),
    });
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      firstName: this._firstName.getValue(),
      lastName: this._lastName.getValue(),
      email: this._email.getValue(),
      emailVerifiedAt: this._emailVerifiedAt,
      phoneNumber: this._phoneNumber.getValue(),
      isActive: this._isActive,
      status: this._status,
      lastLoginAt: this._lastLoginAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
      avatar: this._avatar?.url,
    };
  }

  updateLastLogin(): void {
    this._lastLoginAt = new Date();
    this._updatedAt = new Date();
  }

  setPassword(passwordHash: string): void {
    this._passwordHash = Password.isHashed(passwordHash)
      ? passwordHash
      : Password.Hash(passwordHash);
    this._updatedAt = new Date();
  }

  comparePassword(password: string): Promise<boolean> {
    return Password.compare(password, this._passwordHash);
  }

  touch(): void {
    this._updatedAt = new Date();
  }

  buildUserData(): IUserDataResponse {
    return {
      firstName: this.firstName.getValue(),
      lastName: this.lastName.getValue(),
      phoneNumber: this.phoneNumber.getValue(),
      status: this.status,
      emailVerified: !!this.emailVerifiedAt,
      avatar: this.avatar?.url,
      role: this.role,
      email: this.email?.getValue() ? this.email.getValue() : (this.email as unknown as string),
      isActive: this.isActive,
      isAdmin: this.role === RolesEnum.ADMIN,
    };
  }

  protected mapToDomain(entity: UserEntity): User {
    return User.fromStore(entity);
  }
}
