import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import { TranslationService } from './translation.service';

@Injectable()
export class LocalizedException {
  private readonly ERROR_PREFIX = 'errors.';

  constructor(private readonly translationService: TranslationService) {}

  /**
   * Throw a localized BadRequestException
   * @param key Short key name (e.g. "user" becomes "errors.user_not_found")
   * @param args Translation arguments
   * @param lang Language code (optional)
   * @param customSuffix Custom suffix (default is "invalid")
   */
  badRequest(
    key: string,
    args?: Record<string, any>,
    lang: string = I18nContext.current().lang,
    customSuffix = 'invalid',
  ): never {
    const translationKey = this.buildTranslationKey(key, customSuffix);
    const message = this.translationService.translate(translationKey, args, lang);
    throw new BadRequestException(message);
  }

  /**
   * Throw a localized NotFoundException
   * @param key Short key name (e.g. "user" becomes "errors.user_not_found")
   * @param args Translation arguments
   * @param lang Language code (optional)
   */
  notFound(
    key: string,
    args?: Record<string, any>,
    lang: string = I18nContext.current().lang,
  ): never {
    const translationKey = this.buildTranslationKey(key, 'not_found');
    const message = this.translationService.translate(translationKey, args, lang);
    throw new NotFoundException(message);
  }

  /**
   * Throw a localized UnauthorizedException
   * @param key Short key name (e.g. "login" becomes "errors.login_required")
   * @param args Translation arguments
   * @param lang Language code (optional)
   * @param customSuffix Custom suffix (default is "required")
   */
  unauthorized(
    key: string,
    args?: Record<string, any>,
    lang: string = I18nContext.current().lang,
    customSuffix = 'required',
  ): never {
    const translationKey = this.buildTranslationKey(key, customSuffix);
    const message = this.translationService.translate(translationKey, args, lang);
    throw new UnauthorizedException(message);
  }

  /**
   * Throw a localized ForbiddenException
   * @param key Short key name (e.g. "access" becomes "errors.access_denied")
   * @param args Translation arguments
   * @param lang Language code (optional)
   * @param customSuffix Custom suffix (default is "denied")
   */
  forbidden(
    key: string,
    args?: Record<string, any>,
    lang: string = I18nContext.current().lang,
    customSuffix = 'denied',
  ): never {
    const translationKey = this.buildTranslationKey(key, customSuffix);
    const message = this.translationService.translate(translationKey, args, lang);
    throw new ForbiddenException(message);
  }

  /**
   * Get localized error message without throwing an exception
   * @param key Short key name or full key with "errors." prefix
   * @param args Translation arguments
   * @param lang Language code (optional)
   * @param suffix Optional suffix (e.g. "not_found")
   */
  getMessage(
    key: string,
    args?: Record<string, any>,
    lang: string = I18nContext.current().lang,
    suffix?: string,
  ): string {
    let translationKey = key;

    // If the key doesn't start with the error prefix and a suffix is provided
    if (!key.startsWith(this.ERROR_PREFIX) && suffix) {
      translationKey = this.buildTranslationKey(key, suffix);
    }
    // If the key doesn't start with the error prefix and no suffix is provided
    else if (!key.startsWith(this.ERROR_PREFIX)) {
      translationKey = `${this.ERROR_PREFIX}${key}`;
    }

    return this.translationService.translate(translationKey, args, lang);
  }

  /**
   * Build a translation key from a base key and suffix
   * @param baseKey The base key (e.g. "user")
   * @param suffix The suffix (e.g. "not_found")
   * @returns The full translation key (e.g. "errors.user_not_found")
   */
  private buildTranslationKey(baseKey: string, suffix: string): string {
    // Handle case where the user passes a full translation key (validation.*, errors.*, common.*)
    if (
      baseKey.startsWith(this.ERROR_PREFIX) ||
      baseKey.startsWith('validation.') ||
      baseKey.startsWith('common.')
    ) {
      return baseKey;
    }

    // If the key already includes a suffix
    if (baseKey.includes('_')) {
      return `${this.ERROR_PREFIX}${baseKey}`;
    }

    return `${this.ERROR_PREFIX}${baseKey}_${suffix}`;
  }
}
