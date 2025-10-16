import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { APIVersions } from '@shared/constants/api-versions.constants';
import { StorageService } from './storage.service';

@Controller(APIVersions.General(''))
export class StorageController {
  constructor(
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const key = await this.storageService.uploadFile(
      this.configService.getOrThrow<string>('STORAGE_BUCKET'),
      file,
    );
    return { message: 'File uploaded successfully', key };
  }
}
