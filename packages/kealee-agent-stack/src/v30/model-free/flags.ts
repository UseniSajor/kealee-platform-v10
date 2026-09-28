/** True when the operator has asked for no model at all (KEALEE_MODEL_FREE=true). */
export function modelFreeForced(): boolean {
  return process.env.KEALEE_MODEL_FREE === 'true'
}

/**
 * How a paid bot is produced:
 *   engine-first (default) — Kealee's engines compute it; Qwen / Claude only
 *                            polish its prose and fill what the engines cannot.
 *   model-first            — the original behaviour: the bot's own model prompt,
 *                            with the engines as the fallback.
 */
export function botMode(): 'engine-first' | 'model-first' {
  return process.env.KEALEE_BOT_MODE === 'model-first' ? 'model-first' : 'engine-first'
}
