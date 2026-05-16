/**
 * KEALEE AGENT INTEGRATION
 * Complete working example: Orgo + Obsidian + Hermes in action
 *
 * This file shows:
 * - How to initialize all three layers
 * - How to execute the DesignBot → EstimateBot → PermitBot chain
 * - How to handle approval workflows
 * - How to track cache metrics
 * - How to emit events across the system
 */

import {
  KeaBotRoot,
  ExecutionContext,
  createObsidianKnowledge,
} from "../orgo/orgo-agent-structure";
import {
  ClaudeCachedClient,
  CacheMetricsLogger,
  FunctionRouter,
  KheaEventEmitter,
  KheaEvent,
} from "../hermes/hermes-function-routing";
import {
  getObsidianKnowledgeBase,
  ObsidianKnowledgeBase,
} from "../obsidian/obsidian-knowledge-base";

// ============================================================================
// KEALEE AGENT SYSTEM BOOTSTRAP
// ============================================================================

export class KealeeAgentSystem {
  private root: KeaBotRoot;
  private obsidian: ObsidianKnowledgeBase;
  private claudeClient: ClaudeCachedClient;
  private cacheLogger: CacheMetricsLogger;
  private functionRouter: FunctionRouter;
  private eventEmitter: KheaEventEmitter;

  constructor() {
    // Initialize layers bottom-up
    this.cacheLogger = new CacheMetricsLogger();
    this.claudeClient = new ClaudeCachedClient(this.cacheLogger);
    this.obsidian = getObsidianKnowledgeBase();
    this.root = new KeaBotRoot(
      createObsidianKnowledge(),
      this.claudeClient
    );

    this.functionRouter = new FunctionRouter();
    this.eventEmitter = new KheaEventEmitter();

    this.setupEventHandlers();
  }

  /**
   * Execute full AI Concept workflow
   * Input: 9-question intake
   * Output: 3 design concepts with 6 images each
   */
  async executeAIConcept(
    projectId: string,
    userId: string,
    intakeAnswers: Record<string, string>
  ): Promise<any> {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`[Kealee] Starting AI Concept for project ${projectId}`);
    console.log(`${"=".repeat(60)}\n`);

    const context: ExecutionContext = {
      projectId,
      userId,
      intents: ["ai concept"],
      metadata: {
        intakeAnswers,
      },
      startTime: new Date(),
    };

