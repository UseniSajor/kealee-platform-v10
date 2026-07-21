/**
 * core-agents/registry/seed-registry.ts
 * Deterministic seed lookup for the KeaCore runtime.
 *
 * Provides code-based lookup of intents, workflows, services, and jurisdictions.
 * For scored ranking / retrieval, use @kealee/core-llm retrieval layer.
 */

// ─── Types (mirroring seeds package shapes) ───────────────────────────────────

export interface SeedIntent {
  code: string;
  label: string;
  description?: string;
  category?: string;
  entrySignals?: string[];
  defaultWorkflowTemplate?: string;
  defaultPrimaryAgent?: string;
}

export interface SeedWorkflow {
  code: string;
  name: string;
  description?: string;
  appliesToIntents?: string[];
  steps?: Array<{ code: string; title: string; type?: string; target?: string }>;
}

export interface SeedService {
  code: string;
  name: string;
  category?: string;
  basePrice?: number;
  billingType?: string;
  description?: string;
  includedOutputs?: string[];
  stripePriceKey?: string;
}

export interface SeedJurisdiction {
  code: string;
  name: string;
  state?: string;
  permitPortalUrl?: string;
  permitPortalName?: string;
  planUploadSystem?: string;
  notesForKeaCore?: string;
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export class SeedRegistry {
  private intents = new Map<string, SeedIntent>();
  private workflows = new Map<string, SeedWorkflow>();
  private services = new Map<string, SeedService>();
  private jurisdictions = new Map<string, SeedJurisdiction>();
  private loaded = false;

  load(): void {
    if (this.loaded) return;
    this.loadSeeds();
    this.loaded = true;
    console.log(`[SeedRegistry] Loaded: ${this.intents.size} intents, ${this.workflows.size} workflows, ${this.services.size} services, ${this.jurisdictions.size} jurisdictions`);
  }

  private loadSeeds(): void {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const seeds = require("@kealee/seeds") as {
        intentSeeds: SeedIntent[];
        workflowTemplateSeeds: SeedWorkflow[];
        serviceOfferingSeeds: SeedService[];
        jurisdictionSeeds: SeedJurisdiction[];
      };

      for (const s of seeds.intentSeeds ?? []) this.intents.set(s.code, s);
      for (const s of seeds.workflowTemplateSeeds ?? []) this.workflows.set(s.code, s);
      for (const s of seeds.serviceOfferingSeeds ?? []) this.services.set(s.code, s);
      for (const s of seeds.jurisdictionSeeds ?? []) this.jurisdictions.set(s.code, s);
    } catch (err) {
      console.warn("[SeedRegistry] Could not load seeds:", (err as Error).message);
    }
  }

  // ─── Lookup API ─────────────────────────────────────────────────────────────

  getIntent(code: string): SeedIntent | undefined { return this.intents.get(code); }
  getWorkflow(code: string): SeedWorkflow | undefined { return this.workflows.get(code); }
  getService(code: string): SeedService | undefined { return this.services.get(code); }
  getJurisdiction(code: string): SeedJurisdiction | undefined { return this.jurisdictions.get(code); }

  getWorkflowForIntent(intentCode: string): SeedWorkflow | undefined {
    const intent = this.intents.get(intentCode);
    if (!intent?.defaultWorkflowTemplate) return undefined;
    return this.workflows.get(intent.defaultWorkflowTemplate);
  }

  getServicesByCategory(category: string): SeedService[] {
    return [...this.services.values()].filter(
      (s) => s.category?.toLowerCase() === category.toLowerCase(),
    );
  }

  listIntents(): SeedIntent[] { return [...this.intents.values()]; }
  listWorkflows(): SeedWorkflow[] { return [...this.workflows.values()]; }
  listServices(): SeedService[] { return [...this.services.values()]; }
  listJurisdictions(): SeedJurisdiction[] { return [...this.jurisdictions.values()]; }

  /** Match an intent from a user-provided string using entry signals */
  matchIntent(text: string): SeedIntent | undefined {
    if (this.intents.has(text)) return this.intents.get(text);
    const lower = text.toLowerCase();
    for (const intent of this.intents.values()) {
      for (const signal of intent.entrySignals ?? []) {
        if (lower.includes(signal.toLowerCase())) return intent;
      }
    }
    return undefined;
  }
}

export const seedRegistry = new SeedRegistry();
