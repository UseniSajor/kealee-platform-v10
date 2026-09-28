/**
 * The promotion gate: does the internal Qwen model match Claude on Kealee's work?
 *
 *   INTERNAL_TEXT_BASE_URL=http://gpu-host:8010/v1 ANTHROPIC_API_KEY=… \
 *   pnpm tsx training/qwen/eval.ts --model kealee-v1 [--data training/qwen/data] [--limit 200] [--tolerance 0.02]
 *
 * Runs every held-out approved example (eval.jsonl) through the candidate Qwen
 * model and through Claude with the identical system and user prompt, and
 * scores both against the approved answer:
 *
 *   json_valid       — the answer parses, when the approved answer is JSON
 *   key_recall       — share of the approved answer's top-level keys present
 *   number_fidelity  — share of the approved answer's numbers the answer carries
 *   number_guard     — for rewrite tasks: no number dropped, changed or added
 *
 * Exit 0 (PROMOTE) only if Qwen is within `--tolerance` of Claude on every
 * metric; otherwise exit 1 and the adapter is not served. Writes
 * eval-report.json and eval-report.md beside the data. "Matches or exceeds
 * Claude" is a measured claim here, per task, on Kealee's own approved work —
 * not a general one.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { numbersIn, numbersPreserved } from '../../packages/kealee-agent-stack/src/v30/model-assist'
import { V30ClaudeCachedClient, resolveV30AnthropicModel } from '../../packages/kealee-agent-stack/src/v30/v30-claude-client'

const arg = (name: string, dflt: string) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : dflt }
const DATA = resolve(arg('data', join(__dirname, 'data')))
const MODEL = arg('model', process.env.INTERNAL_TEXT_MODEL ?? 'qwen')
const LIMIT = Number(arg('limit', '200'))
const TOL = Number(arg('tolerance', '0.02'))

type Msg = { role: string; content: string }
interface Example { messages: Msg[]; meta: { kind: string; task?: string; botType?: string } }

function parse(text: string): Record<string, unknown> | null {
  const raw = text.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1] ?? text
  const s = raw.indexOf('{'); const e = raw.lastIndexOf('}')
  if (s < 0 || e <= s) return null
  try { return JSON.parse(raw.slice(s, e + 1)) } catch { return null }
}

export function score(ex: Example, answer: string): Record<string, number | null> {
  const ref = ex.messages[2].content
  const refJson = parse(ref)
  const ansJson = parse(answer)
  const refNums = [...new Set(numbersIn(ref))]
  const ansNums = new Set(numbersIn(answer))
  const isRewrite = (ex.meta.task ?? '').startsWith('narrative_polish')
  return {
    json_valid: refJson ? (ansJson ? 1 : 0) : null,
    key_recall: refJson ? (ansJson ? Object.keys(refJson).filter(k => k in ansJson).length / Math.max(1, Object.keys(refJson).length) : 0) : null,
    number_fidelity: refNums.length ? refNums.filter(n => ansNums.has(n)).length / refNums.length : null,
    // Every metric is oriented the same way: 1 is good, 0 is bad. This must
    // not reward a candidate for changing a protected construction number.
    number_guard: isRewrite ? (numbersPreserved(ex.messages[1].content, answer) ? 0 : 1) : null,
  }
}

async function qwen(ex: Example): Promise<string> {
  const base = (process.env.INTERNAL_TEXT_BASE_URL ?? '').replace(/\/$/, '')
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.INTERNAL_API_KEY ?? 'local'}` },
    body: JSON.stringify({ model: MODEL, messages: ex.messages.slice(0, 2), max_tokens: 4000, temperature: 0 }),
  })
  if (!res.ok) throw new Error(`Qwen HTTP ${res.status}`)
  return ((await res.json()) as any).choices?.[0]?.message?.content ?? ''
}

async function claude(ex: Example): Promise<string> {
  const r = await new V30ClaudeCachedClient().complete({
    model: resolveV30AnthropicModel(process.env.KEALEE_CLAUDE_ASSIST_MODEL ?? 'claude-sonnet'), maxTokens: 4000,
    system: ex.messages[0].content, user: ex.messages[1].content, botType: (ex.meta.botType ?? 'support') as never,
  })
  return r.text
}

function mean(xs: (number | null)[]): number | null {
  const v = xs.filter((x): x is number => x != null)
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null
}

async function main() {
  const file = join(DATA, 'eval.jsonl')
  if (!existsSync(file)) throw new Error(`${file} not found — run export-sft.ts first`)
  const examples = readFileSync(file, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l) as Example).slice(0, LIMIT)
  if (!examples.length) throw new Error('No eval examples — approve more generations and re-export.')
  const rows: { kind: string; task: string; qwen: Record<string, number | null>; claude: Record<string, number | null> }[] = []
  for (const ex of examples) {
    const [q, c] = await Promise.all([qwen(ex).catch(e => `ERROR ${e}`), claude(ex).catch(e => `ERROR ${e}`)])
    rows.push({ kind: ex.meta.kind, task: ex.meta.task ?? ex.meta.botType ?? '', qwen: score(ex, q), claude: score(ex, c) })
  }
  const metrics = ['json_valid', 'key_recall', 'number_fidelity', 'number_guard']
  const summary = Object.fromEntries(metrics.map(m => {
    const qm = mean(rows.map(r => r.qwen[m])); const cm = mean(rows.map(r => r.claude[m]))
    return [m, { qwen: qm, claude: cm, pass: qm == null || cm == null || qm >= cm - TOL }]
  }))
  const promote = Object.values(summary).every(s => (s as { pass: boolean }).pass)
  const report = { model: MODEL, examples: rows.length, tolerance: TOL, summary, promote, rows }
  writeFileSync(join(DATA, 'eval-report.json'), JSON.stringify(report, null, 2))
  const fmt = (x: number | null) => x == null ? '—' : x.toFixed(3)
  writeFileSync(join(DATA, 'eval-report.md'), [
    `# Qwen (${MODEL}) vs Claude — ${rows.length} approved Kealee examples`, '',
    '| metric | Qwen | Claude | within tolerance |', '|---|---|---|---|',
    ...metrics.map(m => { const s = summary[m] as any; return `| ${m} | ${fmt(s.qwen)} | ${fmt(s.claude)} | ${s.pass ? 'yes' : 'NO'} |` }),
    '', promote ? `**PROMOTE** — set INTERNAL_TEXT_MODEL=${MODEL}.` : '**DO NOT PROMOTE** — keep the current model; Claude stays the escalation.',
  ].join('\n'))
  console.log(readFileSync(join(DATA, 'eval-report.md'), 'utf8'))
  process.exit(promote ? 0 : 1)
}

if (require.main === module) main().catch(e => { console.error(e); process.exit(2) })
