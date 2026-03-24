import { AgentSession, ExecutionPlan, RunResult, Task } from "../types";
import { Executor } from "./executor";
import { MemoryManager } from "./memory-manager";
import { Planner } from "./planner";
import { SessionManager } from "./session-manager";

export class KeaCoreRuntime {
  constructor(
    private readonly sessions: SessionManager,
    private readonly planner: Planner,
    private readonly executor: Executor,
    private readonly memory: MemoryManager,
  ) {}

  async startTask(task: Task): Promise<{ task: Task; plan: ExecutionPlan }> {
    const session = await this.sessions.get(task.sessionId);
    await this.memory.appendNote(session.id, `Starting task: ${task.title}`);

    const plan = await this.planner.createPlan(session, task);
    await this.memory.setPlan(session.id, plan);

    const updatedTask: Task = { ...task, status: "running" };
    return { task: updatedTask, plan };
  }

  async runTask(task: Task): Promise<RunResult> {
    const session = await this.sessions.get(task.sessionId);
    const plan = session.memory.currentPlan;

    if (!plan) throw new Error(`No plan found for session ${task.sessionId}`);

    for (const step of plan.steps) {
      if (step.status === "completed" || step.status === "skipped") continue;

      const result = await this.executor.executeStep(session, task, step);
      await this.memory.recordStepOutput(session.id, step.id, result);

      // If the plan produced a projectId, attach it to the session
      if (step.target === "create_project" && typeof result.projectId === "string") {
        await this.sessions.update(session.id, { projectId: result.projectId });
        await this.memory.setFact(session.id, "projectId", result.projectId);
      }

      if (result.awaitingApproval === true) {
        return {
          status: "awaiting_approval",
          stepId: step.id,
          message: typeof result.message === "string" ? result.message : "Approval required",
        };
      }

      if (result.failed === true) {
        if (step.stopOnFailure !== false) {
          return {
            status: "failed",
            stepId: step.id,
            error: typeof result.error === "string" ? result.error : "Unknown error",
          };
        }
        // Non-fatal failure — record and continue
        await this.memory.appendNote(
          session.id,
          `Step ${step.id} (${step.target}) failed but was non-fatal: ${result.error}`,
        );
      } else {
        // Store significant outputs under their tool name for easy retrieval
        await this.memory.setOutput(session.id, step.target, result);
      }
    }

    const finalSession = await this.sessions.get(session.id);
    return {
      status: "completed",
      outputs: finalSession.memory.outputs,
    };
  }

  async approveStep(sessionId: string, stepId: string): Promise<RunResult> {
    const session = await this.sessions.get(sessionId);
    const plan = session.memory.currentPlan;
    if (!plan) throw new Error("No plan on session");

    const step = plan.steps.find((s) => s.id === stepId);
    if (!step) throw new Error(`Step not found: ${stepId}`);

    // Mark approved and re-run from this step
    step.status = "pending";
    step.approvalRequired = false;
    await this.memory.setPlan(sessionId, plan);
    await this.memory.appendNote(sessionId, `Step ${stepId} approved by operator`);

    // Find the task — stored in the step input context
    // TODO: retrieve task from task store once DB-backed
    const fakeTask: Task = {
      id: `task_approval_${stepId}`,
      sessionId,
      title: "Approval continuation",
      description: "",
      requestedBy: "operator",
      assignedAgent: "keacore",
      status: "running",
      priority: "high",
      input: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.runTask(fakeTask);
  }

  async getSession(id: string): Promise<AgentSession> {
    return this.sessions.get(id);
  }
}
