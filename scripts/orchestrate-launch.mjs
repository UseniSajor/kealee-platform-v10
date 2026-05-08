/**
 * scripts/orchestrate-launch.mjs
 *
 * Pre-launch orchestration (no tsx / no build step):
 *   1) Preflight — GET API /health
 *   2) go-live-check — `pnpm run go-live-check` (still uses tsx internally when deps are healthy)
 *   3) Integration smoke — `bash scripts/test-integrations.sh`, or minimal /health if bash missing
 *   4) Optional — `pnpm run setup:marketing` when `--with-marketing-prep` or ORCHESTRATE_WITH_MARKETING_PREP
 *
 * Usage: pnpm run orchestrate:launch
 * Flags: --skip-preflight | --skip-go-live-check | --skip-smoke | --with-marketing-prep
 *
 * Env: API_URL, NEXT_PUBLIC_APP_URL, AUTH_TOKEN (optional for smoke subtests)
 *      ORCHESTRATE_WITH_MARKETING_PREP=1|true — same as --with-marketing-prep (for CI)
 */

import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..')
const REPORT_DIR = join(REPO_ROOT, 'reports', 'orchestration')

const API_URL = (process.env.API_URL || 'http://localhost:3001').replace(/\/$/, '')

/** @typedef {'passed' | 'failed' | 'skipped'} PhaseStatus */

/**
 * @typedef {object} PhaseRecord
 * @property {string} id
 * @property {string} command
 * @property {PhaseStatus} status
 * @property {number | null} exitCode
 * @property {number} durationMs
 * @property {string} [notes]
 */

function truthyEnv(v) {
  const s = (v || '').toLowerCase()
  return s === '1' || s === 'true' || s === 'yes'
}

function parseArgs(argv) {
  return {
    skipPreflight: argv.includes('--skip-preflight'),
    skipGoLive: argv.includes('--skip-go-live-check'),
    skipSmoke: argv.includes('--skip-smoke'),
    withMarketingPrep:
      argv.includes('--with-marketing-prep') ||
      truthyEnv(process.env.ORCHESTRATE_WITH_MARKETING_PREP),
  }
}

function hasBash() {
  const r = spawnSync('bash', ['--version'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    shell: false,
  })
  return r.status === 0
}

function runPnpmScript(script) {
  return spawnSync('pnpm', ['run', script], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  })
}

function runBashSmoke() {
  return spawnSync('bash', ['scripts/test-integrations.sh'], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    shell: false,
    env: { ...process.env, API_URL: process.env.API_URL || API_URL },
  })
}

/** @returns {Promise<PhaseRecord>} */
async function preflightHealth() {
  const started = Date.now()
  const command = `GET ${API_URL}/health`
  try {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 10_000)
    const res = await fetch(`${API_URL}/health`, { signal: controller.signal })
    clearTimeout(t)
    const ok = res.ok
    return {
      id: 'preflight-api-health',
      command,
      status: ok ? 'passed' : 'failed',
      exitCode: ok ? 0 : res.status,
      durationMs: Date.now() - started,
      notes: ok ? undefined : `HTTP ${res.status}`,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return {
      id: 'preflight-api-health',
      command,
      status: 'failed',
      exitCode: 1,
      durationMs: Date.now() - started,
      notes: msg,
    }
  }
}

/** @returns {Promise<PhaseRecord>} */
async function minimalNodeSmoke() {
  const started = Date.now()
  const command = `minimal-node-smoke(${API_URL}/health)`
  try {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 15_000)
    const res = await fetch(`${API_URL}/health`, { signal: controller.signal })
    clearTimeout(t)
    const ok = res.status === 200
    return {
      id: 'smoke-integration-minimal',
      command,
      status: ok ? 'passed' : 'failed',
      exitCode: ok ? 0 : res.status,
      durationMs: Date.now() - started,
      notes: ok
        ? 'bash unavailable or skipped; only /health verified'
        : `expected 200, got ${res.status}`,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return {
      id: 'smoke-integration-minimal',
      command,
      status: 'failed',
      exitCode: 1,
      durationMs: Date.now() - started,
      notes: msg,
    }
  }
}

/**
 * @param {string} id
 * @param {string} command
 * @param {import('node:child_process').SpawnSyncReturns<Buffer>} r
 * @param {number} started
 * @param {string} [notes]
 * @returns {PhaseRecord}
 */
function recordFromSpawn(id, command, r, started, notes) {
  const code = r.status === null ? 1 : r.status
  return {
    id,
    command,
    status: code === 0 ? 'passed' : 'failed',
    exitCode: code,
    durationMs: Date.now() - started,
    notes,
  }
}

/**
 * @param {string} startedAt
 * @param {PhaseRecord[]} phases
 * @param {number} finalExit
 * @param {string[]} [extraNotes]
 */
