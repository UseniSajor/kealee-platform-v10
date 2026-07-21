import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import { sessionRoutes } from "./routes/sessions";
import { taskRoutes } from "./routes/tasks";
import { toolRoutes } from "./routes/tools";
import { intakeRoutes } from "./routes/intake.routes";
import { orchestrationRoutes } from "./routes/orchestration.routes";

export async function buildServer() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info",
      transport:
        process.env.NODE_ENV !== "production"
          ? { target: "pino-pretty", options: { colorize: true } }
          : undefined,
    },
  });

  await app.register(cors, {
    origin: process.env.ALLOWED_ORIGINS?.split(",") ?? ["http://localhost:3024"],
    credentials: true,
  });

  await app.register(sensible);

  // Health check — shows LLM stack + orchestration engine readiness
  app.get("/health", async () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { providerRegistry } = require("@kealee/core-llm") as {
      providerRegistry: { list: () => Array<{ name: string; available: boolean }> };
    };
    const { aiActionLog } = await import("@kealee/core");
    const logStats = aiActionLog.getStats();
    return {
      status: "ok",
      service: "keacore",
      providers: providerRegistry.list(),
      orchestration: {
        engine: "ready",
        totalDecisions: logStats.total,
        autoExecuteRate: logStats.autoExecuteRate,
        escalationRate: logStats.escalationRate,
      },
    };
  });

  // All routes under /keacore prefix
  await app.register(
    async (api) => {
      await api.register(sessionRoutes);
      await api.register(taskRoutes);
      await api.register(toolRoutes);
      await api.register(intakeRoutes);
      await api.register(orchestrationRoutes);
    },
    { prefix: "/keacore" },
  );

  return app;
}
