/**
 * services/ai-orchestrator/src/agents/bot-adapter.ts
 *
 * Bridge between LangGraph subgraphs and KeaBots.
 *
 * Architecture:
 * - LangGraph handles: routing, state, decisions, sequencing
 * - KeaBots handle: domain-specific LLM execution and tool use
 * - This adapter is the only place either system touches the other
 *
 * Usage from a subgraph node:
 *   const result = await runKeaBotNode('keabot-design', state, 'Generate a concept for kitchen remodel')
 *
 * The bot is loaded lazily and cached for the process lifetime.
 */

import type { KealeeState } from "../state/kealee-state.js";

// ─── Bot instance cache ───────────────────────────────────────────────────────

const _botCache = new Map<string, any>();

async function loadBot(botName: string): Promise<any> {
  if (_botCache.has(botName)) return _botCache.get(botName);

  try {
    // Dynamic import — paths are relative from node_modules root in monorepo
    const modulePath = `../../../../bots/${botName}/src/bot.js`;
    const mod = await import(modulePath);
    const BotClass = Object.values(mod).find((v): v is new () => any => typeof v === "function");
    if (!BotClass) throw new Error(`No bot class found in ${modulePath}`);

    const instance = new BotClass();
    await instance.initialize();
    _botCache.set(botName, instance);
    console.log(`[bot-adapter] Loaded ${botName}`);
    return instance;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[bot-adapter] Failed to load ${botName}: ${msg}`);
    return null;
  }
}

// ─── Domain → KeaBot mapping ──────────────────────────────────────────────────
//
// Maps LangGraph subgraph domains to the canonical KeaBot for that domain.
// LangGraph subgraphs use this to delegate LLM execution to the right specialist.

export const SUBGRAPH_BOT_MAP: Record<string, string> = {
  sales_intake:     "keabot-owner",
  land_feasibility: "keabot-land",
  delivery_design:  "keabot-design",
  delivery_permit:  "keabot-permit",
  delivery_estimate:"keabot-estimate",
  marketplace:      "keabot-contractor-match",
  construction:     "keabot-construction",
  construction_pm:  "keabot-project-monitor",
  construction_pay: "keabot-payments",
  support:          "keabot-support",
  growth:           "keabot-marketing",
  developer:        "keabot-developer",
  developer_fin:    "keabot-finance",
  developer_feas:   "keabot-feasibility",
};

// ─── Main adapter function ────────────────────────────────────────────────────

export interface BotNodeResult {
  success: boolean;
  output: string;
  data: Record<string, unknown>;
  botName: string;
  latencyMs: number;
  error?: string;
}

/**
 * Run a KeaBot from a LangGraph subgraph node.
 *
 * @param botName   - The keabot-* package name (e.g. "keabot-design")
 * @param message   - The instruction or query to send the bot
 * @param context   - Current KealeeState fields relevant to this bot's domain
 * @param timeoutMs - Max execution time (default 30s)
 */
export async function runKeaBotNode(
  botName: string,
  message: string,
  context: Partial<KealeeState>,
  timeoutMs = 30_000,
): Promise<BotNodeResult> {
  const startTime = Date.now();

  let bot: any;
  try {
    bot = await loadBot(botName);
  } catch (err) {
    return {
      success: false,
      output: "",
      data: {},
      botName,
      latencyMs: Date.now() - startTime,
      error: `Bot load failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  if (!bot) {
    return {
      success: false,
      output: "",
      data: {},
      botName,
      latencyMs: Date.now() - startTime,
      error: `Bot ${botName} unavailable`,
    };
  }

  try {
    const rawOutput = await Promise.race<string>([
      bot.handleMessage(message, context as Record<string, unknown>),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Bot ${botName} timed out after ${timeoutMs}ms`)), timeoutMs),
      ),
    ]);

    const data = tryParseJson(rawOutput);

    return {
      success: true,
      output: rawOutput,
      data,
      botName,
      latencyMs: Date.now() - startTime,
    };
  } catch (err) {
    return {
      success: false,
      output: "",
      data: {},
      botName,
      latencyMs: Date.now() - startTime,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── Subgraph-aware helper ────────────────────────────────────────────────────

/**
 * Run the canonical KeaBot for a given subgraph domain.
 * Subgraph nodes call this rather than hard-coding bot names.
 */
export async function runSubgraphBot(
  domain: keyof typeof SUBGRAPH_BOT_MAP,
  message: string,
  state: Partial<KealeeState>,
): Promise<BotNodeResult> {
  const botName = SUBGRAPH_BOT_MAP[domain];
  if (!botName) {
    return {
      success: false,
      output: "",
      data: {},
      botName: domain,
      latencyMs: 0,
      error: `No KeaBot mapped to domain: ${domain}`,
    };
  }
  return runKeaBotNode(botName, message, state);
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function tryParseJson(raw: string): Record<string, unknown> {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch {}
  return { message: raw };
}
