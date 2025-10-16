import { v4 as uuidv4 } from 'uuid';

/**
 * Base class for all domain events in the system
 * Provides consistent structure and metadata for CQRS domain events
 */
export abstract class BaseDomainEvent {
  public readonly occurredOn: Date;
  public readonly eventId: string;
  public readonly eventVersion: string;

  protected constructor() {
    this.occurredOn = new Date();
    this.eventId = uuidv4();
    this.eventVersion = '1.0.0';
  }
}
