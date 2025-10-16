import { LoggingService } from '@infrastructure/logging/logging.service';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Optional,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request, Response } from 'express';
import { I18nContext, I18nValidationException } from 'nestjs-i18n';
import { TranslationService } from './translation.service';

interface I18nHttpExceptionResponse {
  message: string | string[];
  error?: string;
  statusCode?: number;
  translationKey?: string;
  params?: Record<string, string | number | boolean>;
}

interface ValidationError {
  property: string;
  constraints?: Record<string, string>;
  children?: ValidationError[];
}

interface LocalizedException extends HttpException {
  errorCode?: string;
  translationKey?: string;
}

interface RequestWithLang extends Request {
  lang?: string;
}

interface ErrorResponseBody {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
  code?: string;
  stack?: string;
}

interface ValidationErrorMessage {
  constraints?: Record<string, string>;
  [key: string]: unknown;
}

@Catch()
@Injectable()
export class I18nExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly translationService: TranslationService,
    @Optional() @Inject(REQUEST) private readonly request?: Request,
  ) {}

  catch(exception: Error | HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Get the current language from I18nContext or request
    const lang = this.getLanguage(request);

    // Determine if this is an HTTP exception or a generic error
    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? (exception as HttpException).getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[];
    let error: string;
    let errorCode: string | undefined;
    let translationKey: string | undefined;
    let params: Record<string, string | number | boolean> = {};

    if (isHttpException) {
      const httpException = exception as HttpException;
      const exceptionResponse = httpException.getResponse();

      // Check if exception has errorCode and translationKey (from LocalizedExceptions)
      const localizedException = httpException as LocalizedException;
      if (localizedException.errorCode) {
        errorCode = localizedException.errorCode;
      }
      if (localizedException.translationKey) {
        translationKey = localizedException.translationKey;
      }

      // Handle I18nValidationException specially
      if (httpException instanceof I18nValidationException) {
        message = this.handleValidationErrors(httpException, lang);
      } else if (typeof exceptionResponse === 'object') {
        const typedResponse = exceptionResponse as I18nHttpExceptionResponse;

        // Extract params if available
        if (typedResponse.params) {
          params = typedResponse.params;
        }

        message = this.translateMessage(typedResponse.message, params, lang);
        error = typedResponse.error || HttpStatus[status] || 'Error';
      } else if (typeof exceptionResponse === 'string') {
        message = this.translateSingleMessage(exceptionResponse, params, lang);
      } else {
        message = httpException.message || 'An error occurred';
      }
    } else {
      // Handle non-HTTP exceptions (generic errors)
      LoggingService.error(`Unhandled exception: ${exception.message}`, {
        stack: exception.stack,
        context: I18nExceptionsFilter.name,
      });

      // Translate generic error message
      message = this.translationService.translate(
        'common.error_types.internal_server_error',
        {},
        lang,
      );

      // In development, include the actual error message
      if (process.env.NODE_ENV === 'development') {
        message = [message as string, exception.message];
      }
    }

    // Translate error type based on status code
    error = this.getTranslatedErrorType(status, lang);

    const responseBody: ErrorResponseBody = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Only add code if it exists
    if (errorCode) {
      responseBody.code = errorCode;
    }

    // In development, add stack trace for 500 errors
    if (process.env.NODE_ENV === 'development' && status === HttpStatus.INTERNAL_SERVER_ERROR) {
      responseBody.stack = exception.stack;
    }

    response.status(status).json(responseBody);
  }

  /**
   * Get the current language from request or I18nContext
   */
  private getLanguage(request: Request): string {
    try {
      return I18nContext.current()?.lang || (request as RequestWithLang)?.lang || 'ar';
    } catch {
      return (request as RequestWithLang)?.lang || 'ar';
    }
  }

  /**
   * Handle validation errors from I18nValidationException
   */
  private handleValidationErrors(exception: I18nValidationException, lang: string): string[] {
    const errors = exception.getResponse() as { message?: unknown[] };

    if (Array.isArray(errors?.message)) {
      return errors.message
        .map((msg: unknown) => {
          if (typeof msg === 'string') {
            return this.translateSingleMessage(msg, {}, lang);
          } else if (typeof msg === 'object' && msg !== null) {
            // Handle class-validator errors
            const validationMsg = msg as ValidationErrorMessage;
            if (validationMsg.constraints) {
              return Object.values(validationMsg.constraints).map((constraint: string) =>
                this.translateSingleMessage(constraint, {}, lang),
              );
            }
          }
          return String(msg);
        })
        .flat();
    }

    return [this.translationService.translate('validation.failed', {}, lang)];
  }

  /**
   * Get translated error type based on status code
   */
  private getTranslatedErrorType(status: number, lang: string): string {
    const errorTypeMap: Record<number, string> = {
      400: 'common.error_types.bad_request',
      401: 'common.error_types.unauthorized',
      403: 'common.error_types.forbidden',
      404: 'common.error_types.not_found',
      409: 'common.error_types.conflict',
      422: 'common.error_types.validation_error',
      500: 'common.error_types.internal_server_error',
      503: 'common.error_types.service_unavailable',
    };

    const translationKey = errorTypeMap[status] || 'common.error_types.internal_server_error';
    return this.translationService.translate(translationKey, {}, lang);
  }

  /**
   * Translate a message or array of messages
   */
  private translateMessage(
    message: string | string[],
    params: Record<string, string | number | boolean>,
    lang: string,
  ): string | string[] {
    if (Array.isArray(message)) {
      return message.map(msg => this.translateSingleMessage(msg, params, lang));
    }
    return this.translateSingleMessage(message, params, lang);
  }

  /**
   * Translate a single message with potential parameters
   */
  private translateSingleMessage(
    message: string,
    params: Record<string, string | number | boolean> = {},
    lang: string,
  ): string {
    // Check if the message is a translation key
    if (
      message &&
      typeof message === 'string' &&
      (message.startsWith('validation.') ||
        message.startsWith('errors.') ||
        message.startsWith('common.'))
    ) {
      const translated = this.translationService.translate(message, params, lang);
      // If translation returns the same key, it means the key wasn't found
      // Return original message in that case
      return translated || message;
    }

    // Not a translation key, return as-is
    return message;
  }
}
