/**
 * Adapter Registry — manages integration adapters
 */

import type { IntegrationAdapter, AdapterHealthCheck } from './adapter';

export class AdapterRegistry {
  private adapters = new Map<string, IntegrationAdapter>();

  register(adapter: IntegrationAdapter): void {
    this.adapters.set(adapter.name, adapter);
  }

  get(name: string): IntegrationAdapter | undefined {
    return this.adapters.get(name);
  }

  getRequired(name: string): IntegrationAdapter {
    const adapter = this.adapters.get(name);
    if (!adapter) throw new Error(`Integration adapter not found: ${name}`);
    return adapter;
  }

  list(): string[] {
    return Array.from(this.adapters.keys());
  }

  async healthCheckAll(): Promise<AdapterHealthCheck[]> {
    const results: AdapterHealthCheck[] = [];
    for (const adapter of this.adapters.values()) {
      try {
        results.push(await adapter.healthCheck());
      } catch (err) {
        results.push({
          name: adapter.name,
          healthy: false,
          latencyMs: 0,
          lastChecked: new Date().toISOString(),
          error: String(err),
        });
      }
    }
    return results;
  }
}
