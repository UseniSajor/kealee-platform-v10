#!/usr/bin/env node
/**
 * Kealee Marketing Automation CLI
 *
 * Usage:
 *   node scripts/marketing.mjs <command> [--param value ...] [options]
 *
 * Commands:
 *   list                          List all available commands and their schemas
 *   run <commandId> [params]      Run a command by ID
 *   help <commandId>              Show full schema for a command
 *
 * Examples:
 *   node scripts/marketing.mjs list
 *   node scripts/marketing.mjs help full-funnel
 *
 *   node scripts/marketing.mjs run generate-content \
 *     --service kitchen_remodel \
 *     --audience homeowners \
 *     --tone friendly
 *
 *   node scripts/marketing.mjs run qualify-lead \
 *     --message "I want to redo my kitchen, budget is $60k, Austin TX"
 *
 *   node scripts/marketing.mjs run full-funnel \
 *     --message "Looking for bathroom remodel, $40k budget" \
 *     --email prospect@example.com \
 *     --name "Jane Smith"
 *
 *   node scripts/marketing.mjs run capture-lead \
 *     --email prospect@example.com \
 *     --service kitchen_remodel \
 *     --source instagram_dm \
 *     --tier 2
 *
 * Options:
 *   --api-url <url>   Override Command Center base URL
 *                     Default: COMMAND_CENTER_URL env var or http://localhost:3001
 *   --json            Output raw JSON instead of formatted output
 *   --no-color        Disable color output
 */

import { parseArgs } from 'node:util'

// ── Config ────────────────────────────────────────────────────────────────────

const DEFAULT_API_URL = process.env.COMMAND_CENTER_URL ?? 'http://localhost:3001'

// ── Colors ────────────────────────────────────────────────────────────────────

const USE_COLOR = !process.argv.includes('--no-color') && process.stdout.isTTY

const c = {
  reset:  USE_COLOR ? '\x1b[0m'  : '',
  bold:   USE_COLOR ? '\x1b[1m'  : '',
  dim:    USE_COLOR ? '\x1b[2m'  : '',
  teal:   USE_COLOR ? '\x1b[36m' : '',
  green:  USE_COLOR ? '\x1b[32m' : '',
  yellow: USE_COLOR ? '\x1b[33m' : '',
  red:    USE_COLOR ? '\x1b[31m' : '',
  orange: USE_COLOR ? '\x1b[33m' : '',
  white:  USE_COLOR ? '\x1b[97m' : '',
  gray:   USE_COLOR ? '\x1b[90m' : '',
}

function t(color, text) { return `${color}${text}${c.reset}` }

// ── Helpers ───────────────────────────────────────────────────────────────────

function printLogo() {
  console.log(`\n${t(c.teal + c.bold, 'KEALEE')} ${t(c.gray, 'Marketing CLI')} ${t(c.gray, 'v1.0')}\n`)
}

function printError(msg) {
  console.error(`${t(c.red + c.bold, '✗ Error:')} ${msg}\n`)
}

function printSuccess(msg) {
  console.log(`${t(c.green, '✓')} ${msg}`)
}

function hr() {
  console.log(t(c.gray, '─'.repeat(60)))
}

function printUsage() {
  printLogo()
  console.log(`${t(c.bold, 'Usage:')}
  ${t(c.teal, 'node scripts/marketing.mjs')} ${t(c.white, '<command>')} ${t(c.gray, '[options]')}

${t(c.bold, 'Commands:')}
  ${t(c.teal, 'list')}                     List all available automation commands
  ${t(c.teal, 'run')} ${t(c.white, '<commandId>')} ${t(c.gray, '[params]')}  Run an automation command
  ${t(c.teal, 'help')} ${t(c.white, '<commandId>')}          Show full schema for a command

${t(c.bold, 'Options:')}
  ${t(c.teal, '--api-url')} ${t(c.white, '<url>')}          Command Center base URL (default: http://localhost:3001)
  ${t(c.teal, '--json')}                   Output raw JSON
  ${t(c.teal, '--no-color')}               Disable color output

${t(c.bold, 'Quick start:')}
  ${t(c.gray, '# List all commands')}
  node scripts/marketing.mjs list

  ${t(c.gray, '# Run the full funnel pipeline')}
  node scripts/marketing.mjs run full-funnel \\
    --message "I want to remodel my kitchen" \\
    --email user@example.com

  ${t(c.gray, '# Generate multi-platform marketing content')}
  node scripts/marketing.mjs run generate-content \\
    --service kitchen_remodel \\
    --audience homeowners
`)
}

