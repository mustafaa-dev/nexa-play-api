import { GlobalProvider } from '@core/services/global.provider';
import { FileEntity } from '@infrastructure/database/entities/file.entity';
import { BaseEntity } from './base.entity';

interface IFileProps {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  name?: string;
  key?: string;
  mime_type?: string;
  size?: number;
  is_used?: boolean;
}

export class File extends BaseEntity<FileEntity> {
  constructor(file: Partial<IFileProps>) {
    super({
      id: file.id,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
      deletedAt: file.deletedAt,
    });
    this._name = file.name;
    this._key = file.key;
    this._mime_type = file.mime_type;
    this._size = file.size;
    this._isUsed = file.is_used;
  }

  private _name: string;

  get name(): string {
    return this._name;
  }

  set name(name: string) {
    this._name = name;
  }

  private _key: string;

  get key(): string {
    return this._key;
  }

  set key(key: string) {
    this._key = key;
  }

  private _mime_type: string;

  get mime_type(): string {
    return this._mime_type;
  }

  set mime_type(mime_type: string) {
    this._mime_type = mime_type;
  }

  private _size: number;

  get size(): number {
    return this._size;
  }

  set size(size: number) {
    this._size = size;
  }

  private _isUsed: boolean;

  set isUsed(is_used: boolean) {
    this._isUsed = is_used;
  }

  private _url: string;

  get url(): string {
    return GlobalProvider.getStorageService().getFileUrl(this.key);
  }

  static fromStore(file: FileEntity): File {
    return new File({
      id: file.id,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
      deletedAt: file.deletedAt,
      name: file.name,
      key: file.key,
      mime_type: file.mime_type,
      size: file.size,
      is_used: file.is_used,
    });
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      key: this.key,
      mime_type: this.mime_type,
      size: this.size,
      url: this._url,
    };
  }

  toStore(): FileEntity {
    return Object.assign(new FileEntity(), {
      id: this.id,
      name: this.name,
      key: this.key,
      mime_type: this.mime_type,
      size: this.size,
      is_used: this.isUsed,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    });
  }

  async getSignedURL() {
    this._url = await GlobalProvider.getStorageService().getDownloadUrl(this.key);
    return this;
  }

  async init() {
    this._url = await GlobalProvider.getStorageService().getDownloadUrl(this.key);
    return this;
  }
}
