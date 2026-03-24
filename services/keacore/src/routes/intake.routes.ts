/**
 * keacore/routes/intake.routes.ts
 * POST /keacore/intake/start — primary intake entry point from web-main
 * GET  /keacore/sessions/:id/execution-context — fetch full session context
 *
 * Flow for POST /keacore/intake/start:
 *   1. Normalize raw intake
 *   2. Create/load session
 *   3. Run AI intake analysis (internal-first)
 *   4. Build seeded workflow plan
 *   5. Execute workflow (non-blocking steps)
 *   6. Return structured result to intake UI
 */

import { FastifyInstance } from "fastify";
import { z } from "zod";
import { normalizeIntake, RawIntake } from "@kealee/core-agents";
import { analyzeIntakeContext } from "@kealee/core-agents";
import { runtime } from "../runtime";

// ─── Validation schemas ───────────────────────────────────────────────────────

const StartIntakeBody = z.object({
  // Identity
  orgId: z.string().optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  source: z.enum(["web-main", "portal-owner", "portal-developer", "api"]).default("web-main"),

  // Raw intake fields
  address: z.string().optional(),
  city: z.string().optional(),
  county: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  projectType: z.string().optional(),
  scopeSummary: z.string().optional(),
  description: z.string().optional(),
  budgetRange: z.string().optional(),
  timeline: z.string().optional(),
  stylePreferences: z.string().optional(),
  hasPlans: z.boolean().optional(),
  hasImages: z.boolean().optional(),

  // Garden-specific
  gardenType: z.string().optional(),
  gardenSize: z.string().optional(),

  // Developer-specific
  lotSize: z.string().optional(),
  targetUnits: z.number().optional(),

  // Multimodal
  imageUrl: z.string().url().optional(),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

export async function intakeRoutes(app: FastifyInstance) {
  /**
   * POST /keacore/intake/start
   *
   * Receives raw intake from web-main and returns a structured project path result.
   *
   * Test scenarios:
   *   1. "I want to build a 2-unit ADU in DC" → zoning + feasibility + estimate flow
   *   2. "I already have plans and need permit help in PG County" → permit-only path
   *   3. "I uploaded plans/screenshots" → Qwen3-VL path triggered
   */
  app.post("/intake/start", async (req, reply) => {
    const parsed = StartIntakeBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid intake", issues: parsed.error.issues });
    }

    const body = parsed.data;

    // 1. Normalize intake
    const normalizedIntake = normalizeIntake(body as RawIntake);

    // 2. Create or load session
    let session;
    if (body.sessionId) {
      try {
        session = await runtime.sessions.get(body.sessionId);
      } catch {
        session = await runtime.sessions.create({
          orgId: body.orgId,
          userId: body.userId,
          source: body.source === "web-main" ? "web" : body.source as "api",
          mode: "assisted",
        });
      }
    } else {
      session = await runtime.sessions.create({
        orgId: body.orgId,
        userId: body.userId,
        source: body.source === "web-main" ? "web" : body.source as "api",
        mode: "assisted",
      });
    }

    // Store normalized intake in session memory
    await runtime.memory.setFact(session.id, "normalizedIntake", normalizedIntake);
    await runtime.memory.setFact(session.id, "address", normalizedIntake.address);
    await runtime.memory.setFact(session.id, "projectType", normalizedIntake.projectType);
    await runtime.memory.setFact(session.id, "jurisdictionCode", normalizedIntake.jurisdictionCode);

    // 3. Run AI intake analysis
    let analysis;
    try {
      analysis = await analyzeIntakeContext(normalizedIntake, {
        sessionId: session.id,
        imageUrl: body.imageUrl,
      });

      // Bubble AI risk flags into session memory
      for (const flag of analysis.riskFlags) {
        await runtime.memory.setRiskFlag(session.id, flag);
      }

      // Store matched intent/workflow
      if (analysis.matchedIntent) {
        await runtime.memory.setFact(session.id, "matchedIntent", analysis.matchedIntent);
        await runtime.memory.appendNote(session.id, `AI classified intent: ${analysis.matchedIntent}`);
      }
      if (analysis.matchedWorkflow) {
        await runtime.memory.setFact(session.id, "matchedWorkflow", analysis.matchedWorkflow);
      }

      // Store AI outputs
      await runtime.memory.setOutput(session.id, "intakeAnalysis", analysis);

    } catch (err) {
      // AI analysis failed — log but don't crash the intake flow
      console.warn(`[IntakeRoutes] AI analysis failed for session ${session.id}:`, err);
      analysis = {
        summary: "Project received. Our team will review and follow up shortly.",
        likelyProjectComplexity: "medium" as const,
        missingCriticalFields: normalizedIntake.address ? [] : ["address"],
        riskFlags: [],
        suggestedUpsells: [],
        requiresOperatorReview: true,
        disclaimers: ["All onsite services must be performed by licensed contractors."],
        confidence: 0,
        provider: "none",
        fallbackUsed: false,
      };
    }

    // 4. Build and execute plan
    const task = {
      id: `task_intake_${session.id}`,
      sessionId: session.id,
      title: `Intake analysis: ${normalizedIntake.projectType ?? "project"}`,
      description: normalizedIntake.scopeSummary ?? "Intake received",
      requestedBy: "user" as const,
      assignedAgent: "keacore" as const,
      status: "running" as const,
      priority: "medium" as const,
      input: {
        ...normalizedIntake,
        intent: analysis.matchedIntent ?? normalizedIntake.projectType,
        normalizedIntent: analysis.matchedIntent,
        title: `${normalizedIntake.projectType ?? "Project"} at ${normalizedIntake.address ?? "unspecified address"}`,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let workflowResult;
    try {
      const { task: startedTask, plan } = await runtime.keacore.startTask(task);
      await runtime.memory.appendNote(session.id, `Plan created: ${plan.steps.length} steps`);

      // Execute synchronously — for intake we run up to first approval gate
      workflowResult = await runtime.keacore.runTask(startedTask);
    } catch (err) {
      workflowResult = {
        status: "failed" as const,
        stepId: "planning",
        error: (err as Error).message,
      };
    }

    // 5. Return structured response to intake UI
    return reply.status(200).send({
      sessionId: session.id,
      intake: normalizedIntake,
      analysis: {
        summary: analysis.summary,
        complexity: analysis.likelyProjectComplexity,
        riskFlags: analysis.riskFlags,
        missingFields: analysis.missingCriticalFields,
        primaryService: analysis.primaryService,
        secondaryServices: analysis.secondaryServices ?? [],
        requiresOperatorReview: analysis.requiresOperatorReview,
        disclaimers: analysis.disclaimers,
        jurisdictionCode: analysis.jurisdictionCode,
        matchedIntent: analysis.matchedIntent,
        matchedWorkflow: analysis.matchedWorkflow,
      },
      workflow: {
        status: workflowResult.status,
        outputs: workflowResult.status === "completed" ? workflowResult.outputs : undefined,
      },
      aiMeta: {
        confidence: analysis.confidence,
        provider: analysis.provider,
        fallbackUsed: analysis.fallbackUsed,
      },
    });
  });

  /**
   * GET /keacore/sessions/:id/execution-context
   * Returns the full execution context for a session (for operator/command-center use).
   */
  app.get<{ Params: { id: string } }>("/sessions/:id/execution-context", async (req, reply) => {
    try {
      const session = await runtime.sessions.get(req.params.id);
      const memory = await runtime.memory.getMemory(session.id);

      return reply.send({
        sessionId: session.id,
        status: session.status,
        source: session.source,
        mode: session.mode,
        projectId: session.projectId,
        memory: {
          normalizedIntake: memory.facts.normalizedIntake,
          matchedIntent: memory.facts.matchedIntent,
          matchedWorkflow: memory.facts.matchedWorkflow,
          jurisdictionCode: memory.facts.jurisdictionCode,
          riskFlags: memory.riskFlags,
          decisions: memory.decisions,
          agentNotes: memory.agentNotes,
          outputs: memory.outputs,
          toolHistory: memory.toolHistory.slice(-20), // last 20 tool calls
          currentPlan: memory.currentPlan,
        },
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      });
    } catch {
      return reply.status(404).send({ error: "Session not found" });
    }
  });
}