// ── Parse CLI args into a params object ──────────────────────────────────────

function parseParams(args) {
  const params = {}
  let   i      = 0
  while (i < args.length) {
    const arg = args[i]
    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const val = args[i + 1]
      if (val && !val.startsWith('--')) {
        params[key] = val
        i += 2
      } else {
        params[key] = true
        i += 1
      }
    } else {
      i += 1
    }
  }
  return params
}

// ── API calls ─────────────────────────────────────────────────────────────────

async function fetchCommands(apiUrl) {
  const res = await fetch(`${apiUrl}/api/marketing/commands`)
  if (!res.ok) throw new Error(`API returned ${res.status}: ${await res.text()}`)
  return res.json()
}

async function runCommand(apiUrl, commandId, params) {
  const res = await fetch(`${apiUrl}/api/marketing/commands`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ command: commandId, params }),
  })
  const json = await res.json()
  if (!res.ok && res.status !== 422) throw new Error(json.error ?? `HTTP ${res.status}`)
  return json
}

// ── Output formatters ─────────────────────────────────────────────────────────

const CATEGORY_LABELS = {
  content:   'Content Generation',
  leads:     'Lead Management',
  campaigns: 'Campaign Pipelines',
  analytics: 'Analytics & Estimates',
}

function printCommandList(commands) {
  const byCategory = {}
  for (const cmd of commands) {
    if (!byCategory[cmd.category]) byCategory[cmd.category] = []
    byCategory[cmd.category].push(cmd)
  }

  for (const [cat, cmds] of Object.entries(byCategory)) {
    console.log(`\n${t(c.bold, CATEGORY_LABELS[cat] ?? cat.toUpperCase())}`)
    hr()
    for (const cmd of cmds) {
      const pipeline = cmd.isPipeline ? t(c.orange, ' [PIPELINE]') : ''
      console.log(`  ${t(c.teal + c.bold, cmd.id)}${pipeline}`)
      console.log(`  ${t(c.gray, cmd.description)}`)
      const required = Object.entries(cmd.inputs)
        .filter(([, f]) => f.required)
        .map(([k]) => t(c.white, `--${k}`))
        .join(' ')
      if (required) console.log(`  ${t(c.gray, 'Required:')} ${required}`)
      if (cmd.chain?.length) {
        console.log(`  ${t(c.gray, 'Steps:')} ${cmd.chain.map(s => t(c.teal, s)).join(t(c.gray, ' → '))}`)
      }
      console.log()
    }
  }
}

function printCommandHelp(cmd) {
  console.log(`\n${t(c.bold + c.white, cmd.name)}`)
  if (cmd.isPipeline) console.log(t(c.orange, 'PIPELINE COMMAND'))
  console.log(t(c.gray, cmd.description))
  console.log()

  if (cmd.chain?.length) {
    console.log(`${t(c.bold, 'Execution chain:')}`)
    cmd.chain.forEach((s, i) => console.log(`  ${t(c.gray, `${i + 1}.`)} ${t(c.teal, s)}`))
    console.log()
  }

  console.log(`${t(c.bold, 'Steps:')}`)
  cmd.steps.forEach((s, i) => console.log(`  ${t(c.gray, `${i + 1}.`)} ${s}`))
  console.log()

  console.log(`${t(c.bold, 'Parameters:')}`)
  for (const [key, field] of Object.entries(cmd.inputs)) {
    const req = field.required ? t(c.red, '*required') : t(c.gray, 'optional')
    console.log(`  ${t(c.teal, `--${key}`)} ${t(c.gray, `<${field.type}>`)}  ${req}`)
    console.log(`    ${t(c.gray, field.description ?? field.label)}`)
    if (field.options) {
      console.log(`    ${t(c.gray, 'Options:')} ${field.options.map(o => t(c.white, o)).join(t(c.gray, ', '))}`)
    }
    if (field.default != null) {
      console.log(`    ${t(c.gray, 'Default:')} ${t(c.white, String(field.default))}`)
    }
    console.log()
  }

  console.log(`${t(c.bold, 'Example:')}`)
  const exArgs = Object.entries(cmd.inputs)
    .filter(([, f]) => f.required)
    .map(([k, f]) => `  ${t(c.gray, `--${k}`)} ${t(c.white, f.placeholder ?? f.options?.[0] ?? `<${k}>`)}`)
    .join(' \\\n')
  console.log(`  ${t(c.teal, 'node scripts/marketing.mjs run')} ${t(c.white, cmd.id)} \\\n${exArgs}`)
}

