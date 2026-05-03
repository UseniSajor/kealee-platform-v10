/**
 * OrgBot Orchestrator
 *
 * Event-driven sequencing of C-Suite OrgBots.
 *
 * Flow:
 *   new_project | updated_estimate | milestone_completion
 *     → CFO (financial validation)
 *     → COO (execution validation) [parallel with CFO]
 *     → CEO (strategic decision, receives CFO + COO results)
 *     → CRO (revenue optimization) [parallel with CEO, independent]
 *
 * Writes KeaBotEvent records to Supabase for audit trail.
 */

import { prisma } from "@kealee/database";
import { CFOBot } from "./cfo/cfo-bot.js";
import { COOBot } from "./coo/coo-bot.js";
import { CEOBot } from "./ceo/ceo-bot.js";
import { CROBot } from "./cro/cro-bot.js";
import type { OrgBotRequest, OrgBotResponse, StructuredDecision } from "./decision-schema.js";

export type OrgBotEventType =
  | "new_project"
  | "updated_estimate"
  | "updated_design"
  | "milestone_completion"
  | "user_request"
  | "permit_issued"
  | "construction_start";

export interface OrgBotOrchestrationRequest {
  projectId: string;
  sessionId?: string;
  eventType: OrgBotEventType;
  context: Record<string, unknown>;
  triggeredBy: string;
  urgency?: "routine" | "urgent" | "critical";
}

export interface OrgBotOrchestrationResult {
  eventId: string;
  projectId: string;
  eventType: OrgBotEventType;
  cfo: OrgBotResponse | null;
  coo: OrgBotResponse | null;
  ceo: OrgBotResponse | null;
  cro: OrgBotResponse | null;
  overallDecision: StructuredDecision["decision"] | null;
  latencyMs: number;
}

const cfo = new CFOBot();
const coo = new COOBot();
const ceo = new CEOBot();
const cro = new CROBot();

export class OrgBotOrchestrator {

  /**
   * Determine which bots to trigger based on event type.
   */
  private selectBots(eventType: OrgBotEventType): string[] {
    switch (eventType) {
      case "new_project":
      case "updated_estimate":
        return ["kea-cfo", "kea-coo", "kea-ceo", "kea-cro"];
      case "updated_design":
        return ["kea-cfo", "kea-cro"];
      case "milestone_completion":
        return ["kea-coo", "kea-cro"];
      case "permit_issued":
      case "construction_start":
        return ["kea-coo"];
      case "user_request":
        return ["kea-cro"];
      default:
        return ["kea-ceo"];
    }
  }

  /**
   * Run the OrgBot pipeline for a given event.
   */
  async run(req: OrgBotOrchestrationRequest): Promise<OrgBotOrchestrationResult> {
    const startMs = Date.now();
    const urgency = req.urgency ?? "routine";
    const triggeredBots = this.selectBots(req.eventType);

    // Create keabot_events record
    const event = await prisma.keaBotEvent.create({
      data: {
        projectId: req.projectId,
        sessionId: req.sessionId,
        eventType: req.eventType,
        payload: req.context as object,
        context: { triggeredBy: req.triggeredBy, urgency } as object,
        triggeredBots,
        status: "running",
      },
    });

    let cfoResult: OrgBotResponse | null = null;
    let cooResult: OrgBotResponse | null = null;
    let ceoResult: OrgBotResponse | null = null;
    let croResult: OrgBotResponse | null = null;

    try {
      const baseRequest: Omit<OrgBotRequest, "context"> = {
        projectId: req.projectId,
        sessionId: req.sessionId,
        triggeredBy: req.triggeredBy,
        urgency,
      };

      // --- Phase 1: CFO + COO in parallel ---
      const phase1 = await Promise.allSettled([
        triggeredBots.includes("kea-cfo")
          ? cfo.execute({ ...baseRequest, context: req.context })
          : Promise.resolve(null),
        triggeredBots.includes("kea-coo")
          ? coo.execute({ ...baseRequest, context: req.context })
          : Promise.resolve(null),
      ]);

      cfoResult = phase1[0].status === "fulfilled" ? phase1[0].value : null;
      cooResult = phase1[1].status === "fulfilled" ? phase1[1].value : null;

      // --- Phase 2: CEO (synthesizes CFO + COO) + CRO (parallel, independent) ---
      const ceoContext: Record<string, unknown> = {
        ...req.context,
        cfoDecision: cfoResult?.decision ?? null,
        cooDecision: cooResult?.decision ?? null,
      };

      const phase2 = await Promise.allSettled([
        triggeredBots.includes("kea-ceo")
          ? ceo.execute({ ...baseRequest, context: ceoContext })
          : Promise.resolve(null),
        triggeredBots.includes("kea-cro")
          ? cro.execute({ ...baseRequest, context: req.context })
          : Promise.resolve(null),
      ]);

      ceoResult = phase2[0].status === "fulfilled" ? phase2[0].value : null;
      croResult = phase2[1].status === "fulfilled" ? phase2[1].value : null;

      // --- Determine overall decision ---
      const overallDecision = ceoResult?.decision.decision
        ?? cfoResult?.decision.decision
        ?? cooResult?.decision.decision
        ?? null;

      // Update event record with results
      await prisma.keaBotEvent.update({
        where: { id: event.id },
        data: {
          status: "completed",
          executionPlan: {
            cfo: cfoResult ? { decision: cfoResult.decision.decision, confidence: cfoResult.decision.confidence } : null,
            coo: cooResult ? { decision: cooResult.decision.decision, confidence: cooResult.decision.confidence } : null,
            ceo: ceoResult ? { decision: ceoResult.decision.decision, confidence: ceoResult.decision.confidence } : null,
            cro: croResult ? { decision: croResult.decision.decision, confidence: croResult.decision.confidence } : null,
            overall: overallDecision,
          } as object,
          completedAt: new Date(),
        },
      });

      return {
        eventId: event.id,
        projectId: req.projectId,
        eventType: req.eventType,
        cfo: cfoResult,
        coo: cooResult,
        ceo: ceoResult,
        cro: croResult,
        overallDecision,
        latencyMs: Date.now() - startMs,
      };

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      await prisma.keaBotEvent.update({
        where: { id: event.id },
        data: {
          status: "failed",
          errors: { message: errorMsg } as object,
          completedAt: new Date(),
        },
      });
      throw err;
    }
  }
}

// Singleton instance
export const orgBotOrchestrator = new OrgBotOrchestrator();
