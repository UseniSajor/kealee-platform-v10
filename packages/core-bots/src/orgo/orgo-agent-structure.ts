/**
 * ORGO: Organizational Structure Layer
 * Manages hierarchical agent roles, execution contexts, and state
 *
 * Architecture:
 * - KeaBotRoot: Parent executor (entry point)
 * - Gateway: Intent classifier (routes to correct chain)
 * - KeaBotChain: Immutable execution flow (DesignBot → EstimateBot → PermitBot)
 * - Executor: Action runner (calls Claude API with caching)
 */

import { ClaudeCachedClient } from "../hermes/hermes-function-routing";

// ============================================================================
// ROLE TYPES
// ============================================================================

export enum AgentRole {
  DESIGN = "DESIGN",
  ESTIMATE = "ESTIMATE",
  PERMIT = "PERMIT",
  GATEWAY = "GATEWAY",
  EXECUTOR = "EXECUTOR",
}

export enum ChainStage {
  CONCEPT = "CONCEPT",
  ESTIMATE = "ESTIMATE",
  PERMIT = "PERMIT",
}

export interface ExecutionContext {
  projectId: string;
  userId: string;
  clientId?: string;
  intents: string[];
  metadata: Record<string, any>;
  startTime: Date;
  cache?: CacheMetrics;
}

export interface CacheMetrics {
  cacheCreationTokens: number;
  cacheReadTokens: number;
  cacheHit: boolean;
}

// ============================================================================
// ORGO: ORGANIZATIONAL AGENT SYSTEM
// ============================================================================

export class KeaBotRoot {
  private gateway: Gateway;
  private executor: KeaBotExecutor;
  private obsidian: ObsidianKnowledge;
  private claudeClient: ClaudeCachedClient;

  constructor(obsidian: ObsidianKnowledge, claudeClient: ClaudeCachedClient) {
    this.obsidian = obsidian;
    this.claudeClient = claudeClient;
    this.gateway = new Gateway(obsidian);
    this.executor = new KeaBotExecutor(claudeClient, obsidian);
  }

  /**
   * Main entry point: classifies intent and routes to appropriate chain
   */
  async execute(context: ExecutionContext): Promise<KeaBotChainResult> {
    console.log(`[KeaBotRoot] Starting execution for project ${context.projectId}`);

    // Step 1: Classify intent via Gateway
    const routedChain = await this.gateway.classify(context);
    console.log(`[Gateway] Routed to chain: ${routedChain}`);

    // Step 2: Execute immutable chain
    const chainResult = await this.executeChain(context, routedChain);

    return chainResult;
  }

  /**
   * Execute the immutable KeaBot chain
   */
  private async executeChain(
    context: ExecutionContext,
    chain: ChainStage[]
  ): Promise<KeaBotChainResult> {
    const stages: Record<ChainStage, any> = {
      CONCEPT: null,
      ESTIMATE: null,
      PERMIT: null,
    };

    console.log(`[KeaBotRoot] Executing chain with stages: ${chain.join(" → ")}`);

    for (const stage of chain) {
      console.log(`[KeaBotRoot] Executing stage: ${stage}`);

      if (stage === ChainStage.CONCEPT) {
        stages.CONCEPT = await this.executor.runDesignBot(context);
        // Enrich context with concept output
        context.metadata.conceptId = stages.CONCEPT.conceptId;
        context.metadata.images = stages.CONCEPT.images;
      } else if (stage === ChainStage.ESTIMATE) {
        stages.ESTIMATE = await this.executor.runEstimateBot(
          context,
          stages.CONCEPT
        );
        context.metadata.estimateId = stages.ESTIMATE.estimateId;
        context.metadata.costs = stages.ESTIMATE.costs;
      } else if (stage === ChainStage.PERMIT) {
        stages.PERMIT = await this.executor.runPermitBot(
          context,
          stages.CONCEPT,
          stages.ESTIMATE
        );
        context.metadata.permitId = stages.PERMIT.permitId;
      }
    }

    return {
      status: "SUCCESS",
      concept: stages.CONCEPT,
      estimate: stages.ESTIMATE,
      permit: stages.PERMIT,
      executedAt: new Date(),
    };
  }
}

// ============================================================================
// GATEWAY: INTENT CLASSIFIER
// ============================================================================

export class Gateway {
  private obsidian: ObsidianKnowledge;

  constructor(obsidian: ObsidianKnowledge) {
    this.obsidian = obsidian;
  }

