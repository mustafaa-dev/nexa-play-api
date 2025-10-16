import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import { StorageStrategyInterface } from '../interfaces/storage-strategy.interface';

export class AmazonS3Strategy implements StorageStrategyInterface {
  private readonly s3Client: S3Client;

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.getOrThrow<string>('AWS_DEFAULT_REGION'),
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('AWS_S3_ACCESS_KEY'),
        secretAccessKey: this.configService.getOrThrow<string>('AWS_S3_KEY_SECRET'),
      },
    });
  }

  async uploadFile(bucket: string, key: string, body: Buffer | Readable | string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
    });
    await this.s3Client.send(command);
    return key;
  }

  async getFile(bucket: string, key: string): Promise<Buffer> {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await this.s3Client.send(command);
    const chunks: Uint8Array[] = [];

    return new Promise((resolve, reject) => {
      (response.Body as Readable)?.on('data', chunk => chunks.push(chunk));
      (response.Body as Readable)?.on('end', () => resolve(Buffer.concat(chunks)));
      (response.Body as Readable)?.on('error', reject);
    });
  }

  async deleteFile(bucket: string, key: string): Promise<void> {
    const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
    await this.s3Client.send(command);
  }

  async deleteFiles(bucket: string, keys: string[]): Promise<void> {
    const command = new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: keys.map(key => ({ Key: key })), Quiet: true },
    });
    await this.s3Client.send(command);
  }

  async getDownloadUrl(
    bucket: string,
    key: string,
    _expiresInSeconds = 900,
    filenameOverride?: string,
  ): Promise<string> {
    return `/public/${bucket}/${key}`;
  }
}
