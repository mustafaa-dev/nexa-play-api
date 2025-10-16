import { AmazonS3Strategy } from './strategies/s3.strategy';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { LocalStrategy } from './strategies/local.strategy';
import { MinioStrategy } from './strategies/minio.strategy';
import { StorageProviderEnum } from './storage.provider.enum';
import { StorageStrategyInterface } from './interfaces/storage-strategy.interface';

@Injectable()
export class StorageFactory {
  private provider: string;

  constructor(private readonly configService: ConfigService) {}

  get providerName(): string {
    return this.provider;
  }

  getStrategy(): StorageStrategyInterface {
    const provider = this.configService.get<string>('STORAGE_PROVIDER');
    this.provider = provider;
    switch (provider) {
      case StorageProviderEnum.MINIO:
        return new MinioStrategy(this.configService);
      case StorageProviderEnum.AMAZON_S3:
        return new AmazonS3Strategy(this.configService);
      default:
        return new LocalStrategy();
    }
  }
}
