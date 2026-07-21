import type { PrismaClient } from '@prisma/client';
import type { EventBus, KealeeEventEnvelope } from '@kealee/events';

/**
 * Claw configuration — defines boundaries.
 * See: _docs/kealee-architecture.md §5.3
 */
export interface ClawConfig {
  /** Unique claw name (e.g. 'acquisition-precon-claw') */
  name: string;
  /** Event patterns this claw subscribes to (e.g. ['project.*', 'estimation.*']) */
  eventPatterns: string[];
  /** Prisma models this claw is allowed to write to */
  writableModels: string[];
}

/**
 * Abstract BaseClaw — every claw extends this.
 *
 * Enforces:
 * - Self-loop prevention (claw never reacts to its own events)
 * - Hop count limit (max 10 to prevent infinite cascades)
 * - Write guardrails (assertWritable before any Prisma write)
 */
export abstract class BaseClaw {
  protected eventBus: EventBus;
  protected prisma: PrismaClient;
  protected config: ClawConfig;

  constructor(eventBus: EventBus, prisma: PrismaClient, config: ClawConfig) {
    this.eventBus = eventBus;
    this.prisma = prisma;
    this.config = config;
  }

  /**
   * Start the claw: subscribe to all event patterns, register workers.
   */
  async start(): Promise<void> {
    for (const pattern of this.config.eventPatterns) {
      this.eventBus.subscribe(pattern, (event) => this.handleEventSafe(event));
    }

    await this.registerWorkers();
    console.log(`[${this.config.name}] Started — listening to [${this.config.eventPatterns.join(', ')}]`);
  }

  /**
   * Safe event handler wrapper:
   * 1. Skip self-source events (self-loop prevention)
   * 2. Skip if hop count exceeds 10 (cascade limit)
   */
  private async handleEventSafe(event: KealeeEventEnvelope): Promise<void> {
    // Self-loop prevention
    if (event.source === this.config.name) return;

    // Cascade depth limit
    const hopCount = event.metadata?.hopCount ?? 0;
    if (hopCount > 10) {
      console.warn(
        `[${this.config.name}] Skipping event ${event.type} — hop count ${hopCount} exceeds limit`
      );
      return;
    }

    try {
      await this.handleEvent(event);
    } catch (err) {
      console.error(`[${this.config.name}] Error handling ${event.type}:`, err);
    }
  }

  /**
   * Override in each claw to handle domain-specific events.
   */
  abstract handleEvent(event: KealeeEventEnvelope): Promise<void>;

  /**
   * Override in each claw to set up BullMQ workers.
   */
  abstract registerWorkers(): Promise<void>;

  /**
   * GUARDRAIL: Assert that this claw has write permission to a model.
   * Must be called before every Prisma write operation.
   */
  protected assertWritable(model: string): void {
    if (!this.config.writableModels.includes(model)) {
      throw new Error(
        `[GUARDRAIL VIOLATION] ${this.config.name} cannot write to model "${model}". ` +
          `Allowed: [${this.config.writableModels.join(', ')}]`
      );
    }
  }

  /** Get claw name */
  get name(): string {
    return this.config.name;
  }
}