  /**
   * Classify user intent and determine which chain stages to execute
   */
  async classify(context: ExecutionContext): Promise<ChainStage[]> {
    const intents = context.intents.map((i) => i.toLowerCase());

    // Determine which stages are needed
    const stages: ChainStage[] = [];

    // AI Concept always starts with design
    if (
      intents.includes("ai concept") ||
      intents.includes("design") ||
      intents.includes("scope")
    ) {
      stages.push(ChainStage.CONCEPT);
    }

    // Estimate requires concept first
    if (
      intents.includes("estimate") ||
      intents.includes("cost") ||
      intents.includes("budget")
    ) {
      if (!stages.includes(ChainStage.CONCEPT)) {
        stages.push(ChainStage.CONCEPT);
      }
      stages.push(ChainStage.ESTIMATE);
    }

    // Permit requires full chain
    if (intents.includes("permit") || intents.includes("filing")) {
      if (!stages.includes(ChainStage.CONCEPT)) {
        stages.push(ChainStage.CONCEPT);
      }
      if (!stages.includes(ChainStage.ESTIMATE)) {
        stages.push(ChainStage.ESTIMATE);
      }
      stages.push(ChainStage.PERMIT);
    }

    // If no explicit intent, default to concept
    if (stages.length === 0) {
      stages.push(ChainStage.CONCEPT);
    }

    console.log(`[Gateway] Classified intents ${JSON.stringify(intents)} to chain: ${stages.join(" → ")}`);
    return stages;
  }
}

// ============================================================================
// EXECUTOR: ACTION RUNNER
// ============================================================================

export class KeaBotExecutor {
  private claudeClient: ClaudeCachedClient;
  private obsidian: ObsidianKnowledge;

  constructor(claudeClient: ClaudeCachedClient, obsidian: ObsidianKnowledge) {
    this.claudeClient = claudeClient;
    this.obsidian = obsidian;
  }

  /**
   * DesignBot: 9-question intake → Claude Opus → 6 images/3 concepts
   */
  async runDesignBot(context: ExecutionContext): Promise<any> {
    console.log(`[DesignBot] Starting for project ${context.projectId}`);

    const intakeAnswers = context.metadata.intakeAnswers || {};
    const designPrompt = `
    You are DesignBot, an expert construction design AI using Claude Opus 4.6.

    Based on the following project intake:
    ${JSON.stringify(intakeAnswers, null, 2)}

    Generate:
    1. A detailed design concept (500-800 words)
    2. Key design assumptions
    3. Descriptions for 6 images (3 concepts × 2 angles each)
    4. Preliminary timeline and risk factors

    Return as JSON with structure:
    {
      "concept": "...",
      "assumptions": ["...", "..."],
      "imagePrompts": ["...", "..."],
      "timeline": "...",
      "risks": ["...", "..."]
    }
    `;

    const designResult = await this.claudeClient.callClaudeWithCache(
      context.projectId,
      designPrompt,
      "claude-opus-4-6",
      { role: AgentRole.DESIGN }
    );

    // Parse and store result
    const parsed = JSON.parse(designResult.content);

    return {
      conceptId: `concept-${context.projectId}`,
      concept: parsed.concept,
      assumptions: parsed.assumptions,
      imagePrompts: parsed.imagePrompts,
      images: [], // Would be populated by image generation service
      timeline: parsed.timeline,
      risks: parsed.risks,
      executedAt: new Date(),
      cacheMetrics: designResult.cacheMetrics,
    };
  }

  /**
   * EstimateBot: Claude Sonnet → cost breakdown, timeline, risk
   */
  async runEstimateBot(
    context: ExecutionContext,
    conceptResult: any
  ): Promise<any> {
    console.log(`[EstimateBot] Starting for project ${context.projectId}`);

    const pricingRules = await this.obsidian.getPricingRules(context);
    const estimatePrompt = `
    You are EstimateBot, a construction cost estimation AI using Claude Sonnet.

    Given this design concept:
    ${JSON.stringify(conceptResult, null, 2)}

    And these pricing rules:
    ${JSON.stringify(pricingRules, null, 2)}

    Generate a detailed estimate including:
    1. Line-item cost breakdown by trade (HVAC, Plumbing, Electrical, etc.)
    2. Labor, materials, equipment costs
    3. Regional adjustments (DMV 2026 rates)
    4. Contingency and insurance
    5. Timeline phases
    6. Risk mitigation costs

    Return as JSON with cost totals and detailed breakdown.
    `;

    const estimateResult = await this.claudeClient.callClaudeWithCache(
      context.projectId,
      estimatePrompt,
      "claude-sonnet-4-20250514",
      { role: AgentRole.ESTIMATE }
    );

    const parsed = JSON.parse(estimateResult.content);

    return {
      estimateId: `estimate-${context.projectId}`,
      costs: parsed.costs,
      breakdown: parsed.breakdown,
      timeline: parsed.timeline,
      risks: parsed.risks,
      executedAt: new Date(),
      cacheMetrics: estimateResult.cacheMetrics,
    };
  }

