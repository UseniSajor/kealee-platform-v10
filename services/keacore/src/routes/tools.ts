import { FastifyInstance } from "fastify";
import { z } from "zod";
import { toolRegistry } from "@kealee/core-tools";
import { runtime } from "../runtime";
import { taskStore } from "../store/task-store";
import { createId } from "@kealee/core-agents";

const ExecuteToolBody = z.object({
  sessionId: z.string(),
  taskId: z.string().optional(),
  input: z.record(z.unknown()).default({}),
});

export async function toolRoutes(app: FastifyInstance) {
  // GET /keacore/tools
  app.get("/tools", async (_req, reply) => {
    return reply.send({ tools: toolRegistry.list() });
  });

  // POST /keacore/tools/:name/execute
  app.post<{ Params: { name: string } }>("/tools/:name/execute", async (req, reply) => {
    const body = ExecuteToolBody.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: "Invalid request", issues: body.error.issues });
    }

    let session;
    try {
      session = await runtime.sessions.get(body.data.sessionId);
    } catch {
      return reply.status(404).send({ error: "Session not found" });
    }

    // Get or create a task for context
    let task;
    if (body.data.taskId) {
      try {
        task = taskStore.get(body.data.taskId);
      } catch {
        return reply.status(404).send({ error: "Task not found" });
      }
    } else {
      task = taskStore.create({
        sessionId: session.id,
        title: `Direct tool: ${req.params.name}`,
        description: `Direct execution of tool ${req.params.name}`,
        requestedBy: "operator",
        assignedAgent: "keacore",
        status: "running",
        priority: "medium",
        input: body.data.input,
      });
    }

    const context = {
      session,
      task,
      memory: session.memory,
      traceId: createId("trace"),
    };

    try {
      const output = await toolRegistry.execute(req.params.name, body.data.input, context);
      return reply.send({ output });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return reply.status(500).send({ error: msg });
    }
  });
}
