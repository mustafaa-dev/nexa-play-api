import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';
import { Readable } from 'stream';
import { StorageStrategyInterface } from '../interfaces/storage-strategy.interface';

export class LocalStrategy implements StorageStrategyInterface {
  private readonly publicDir: string;

  constructor() {
    this.publicDir = path.join(process.cwd(), 'public');
  }

  async uploadFile(bucket: string, key: string, body: Buffer | Readable | string): Promise<string> {
    const targetDir = path.join(this.publicDir, bucket);
    const targetPath = path.join(targetDir, key);

    await fsp.mkdir(targetDir, { recursive: true });

    if (Buffer.isBuffer(body)) {
      await fsp.writeFile(targetPath, body);
    } else if (typeof body === 'string') {
      await fsp.writeFile(targetPath, body, 'utf8');
    } else {
      const writeStream = fs.createWriteStream(targetPath);
      const readableBody = body as Readable;
      readableBody.pipe(writeStream);

      await new Promise((resolve, reject) => {
        readableBody.on('error', reject);
        writeStream.on('finish', () => resolve(undefined));
        writeStream.on('error', reject);
      });
    }

    return `/public/${bucket}/${key}`;
  }

  async getFile(bucket: string, key: string): Promise<Buffer> {
    const filePath = path.join(this.publicDir, bucket, key);

    try {
      return await fsp.readFile(filePath);
    } catch (error) {
      throw new Error(`File not found: ${bucket}/${key}`);
    }
  }

  async deleteFile(bucket: string, key: string): Promise<void> {
    const filePath = path.join(this.publicDir, bucket, key);

    try {
      await fsp.unlink(filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async deleteFiles(bucket: string, keys: string[]): Promise<void> {
    const deletePromises = keys.map(async key => {
      const filePath = path.join(this.publicDir, bucket, key);

      try {
        await fsp.unlink(filePath);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    });

    await Promise.all(deletePromises);
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
