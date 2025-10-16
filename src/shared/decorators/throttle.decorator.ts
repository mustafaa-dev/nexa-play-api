import { SetMetadata } from '@nestjs/common';

export const THROTTLE_KEY = 'throttle';
export const SKIP_THROTTLE_KEY = 'skipThrottle';

/**
 * Decorator that sets custom throttle limits for a specific route or controller
 * @param ttl Time to live in seconds
 * @param limit Maximum number of requests within the TTL
 */
export const Throttle = (ttl: number, limit: number) => SetMetadata(THROTTLE_KEY, { ttl, limit });

/**
 * Decorator that skips throttling for a specific route or controller
 */
export const SkipThrottle = () => SetMetadata(SKIP_THROTTLE_KEY, true);
