import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { Readable } from 'stream';
import { StorageStrategyInterface } from '../interfaces/storage-strategy.interface';

export class MinioStrategy implements StorageStrategyInterface {
  private readonly minioClient: Minio.Client;
  private readonly publicMinioClient?: Minio.Client;
  private readonly defaultBucket: string;
  private initialized = false;

  constructor(private readonly configService: ConfigService) {
    this.minioClient = new Minio.Client({
      endPoint: configService.getOrThrow<string>('STORAGE_ENDPOINT'),
      port: Number(configService.get<string>('STORAGE_PORT')) || 9000,
      useSSL: configService.get<string>('STORAGE_USE_SSL') === 'true' || false,
      accessKey: configService.getOrThrow<string>('STORAGE_ACCESS_KEY'),
      secretKey: configService.getOrThrow<string>('STORAGE_KEY_SECRET'),
    });

    // Optional: a dedicated client that uses the public URL for signing so the host is public from the start
    const publicUrl = configService.get<string>('STORAGE_PUBLIC_URL');
    if (publicUrl) {
      const parsed = new URL(publicUrl);
      const useSSL = parsed.protocol === 'https:';
      const port = parsed.port ? Number(parsed.port) : useSSL ? 443 : 80;

      this.publicMinioClient = new Minio.Client({
        endPoint: parsed.hostname,
        port,
        useSSL,
        accessKey: configService.getOrThrow<string>('STORAGE_ACCESS_KEY'),
        secretKey: configService.getOrThrow<string>('STORAGE_KEY_SECRET'),
      });
    }

    // Get the default bucket from environment
    this.defaultBucket = this.configService.get<string>('STORAGE_BUCKET') || 'megasender';

    // Initialize the default bucket during construction
    this.initializeDefaultBucket();
  }

