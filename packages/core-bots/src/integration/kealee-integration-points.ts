/**
 * KEALEE PLATFORM v20 INTEGRATION POINTS
 * How to connect Orgo/Obsidian/Hermes to existing services
 *
 * Integration targets:
 * - Stripe webhook (for purchase events)
 * - Portal apps (kealee.com, app.kealee.com, contractor.kealee.com)
 * - Marketplace (lead intake + concept generation)
 * - KeaBots (all 13 existing bots)
 * - ClaudeCachedClient (replaces direct Anthropic calls)
 */

import { KealeeAgentSystem } from "./kealee-integration-example";

// ============================================================================
// INTEGRATION POINT 1: STRIPE WEBHOOK → KeaBot Trigger
// ============================================================================

/**
 * When customer purchases "AI Concept" ($599) via Stripe,
 * trigger DesignBot execution immediately.
 *
 * Webhook flow:
 * charge.succeeded
 *   → Check product ID (AI_CONCEPT_PRODUCT_ID)
 *   → Create Project record
 *   → Queue DesignBot via KealeeAgentSystem
 *   → Emit DESIGN_STARTED event to portal
 */

export async function handleStripeChargeSucceeded(
  charge: any, // Stripe.Charge
  db: any      // PrismaClient
) {
  console.log(`[Stripe] Processing charge ${charge.id}`);

  // Lookup product from Stripe metadata
  const productId = charge.metadata?.product_id;
  if (!productId) return; // Not a KeaBot product

  // Check if this is an "AI Concept" product
  const isAIConcept = productId === process.env.AI_CONCEPT_PRODUCT_ID;
  if (!isAIConcept) return;

  // Extract customer info from charge
  const customerId = charge.customer as string;
  const customer = await db.customer.findUnique({
    where: { stripeId: customerId },
  });

  if (!customer) {
    console.error(`[Stripe] Customer ${customerId} not found`);
    return;
  }

  // Create project record
  const project = await db.project.create({
    data: {
      userId: customer.id,
      status: "INTAKE_PENDING",
      pricingTier: "AI_CONCEPT",
      stripeChargeId: charge.id,
      metadata: {
        chargeAmount: charge.amount,
        currency: charge.currency,
        timestamp: new Date(charge.created * 1000),
      },
    },
  });

  console.log(`[Stripe] Created project ${project.id} for customer ${customer.id}`);

  // Queue intake form (customer must complete 9 questions before DesignBot starts)
  // This is handled by the Next.js portal app
  console.log(
    `[KeaBot] Awaiting intake completion for project ${project.id}`
  );
}

// ============================================================================
// INTEGRATION POINT 2: Portal Intake Form → DesignBot Launch
// ============================================================================

/**
 * Customer completes 9-question intake on /concept page
 * Stores answers → triggers DesignBot
 *
 * Route: POST /api/concept
 * Body: { projectId, intakeAnswers }
 */

export async function handleIntakeSubmission(
  projectId: string,
  userId: string,
  intakeAnswers: Record<string, string>,
  system: KealeeAgentSystem,
  db: any // PrismaClient
) {
  console.log(`[Portal] Intake submitted for project ${projectId}`);

  // Validate project exists and belongs to user
  const project = await db.project.findUnique({
    where: { id: projectId },
  });

  if (!project || project.userId !== userId) {
    throw new Error("Project not found or access denied");
  }

  // Store intake answers
  await db.project.update({
    where: { id: projectId },
    data: {
      status: "DESIGN_IN_PROGRESS",
      metadata: {
        ...project.metadata,
        intakeAnswers,
        intakeCompletedAt: new Date(),
      },
    },
  });

  // Launch DesignBot
  try {
    const result = await system.executeAIConcept(
      projectId,
      userId,
      intakeAnswers
    );

    // Store concept result
    await db.concept.create({
      data: {
        id: result.concept.conceptId,
        projectId,
        concept: result.concept.concept,
        assumptions: result.concept.assumptions,
        imagePrompts: result.concept.imagePrompts,
        timeline: result.concept.timeline,
        risks: result.concept.risks,
        status: "DRAFT",
        executedAt: new Date(),
        cacheMetrics: {
          cacheHit: result.concept.cacheMetrics.cacheHit,
          inputTokens: result.concept.cacheMetrics.inputTokens,
          costSavingsPercent: result.concept.cacheMetrics.costSavingsPercent,
        },
      },
    });

    // Update project
    await db.project.update({
      where: { id: projectId },
      data: {
        status: "DESIGN_COMPLETE",
        conceptId: result.concept.conceptId,
      },
    });

    console.log(`[DesignBot] Complete for project ${projectId}`);
    return result;
  } catch (error) {
    console.error(`[DesignBot] Failed for project ${projectId}:`, error);

    await db.project.update({
      where: { id: projectId },
      data: {
        status: "DESIGN_FAILED",
        metadata: {
          ...project.metadata,
          error: String(error),
        },
      },
    });

    throw error;
  }
}

