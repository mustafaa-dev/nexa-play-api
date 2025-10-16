import { ThrottleLimit } from '@core/value-objects/throttle-limit.vo';

export interface IThrottlerService {
  /**
   * Check if a request is allowed based on its identifier
   * @param identifier The request identifier (e.g., IP address, user ID)
   * @param throttleLimit The throttle limit to apply
   */
  isAllowed(identifier: string, throttleLimit: ThrottleLimit): Promise<boolean>;

  /**
   * Track a request for rate limiting
   * @param identifier The request identifier (e.g., IP address, user ID)
   * @param throttleLimit The throttle limit to apply
   */
  trackRequest(identifier: string, throttleLimit: ThrottleLimit): Promise<void>;

  /**
   * Get the remaining number of requests allowed
   * @param identifier The request identifier (e.g., IP address, user ID)
   * @param throttleLimit The throttle limit to apply
   */
  getRemainingRequests(identifier: string, throttleLimit: ThrottleLimit): Promise<number>;

  /**
   * Reset throttling for a specific identifier
   * @param identifier The request identifier (e.g., IP address, user ID)
   */
  resetThrottling(identifier: string): Promise<void>;
}
