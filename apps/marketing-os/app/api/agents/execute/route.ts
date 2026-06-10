import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireMarketingAdmin } from '@/lib/auth'
import { AGENT_KEYS } from '@/lib/domain'
import { executeAgent } from '@/lib/agents'
import { getSupabaseAdmin } from '@/lib/supabase'

const RequestSchema = z.object({
  agent: z.enum(AGENT_KEYS),
  workflowKey: z.string().min(2),
  input: z.record(z.string(), z.unknown()),
  model: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const auth = await requireMarketingAdmin()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = RequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const supabase = getSupabaseAdmin()
  const { data: agent, error: agentError } = await supabase
    .from('marketing_os_agents')
    .select('id')
    .eq('key', parsed.data.agent)
    .eq('enabled', true)
    .single()
  if (agentError || !agent) {
    return NextResponse.json({ error: `Agent ${parsed.data.agent} is not registered and enabled` }, { status: 409 })
  }

  const { data: run, error: runError } = await supabase
    .from('marketing_os_agent_runs')
    .insert({
      agent_id: agent.id,
      workflow_key: parsed.data.workflowKey,
      status: 'running',
      input: parsed.data.input,
      started_at: new Date().toISOString(),
      created_by: auth.user.id,
    })
    .select('id')
    .single()
  if (runError || !run) return NextResponse.json({ error: runError?.message }, { status: 500 })

  try {
    const execution = await executeAgent(parsed.data)
    await supabase.from('marketing_os_agent_runs').update({
      status: 'completed',
      output: execution.result,
      completed_at: new Date().toISOString(),
    }).eq('id', run.id)
    return NextResponse.json({ runId: run.id, ...execution })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await supabase.from('marketing_os_agent_runs').update({
      status: 'failed',
      error: message,
      completed_at: new Date().toISOString(),
    }).eq('id', run.id)
    return NextResponse.json({ runId: run.id, error: message }, { status: 502 })
  }
}
