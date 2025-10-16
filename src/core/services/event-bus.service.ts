import { BaseDomainEvent } from '@core/events/base.event';
import { LoggingService } from '@infrastructure/logging/logging.service';
import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';

@Injectable()
export class EventBusService {
  constructor(private readonly eventBus: EventBus) {}

  /**
   * Publish a domain event to the event bus
   */
  async publish(event: BaseDomainEvent): Promise<void> {
    try {
      LoggingService.debug(
        `Publishing domain event: ${event.constructor.name} ${event.eventId} ${event.occurredOn}`,
        {
          context: 'EventBusService::publish',
        },
      );

      this.eventBus.publish(event);
    } catch (error) {
      LoggingService.error(`Failed to publish domain event: ${error.message}`, {
        context: 'EventBusService::publish',
      });
      throw error;
    }
  }

  /**
   * Publish multiple domain events
   */
  async publishAll(events: BaseDomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  /**
   * Publish events from an aggregate root
   */
  async publishEventsFromAggregate(aggregate: {
    pullDomainEvents(): BaseDomainEvent[];
  }): Promise<void> {
    const events = aggregate.pullDomainEvents();
    if (events.length > 0) {
      await this.publishAll(events);
    }
  }
}
