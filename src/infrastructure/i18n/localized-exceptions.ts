import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n';

/**
 * Base class for all localized exceptions
 * Handles translation and key building logic
 */
class BaseLocalizedException extends Error {
  public readonly translationKey: string;

  constructor(key: string, args?: Record<string, any>) {
    const translatedArgs = BaseLocalizedException.translateArgs(args);

    const message = BaseLocalizedException.translateMessage(key, translatedArgs);
    super(message);
    this.translationKey = key;
  }

  /**
   * Get the I18nService from the current context
   */
  private static getI18nService(): I18nService | null {
    try {
      return I18nContext.current()?.service || null;
    } catch {
      return null;
    }
  }

  /**
   * Translate argument values that are string references to translation keys
   */
  private static translateArgs(args?: Record<string, any>): Record<string, any> | undefined {
    if (!args || Object.keys(args).length === 0) {
      return args;
    }

    const locale = I18nContext.current()?.lang || 'ar';
    const i18nService = this.getI18nService();
    const translatedArgs = { ...args };

    for (const key of Object.keys(translatedArgs)) {
      const value = translatedArgs[key];
      if (typeof value === 'string' && i18nService) {
        const translated = i18nService.translate(value, { lang: locale });
        translatedArgs[key] = translated || value;
      }
    }

    return translatedArgs;
  }

  /**
   * Translate the error message using the translation key
   */
  private static translateMessage(key: string, args?: Record<string, any>): string {
    const locale = I18nContext.current()?.lang || 'ar';
    const translationKey = key;
    try {
      const i18nService = this.getI18nService();
      if (!i18nService) {
        return translationKey;
      }
      if (locale === 'ar' && args?.property) {
        const feminine = (
          i18nService.translate(`properties.${args?.property}`, { lang: locale }) as string
        )?.endsWith('ة');

        if (feminine) {
          args.suffix = 'ة.';
        } else {
          args.suffix = '.';
        }
      }

      const options: any = { lang: locale };
      if (args && Object.keys(args).length > 0) {
        options.args = args;
      }

      return i18nService.translate(translationKey, options);
    } catch (error) {
      console.error('Translation failed:', error);
      return translationKey;
    }
  }
}

export class LocalizedBadRequestException extends BadRequestException {
  public readonly translationKey: string;

  constructor(key: string = 'errors.badRequest', args?: Record<string, any>) {
    const localizedError = new BaseLocalizedException(key, args);
    super(localizedError.message);
    this.translationKey = localizedError.translationKey;
  }
}

/**
 * Localized Not Found Exception (404)
 *
 * @example
 * throw new LocalizedNotFoundException('user'); // errors.user_not_found
 * throw new LocalizedNotFoundException('item', { id: '123' });
 */
export class LocalizedNotFoundException extends NotFoundException {
  public readonly translationKey: string;

  constructor(args?: Record<string, any>) {
    const localizedError = new BaseLocalizedException('errors.notFound', args);
    super(localizedError.message);
    this.translationKey = localizedError.translationKey;
  }
}

/**
 * Localized Unauthorized Exception (401)
 *
 * @example
 * throw new LocalizedUnauthorizedException('login'); // errors.login_required
 * throw new LocalizedUnauthorizedException('common.auth.invalid_credentials');
 */
export class LocalizedUnauthorizedException extends UnauthorizedException {
  public readonly translationKey: string;

  constructor(key: string, args?: Record<string, any>) {
    const localizedError = new BaseLocalizedException(key, args);
    super(localizedError.message);
    this.translationKey = localizedError.translationKey;
  }
}

/**
 * Localized Forbidden Exception (403)
 *
 * @example
 * throw new LocalizedForbiddenException('access'); // errors.access_denied
 * throw new LocalizedForbiddenException('common.errors.insufficient_permissions');
 */
export class LocalizedForbiddenException extends ForbiddenException {
  public readonly translationKey: string;

  constructor(key: string, args?: Record<string, any>) {
    const localizedError = new BaseLocalizedException(key, args);
    super(localizedError.message);
    this.translationKey = localizedError.translationKey;
  }
}

/**
 * Localized Conflict Exception (409)
 *
 * @example
 * throw new LocalizedConflictException('email_duplicate', { email: 'test@test.com' });
 */
export class LocalizedConflictException extends ConflictException {
  public readonly translationKey: string;

  constructor(key: string, args?: Record<string, any>) {
    const localizedError = new BaseLocalizedException(key, args);
    super(localizedError.message);
    this.translationKey = localizedError.translationKey;
  }
}

/**
 * Localized Internal Server Error Exception (500)
 *
 * @example
 * throw new LocalizedInternalServerErrorException('database'); // errors.database_error
 */
export class LocalizedInternalServerErrorException extends InternalServerErrorException {
  public readonly translationKey: string;

  constructor(key: string, args?: Record<string, any>) {
    const localizedError = new BaseLocalizedException(key, args);
    super(localizedError.message);
    this.translationKey = localizedError.translationKey;
  }
}

/**
 * Localized Invalid Input Exception (400)
 *
 * @example
 * throw new LocalizedInvalidInputException('phone'); // errors.phone_invalid
 */
export class LocalizedInvalidInputException extends BadRequestException {
  public readonly translationKey: string;

  constructor(key: string, args?: Record<string, any>) {
    const localizedError = new BaseLocalizedException(key, args);
    super(localizedError.message);
    this.translationKey = localizedError.translationKey;
  }
}

/**
 * Localized Throttling Exception (429)
 *
 * @example
 * throw new LocalizedThrottlingException('rate_limit'); // errors.rate_limit_throttling
 */
export class LocalizedThrottlingException extends BadRequestException {
  public readonly translationKey: string;

  constructor(key: string, args?: Record<string, any>) {
    const localizedError = new BaseLocalizedException(key, args);
    super(localizedError.message);
    this.translationKey = localizedError.translationKey;
  }
}
