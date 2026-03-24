import {
  Executor,
  KeaCoreRuntime,
  MemoryManager,
  Planner,
  SessionManager,
} from "@kealee/core-agents";
import { seedRegistry } from "@kealee/core-agents";
import { toolRegistry } from "@kealee/core-tools";

// Bootstrap all tools on startup (auto-registration happens in @kealee/core-tools index)
// eslint-disable-next-line @typescript-eslint/no-var-requires
require("@kealee/core-tools");

// ─── Initialize LLM stack ─────────────────────────────────────────────────────
// Registers all providers and warms the retrieval layer from seed packs.

function initLlmStack() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { initializeLlmStack } = require("@kealee/core-llm") as {
      initializeLlmStack: () => { providers: Array<{ name: string; available: boolean }>; chunksLoaded: number };
    };
    const result = initializeLlmStack();
    console.log(`[KeaCore] LLM stack initialized: ${result.providers.length} providers, ${result.chunksLoaded} chunks`);
  } catch (err) {
    console.warn("[KeaCore] LLM stack initialization failed — falling back to Claude-only mode:", (err as Error).message);
    // KeaCore can still boot with Claude/GPT external providers even if internal setup fails
  }
}

// ─── Initialize seed registry ─────────────────────────────────────────────────

function initSeedRegistry() {
  try {
    seedRegistry.load();
  } catch (err) {
    console.warn("[KeaCore] Seed registry load failed:", (err as Error).message);
  }
}

// Boot sequence
initSeedRegistry();
initLlmStack();

// ─── Core runtime ─────────────────────────────────────────────────────────────

const sessions  = new SessionManager();
const memory    = new MemoryManager(sessions);
const planner   = new Planner();
const executor  = new Executor(toolRegistry);
const keacore   = new KeaCoreRuntime(sessions, planner, executor, memory);

export const runtime = { sessions, memory, planner, executor, keacore };
