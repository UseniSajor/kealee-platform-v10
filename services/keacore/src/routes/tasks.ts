import { FastifyInstance } from "fastify";
import { z } from "zod";
import { AgentRoleSchema } from "@kealee/core-agents";
import { runtime } from "../runtime";
import { taskStore } from "../store/task-store";

const CreateTaskBody = z.object({
  sessionId: z.string(),
  title: z.string().min(1),
  description: z.string().default(""),
  requestedBy: z.enum(["user", "system", "operator"]).default("user"),
  assignedAgent: AgentRoleSchema.default("keacore"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  input: z.record(z.unknown()).default({}),
});

const ApproveBody = z.object({
  stepId: z.string(),
});

export async function taskRoutes(app: FastifyInstance) {
  // POST /keacore/tasks
  app.post("/tasks", async (req, reply) => {
    const body = CreateTaskBody.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: "Invalid request", issues: body.error.issues });
    }

    // Verify session exists
    try {
      await runtime.sessions.get(body.data.sessionId);
    } catch {
      return reply.status(404).send({ error: "Session not found" });
    }

    const task = taskStore.create({ ...body.data, status: "queued", output: undefined });

    // Start planning immediately
    try {
      const { task: planned, plan } = await runtime.keacore.startTask(task);
      taskStore.update(task.id, { status: "planning" });
      return reply.status(201).send({ task: planned, plan });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return reply.status(500).send({ error: "Failed to start task", detail: msg });
    }
  });

  // POST /keacore/tasks/:id/run
  app.post<{ Params: { id: string } }>("/tasks/:id/run", async (req, reply) => {
    let task;
    try {
      task = taskStore.get(req.params.id);
    } catch {
      return reply.status(404).send({ error: "Task not found" });
    }

    taskStore.update(task.id, { status: "running" });

    try {
      const result = await runtime.keacore.runTask(task);

      if (result.status === "completed") {
        taskStore.update(task.id, { status: "completed", output: result.outputs });
      } else if (result.status === "awaiting_approval") {
        taskStore.update(task.id, { status: "awaiting_approval" });
      } else if (result.status === "failed") {
        taskStore.update(task.id, { status: "failed", error: result.error });
      }

      return reply.send({ result });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      taskStore.update(task.id, { status: "failed", error: msg });
      return reply.status(500).send({ error: msg });
    }
  });

  // GET /keacore/tasks/:id
  app.get<{ Params: { id: string } }>("/tasks/:id", async (req, reply) => {
    try {
      const task = taskStore.get(req.params.id);
      return reply.send({ task });
    } catch {
      return reply.status(404).send({ error: "Task not found" });
    }
  });

  // POST /keacore/tasks/:id/approve  — operator approves a waiting step
  app.post<{ Params: { id: string } }>("/tasks/:id/approve", async (req, reply) => {
    const body = ApproveBody.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: "stepId required" });
    }

    let task;
    try {
      task = taskStore.get(req.params.id);
    } catch {
      return reply.status(404).send({ error: "Task not found" });
    }

    try {
      const result = await runtime.keacore.approveStep(task.sessionId, body.data.stepId);
      return reply.send({ result });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return reply.status(500).send({ error: msg });
    }
  });
}
