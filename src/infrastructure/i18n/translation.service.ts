import { Injectable } from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n';

interface TranslateOptions {
  lang: string;
  args?: Record<string, string | number | boolean>;
}

@Injectable()
export class TranslationService {
  constructor(private readonly i18n: I18nService) {}

  /**
   * Translate a key
   * @param key The key to translate
   * @param args Any arguments to pass to the translation
   * @param lang The language to use (optional - will use request language if not provided)
   */
  translate(key: string, args?: Record<string, string | number | boolean>, lang?: string): string {
    const options: TranslateOptions = { lang: lang || I18nContext.current().lang };
    if (args && Object.keys(args).length > 0) {
      options.args = args;
    }
    return this.i18n.translate(key, options) as string;
  }
}
