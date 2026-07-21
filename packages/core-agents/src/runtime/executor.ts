import { AgentSession, PlanStep, Task, ToolExecutionRecord } from "../types";
import { createId } from "../utils/ids";

// toolRegistry is injected to avoid circular dependencies with core-tools
export type ToolRegistryLike = {
  execute: (name: string, input: unknown, context: unknown) => Promise<unknown>;
};

export class Executor {
  constructor(private readonly registry: ToolRegistryLike) {}

  async executeStep(
    session: AgentSession,
    task: Task,
    step: PlanStep,
  ): Promise<Record<string, unknown>> {
    step.status = "running";
    const startedAt = new Date().toISOString();

    try {
      // ── Approval gate ────────────────────────────────────────────────────────
      if (step.type === "approval") {
        step.status = "awaiting_approval";
        return {
          awaitingApproval: true,
          message: step.description,
        };
      }

      // ── Tool call ────────────────────────────────────────────────────────────
      if (step.type === "tool") {
        const output = await this.registry.execute(step.target, step.input ?? {}, {
          session,
          task,
          memory: session.memory,
          traceId: createId("trace"),
        });

        step.status = "completed";
        step.output = output as Record<string, unknown>;

        const record: ToolExecutionRecord = {
          id: createId("toolrun"),
          toolName: step.target,
          input: step.input ?? {},
          output: output as Record<string, unknown>,
          success: true,
          startedAt,
          completedAt: new Date().toISOString(),
        };
        session.memory.toolHistory.push(record);

        return output as Record<string, unknown>;
      }

      // ── Agent delegation ─────────────────────────────────────────────────────
      // TODO: route to specialist agent when step.type === "agent"
      if (step.type === "agent") {
        throw new Error(`Agent delegation not yet implemented for: ${step.target}`);
      }

      throw new Error(`Unsupported step type: ${step.type}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      step.status = "failed";
      step.retries = (step.retries ?? 0) + 1;

      session.memory.toolHistory.push({
        id: createId("toolrun"),
        toolName: step.target,
        input: step.input ?? {},
        success: false,
        startedAt,
        completedAt: new Date().toISOString(),
        error: message,
      });

      return { failed: true, error: message };
    }
  }
}
