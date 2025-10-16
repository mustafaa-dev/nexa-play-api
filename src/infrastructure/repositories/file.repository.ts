import { File } from '@core/entities/file.entity';
import { IFileRepository } from '@core/repositories/file.repository.interface';
import { FileEntity } from '@infrastructure/database/entities/file.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import { BaseRepository } from './base.repository';

@Injectable()
export class FileRepository extends BaseRepository<File, FileEntity> implements IFileRepository {
  constructor(
    @InjectRepository(FileEntity)
    readonly fileRepository: Repository<FileEntity>,
  ) {
    super(fileRepository);
  }

  async findByKeyAndDelete(key: string): Promise<boolean> {
    const file = await this.fileRepository.findOne({ where: { key } });
    await this.fileRepository.remove(file);
    return true;
  }

  async findByKeysAndDelete(keys: string[]): Promise<boolean> {
    const files = await this.fileRepository.find({ where: { key: In(keys) } });
    await this.fileRepository.remove(files);
    return true;
  }

  async deleteUnusedFiles(): Promise<boolean> {
    const files = await this.fileRepository.find({
      where: {
        is_used: false,
        createdAt: LessThan(new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)),
      },
    });
    await this.fileRepository.remove(files);
    return true;
  }

  protected mapToDomain(entity: FileEntity): File {
    return File.fromStore(entity);
  }
}