// ============================================================================
// INTEGRATION POINT 3: Client Concept Approval → EstimateBot Launch
// ============================================================================

/**
 * Client approves concept in /design dashboard
 * Triggers EstimateBot for detailed cost breakdown
 *
 * Route: POST /api/concept/:conceptId/approve
 * Body: { approvedBy: string }
 */

export async function handleConceptApproval(
  conceptId: string,
  approvedBy: string,
  system: KealeeAgentSystem,
  db: any, // PrismaClient
  obsidian: any
) {
  console.log(`[Portal] Concept ${conceptId} approved by ${approvedBy}`);

  // Approve in Obsidian
  await obsidian.approveConceptRecord(conceptId, approvedBy);

  // Get concept details
  const concept = await db.concept.findUnique({
    where: { id: conceptId },
    include: { project: true },
  });

  if (!concept) {
    throw new Error(`Concept ${conceptId} not found`);
  }

  // Update project
  await db.project.update({
    where: { id: concept.projectId },
    data: {
      status: "ESTIMATE_IN_PROGRESS",
    },
  });

  // Launch EstimateBot
  try {
    const result = await system.executeEstimate(
      concept.projectId,
      concept.project.userId,
      conceptId
    );

    // Store estimate
    if (result.estimate) {
      await db.estimate.create({
        data: {
          id: result.estimate.estimateId,
          projectId: concept.projectId,
          costs: result.estimate.costs,
          breakdown: result.estimate.breakdown,
          timeline: result.estimate.timeline,
          risks: result.estimate.risks,
          status: "DRAFT",
          executedAt: new Date(),
        },
      });

      await db.project.update({
        where: { id: concept.projectId },
        data: {
          status: "ESTIMATE_COMPLETE",
          estimateId: result.estimate.estimateId,
        },
      });
    }

    console.log(`[EstimateBot] Complete for project ${concept.projectId}`);
    return result;
  } catch (error) {
    console.error(`[EstimateBot] Failed:`, error);

    await db.project.update({
      where: { id: concept.projectId },
      data: {
        status: "ESTIMATE_FAILED",
      },
    });

    throw error;
  }
}

// ============================================================================
// INTEGRATION POINT 4: Contractor Estimate Review → PermitBot Launch
// ============================================================================

/**
 * Contractor reviews estimate on contractor.kealee.com
 * Approves if costs are acceptable
 * Triggers PermitBot for autonomous filing
 *
 * Route: POST /api/estimate/:estimateId/approve
 * Body: { approvedBy: string, notes?: string }
 */

export async function handleEstimateApproval(
  estimateId: string,
  approvedBy: string,
  system: KealeeAgentSystem,
  db: any, // PrismaClient
  _obsidian: any
) {
  console.log(`[Portal] Estimate ${estimateId} approved by ${approvedBy}`);

  const estimate = await db.estimate.findUnique({
    where: { id: estimateId },
    include: {
      project: {
        include: { concept: true },
      },
    },
  });

  if (!estimate) {
    throw new Error(`Estimate ${estimateId} not found`);
  }

  // Update estimate status
  await db.estimate.update({
    where: { id: estimateId },
    data: {
      status: "APPROVED",
      approvedBy,
      approvedAt: new Date(),
    },
  });

  // Update project
  const project = estimate.project;
  await db.project.update({
    where: { id: project.id },
    data: {
      status: "PERMIT_IN_PROGRESS",
    },
  });

  // Launch PermitBot (fully autonomous, no further approvals needed)
  try {
    const result = await system.executePermitFiling(
      project.id,
      project.userId,
      project.conceptId!,
      estimateId
    );

    // Store permit filing
    if (result.permit) {
      await db.permit.create({
        data: {
          id: result.permit.permitId,
          projectId: project.id,
          jurisdiction: result.permit.jurisdiction,
          permitType: result.permit.permitType,
          documents: result.permit.documents,
          filing: result.permit.filing,
          status: "FILED",
          filedAt: new Date(),
        },
      });

      await db.project.update({
        where: { id: project.id },
        data: {
          status: "PERMIT_FILED",
          permitId: result.permit.permitId,
        },
      });
    }

    console.log(`[PermitBot] Filed permit for project ${project.id}`);
    return result;
  } catch (error) {
    console.error(`[PermitBot] Failed:`, error);

    await db.project.update({
      where: { id: project.id },
      data: {
        status: "PERMIT_FAILED",
      },
    });

    throw error;
  }
}

