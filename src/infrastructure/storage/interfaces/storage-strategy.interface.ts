import { Readable } from 'stream';

export interface StorageStrategyInterface {
  uploadFile(bucket: string, key: string, body: Buffer | Readable | string): Promise<string>;

  getFile(bucket: string, key: string): Promise<Buffer>;

  deleteFile(bucket: string, key: string): Promise<void>;

  deleteFiles(bucket: string, keys: string[]): Promise<void>;

  /**
   * Returns a pre-signed URL to download the object directly from storage.
   * expiresInSeconds defaults to 900s (15 minutes)
   */
  getDownloadUrl(
    bucket: string,
    key: string,
    expiresInSeconds?: number,
    filenameOverride?: string,
  ): Promise<string>;
}
