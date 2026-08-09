import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireMarketingAdmin } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

const SourceSchema = z.object({
  name: z.string().min(2),
  sourceType: z.enum(['federal_api', 'state_api', 'local_api', 'arcgis', 'csv', 'document']),
  baseUrl: z.string().url(),
  parserKey: z.enum(['json_api', 'arcgis_featureserver', 'csv_http']),
  jurisdictionScope: z.string().optional(),
  scheduleCron: z.string().optional(),
  metadata: z.object({
    targetTable: z.string(),
    recordsPath: z.string().optional(),
    fieldMap: z.record(z.string(), z.string()),
    staticFields: z.record(z.string(), z.unknown()).optional(),
    uniqueBy: z.string(),
    headers: z.record(z.string(), z.string()).optional(),
    query: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  }),
  enabled: z.boolean().default(true),
})

export async function GET() {
  if (!await requireMarketingAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await getSupabaseAdmin()
    .from('marketing_os_sources')
    .select('id, name, source_type, base_url, parser_key, schedule_cron, enabled, last_run_at, next_run_at, consecutive_failures, metadata')
    .order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sources: data ?? [] })
}

export async function POST(request: NextRequest) {
  const auth = await requireMarketingAdmin()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = SourceSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const { data, error } = await getSupabaseAdmin().from('marketing_os_sources').insert({
    name: parsed.data.name,
    source_type: parsed.data.sourceType,
    base_url: parsed.data.baseUrl,
    parser_key: parsed.data.parserKey,
    jurisdiction_scope: parsed.data.jurisdictionScope,
    schedule_cron: parsed.data.scheduleCron,
    metadata: parsed.data.metadata,
    enabled: parsed.data.enabled,
  }).select('id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 409 })
  return NextResponse.json(data, { status: 201 })
}