function printResult(result) {
  const statusColor = result.status === 'success' ? c.green
    : result.status === 'partial' ? c.yellow : c.red

  console.log(`\n${t(c.bold, 'Result')}  ${t(statusColor + c.bold, result.status.toUpperCase())}  ${t(c.gray, `${result.durationMs}ms`)}`)
  hr()

  if (result.steps.length > 1) {
    // Pipeline — show each step
    for (const [i, step] of result.steps.entries()) {
      const stepStatus = step.status === 'success' ? t(c.green, '✓') : t(c.red, '✗')
      console.log(`\n  ${stepStatus} ${t(c.bold, `Step ${i + 1}: ${step.command ?? step.step}`)}  ${t(c.gray, `${step.durationMs}ms`)}`)
      if (step.error) {
        console.log(`    ${t(c.red, step.error)}`)
      } else {
        const preview = JSON.stringify(step.output, null, 2)
          .split('\n').slice(0, 15).join('\n')
          .replace(/^/gm, '    ')
        console.log(t(c.gray, preview))
        if (Object.keys(step.output).length > 8) {
          console.log(t(c.gray, '    ... (use --json for full output)'))
        }
      }
    }
  } else {
    // Single command
    const out = JSON.stringify(result.output, null, 2)
    const lines = out.split('\n')
    const preview = lines.slice(0, 40).join('\n')
    console.log(t(c.gray, preview.replace(/^/gm, '  ')))
    if (lines.length > 40) {
      console.log(t(c.gray, `  ... ${lines.length - 40} more lines (use --json for full output)`))
    }
  }
  console.log()
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const argv = process.argv.slice(2)

  if (argv.length === 0 || argv[0] === '--help' || argv[0] === '-h') {
    printUsage()
    process.exit(0)
  }

  const subCommand = argv[0]
  const rest       = argv.slice(1)
  const parsed     = parseParams(rest)

  const apiUrl   = parsed['api-url'] ?? DEFAULT_API_URL
  const jsonMode = 'json' in parsed

  if (!jsonMode) printLogo()

  // ── list ──────────────────────────────────────────────────────────────────
  if (subCommand === 'list') {
    try {
      const { commands } = await fetchCommands(apiUrl)
      if (jsonMode) {
        console.log(JSON.stringify(commands, null, 2))
      } else {
        printCommandList(commands)
        console.log(t(c.gray, `${commands.length} commands available  ·  API: ${apiUrl}\n`))
      }
    } catch (e) {
      printError(`Could not fetch commands: ${e.message}`)
      console.log(t(c.gray, `Make sure the Command Center is running at ${apiUrl}\n`))
      process.exit(1)
    }
    return
  }

  // ── help <commandId> ──────────────────────────────────────────────────────
  if (subCommand === 'help') {
    const commandId = rest[0]
    if (!commandId) { printError('Usage: help <commandId>'); process.exit(1) }
    try {
      const { commands } = await fetchCommands(apiUrl)
      const cmd = commands.find(c => c.id === commandId)
      if (!cmd) {
        printError(`Unknown command: ${commandId}`)
        console.log(`Available: ${commands.map(c => t(c.teal, c.id)).join(', ')}\n`)
        process.exit(1)
      }
      if (jsonMode) console.log(JSON.stringify(cmd, null, 2))
      else printCommandHelp(cmd)
    } catch (e) {
      printError(e.message)
      process.exit(1)
    }
    return
  }

  // ── run <commandId> [--param value ...] ───────────────────────────────────
  if (subCommand === 'run') {
    const commandId = rest[0]
    if (!commandId) {
      printError('Usage: run <commandId> [--param value ...]')
      process.exit(1)
    }

    // Remove meta options from params
    const params = parseParams(rest.slice(1))
    delete params['api-url']
    delete params['json']
    delete params['no-color']

    if (!jsonMode) {
      console.log(`${t(c.bold, 'Running')} ${t(c.teal, commandId)}  ${t(c.gray, `→ ${apiUrl}`)}\n`)
    }

    try {
      const result = await runCommand(apiUrl, commandId, params)
      if (jsonMode) {
        console.log(JSON.stringify(result, null, 2))
      } else {
        printResult(result)
      }
      process.exit(result.status === 'error' ? 1 : 0)
    } catch (e) {
      printError(e.message)
      process.exit(1)
    }
    return
  }

  printError(`Unknown command: ${subCommand}`)
  printUsage()
  process.exit(1)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
