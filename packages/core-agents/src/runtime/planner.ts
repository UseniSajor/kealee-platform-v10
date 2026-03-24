import { AgentSession, ExecutionPlan, Task } from "../types";
import { createId } from "../utils/ids";

// ─── Routing rules ────────────────────────────────────────────────────────────
// Deterministic routing is evaluated BEFORE any LLM-generated plan.
// Keep these explicit and readable. Add new intents here first.

type NormalizedIntent =
  | "build_new"
  | "renovate"
  | "permit_only"
  | "design_concept"
  | "feasibility"
  | "contractor_match"
  | "developer_deal"
  | "unknown";

function normalizeIntent(raw: string): NormalizedIntent {
  const s = raw.toLowerCase();
  if (s.includes("build") || s.includes("construct") || s.includes("new home")) return "build_new";
  if (s.includes("renovate") || s.includes("remodel") || s.includes("addition") || s.includes("adu")) return "renovate";
  if (s.includes("permit") || s.includes("zoning")) return "permit_only";
  if (s.includes("concept") || s.includes("design") || s.includes("render") || s.includes("garden") || s.includes("landscape")) return "design_concept";
  if (s.includes("feasib") || s.includes("pro forma") || s.includes("viab")) return "feasibility";
  if (s.includes("contractor") || s.includes("find a gc") || s.includes("bid")) return "contractor_match";
  if (s.includes("develop") || s.includes("multifamily") || s.includes("land")) return "developer_deal";
  return "unknown";
}

export class Planner {
  async createPlan(session: AgentSession, task: Task): Promise<ExecutionPlan> {
    const input = task.input ?? {};
    const rawIntent = String(input.intent ?? session.memory.normalizedIntent ?? task.description ?? "");
    const intent = normalizeIntent(rawIntent);

    // Store the normalized intent back into the task input for downstream use
    input.normalizedIntent = intent;

    const steps = [];

    // ── Step 1: Always create project if none attached to session ──────────────
    if (!session.projectId) {
      steps.push({
        id: createId("step"),
        title: "Create project",
        description: "Initialize project record from intake data",
        type: "tool" as const,
        target: "create_project",
        status: "pending" as const,
        input: {
          orgId: session.orgId,
          userId: session.userId,
          title: String(input.title ?? "New Kealee Project"),
          projectType: String(input.projectType ?? "unknown"),
          address: input.address,
          scopeSummary: input.scopeSummary,
        },
        maxRetries: 1,
        stopOnFailure: true,
      });
    }

    // ── Step 2: Permit / zoning check ─────────────────────────────────────────
    if (
      intent === "permit_only" ||
      intent === "build_new" ||
      intent === "renovate" ||
      intent === "developer_deal"
    ) {
      steps.push({
        id: createId("step"),
        title: "Check zoning",
        description: "Look up zoning designation and basic constraints for the address",
        type: "tool" as const,
        target: "check_zoning",
        status: "pending" as const,
        input: { address: input.address },
        maxRetries: 2,
        stopOnFailure: true,
      });
    }

    // ── Step 3: Feasibility ───────────────────────────────────────────────────
    if (
      intent === "build_new" ||
      intent === "renovate" ||
      intent === "developer_deal" ||
      intent === "feasibility"
    ) {
      steps.push({
        id: createId("step"),
        title: "Run feasibility",
        description: "Produce a light feasibility assessment with risk flags",
        type: "tool" as const,
        target: "run_feasibility",
        status: "pending" as const,
        input: {
          address: input.address,
          projectType: input.projectType,
          scopeSummary: input.scopeSummary,
        },
        maxRetries: 1,
      });
    }

    // ── Step 4: Concept brief ─────────────────────────────────────────────────
    if (
      intent === "build_new" ||
      intent === "renovate" ||
      intent === "design_concept"
    ) {
      steps.push({
        id: createId("step"),
        title: "Generate concept brief",
        description: "Produce a design brief suitable for the concept engine",
        type: "tool" as const,
        target: "generate_concept_brief",
        status: "pending" as const,
        input: {
          projectType: input.projectType,
          scopeSummary: input.scopeSummary,
          address: input.address,
          stylePreferences: input.stylePreferences,
        },
        maxRetries: 1,
      });
    }

    // ── Step 5: Estimate ──────────────────────────────────────────────────────
    if (
      intent === "build_new" ||
      intent === "renovate" ||
      intent === "feasibility"
    ) {
      steps.push({
        id: createId("step"),
        title: "Create rough estimate",
        description: "Generate a rough cost range for the scope",
        type: "tool" as const,
        target: "create_estimate",
        status: "pending" as const,
        input: {
          projectType: input.projectType,
          scopeSummary: input.scopeSummary,
          address: input.address,
          budgetRange: input.budgetRange,
        },
        maxRetries: 1,
      });
    }

    // ── Step 6: Approval gate before any payment / checkout ───────────────────
    if (input.autoCheckout === true) {
      steps.push({
        id: createId("step"),
        title: "User approval: proceed to checkout",
        description: "Present summary to user and request approval before charging",
        type: "approval" as const,
        target: "request_human_approval",
        status: "pending" as const,
        input: { reason: "User must approve before checkout is created" },
        approvalRequired: true,
        stopOnFailure: true,
      });

      steps.push({
        id: createId("step"),
        title: "Create checkout",
        description: "Create Stripe checkout session for recommended next package",
        type: "tool" as const,
        target: "create_checkout",
        status: "pending" as const,
        input: {
          userId: session.userId,
          productKey: input.recommendedProduct,
        },
        requiresApproval: true,
        maxRetries: 1,
      });
    }

    return {
      id: createId("plan"),
      taskId: task.id,
      summary: `KeaCore plan for intent: ${intent}`,
      steps,
      createdAt: new Date().toISOString(),
    };
  }
}