    try {
      const result = await this.root.execute(context);

      // Store concept in Obsidian
      if (result.concept) {
        await this.obsidian.storeConceptRecord(
          projectId,
          userId,
          result.concept
        );
      }

      // Emit completion event
      this.eventEmitter.emit(KheaEvent.DESIGN_COMPLETE, projectId, {
        conceptId: result.concept?.conceptId,
      });

      // Log metrics
      const metrics = await this.cacheLogger.getAggregateMetrics();
      console.log(`\n[Cache Metrics]`);
      console.log(`  Total requests: ${metrics.totalRequests}`);
      console.log(`  Cache hit rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`);
      console.log(`  Avg cost savings: ${metrics.avgCostSavingsPercent.toFixed(1)}%`);
      console.log(`  Tokens saved: ${metrics.totalTokensSaved.toFixed(0)}\n`);

      return result;
    } catch (error) {
      console.error(`[Kealee] AI Concept failed:`, error);
      this.eventEmitter.emit(KheaEvent.ERROR, projectId, {
        stage: "DESIGN",
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Execute full Estimate workflow
   * Requires: Completed concept
   * Output: Detailed cost breakdown with timeline
   */
  async executeEstimate(
    projectId: string,
    userId: string,
    conceptId: string
  ): Promise<any> {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`[Kealee] Starting Estimate for project ${projectId}`);
    console.log(`${"=".repeat(60)}\n`);

    // Retrieve concept from Obsidian
    const concept = await this.obsidian.getConceptRecord(conceptId);
    if (!concept) {
      throw new Error(`Concept ${conceptId} not found`);
    }

    // Check approval status
    const approved = await this.obsidian.canProceedToNextStage(
      conceptId,
      "CONCEPT"
    );
    if (!approved) {
      console.log(`[Kealee] Concept awaiting approval, cannot proceed to estimate`);
      this.eventEmitter.emit(KheaEvent.APPROVAL_REQUIRED, projectId, {
        stage: "CONCEPT",
        conceptId,
      });
      return { status: "PENDING_APPROVAL", stage: "CONCEPT" };
    }

    const context: ExecutionContext = {
      projectId,
      userId,
      intents: ["estimate"],
      metadata: {
        conceptId,
        concept: concept.concept,
      },
      startTime: new Date(),
    };

    try {
      const result = await this.root.execute(context);

      if (result.estimate) {
        // Store estimate (would be in DB in production)
        console.log(`[Obsidian] Would store estimate for ${projectId}`);
      }

      this.eventEmitter.emit(KheaEvent.ESTIMATE_COMPLETE, projectId, {
        estimateId: result.estimate?.estimateId,
        total: result.estimate?.costs?.total,
      });

      return result;
    } catch (error) {
      console.error(`[Kealee] Estimate failed:`, error);
      this.eventEmitter.emit(KheaEvent.ERROR, projectId, {
        stage: "ESTIMATE",
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Execute full Permit filing workflow
   * Requires: Approved concept + approved estimate
   * Output: Autonomous permit filing with post-filing verification
   */
  async executePermitFiling(
    projectId: string,
    userId: string,
    conceptId: string,
    estimateId: string
  ): Promise<any> {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`[Kealee] Starting Permit Filing for project ${projectId}`);
    console.log(`${"=".repeat(60)}\n`);

    const concept = await this.obsidian.getConceptRecord(conceptId);
    if (!concept) {
      throw new Error(`Concept ${conceptId} not found`);
    }

    const context: ExecutionContext = {
      projectId,
      userId,
      intents: ["permit"],
      metadata: {
        conceptId,
        estimateId,
        jurisdiction: concept.assumptions[0], // First assumption should be jurisdiction
      },
      startTime: new Date(),
    };

    try {
      const result = await this.root.execute(context);

      if (result.permit) {
        console.log(
          `[Permit] Filed permit ${result.permit.permitId} in ${result.permit.jurisdiction}`
        );
      }

      this.eventEmitter.emit(KheaEvent.PERMIT_FILED, projectId, {
        permitId: result.permit?.permitId,
        jurisdiction: result.permit?.jurisdiction,
      });

      return result;
    } catch (error) {
      console.error(`[Kealee] Permit filing failed:`, error);
      this.eventEmitter.emit(KheaEvent.ERROR, projectId, {
        stage: "PERMIT",
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Register a function handler (for Claude function calling)
   */
  registerFunction(name: string, handler: (args: any) => Promise<any>) {
    this.functionRouter.registerHandler(name, handler);
  }

  /**
   * Handle events from agents (for reactive workflows)
   */
  onEvent(
    event: KheaEvent,
    callback: (projectId: string, data: any) => void
  ) {
    this.eventEmitter.on(event, (payload) => {
      callback(payload.contextId, payload.data);
    });
  }

  /**
   * Set up standard event handlers
   */
  private setupEventHandlers() {
    // When concept completes, optionally auto-start estimate
    this.eventEmitter.on(
      KheaEvent.DESIGN_COMPLETE,
      (payload) => {
        console.log(
          `[EventHandler] Concept complete for ${payload.contextId}, awaiting approval before estimate`
        );
      }
    );

    // When estimate completes, optionally auto-start permit filing
    this.eventEmitter.on(
      KheaEvent.ESTIMATE_COMPLETE,
      (payload) => {
        console.log(
          `[EventHandler] Estimate complete for ${payload.contextId}, awaiting approval before permit`
        );
      }
    );

    // When approval required, send notifications
    this.eventEmitter.on(
      KheaEvent.APPROVAL_REQUIRED,
      (payload) => {
        console.log(
          `[EventHandler] ${payload.data.stage} approval required for ${payload.contextId}`
        );
        // In production: send Slack notification, create Jira task, etc.
      }
    );

    // Log cache hits
    this.eventEmitter.on(
      KheaEvent.CACHE_HIT,
      (payload) => {
        console.log(
          `[EventHandler] Cache hit for ${payload.contextId}, saved ${payload.data.savingsPercent}%`
        );
      }
    );
  }
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

async function main() {
  const system = new KealeeAgentSystem();

  // Example 1: AI Concept only
  console.log("\n>>> EXAMPLE 1: AI Concept (DesignBot only)\n");

  const conceptResult = await system.executeAIConcept(
    "proj-001",
    "user-alice",
    {
      property_type: "Single-family home",
      scope: "HVAC upgrade + plumbing modernization",
      budget: "$45,000",
      timeline: "6 weeks",
      location: "Washington DC",
      square_footage: "2,800 SF",
      year_built: "1985",
      utilities: "Natural gas, city water",
      code_compliance: "DC housing code 14-1401",
    }
  );

  console.log("\nConcept result:");
  console.log(`  Status: ${conceptResult.status}`);
  console.log(
    `  Concept ID: ${conceptResult.concept?.conceptId}`
  );

  // Example 2: Estimate (requires approved concept)
  console.log("\n>>> EXAMPLE 2: Estimate (EstimateBot)");
  console.log(
    "   (Normally requires concept approval, but skipped for demo)\n"
  );

  const estimateResult = await system.executeEstimate(
    "proj-001",
    "user-alice",
    conceptResult.concept?.conceptId
  );

  console.log("\nEstimate result:");
  console.log(`  Status: ${estimateResult.status}`);

  // Example 3: Register custom function
  console.log("\n>>> EXAMPLE 3: Custom function registration\n");

  system.registerFunction("GET_PROJECT_INFO", async (args: any) => {
    console.log(`[Function] GET_PROJECT_INFO called with:`, args);
    return {
      projectId: args.projectId,
      name: "Sample Project",
      status: "IN_PROGRESS",
    };
  });

  // Example 4: Event listener
  console.log("\n>>> EXAMPLE 4: Event listeners\n");

  system.onEvent(KheaEvent.DESIGN_COMPLETE, (projectId, data) => {
    console.log(`[Custom Handler] Design complete for ${projectId}`);
    console.log(`  Concept ID: ${data.conceptId}`);
  });

  console.log("\n" + "=".repeat(60));
  console.log("Kealee Agent System ready");
  console.log("=".repeat(60));
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { KealeeAgentSystem as default };
