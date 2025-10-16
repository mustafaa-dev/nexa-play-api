import {
  ArgumentMetadata,
  BadRequestException,
  Inject,
  Injectable,
  OnModuleInit,
  Optional,
  PipeTransform,
  Scope,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { I18nContext } from 'nestjs-i18n';
import { TranslationService } from './translation.service';

@Injectable({ scope: Scope.REQUEST })
export class I18nValidationPipe implements PipeTransform, OnModuleInit {
  private validationPipe: ValidationPipe;

  constructor(
    private readonly translationService: TranslationService,
    @Optional() @Inject(REQUEST) private readonly request?: Request,
  ) {
    // We need to initialize this in onModuleInit to ensure it's created after all dependencies are available
  }

  // Initialize the validation pipe after module initialization
  onModuleInit() {
    this.validationPipe = new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
        excludeExtraneousValues: false,
      },
      whitelist: true,
      forbidNonWhitelisted: true,
      validateCustomDecorators: false,
      stopAtFirstError: false,
      disableErrorMessages: false,
      exceptionFactory: (errors: ValidationError[]) => {
        return new BadRequestException(this.formatErrors(errors));
      },
    });
  }

  async transform(value: any, metadata: ArgumentMetadata) {
    // Make sure the validation pipe is initialized
    if (!this.validationPipe) {
      this.onModuleInit();
    }

    try {
      // Delegate to the standard ValidationPipe
      return await this.validationPipe.transform(value, metadata);
    } catch (error) {
      // If validation fails with standard errors, rethrow
      throw error;
    }
  }

  /**
   * Check if a translation exists for the given key
   *
   * @param key Translation key to check
   * @param lang Language to check in
   * @returns True if translation exists and is not the key itself
   */
  private translationExists(key: string, lang: string): boolean {
    try {
      const translation = this.translationService.translate(key, {}, lang);
      // If the translation is the same as the key, it's not translated
      return translation !== key && !!translation;
    } catch (e) {
      return false;
    }
  }

  /**
   * Replace placeholders in the message with values
   * @param message Message with placeholders
   * @param params Parameter values to replace
   * @returns Message with placeholders replaced
   */
  private replacePlaceholders(message: string, params: Record<string, any>): string {
    if (!message) return message;

    let result = message;

    // Replace each parameter in the message
    Object.keys(params).forEach(key => {
      // For double-braced format {{field}}
      let regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, params[key].toString());

      // For single-braced format {field}
      regex = new RegExp(`{${key}}`, 'g');
      result = result.replace(regex, params[key].toString());
    });

    return result;
  }

  private formatErrors(errors: ValidationError[]): any[] {
    // Get language from request (set by middleware) or fallback to default
    let lang: string = I18nContext.current().lang;

    return errors.map(error => {
      if (error.constraints) {
        // Get field name for translation
        const target = error.target;
        const fieldNameKey =
          target &&
          Reflect.getMetadata('i18n:field_name', target.constructor.prototype, error.property);

        // Get the field name from metadata or fallback to generic translation
        const field = fieldNameKey
          ? this.translationService.translate(fieldNameKey, {}, lang)
          : this.translationService.translate(`properties.${error.property}`, {}, lang) ||
            error.property;

        // Convert constraints to array of errors as requested
        const errorsArray: string[] = [];

        for (const key of Object.keys(error.constraints)) {
          // Get the constraint value
          let constraintValue = error.constraints[key];
          if (!constraintValue) {
            continue;
          }

          let errorMessage = '';
          let params: Record<string, any> = { field };

          // Try to parse the constraint value as JSON if it's a string from our custom validators
          let customMessage = null;
          if (
            typeof constraintValue === 'string' &&
            constraintValue.startsWith('{') &&
            constraintValue.endsWith('}')
          ) {
            try {
              customMessage = JSON.parse(constraintValue);
            } catch (e) {
              // Not valid JSON, continue with normal processing
            }
          }

          if (customMessage && customMessage.messageKey) {
            // Handle custom message with translation key from our parsed JSON
            params = { field, ...(customMessage.args || {}) };
            errorMessage = this.translationService.translate(
              customMessage.messageKey,
              params,
              lang,
            );

            // Apply placeholder replacement for custom messages too
            errorMessage = errorMessage.replace(/{field}/g, field).replace(/{{field}}/g, field);
            errorMessage = this.replacePlaceholders(errorMessage, params);
          } else {
            // Handle special validation types
            if (key === 'whitelistValidation') {
              // This is the "property should not exist" error from forbidNonWhitelisted
              const whitelistKey = 'validation.whitelistValidation';
              if (this.translationExists(whitelistKey, lang)) {
                errorMessage = this.translationService.translate(whitelistKey, params, lang);
              } else {
                // Fallback message
                errorMessage = this.translationService.translate(
                  'validation.shouldNotExist',
                  params,
                  lang,
                );
              }
              errorMessage = errorMessage.replace(/{field}/g, field).replace(/{{field}}/g, field);
              errorMessage = this.replacePlaceholders(errorMessage, params);
            } else {
              // Extract parameters from the constraint key and value
              if (key.includes('min')) {
                const matches = constraintValue.match(/\d+/);
                if (matches) {
                  params.min = matches[0];
                }
              } else if (key.includes('max')) {
                const matches = constraintValue.match(/\d+/);
                if (matches) {
                  params.max = matches[0];
                }
              }

              // Try to get translated message
              const directKey = key;
              const prefixedKey = `validation.${key}`;

              if (this.translationExists(directKey, lang)) {
                errorMessage = this.translationService.translate(directKey, params, lang);
                // Still apply placeholder replacement to handle any unprocessed placeholders
                errorMessage = errorMessage.replace(/{field}/g, field).replace(/{{field}}/g, field);
                errorMessage = this.replacePlaceholders(errorMessage, params);
              } else if (this.translationExists(prefixedKey, lang)) {
                errorMessage = this.translationService.translate(prefixedKey, params, lang);
                // Still apply placeholder replacement to handle any unprocessed placeholders
                errorMessage = errorMessage.replace(/{field}/g, field).replace(/{{field}}/g, field);
                errorMessage = this.replacePlaceholders(errorMessage, params);
              } else {
                // Fallback: manually replace placeholders
                errorMessage = constraintValue;

                // Replace field placeholder first
                errorMessage = errorMessage.replace(/{field}/g, field).replace(/{{field}}/g, field);

                // Then replace other parameters
                errorMessage = this.replacePlaceholders(errorMessage, params);
              }
            }
          }

          // Add to errors array
          errorsArray.push(errorMessage);
        }

        return {
          property: error.property,
          errors: errorsArray, // Return array of errors as requested
        };
      }

      if (error.children && error.children.length) {
        return {
          property: error.property,
          children: this.formatErrors(error.children),
        };
      }

      return error;
    });
  }
}