// ============================================================================
// INTEGRATION POINT 5: Real-time Portal Updates via Event System
// ============================================================================

/**
 * KealeeAgentSystem emits events → Portal updates in real-time
 *
 * Events flow:
 * KeaBot completion → KheaEventEmitter.emit()
 *   → Next.js API route (WebSocket)
 *   → Portal subscribed clients
 *   → UI update without page reload
 */

export function setupPortalEventListeners(
  system: KealeeAgentSystem,
  io: any // Socket.io
) {
  // Design complete: show concept in /design
  system.onEvent(
    "DESIGN_COMPLETE" as any,
    (projectId: string, data: any) => {
      console.log(`[Events] Broadcasting design complete for ${projectId}`);

      io.to(`project-${projectId}`).emit("design-complete", {
        conceptId: data.conceptId,
        timestamp: new Date(),
      });
    }
  );

  // Estimate complete: show cost breakdown in /estimate
  system.onEvent(
    "ESTIMATE_COMPLETE" as any,
    (projectId: string, data: any) => {
      console.log(`[Events] Broadcasting estimate complete for ${projectId}`);

      io.to(`project-${projectId}`).emit("estimate-complete", {
        estimateId: data.estimateId,
        total: data.total,
        timestamp: new Date(),
      });
    }
  );

  // Permit filed: show filing status in /permit
  system.onEvent(
    "PERMIT_FILED" as any,
    (projectId: string, data: any) => {
      console.log(`[Events] Broadcasting permit filed for ${projectId}`);

      io.to(`project-${projectId}`).emit("permit-filed", {
        permitId: data.permitId,
        jurisdiction: data.jurisdiction,
        timestamp: new Date(),
      });
    }
  );

  // Error: alert user
  system.onEvent(
    "ERROR" as any,
    (projectId: string, data: any) => {
      console.error(
        `[Events] Broadcasting error for ${projectId}: ${data.error}`
      );

      io.to(`project-${projectId}`).emit("error", {
        stage: data.stage,
        message: data.error,
        timestamp: new Date(),
      });
    }
  );

  // Approval required: notify stakeholder
  system.onEvent(
    "APPROVAL_REQUIRED" as any,
    (projectId: string, data: any) => {
      console.log(`[Events] Approval required for ${projectId}`);

      io.to(`project-${projectId}`).emit("approval-required", {
        stage: data.stage,
        timestamp: new Date(),
      });
    }
  );
}

// ============================================================================
// INTEGRATION POINT 6: Cache Metrics → Analytics Dashboard
// ============================================================================

/**
 * Log cache performance to analytics for cost tracking
 *
 * Metrics tracked:
 * - Cache hit rate (target: 40-60%)
 * - Cost savings per call
 * - Total tokens saved
 * - API costs reduced
 */

export async function logCacheMetricsToAnalytics(
  projectId: string,
  metrics: any,
  db: any // PrismaClient
) {
  console.log(`[Analytics] Logging cache metrics for ${projectId}`);

  const costSavings = metrics.inputTokens - metrics.cacheReadTokens * 0.99;
  const estimatedDollars = (costSavings / 1000000) * 0.003; // $0.003 per 1M tokens

  await db.keaBotRun.create({
    data: {
      projectId,
      stage: "DESIGN", // Varies
      status: "COMPLETE",
      inputTokens: metrics.inputTokens,
      outputTokens: metrics.outputTokens,
      cacheCreationTokens: metrics.cacheCreationTokens,
      cacheReadTokens: metrics.cacheReadTokens,
      cacheHit: metrics.cacheHit,
      costSavingsPercent: metrics.costSavingsPercent,
      estimatedCostSavings: estimatedDollars,
      executedAt: new Date(),
    },
  });
}

// ============================================================================
// INTEGRATION POINT 7: Marketplace Lead → Project Creation → DesignBot
// ============================================================================

/**
 * Lead submits project from public marketplace
 * → Auto-create account
 * → Capture intake answers
 * → Launch DesignBot immediately
 *
 * Route: POST /api/marketplace/leads
 * Body: { leadData, intakeAnswers }
 */

