import { I18nExceptionsFilter } from '@infrastructure/i18n/i18n-exceptions.filter';
import { TranslationService } from '@infrastructure/i18n/translation.service';
import { LoggingService } from '@infrastructure/logging/logging.service';
import { RequestMethod, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ActivityLogInterceptor } from '@presentation/interceptors/activity-log.interceptor';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Set up validation pipe
  const translationService = app.get(TranslationService);

  app.useGlobalInterceptors(app.get(ActivityLogInterceptor));

  app.useGlobalFilters(new I18nExceptionsFilter(translationService));

  app.enableCors();

  app.setGlobalPrefix('api', {
    exclude: [{ path: '/metrics', method: RequestMethod.GET }],
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: undefined,
  });

  const port = configService.get<number>('PORT', 3000);

  await app.listen(port);

  LoggingService.info(`HTTP server running on port ${port}`, {
    context: 'MAIN',
  });
}

bootstrap().catch(err => {
  LoggingService.fatal('Error starting application:', {
    context: 'Main',
    error: JSON.stringify(err),
    stack: err.stack,
  });
  process.exit(1);
});
