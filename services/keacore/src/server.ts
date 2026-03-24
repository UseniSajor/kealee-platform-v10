import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import { sessionRoutes } from "./routes/sessions";
import { taskRoutes } from "./routes/tasks";
import { toolRoutes } from "./routes/tools";

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

  // Health check
  app.get("/health", async () => ({ status: "ok", service: "keacore" }));

  // All routes under /keacore prefix
  await app.register(
    async (api) => {
      await api.register(sessionRoutes);
      await api.register(taskRoutes);
      await api.register(toolRoutes);
    },
    { prefix: "/keacore" },
  );

  return app;
}