export async function handleMarketplaceLeadSubmission(
  leadData: Record<string, any>,
  intakeAnswers: Record<string, string>,
  system: KealeeAgentSystem,
  db: any // PrismaClient
) {
  console.log(`[Marketplace] New lead submission`);

  // Create or find customer
  let customer = await db.customer.findUnique({
    where: { email: leadData.email },
  });

  if (!customer) {
    customer = await db.customer.create({
      data: {
        email: leadData.email,
        name: leadData.name,
        phone: leadData.phone,
        source: "MARKETPLACE",
        marketplaceLeadData: leadData,
      },
    });

    console.log(`[Marketplace] Created new customer ${customer.id}`);
  }

  // Create project
  const project = await db.project.create({
    data: {
      userId: customer.id,
      status: "DESIGN_IN_PROGRESS",
      pricingTier: "AI_CONCEPT",
      source: "MARKETPLACE",
      metadata: {
        leadData,
        intakeAnswers,
        createdAt: new Date(),
      },
    },
  });

  console.log(`[Marketplace] Created project ${project.id}`);

  // Launch DesignBot immediately (no Stripe charge needed for marketplace)
  try {
    const result = await system.executeAIConcept(
      project.id,
      customer.id,
      intakeAnswers
    );

    // Store concept
    await db.concept.create({
      data: {
        id: result.concept.conceptId,
        projectId: project.id,
        concept: result.concept.concept,
        assumptions: result.concept.assumptions,
        imagePrompts: result.concept.imagePrompts,
        timeline: result.concept.timeline,
        risks: result.concept.risks,
        status: "DRAFT",
      },
    });

    await db.project.update({
      where: { id: project.id },
      data: {
        status: "DESIGN_COMPLETE",
        conceptId: result.concept.conceptId,
      },
    });

    console.log(`[DesignBot] Concept ready for marketplace lead ${project.id}`);
    return result;
  } catch (error) {
    console.error(`[DesignBot] Failed for marketplace lead:`, error);

    await db.project.update({
      where: { id: project.id },
      data: {
        status: "DESIGN_FAILED",
      },
    });

    throw error;
  }
}

// ============================================================================
// INTEGRATION POINT 8: Next.js API Routes (Example Structure)
// ============================================================================

/**
 * File: app/api/concept/route.ts
 */

export const conceptApiExample = `
import { NextRequest, NextResponse } from "next/server";
import { KealeeAgentSystem } from "@kealee/core-bots/integration/kealee-integration-example";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { handleIntakeSubmission } from "@kealee/core-bots/integration/kealee-integration-points";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { projectId, intakeAnswers } = body;
  const kealeeSystem = new KealeeAgentSystem();

  try {
    const result = await handleIntakeSubmission(
      projectId,
      session.user.id,
      intakeAnswers,
      kealeeSystem,
      db
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
`;

// ============================================================================
// INTEGRATION POINT 9: ClaudeCachedClient Replaces Direct SDK Calls
// ============================================================================

/**
 * BEFORE: Direct Anthropic SDK calls scattered across codebase
 *
 * ❌ WRONG (old way)
 * const client = new Anthropic();
 * const response = await client.messages.create({ ... });
 */

/**
 * AFTER: All calls go through KealeeAgentSystem or ClaudeCachedClient
 *
 * ✅ Correct (new way)
 * const result = await claudeClient.callClaudeWithCache(contextId, prompt);
 * // Automatically handles caching, metrics, rate limits
 */

// ============================================================================
// DEPLOYMENT CHECKLIST
// ============================================================================

export const deploymentChecklist = `
## Pre-Deployment Checklist

### Code Integration
- [ ] core-bots/src/orgo/orgo-agent-structure.ts installed
- [ ] core-bots/src/hermes/hermes-function-routing.ts installed
- [ ] core-bots/src/obsidian/obsidian-knowledge-base.ts installed
- [ ] Update packages/core-rules/src/pricing.ts with 2026 rates
- [ ] Update .mdc Cursor configuration with KeaBot rules

### Environment Setup
- [ ] Set ANTHROPIC_API_KEY in .env.local
- [ ] Set KEALEE_REGION=DMV
- [ ] Verify Stripe webhook handler configured
- [ ] Verify Prisma migrations include new tables

### Testing
- [ ] Run all 12 smoke tests (must pass)
- [ ] Test DesignBot on sample intake
- [ ] Test EstimateBot with concept output
- [ ] Test PermitBot with DC and Maryland jurisdictions
- [ ] Verify cache hit rate >= 40%
- [ ] Test approval workflows

### Portal Integration
- [ ] Update /concept page to call new API
- [ ] Add WebSocket listeners for real-time updates
- [ ] Update /estimate page
- [ ] Update /permit page
- [ ] Add analytics dashboard for cache metrics

### Monitoring
- [ ] Set up alerts for API errors
- [ ] Set up alerts for cache hit rate drop
- [ ] Monitor cost savings vs. baseline
- [ ] Track KeaBot execution times

### Go-Live
- [ ] Deploy to Railway (services)
- [ ] Deploy to Vercel (portal apps)
- [ ] Enable Stripe webhook for production
- [ ] Monitor first 24h of production traffic
`;
