import { TranslationService } from '@infrastructure/i18n/translation.service';
import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { APIVersions } from '@shared/constants/api-versions.constants';

@Controller(APIVersions.General(''))
export class AppController {
  constructor(private readonly translationService: TranslationService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  root() {
    return {
      message: this.translationService.translate('common.welcome'),
    };
  }

  @HttpCode(HttpStatus.OK)
  @Get('health')
  health() {
    return {
      status: 'ok',
      message: this.translationService.translate('common.hello'),
    };
  }
}