  /**
   * Initialize the default bucket with public access
   */
  private async initializeDefaultBucket(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.ensureBucketExists(this.defaultBucket);
      this.initialized = true;
    } catch (error) {
      console.error(`Failed to initialize default bucket '${this.defaultBucket}':`, error);
    }
  }

  /**
   * Ensure bucket exists and has public read access
   */
  private async ensureBucketExists(bucket: string): Promise<void> {
    try {
      const exists = await this.minioClient.bucketExists(bucket);
      if (!exists) {
        await this.minioClient.makeBucket(bucket);
        await this.makeBucketPublic(bucket);
      } else {
        // Ensure existing bucket has public read access
        await this.makeBucketPublic(bucket);
      }
    } catch (error) {
      console.error(`Failed to ensure bucket ${bucket} exists:`, error);
      throw error;
    }
  }

  /**
   * Make bucket publicly readable
   */
  private async makeBucketPublic(bucket: string): Promise<void> {
    try {
      // Policy for MinIO public access with proper viewing
      const publicReadPolicy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: '*',
            Action: [
              's3:GetObject',
              's3:GetObjectVersion',
              's3:GetObjectAcl',
              's3:ListBucket',
              's3:GetBucketLocation',
              's3:GetBucketPolicy',
            ],
            Resource: [`arn:aws:s3:::${bucket}`, `arn:aws:s3:::${bucket}/*`],
          },
        ],
      };

      await this.minioClient.setBucketPolicy(bucket, JSON.stringify(publicReadPolicy));

      // Also try to set anonymous policy for better MinIO compatibility
      try {
        await this.minioClient.setBucketPolicy(
          bucket,
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: '*',
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::${bucket}/*`],
                Condition: {
                  StringEquals: {
                    's3:ResourceType': 'object',
                  },
                },
              },
            ],
          }),
        );
      } catch (anonError) {
        // Use the first policy if anonymous doesn't work
      }

      // Bucket is now publicly readable and viewable
    } catch (error) {
      console.error(`Failed to make bucket ${bucket} public:`, error);
      // Don't throw error as this is not critical for basic functionality
    }
  }

  async uploadFile(bucket: string, key: string, body: Buffer | Readable | string): Promise<string> {
    // Ensure bucket exists and is public before uploading
    await this.ensureBucketExists(bucket);

    // Set proper content type and force inline display
    const contentType = this.getContentType(key);
    const metadata = {
      'Content-Type': contentType,
      'Content-Disposition': 'inline',
      'Cache-Control': 'public, max-age=31536000',
      'X-Content-Type-Options': 'nosniff',
    };

    await this.minioClient.putObject(bucket, key, body, undefined, metadata);
    return key;
  }

  /**
   * Get content type based on file extension
   */
  private getContentType(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      pdf: 'application/pdf',
      txt: 'text/plain',
      html: 'text/html',
      css: 'text/css',
      js: 'application/javascript',
      json: 'application/json',
      xml: 'application/xml',
      mp4: 'video/mp4',
      webm: 'video/webm',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Determine if file should be displayed inline or downloaded
   */
  private shouldInline(filename: string): boolean {
    const ext = filename.toLowerCase().split('.').pop();
    const inlineExtensions = [
      'jpg',
      'jpeg',
      'png',
      'gif',
      'webp',
      'svg',
      'pdf',
      'txt',
      'html',
      'css',
      'js',
      'json',
      'xml',
      'mp4',
      'webm',
      'mp3',
      'wav',
    ];
    return inlineExtensions.includes(ext);
  }

  async getFile(bucket: string, key: string): Promise<Buffer> {
    try {
      const stream = await this.minioClient.getObject(bucket, key);
      const chunks: Uint8Array[] = [];

      return await new Promise((resolve, reject) => {
        stream.on('data', chunk => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });
    } catch (error) {
      return null;
    }
  }

  async deleteFile(bucket: string, key: string): Promise<void> {
    await this.minioClient.removeObject(bucket, key);
  }

  async deleteFiles(bucket: string, keys: string[]): Promise<void> {
    await this.minioClient.removeObjects(bucket, keys);
  }

  async getDownloadUrl(bucket: string, key: string, expiresInSeconds = 900): Promise<string> {
    // Prefer signing with the public client so the host in the signature is already public
    const client = this.publicMinioClient ?? this.minioClient;
    return client.presignedGetObject(bucket, key, expiresInSeconds);
  }

  /**
   * Get public URL for a file (no authentication required)
   */
  async getPublicUrl(bucket: string, key: string): Promise<string> {
    const publicUrl = this.configService.get<string>('STORAGE_PUBLIC_URL');
    if (!publicUrl) {
      throw new Error('STORAGE_PUBLIC_URL not configured');
    }

    // Ensure bucket exists and is public
    await this.ensureBucketExists(bucket);

    // Return direct public URL
    return `${publicUrl}/${bucket}/${key}`;
  }

  /**
   * Get presigned URL with proper content type for viewing
   */
  async getViewUrl(bucket: string, key: string, expiresInSeconds = 3600): Promise<string> {
    // Ensure bucket exists and is public
    await this.ensureBucketExists(bucket);

    // Get presigned URL with response headers for proper viewing
    const responseHeaders = {
      'response-content-type': this.getContentType(key),
      'response-content-disposition': 'inline',
      'response-cache-control': 'public, max-age=31536000',
    };

    return this.minioClient.presignedGetObject(bucket, key, expiresInSeconds, responseHeaders);
  }

  /**
   * Force refresh bucket policy to ensure public access
   */
  async refreshBucketPolicy(bucket: string): Promise<void> {
    try {
      await this.makeBucketPublic(bucket);
      console.error(`Bucket policy refreshed for ${bucket}`);
    } catch (error) {
      console.error(`Failed to refresh bucket policy for ${bucket}:`, error);
    }
  }

  /**
   * Ensure the default bucket is public (can be called manually)
   */
  async ensureDefaultBucketPublic(): Promise<void> {
    await this.initializeDefaultBucket();
  }

  /**
   * Get the default bucket name
   */
  getDefaultBucket(): string {
    return this.defaultBucket;
  }
}
