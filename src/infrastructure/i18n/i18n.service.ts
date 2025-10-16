import { Injectable } from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n';

@Injectable()
export class I18nTranslationService {
  constructor(private readonly i18n: I18nService) {}

  /**
   * Translate a key
   * @param key The key to translate
   * @param args Any arguments to pass to the translation
   * @param lang The language to use (optional - will use request language if not provided)
   */
  translate(
    key: string,
    args?: Record<string, any>,
    lang: string = I18nContext.current().lang,
  ): string {
    return this.i18n.translate(key, { args, lang });
  }

  /**
   * Get the current language from request
   */
  getCurrentLanguage(): string {
    // Default to Arabic if we can't determine language
    try {
      // Try to use the I18n context to get the current language
      return I18nContext.current().lang || 'ar';
    } catch (e) {
      return 'ar';
    }
  }

  /**
   * Get available languages
   */
  getAvailableLanguages(): string[] {
    return ['ar', 'en'];
  }
}