function writeReport(startedAt, phases, finalExit, extraNotes = []) {
  const payload = {
    startedAt,
    finishedAt: new Date().toISOString(),
    apiUrl: API_URL,
    finalExitCode: finalExit,
    phases,
    notes: [
      'Full bash launch chain: pnpm run launch:all (Git Bash / WSL).',
      'SESSION 12 smoke and production deploy gates remain manual policy per workspace rules.',
      ...extraNotes,
    ],
  }

  const jsonPath = join(REPORT_DIR, 'latest.json')
  writeFileSync(jsonPath, JSON.stringify(payload, null, 2), 'utf8')
  console.log(`Report written: ${jsonPath}\n`)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  /** @type {PhaseRecord[]} */
  const phases = []
  const startedAt = new Date().toISOString()

  console.log('\n' + '='.repeat(72))
  console.log('  KEALEE — ORCHESTRATE LAUNCH')
  console.log('='.repeat(72))
  console.log(`  Repo:     ${REPO_ROOT}`)
  console.log(`  API_URL:  ${API_URL}`)
  console.log(`  Web:      ${process.env.NEXT_PUBLIC_APP_URL || '(default from go-live-check)'}`)
  console.log('='.repeat(72) + '\n')

  mkdirSync(REPORT_DIR, { recursive: true })

  if (!args.skipPreflight) {
    console.log('▶ Phase: preflight (API /health)\n')
    const p = await preflightHealth()
    phases.push(p)
    if (p.status === 'failed') {
      console.error('\n❌ Preflight failed — fix API reachability before continuing.\n')
      writeReport(startedAt, phases, 1)
      process.exit(1)
    }
  } else {
    phases.push({
      id: 'preflight-api-health',
      command: '(skipped)',
      status: 'skipped',
      exitCode: null,
      durationMs: 0,
    })
  }

  if (!args.skipGoLive) {
    console.log('▶ Phase: go-live-check (pnpm run go-live-check)\n')
    const t0 = Date.now()
    const r = runPnpmScript('go-live-check')
    phases.push(recordFromSpawn('go-live-check', 'pnpm run go-live-check', r, t0))
    if (r.status !== 0) {
      console.error('\n❌ go-live-check failed.\n')
      writeReport(startedAt, phases, 1)
      process.exit(1)
    }
  } else {
    phases.push({
      id: 'go-live-check',
      command: '(skipped)',
      status: 'skipped',
      exitCode: null,
      durationMs: 0,
    })
  }

  if (!args.skipSmoke) {
    if (hasBash()) {
      console.log('▶ Phase: integration smoke (bash scripts/test-integrations.sh)\n')
      const t0 = Date.now()
      const r = runBashSmoke()
      const note = process.env.AUTH_TOKEN
        ? undefined
        : 'AUTH_TOKEN unset — some subtests may skip'
      phases.push(
        recordFromSpawn('smoke-integration-bash', 'bash scripts/test-integrations.sh', r, t0, note),
      )
      if (r.status !== 0) {
        console.error('\n❌ Integration smoke failed.\n')
        writeReport(startedAt, phases, 1)
        process.exit(1)
      }
    } else {
      console.warn('⚠ bash not found — running minimal Node smoke (/health only).\n')
      const p = await minimalNodeSmoke()
      phases.push(p)
      if (p.status === 'failed') {
        console.error('\n❌ Minimal smoke failed.\n')
        writeReport(startedAt, phases, 1)
        process.exit(1)
      }
    }
  } else {
    phases.push({
      id: 'smoke-integration',
      command: '(skipped)',
      status: 'skipped',
      exitCode: null,
      durationMs: 0,
    })
  }

  /** @type {string[]} */
  const reportExtras = []

  if (args.withMarketingPrep) {
    console.log('▶ Phase: marketing prep (pnpm run setup:marketing)\n')
    if (hasBash()) {
      const t0 = Date.now()
      const r = runPnpmScript('setup:marketing')
      phases.push(recordFromSpawn('setup-marketing', 'pnpm run setup:marketing', r, t0))
      if (r.status !== 0) {
        console.error('\n❌ setup:marketing failed.\n')
        writeReport(startedAt, phases, 1, reportExtras)
        process.exit(1)
      }
    } else {
      phases.push({
        id: 'setup-marketing',
        command: 'pnpm run setup:marketing',
        status: 'skipped',
        exitCode: null,
        durationMs: 0,
        notes: 'bash not on PATH — run pnpm run setup:marketing from Git Bash/WSL',
      })
      reportExtras.push('setup:marketing skipped (no bash); checklist files not regenerated.')
      console.warn('⚠ setup:marketing skipped — bash not found.\n')
    }
  }

  console.log('\n' + '='.repeat(72))
  console.log('  ORCHESTRATION COMPLETE — all executed phases passed')
  console.log('='.repeat(72) + '\n')

  writeReport(startedAt, phases, 0, reportExtras)
  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
