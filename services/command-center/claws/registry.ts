import type { BaseClaw } from './base-claw';

/**
 * ClawRegistry — manages all 8 claws.
 * Handles registration, startup, and health checks.
 */
export class ClawRegistry {
  private claws = new Map<string, BaseClaw>();

  /** Register a claw instance */
  register(claw: BaseClaw): void {
    if (this.claws.has(claw.name)) {
      throw new Error(`[ClawRegistry] Claw "${claw.name}" already registered`);
    }
    this.claws.set(claw.name, claw);
    console.log(`[ClawRegistry] Registered: ${claw.name}`);
  }

  /** Start all registered claws */
  async startAll(): Promise<void> {
    console.log(`[ClawRegistry] Starting ${this.claws.size} claws...`);
    const startPromises = Array.from(this.claws.values()).map((claw) => claw.start());
    await Promise.all(startPromises);
    console.log(`[ClawRegistry] All ${this.claws.size} claws started`);
  }

  /** Get a claw by name */
  getClaw(name: string): BaseClaw | undefined {
    return this.claws.get(name);
  }

  /** Get all registered claws */
  getAll(): BaseClaw[] {
    return Array.from(this.claws.values());
  }

  /** Health check — returns status of all claws */
  healthCheck(): { name: string; status: 'registered' }[] {
    return Array.from(this.claws.entries()).map(([name]) => ({
      name,
      status: 'registered' as const,
    }));
  }
}
