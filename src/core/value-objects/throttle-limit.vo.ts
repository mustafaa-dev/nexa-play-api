import { LocalizedInvalidInputException } from '@infrastructure/i18n';

export class ThrottleLimit {
  private constructor(
    private readonly ttl: number,
    private readonly limit: number,
  ) {
    if (ttl <= 0) {
      throw new LocalizedInvalidInputException('TTL must be a positive number');
    }

    if (limit <= 0) {
      throw new LocalizedInvalidInputException('Limit must be a positive number');
    }
  }

  static create(ttl: number, limit: number): ThrottleLimit {
    return new ThrottleLimit(ttl, limit);
  }

  static createDefault(): ThrottleLimit {
    return new ThrottleLimit(60, 10);
  }

  get getTtl(): number {
    return this.ttl;
  }

  get getLimit(): number {
    return this.limit;
  }

  toString(): string {
    return `${this.limit} requests per ${this.ttl} seconds`;
  }
}
