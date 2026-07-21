import { createHash } from 'node:crypto'
import { parse } from 'csv-parse/sync'
import { z } from 'zod'
import { getSupabaseAdmin } from './supabase'

const ALLOWED_TARGET_TABLES = new Set([
  'marketing_os_states',
  'marketing_os_counties',
  'marketing_os_cities',
  'marketing_os_permit_offices',
  'marketing_os_planning_departments',
  'marketing_os_project_types',
  'marketing_os_construction_costs',
  'marketing_os_permit_fees',
  'marketing_os_zoning_data',
])

const SourceMetadataSchema = z.object({
  targetTable: z.string(),
  recordsPath: z.string().optional(),
  fieldMap: z.record(z.string(), z.string()).default({}),
  staticFields: z.record(z.string(), z.unknown()).default({}),
  uniqueBy: z.string().min(1),
  headers: z.record(z.string(), z.string()).default({}),
  query: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
})

interface SourceRecord {
  id: string
  name: string
  base_url: string | null
  parser_key: string
  metadata: unknown
}

function atPath(value: unknown, path?: string): unknown {
  if (!path) return value
  return path.split('.').reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object') return undefined
    return (current as Record<string, unknown>)[segment]
  }, value)
}

function mapRecord(
  source: Record<string, unknown>,
  fieldMap: Record<string, string>,
  staticFields: Record<string, unknown>,
) {
  const output: Record<string, unknown> = { ...staticFields }
  for (const [target, sourcePath] of Object.entries(fieldMap)) {
    output[target] = atPath(source, sourcePath)
  }
  return output
}

async function fetchSource(source: SourceRecord, metadata: z.infer<typeof SourceMetadataSchema>) {
  if (!source.base_url) throw new Error(`Source ${source.name} has no base_url`)
  const url = new URL(source.base_url)
  for (const [key, value] of Object.entries(metadata.query)) url.searchParams.set(key, String(value))
  const response = await fetch(url, {
    headers: metadata.headers,
    signal: AbortSignal.timeout(60_000),
  })
  if (!response.ok) throw new Error(`${source.name} returned HTTP ${response.status}`)
  const contentType = response.headers.get('content-type') ?? 'application/octet-stream'
  const raw = await response.text()
  let parsed: unknown
  if (source.parser_key === 'csv_http') {
    parsed = parse(raw, { columns: true, skip_empty_lines: true, relax_column_count: true })
  } else if (source.parser_key === 'json_api' || source.parser_key === 'arcgis_featureserver') {
    parsed = JSON.parse(raw)
    if (source.parser_key === 'arcgis_featureserver') {
      const features = atPath(parsed, metadata.recordsPath ?? 'features')
      parsed = Array.isArray(features)
        ? features.map((feature) => atPath(feature, 'attributes') ?? feature)
        : features
    }
  } else {
    throw new Error(`Unsupported parser_key: ${source.parser_key}`)
  }
  const records = atPath(parsed, source.parser_key === 'arcgis_featureserver' ? undefined : metadata.recordsPath)
  if (!Array.isArray(records)) throw new Error(`${source.name} recordsPath did not resolve to an array`)
  return { url: url.toString(), contentType, raw, records }
}

export async function ingestSourceById(sourceId: string) {
  const supabase = getSupabaseAdmin()
  const { data: source, error: sourceError } = await supabase
    .from('marketing_os_sources')
    .select('id, name, base_url, parser_key, metadata')
    .eq('id', sourceId)
    .eq('enabled', true)
    .single()
  if (sourceError || !source) throw new Error(sourceError?.message ?? `Source ${sourceId} not found`)

  const metadata = SourceMetadataSchema.parse(source.metadata)
  if (!ALLOWED_TARGET_TABLES.has(metadata.targetTable)) {
    throw new Error(`Target table is not allowed: ${metadata.targetTable}`)
  }

  const { data: run, error: runError } = await supabase
    .from('marketing_os_ingestion_runs')
    .insert({ source_id: source.id, status: 'running', started_at: new Date().toISOString() })
    .select('id')
    .single()
  if (runError || !run) throw new Error(runError?.message ?? 'Could not create ingestion run')

  try {
    const fetched = await fetchSource(source, metadata)
    const hash = createHash('sha256').update(fetched.raw).digest('hex')
    await supabase.from('marketing_os_source_documents').upsert({
      source_id: source.id,
      ingestion_run_id: run.id,
      canonical_url: fetched.url,
      content_hash: hash,
      mime_type: fetched.contentType,
      title: source.name,
      extracted_data: { recordCount: fetched.records.length },
      fetched_at: new Date().toISOString(),
    }, { onConflict: 'canonical_url,content_hash' })

    const normalized = fetched.records.map((record) =>
      mapRecord(record as Record<string, unknown>, metadata.fieldMap, metadata.staticFields),
    )
    const { error: upsertError } = await supabase
      .from(metadata.targetTable)
      .upsert(normalized, { onConflict: metadata.uniqueBy, ignoreDuplicates: false })
    if (upsertError) throw upsertError

    await Promise.all([
      supabase.from('marketing_os_ingestion_runs').update({
        status: 'completed',
        records_seen: normalized.length,
        records_inserted: normalized.length,
        completed_at: new Date().toISOString(),
      }).eq('id', run.id),
      supabase.from('marketing_os_sources').update({
        last_run_at: new Date().toISOString(),
        consecutive_failures: 0,
      }).eq('id', source.id),
    ])
    return { sourceId, runId: run.id, records: normalized.length, contentHash: hash }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await Promise.all([
      supabase.from('marketing_os_ingestion_runs').update({
        status: 'failed',
        error: message,
        completed_at: new Date().toISOString(),
      }).eq('id', run.id),
      supabase.rpc('increment_marketing_os_source_failure', { source_uuid: source.id }),
    ])
    throw error
  }
}