  /**
   * PermitBot: Claude Sonnet → DC/Maryland permit filing
   */
  async runPermitBot(
    context: ExecutionContext,
    conceptResult: any,
    estimateResult: any
  ): Promise<any> {
    console.log(`[PermitBot] Starting for project ${context.projectId}`);

    const blueprints = await this.obsidian.getPermitBlueprints(context);
    const permitPrompt = `
    You are PermitBot, a construction permit filing AI for DC and Maryland.

    Given this project:
    - Concept: ${JSON.stringify(conceptResult, null, 2)}
    - Estimate: ${JSON.stringify(estimateResult, null, 2)}

    Available permit blueprints:
    ${JSON.stringify(blueprints, null, 2)}

    Generate autonomous permit filing instructions:
    1. Identify jurisdiction (DC DCRA / Maryland county)
    2. Determine permit type (Type A REST or Type B Playwright automation)
    3. Extract required documents and signatures
    4. Generate filing payload
    5. Plan verification steps

    Note: Autonomous execution with post-filing verification.
    `;

    const permitResult = await this.claudeClient.callClaudeWithCache(
      context.projectId,
      permitPrompt,
      "claude-sonnet-4-20250514",
      { role: AgentRole.PERMIT }
    );

    const parsed = JSON.parse(permitResult.content);

    return {
      permitId: `permit-${context.projectId}`,
      jurisdiction: parsed.jurisdiction,
      permitType: parsed.permitType,
      documents: parsed.documents,
      filing: parsed.filing,
      verificationSteps: parsed.verificationSteps,
      executedAt: new Date(),
      cacheMetrics: permitResult.cacheMetrics,
    };
  }
}

// ============================================================================
// OBSIDIAN: KNOWLEDGE BASE INTERFACE
// ============================================================================

export interface ObsidianKnowledge {
  getPricingRules(context: ExecutionContext): Promise<any>;
  getPermitBlueprints(context: ExecutionContext): Promise<any>;
  getApprovalWorkflows(context: ExecutionContext): Promise<any>;
  storeConceptResult(conceptId: string, data: any): Promise<void>;
}

export const createObsidianKnowledge = (): ObsidianKnowledge => ({
  async getPricingRules(_context: ExecutionContext) {
    // Import from packages/core-rules/src/pricing.ts (never hardcode)
    return {
      baseRate: 2026,
      regional: 1.28, // +28% DMV adjustment
      lumber: 1.38,
      trades: {
        HVAC: { hourly: 95, overhead: 1.35 },
        PLUMBING: { hourly: 110, overhead: 1.4 },
        ELECTRICAL: { hourly: 125, overhead: 1.45 },
        CARPENTRY: { hourly: 85, overhead: 1.3 },
      },
    };
  },

  async getPermitBlueprints(_context: ExecutionContext) {
    return {
      DC_DCRA: {
        type: "REST_API",
        endpoint: "https://api.dcapps.dc.gov",
        auth: "OAuth2",
        requirements: [
          "Stamped plans",
          "PE signature",
          "BOM",
          "Zoning letter",
        ],
      },
      MARYLAND_COUNTY: {
        type: "PLAYWRIGHT_AUTOMATION",
        counties: ["Montgomery", "Prince George", "Howard"],
        requirements: [
          "Permit-ready plans",
          "Regional variance forms",
          "Soil report",
        ],
      },
    };
  },

  async getApprovalWorkflows(_context: ExecutionContext) {
    return {
      concept: { requiredApprovals: ["CLIENT"], autoApprove: false },
      estimate: { requiredApprovals: ["CLIENT", "FINANCE"], autoApprove: false },
      permit: { requiredApprovals: ["PE", "COMPLIANCE"], autoApprove: true },
    };
  },

  async storeConceptResult(conceptId: string, _data: any) {
    console.log(`[Obsidian] Storing concept ${conceptId}`);
    // Store in knowledge base
  },
});

// ============================================================================
// KEABOT CHAIN RESULT
// ============================================================================

export interface KeaBotChainResult {
  status: "SUCCESS" | "FAILED" | "PENDING_APPROVAL";
  concept?: any;
  estimate?: any;
  permit?: any;
  executedAt: Date;
}
