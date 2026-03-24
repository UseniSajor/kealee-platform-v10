import {
  Executor,
  KeaCoreRuntime,
  MemoryManager,
  Planner,
  SessionManager,
} from "@kealee/core-agents";
import { toolRegistry } from "@kealee/core-tools";

// Bootstrap all tools on startup (auto-registration happens in @kealee/core-tools index)
// eslint-disable-next-line @typescript-eslint/no-var-requires
require("@kealee/core-tools");

const sessions  = new SessionManager();
const memory    = new MemoryManager(sessions);
const planner   = new Planner();
const executor  = new Executor(toolRegistry);
const keacore   = new KeaCoreRuntime(sessions, planner, executor, memory);

export const runtime = { sessions, memory, planner, executor, keacore };
