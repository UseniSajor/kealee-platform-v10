/**
 * Permit Adapter Manager
 *
 * Routes permit API calls to appropriate adapter based on jurisdiction
 * Implements fallback logic: live adapter → fallback adapter
 */

import { PermitAdapter, FallbackPermitAdapter } from './permit.adapter'
import { AccelaPermitAdapter } from './accela.adapter'
import { EnerGovPermitAdapter } from './energov.adapter'

export class PermitAdapterManager {
  private adapters: PermitAdapter[]
  private fallbackAdapter: FallbackPermitAdapter

  constructor() {
    this.adapters = [new AccelaPermitAdapter(), new EnerGovPermitAdapter()]
    this.fallbackAdapter = new FallbackPermitAdapter()
  }

  /**
   * Get best available adapter for jurisdiction
   * Returns live adapter if available, otherwise fallback
   */
  async getAdapter(jurisdictionCode: string): Promise<PermitAdapter> {
    for (const adapter of this.adapters) {
      if (adapter.jurisdictions.includes(jurisdictionCode)) {
        const isAvailable = await adapter.isAvailable()
        if (isAvailable) {
          return adapter
        }
      }
    }

    // Fallback to stub adapter
    console.warn(`[PermitAdapterManager] No live adapter available for ${jurisdictionCode}, using fallback`)
    return this.fallbackAdapter
  }

  /**
   * Get all available adapters (for health/status checks)
   */
  async getAdaptersStatus(): Promise<
    Array<{
      name: string
      available: boolean
      jurisdictions: string[]
    }>
  > {
    return Promise.all(
      this.adapters.map(async (adapter) => ({
        name: adapter.name,
        available: await adapter.isAvailable(),
        jurisdictions: adapter.jurisdictions,
      })),
    )
  }

  /**
   * List all supported jurisdictions
   */
  getSupportedJurisdictions(): string[] {
    const jurisdictions = new Set<string>()
    for (const adapter of this.adapters) {
      adapter.jurisdictions.forEach((j) => jurisdictions.add(j))
    }
    return Array.from(jurisdictions)
  }
}

// Singleton instance
let instance: PermitAdapterManager | null = null

export function getPermitAdapterManager(): PermitAdapterManager {
  if (!instance) {
    instance = new PermitAdapterManager()
  }
  return instance
}
