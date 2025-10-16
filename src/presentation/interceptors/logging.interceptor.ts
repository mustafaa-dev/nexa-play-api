import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';

import { LoggingService } from '@infrastructure/logging/logging.service';
import { redactSensitiveData } from '@infrastructure/utils/objects';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const { method, url, user } = req;
    const sanitizedReq = {
      body: req.body,
      query: req.query,
      params: req.params,
    };
    const userId = user?.id || 'anonymous';
    const clearedObj = redactSensitiveData(sanitizedReq);
    // Log the request
    LoggingService.debug(
      `[${userId}] ${method} ${url} - Request body: ${JSON.stringify(clearedObj)}`,
      { context: LoggingInterceptor.name },
    );

    const now = Date.now();
    return next.handle().pipe(
      tap(data => {
        // Log the response
        LoggingService.debug(
          `[${userId}] ${method} ${url} - ${Date.now() - now}ms - Response: ${
            typeof data === 'object'
              ? 'Object returned'
              : typeof data === 'string' && data.length > 100
                ? 'Big string returned'
                : data
          }`,
          { context: LoggingInterceptor.name },
        );
      }),
    );
  }
}
