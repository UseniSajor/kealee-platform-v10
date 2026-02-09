/**
 * Circuit Breaker
 *
 * Prevents cascading failures when external services are degraded.
 * State machine: CLOSED → OPEN → HALF_OPEN → CLOSED
 *
 * CLOSED:    Normal operation. Failures are tracked.
 * OPEN:      Requests fail immediately (fast-fail). Timer runs.
 * HALF_OPEN: One test request allowed. Success → CLOSED, Failure → OPEN.
 */

// ── Types ────────────────────────────────────────────────────

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
  /** Human-readable name (e.g. 'anthropic', 'stripe') */
  name: string;
  /** Number of consecutive failures before opening the circuit */
  failureThreshold?: number;
  /** Milliseconds to wait before switching from OPEN to HALF_OPEN */
  resetTimeout?: number;
  /** Optional callback when state changes */
  onStateChange?: (name: string, from: CircuitState, to: CircuitState) => void;
}

export interface CircuitBreakerStatus {
  name: string;
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure: Date | null;
  lastSuccess: Date | null;
  nextRetry: Date | null;
}

// ── Circuit Breaker Error ────────────────────────────────────

export class CircuitOpenError extends Error {
  public readonly circuitName: string;
  public readonly nextRetry: Date;

  constructor(name: string, nextRetry: Date) {
    super(`Circuit breaker OPEN for ${name}. Next retry at ${nextRetry.toISOString()}`);
    this.name = 'CircuitOpenError';
    this.circuitName = name;
    this.nextRetry = nextRetry;
  }
}

// ── Circuit Breaker Implementation ───────────────────────────

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime: Date | null = null;
  private lastSuccessTime: Date | null = null;
  private openedAt: Date | null = null;

  private readonly name: string;
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly onStateChange?: (name: string, from: CircuitState, to: CircuitState) => void;

  constructor(opts: CircuitBreakerOptions) {
    this.name = opts.name;
    this.failureThreshold = opts.failureThreshold ?? 5;
    this.resetTimeout = opts.resetTimeout ?? 60_000;
    this.onStateChange = opts.onStateChange;
  }

  /**
   * Execute a function through the circuit breaker.
   * If the circuit is open, throws immediately without calling fn.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if we should transition from OPEN → HALF_OPEN
    if (this.state === CircuitState.OPEN) {
      const now = Date.now();
      const openedTime = this.openedAt?.getTime() ?? 0;

      if (now - openedTime >= this.resetTimeout) {
        this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        const nextRetry = new Date(openedTime + this.resetTimeout);
        throw new CircuitOpenError(this.name, nextRetry);
      }
    }

    // Execute the function
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Get current circuit breaker status.
   */
  getStatus(): CircuitBreakerStatus {
    let nextRetry: Date | null = null;
    if (this.state === CircuitState.OPEN && this.openedAt) {
      nextRetry = new Date(this.openedAt.getTime() + this.resetTimeout);
    }

    return {
      name: this.name,
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailure: this.lastFailureTime,
      lastSuccess: this.lastSuccessTime,
      nextRetry,
    };
  }

  /**
   * Manually reset the circuit breaker to CLOSED.
   */
  reset(): void {
    this.transitionTo(CircuitState.CLOSED);
    this.failures = 0;
    this.successes = 0;
  }

  // ── Private Methods ────────────────────────────────────────

  private onSuccess(): void {
    this.lastSuccessTime = new Date();
    this.successes++;

    if (this.state === CircuitState.HALF_OPEN) {
      // Test request succeeded — close the circuit
      this.failures = 0;
      this.transitionTo(CircuitState.CLOSED);
      console.log(`[CircuitBreaker] ${this.name}: HALF_OPEN → CLOSED (service recovered)`);
    } else if (this.state === CircuitState.CLOSED) {
      // Consecutive success in closed state — reset failure counter
      this.failures = 0;
    }
  }

  private onFailure(): void {
    this.lastFailureTime = new Date();
    this.failures++;

    if (this.state === CircuitState.HALF_OPEN) {
      // Test request failed — back to OPEN
      this.transitionTo(CircuitState.OPEN);
      console.warn(`[CircuitBreaker] ${this.name}: HALF_OPEN → OPEN (test request failed)`);
    } else if (this.state === CircuitState.CLOSED && this.failures >= this.failureThreshold) {
      // Too many failures — open the circuit
      this.transitionTo(CircuitState.OPEN);
      console.error(
        `[CircuitBreaker] ${this.name}: CLOSED → OPEN (${this.failures} failures, threshold: ${this.failureThreshold})`
      );
    }
  }

  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    if (oldState === newState) return;

    this.state = newState;
    if (newState === CircuitState.OPEN) {
      this.openedAt = new Date();
    }

    this.onStateChange?.(this.name, oldState, newState);
  }
}

// ── Pre-configured Circuit Breakers for External Services ────

/** Default state-change handler: logs + triggers alerts */
function defaultOnStateChange(name: string, from: CircuitState, to: CircuitState): void {
  if (to === CircuitState.OPEN) {
    console.error(`[CircuitBreaker] ${name}: ${from} → ${to} — Service degraded, fast-failing requests`);
    // Alert is triggered asynchronously (fire-and-forget)
    import('./alerting').then(({ alertService, AlertLevel }) => {
      alertService.createAlert({
        level: AlertLevel.ERROR,
        source: 'system',
        title: `Circuit Breaker OPEN: ${name}`,
        message: `The ${name} service circuit breaker has opened. Requests are being fast-failed to prevent cascading failures. The circuit will attempt recovery in the configured timeout.`,
        data: { service: name, from, to },
      }).catch((err) => console.error('[CircuitBreaker] Failed to create alert:', err));
    }).catch(() => {});
  } else if (to === CircuitState.CLOSED && from === CircuitState.HALF_OPEN) {
    console.log(`[CircuitBreaker] ${name}: ${from} → ${to} — Service recovered`);
    import('./alerting').then(({ alertService, AlertLevel }) => {
      alertService.createAlert({
        level: AlertLevel.INFO,
        source: 'system',
        title: `Circuit Breaker Recovered: ${name}`,
        message: `The ${name} service circuit breaker has closed. Service is operating normally.`,
        data: { service: name, from, to },
      }).catch((err) => console.error('[CircuitBreaker] Failed to create alert:', err));
    }).catch(() => {});
  }
}

export const anthropicCircuit = new CircuitBreaker({
  name: 'anthropic',
  failureThreshold: 5,
  resetTimeout: 60_000,
  onStateChange: defaultOnStateChange,
});

export const stripeCircuit = new CircuitBreaker({
  name: 'stripe',
  failureThreshold: 3,
  resetTimeout: 30_000,
  onStateChange: defaultOnStateChange,
});

export const resendCircuit = new CircuitBreaker({
  name: 'resend',
  failureThreshold: 5,
  resetTimeout: 45_000,
  onStateChange: defaultOnStateChange,
});

export const twilioCircuit = new CircuitBreaker({
  name: 'twilio',
  failureThreshold: 5,
  resetTimeout: 45_000,
  onStateChange: defaultOnStateChange,
});

// ── Utility: Get All Circuit Breaker Statuses ────────────────

const ALL_CIRCUITS = [anthropicCircuit, stripeCircuit, resendCircuit, twilioCircuit];

export function getAllCircuitStatuses(): CircuitBreakerStatus[] {
  return ALL_CIRCUITS.map((cb) => cb.getStatus());
}
