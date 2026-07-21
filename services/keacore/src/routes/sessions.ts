import { FastifyInstance } from "fastify";
import { z } from "zod";
import { runtime } from "../runtime";

const CreateSessionBody = z.object({
  orgId: z.string().optional(),
  userId: z.string().optional(),
  projectId: z.string().optional(),
  source: z.enum(["web", "portal-owner", "portal-developer", "command-center", "api"]).default("api"),
  mode: z.enum(["autonomous", "assisted", "operator"]).default("assisted"),
  metadata: z.record(z.unknown()).optional(),
});

export async function sessionRoutes(app: FastifyInstance) {
  // POST /keacore/sessions
  app.post("/sessions", async (req, reply) => {
    const body = CreateSessionBody.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: "Invalid request", issues: body.error.issues });
    }

    const session = await runtime.sessions.create(body.data);
    return reply.status(201).send({ session });
  });

  // GET /keacore/sessions/:id
  app.get<{ Params: { id: string } }>("/sessions/:id", async (req, reply) => {
    try {
      const session = await runtime.sessions.get(req.params.id);
      return reply.send({ session });
    } catch {
      return reply.status(404).send({ error: "Session not found" });
    }
  });

  // GET /keacore/sessions
  app.get("/sessions", async (_req, reply) => {
    const sessions = await runtime.sessions.list(50);
    return reply.send({ sessions });
  });
}
