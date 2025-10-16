import { BadGatewayException, Inject, Injectable } from '@nestjs/common';

import { File } from '@core/entities/file.entity';
import { IFileRepository } from '@core/repositories/file.repository.interface';
import { ConfigService } from '@nestjs/config';
import { EntityNotFoundError } from 'typeorm';
import { LoggingService } from '../logging/logging.service';
import { StorageStrategyInterface } from './interfaces/storage-strategy.interface';
import { prepareFileForUpload } from './storage.config';
import { StorageFactory } from './storage.factory';

@Injectable()
export class StorageService {
  private readonly storageStrategy: StorageStrategyInterface;

  constructor(
    private readonly storageFactory: StorageFactory,
    private readonly configService: ConfigService,
    @Inject('FileRepository')
    private readonly fileRepository: IFileRepository,
  ) {
    this.storageStrategy = this.storageFactory.getStrategy();
  }

  async uploadFile(bucket: string, file: Express.Multer.File) {
    const { key, body } = prepareFileForUpload(file);
    if (!key || !body) throw new BadGatewayException('validation.isImage');
    LoggingService.debug(
      `Uploading file to bucket: ${bucket}, file name: ${file.originalname} with key : ${key}`,
      { context: StorageService.name },
    );
    const fileEntity = new File({
      name: file.originalname,
      key,
      mime_type: file.mimetype,
      size: file.size,
    });
    await this.fileRepository.createFromDomain(fileEntity);
    return await this.storageStrategy.uploadFile(bucket, key, body);
  }

  async getFileEntity(key: string): Promise<File | null> {
    const file = await this.fileRepository.findOne({
      where: {
        key,
      },
    });
    if (!file) throw new EntityNotFoundError('File', key);
    return file;
  }

  async uploadToInstance(instanceId: string, file: Express.Multer.File) {
    const { key, body } = prepareFileForUpload(file);
    if (!key || !body) throw new BadGatewayException('validation.isImage');
    LoggingService.debug(
      `Uploading file to instance: ${instanceId}, file name: ${file.originalname} with key : ${key}`,
      { context: StorageService.name },
    );
    await this.storageStrategy.uploadFile(instanceId, key, body);
    return key;
  }

  getFile(path: string) {
    try {
      if (path.includes('/')) {
        const [bucket, ...keyParts] = path.split('/');
        const key = keyParts.join('/');
        LoggingService.debug(`Getting file : ${key}`, {
          context: StorageService.name,
        });
        return this.storageStrategy.getFile(bucket, key);
      } else {
        const bucket = this.configService.get<string>('AWS_S3_BUCKET');
        const key = path;
        LoggingService.debug(`Getting file : ${key}`, {
          context: StorageService.name,
        });
        return this.storageStrategy.getFile(bucket, key);
      }
    } catch (error) {
      // LoggingService.error(`Failed to get file: ${error.message}`, error.stack);
      return null;
    }
  }

  getFileUrl(path: string, instanceId?: string) {
    const s3Endpoint = this.configService.get<string>('STORAGE_PUBLIC_URL');
    const s3_bucket = instanceId || this.configService.get<string>('STORAGE_BUCKET');
    return `${s3Endpoint}/${s3_bucket}/${path}`;
  }

  async deleteFile(url: string) {
    try {
      const { bucket, key } = this.parseS3Url(url);
      LoggingService.debug(`Deleting file from bucket: ${bucket}, key: ${key}`, {
        context: StorageService.name,
      });
      return await this.storageStrategy.deleteFile(bucket, key);
    } catch (error) {
      LoggingService.error(`Failed to delete file: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteFiles(bucket: string, keys: string[]) {
    try {
      LoggingService.debug(`Deleting files from bucket: ${bucket}, keys: ${keys}`, {
        context: StorageService.name,
      });
      return await this.storageStrategy.deleteFiles(bucket, keys);
    } catch (error) {
      LoggingService.error(`Failed to delete files: ${error.message}`, error.stack);
      throw error;
    }
  }

  private parseS3Url(url: string): { bucket: string; key: string } {
    const urlParts = new URL(url);
    const bucket = urlParts.hostname.split('.')[0];
    const key = urlParts.pathname.slice(1);
    return { bucket, key };
  }

  getDownloadUrl(key: string, bucket: string = this.configService.get<string>('STORAGE_BUCKET')) {
    return this.storageStrategy.getDownloadUrl(bucket, key);
  }
}
