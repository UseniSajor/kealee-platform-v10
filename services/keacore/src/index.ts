import { config } from "dotenv";
import { resolve } from "path";

if (process.env.NODE_ENV !== "production") {
  config({ path: resolve(process.cwd(), ".env.local") });
  config({ path: resolve(process.cwd(), "../../packages/database/.env"), override: true });
}

import { buildServer } from "./server";

const PORT = parseInt(process.env.PORT ?? "3030", 10);
const HOST = process.env.HOSTNAME ?? "0.0.0.0";

async function main() {
  const app = await buildServer();

  await app.listen({ port: PORT, host: HOST });
  console.log(`[KeaCore] Running on http://${HOST}:${PORT}`);
}

main().catch((err) => {
  console.error("[KeaCore] Fatal startup error:", err);
  process.exit(1);
});
