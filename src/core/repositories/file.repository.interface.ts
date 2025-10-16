import { File } from '@core/entities/file.entity';
import { FileEntity } from '@infrastructure/database/entities/file.entity';
import { IBaseRepository } from './base.repository.interface';

export interface IFileRepository extends IBaseRepository<File, FileEntity> {
  findByKeyAndDelete(key: string): Promise<boolean>;
  findByKeysAndDelete(keys: string[]): Promise<boolean>;
  deleteUnusedFiles(): Promise<boolean>;
}
