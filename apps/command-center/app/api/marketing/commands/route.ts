/**
 * GET  /api/marketing/commands        — list all available commands + their schemas
 * POST /api/marketing/commands        — execute a command by ID with params
 *
 * POST body:
 * {
 *   command: string          // command ID, e.g. "full-funnel"
 *   params:  Record<string, unknown>  // command inputs
 * }
 *
 * This endpoint is consumed by:
 *   - The Command Center marketing UI (Commands tab)
 *   - The CLI runner (scripts/marketing.mjs)
 *   - External automation agents
 */

import { NextRequest, NextResponse } from 'next/server'
import { COMMAND_REGISTRY, executeCommand } from '../../../../lib/marketing-commands'

export const runtime = 'nodejs'

// ── GET — list commands ───────────────────────────────────────────────────────

export async function GET() {
  return NextResponse.json({
    version:  '1.0',
    commands: COMMAND_REGISTRY.map(cmd => ({
      id:          cmd.id,
      name:        cmd.name,
      description: cmd.description,
      category:    cmd.category,
      tags:        cmd.tags,
      inputs:      cmd.inputs,
      steps:       cmd.steps,
      chain:       cmd.chain ?? null,
      isPipeline:  !!(cmd.chain && cmd.chain.length > 0),
    })),
    categories: {
      content:   'Single-step content generation commands',
      leads:     'Individual lead qualification, pitching, and capture commands',
      campaigns: 'Multi-step pipeline commands that chain bots together',
      analytics: 'Cost estimation and project analysis',
    },
    usage: {
      list:    'GET  /api/marketing/commands',
      execute: 'POST /api/marketing/commands  { "command": "full-funnel", "params": { ... } }',
    },
  })
}

// ── POST — execute command ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: { command?: string; params?: Record<string, unknown> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { command: commandId, params = {} } = body

  if (!commandId) {
    return NextResponse.json(
      { error: 'Missing required field: command', availableCommands: COMMAND_REGISTRY.map(c => c.id) },
      { status: 400 },
    )
  }

  // Build base URL for internal API calls (bots live in this same app)
  const host    = req.headers.get('host') ?? 'localhost:3001'
  const proto   = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const baseUrl = process.env.COMMAND_CENTER_URL ?? `${proto}://${host}`

  const result = await executeCommand(commandId, params, baseUrl)

  const httpStatus = result.status === 'error' ? 422 : 200

  return NextResponse.json(result, { status: httpStatus })
}
