import type { NormalizedIntake } from "./normalize-intake";
import type { LeadScore } from "./score-lead";

export interface SaveIntakeOptions {
  apiBase?: string;
  source?: string;
}

export interface SaveIntakeResult {
  ok: boolean;
  intakeId?: string;
  error?: string;
}

export async function saveIntake(
  intake: NormalizedIntake,
  score: LeadScore,
  options: SaveIntakeOptions = {},
): Promise<SaveIntakeResult> {
  const base = options.apiBase ?? (typeof window !== "undefined" ? "" : "http://localhost:3001");
  const url = `${base}/api/intake/submit`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intake, score, source: options.source ?? "public_intake" }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
    }

    const data = (await res.json()) as { intakeId?: string };
    return { ok: true, intakeId: data.intakeId };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
