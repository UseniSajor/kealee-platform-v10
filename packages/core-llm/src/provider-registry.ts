/**
 * core-llm/provider-registry.ts
 * Registers and resolves LLM providers by name.
 * Fails clearly if routing selects an unregistered provider.
 */

import { LlmProvider, ProviderName } from "./types";

export class ProviderRegistry {
  private readonly providers = new Map<ProviderName, LlmProvider>();

  register(provider: LlmProvider): void {
    this.providers.set(provider.name, provider);
  }

  resolve(name: ProviderName): LlmProvider {
    const p = this.providers.get(name);
    if (!p) {
      throw new Error(
        `[ProviderRegistry] Provider "${name}" is not registered. ` +
        `Registered providers: ${[...this.providers.keys()].join(", ") || "none"}`,
      );
    }
    return p;
  }

  getAvailable(): LlmProvider[] {
    return [...this.providers.values()].filter((p) => p.isAvailable());
  }

  list(): Array<{ name: ProviderName; available: boolean }> {
    return [...this.providers.entries()].map(([name, p]) => ({
      name,
      available: p.isAvailable(),
    }));
  }

  isRegistered(name: ProviderName): boolean {
    return this.providers.has(name);
  }

  hasAvailable(name: ProviderName): boolean {
    const p = this.providers.get(name);
    return p != null && p.isAvailable();
  }
}

/** Singleton registry — imported by router, gateway, and startup */
export const providerRegistry = new ProviderRegistry();
