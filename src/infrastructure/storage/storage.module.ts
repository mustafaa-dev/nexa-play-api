import { Global, Module, OnApplicationBootstrap } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { FileRepository } from '../repositories/file.repository';
import { StorageController } from './storage.controller';
import { StorageFactory } from './storage.factory';
import { StorageService } from './storage.service';

@Global()
@Module({
  imports: [
    ConfigModule,
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  controllers: [StorageController],
  providers: [
    StorageService,
    StorageFactory,
    { provide: 'FileRepository', useClass: FileRepository },
  ],
  exports: [StorageService],
})
export class StorageModule implements OnApplicationBootstrap {
  constructor(private readonly storageService: StorageService) {}

  async onApplicationBootstrap() {}
}
