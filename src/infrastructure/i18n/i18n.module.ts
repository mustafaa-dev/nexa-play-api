import { Global, Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { AcceptLanguageResolver, CookieResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import * as path from 'path';
import { I18nValidationPipe } from './i18n-validation.pipe';
import { LocalizedException } from './localized-exception';
import { TranslationService } from './translation.service';

@Global()
@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'ar',
      loaderOptions: {
        path:
          process.env.NODE_ENV !== 'production'
            ? path.join(process.cwd(), '/src/infrastructure/i18n/locales/')
            : path.join(__dirname, './locales/'),
        watch: process.env.NODE_ENV !== 'production',
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        new CookieResolver(['lang']),
        new AcceptLanguageResolver(),
      ],
      typesOutputPath: path.join(__dirname, '../../../src/generated/i18n.types.ts'),
    }),
  ],
  providers: [
    TranslationService,
    LocalizedException,
    {
      provide: APP_PIPE,
      useClass: I18nValidationPipe,
    },
  ],
  exports: [I18nModule, TranslationService, LocalizedException],
})
export class I18nConfigModule {}
