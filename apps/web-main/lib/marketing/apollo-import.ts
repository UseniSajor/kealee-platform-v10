import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { ApolloClient, ApolloRateLimitError } from './apollo-client'
import { normalizeContactIdentity } from './contact-identity'
import { ingestCanonicalLead } from './lead-ingestion'

const PROVIDER = 'apollo'
const MAX_PER_RUN = 100
const MAX_PER_DAY = 500
const LEASE_MS = 30 * 60 * 1000

export interface ApolloAudienceRules {
  personTitles: string[]
  personSeniorities?: string[]
  organizationLocations: string[]
  organizationEmployeeRanges?: string[]
  organizationKeywords?: string[]
  organizationIndustryTagIds?: string[]
  requireVerifiedEmail?: boolean
}

export interface ApolloImportConfig {
  enabled: boolean
  organizationId: string
  campaignId: string
  perRunCap: number
  dailyCap: number
  minIntervalMinutes: number
  audience: ApolloAudienceRules
  audienceHash: string
}

export interface ApolloImportResult {
  status: 'disabled' | 'skipped' | 'completed' | 'rate_limited' | 'failed'
  imported: number
  duplicates: number
  suppressed: number
  rejected: number
  processed: number
  page: number
  nextPage: number | null
  dailyImported: number
  dailyProcessed: number
  message?: string
}

interface ApolloPerson {
  id?: string
  name?: string
  first_name?: string
  last_name?: string
  title?: string
  seniority?: string
  email?: string
  email_status?: string
  city?: string
  state?: string
  country?: string
  phone_numbers?: Array<{ sanitized_number?: string; raw_number?: string }>
  organization?: {
    name?: string
    primary_domain?: string
    website_url?: string
    industry?: string
  }
}

interface CursorMetadata {
  dailyDate?: string
  dailyImported?: number
  dailyProcessed?: number
  audienceHash?: string
  lastRun?: Record<string, unknown>
  consecutiveFailures?: number
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((item): item is string => typeof item === 'string').map(item => item.trim()).filter(Boolean))]
}

function clampInteger(value: string | undefined, fallback: number, maximum: number): number {
  const parsed = Number.parseInt(value ?? '', 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.min(parsed, maximum)
}

export function loadApolloImportConfig(env: NodeJS.ProcessEnv = process.env): ApolloImportConfig {
  const enabled = env.APOLLO_IMPORT_ENABLED === 'true'
  const organizationId = env.APOLLO_ORGANIZATION_ID?.trim() ?? ''
  const campaignId = env.APOLLO_CAMPAIGN_ID?.trim() ?? ''
  let raw: Record<string, unknown> = {}
  try {
    raw = JSON.parse(env.APOLLO_AUDIENCE_JSON ?? '{}') as Record<string, unknown>
  } catch {
    throw new Error('APOLLO_AUDIENCE_JSON must be valid JSON')
  }

  const audience: ApolloAudienceRules = {
    personTitles: asStringArray(raw.personTitles),
    personSeniorities: asStringArray(raw.personSeniorities),
    organizationLocations: asStringArray(raw.organizationLocations),
    organizationEmployeeRanges: asStringArray(raw.organizationEmployeeRanges),
    organizationKeywords: asStringArray(raw.organizationKeywords),
    organizationIndustryTagIds: asStringArray(raw.organizationIndustryTagIds),
    requireVerifiedEmail: raw.requireVerifiedEmail !== false,
  }

  if (enabled) {
    if (!env.APOLLO_API_KEY) throw new Error('APOLLO_API_KEY is required when Apollo import is enabled')
    if (!organizationId || !campaignId) throw new Error('APOLLO_ORGANIZATION_ID and APOLLO_CAMPAIGN_ID are required')
    if (audience.personTitles.length === 0 || audience.organizationLocations.length === 0) {
      throw new Error('Apollo audience requires at least one person title and organization location')
    }
  }

  const audienceHash = createHash('sha256').update(JSON.stringify(audience)).digest('hex')
  return {
    enabled,
    organizationId,
    campaignId,
    perRunCap: clampInteger(env.APOLLO_IMPORT_PER_RUN_CAP, 25, MAX_PER_RUN),
    dailyCap: clampInteger(env.APOLLO_IMPORT_DAILY_CAP, 100, MAX_PER_DAY),
    minIntervalMinutes: Math.max(60, clampInteger(env.APOLLO_IMPORT_MIN_INTERVAL_MINUTES, 360, 1_440)),
    audience,
    audienceHash,
  }
}

export function buildApolloSearchInput(audience: ApolloAudienceRules): Record<string, unknown> {
  return {
    person_titles: audience.personTitles,
    person_seniorities: audience.personSeniorities,
    organization_locations: audience.organizationLocations,
    organization_num_employees_ranges: audience.organizationEmployeeRanges,
    q_organization_keyword_tags: audience.organizationKeywords,
    organization_industry_tag_ids: audience.organizationIndustryTagIds,
    contact_email_status: audience.requireVerifiedEmail === false ? undefined : ['verified'],
  }
}

export function mapApolloPerson(person: ApolloPerson, config: ApolloImportConfig) {
  const email = person.email?.trim().toLowerCase()
  if (!person.id || !email) return null
  if (config.audience.requireVerifiedEmail !== false && person.email_status !== 'verified') return null
  const phone = person.phone_numbers?.find(item => item.sanitized_number || item.raw_number)
  const companyDomain = person.organization?.primary_domain ?? person.organization?.website_url
  const identity = normalizeContactIdentity({
    email,
    phone: phone?.sanitized_number ?? phone?.raw_number,
    companyDomain,
  })
  if (!identity.email) return null
  const name = person.name?.trim() || `${person.first_name ?? ''} ${person.last_name ?? ''}`.trim()
  if (!name) return null
  const location = [person.city, person.state, person.country].filter(Boolean).join(', ') || 'Not provided'
  return {
    organizationId: config.organizationId,
    name,
    email: identity.email,
    phone: identity.phone ?? undefined,
    companyName: person.organization?.name,
    companyDomain: identity.domain ?? undefined,
    source: PROVIDER,
    sourceRecordId: person.id,
    projectPath: 'b2b_apollo',
    projectAddress: location,
    requiresPayment: false,
    customerType: person.organization?.industry ?? 'B2B prospect',
    roleSeniority: person.title ?? person.seniority,
    geographyFit: true,
    emailQuality: 'verified' as const,
    metadata: {
      apolloCampaignId: config.campaignId,
      apolloAudienceHash: config.audienceHash,
      title: person.title ?? null,
      seniority: person.seniority ?? null,
      industry: person.organization?.industry ?? null,
      importedForReview: true,
      outreachAuthorized: false,
    },
  }
}

function suppressionKey(email?: string | null, phone?: string | null) {
  return email ? `email:${email}` : phone ? `phone:${phone}` : ''
}

function isCandidateSuppressed(blocked: Set<string>, candidate: { email?: string; phone?: string }) {
  return Boolean(
    (candidate.email && blocked.has(`email:${candidate.email}`))
    || (candidate.phone && blocked.has(`phone:${candidate.phone}`)),
  )
}

async function getSuppressedKeys(
  client: SupabaseClient,
  organizationId: string,
  campaignId: string,
  candidates: Array<{ email?: string; phone?: string }>,
): Promise<Set<string>> {
  const emails = [...new Set(candidates.map(item => item.email).filter((item): item is string => Boolean(item)))]
  const phones = [...new Set(candidates.map(item => item.phone).filter((item): item is string => Boolean(item)))]
  const rows: Array<Record<string, unknown>> = []
  for (const [column, values] of [['normalized_email', emails], ['normalized_phone', phones]] as const) {
    if (values.length === 0) continue
    const { data, error } = await client.from('marketing_suppressions')
      .select('organization_id,campaign_id,scope,normalized_email,normalized_phone,expires_at')
      .in(column, values)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    if (error) throw new Error(`Suppression lookup failed: ${error.message}`)
    rows.push(...(data ?? []))
  }
  const blocked = new Set<string>()
  for (const row of rows) {
    const scopeMatches = row.scope === 'global'
      || (row.scope === 'organization' && row.organization_id === organizationId)
      || (row.scope === 'campaign' && row.campaign_id === campaignId)
    if (!scopeMatches) continue
    const key = suppressionKey(row.normalized_email as string | null, row.normalized_phone as string | null)
    if (key) blocked.add(key)
  }
  return blocked
}

async function writeDailyMetrics(client: SupabaseClient, config: ApolloImportConfig, result: ApolloImportResult) {
  const metricDate = new Date().toISOString().slice(0, 10)
  const { error } = await client.from('marketing_daily_metrics').upsert({
    organization_id: config.organizationId,
    metric_date: metricDate,
    campaign_id: config.campaignId,
    channel: 'apollo_import',
    metrics: result,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'organization_id,metric_date,campaign_id,channel' })
  if (error) console.warn('[apollo-import] metrics update failed:', error.message)
}

export async function runApolloImport(options: {
  client?: SupabaseClient
  apollo?: Pick<ApolloClient, 'searchPeople' | 'enrichPeople'>
  env?: NodeJS.ProcessEnv
} = {}): Promise<ApolloImportResult> {
  const config = loadApolloImportConfig(options.env)
  if (!config.enabled) {
    return { status: 'disabled', imported: 0, duplicates: 0, suppressed: 0, rejected: 0, processed: 0, page: 1, nextPage: null, dailyImported: 0, dailyProcessed: 0, message: 'Apollo import is disabled' }
  }
  const client = options.client ?? getSupabaseAdmin()
  const apollo = options.apollo ?? new ApolloClient()
  const now = new Date()
  const today = now.toISOString().slice(0, 10)

  const { data: campaign, error: campaignError } = await client.from('marketing_campaigns_v2')
    .select('id,status,approval_required')
    .eq('id', config.campaignId)
    .eq('organization_id', config.organizationId)
    .maybeSingle()
  if (campaignError) throw new Error(`Apollo campaign lookup failed: ${campaignError.message}`)
  if (!campaign || !['approved', 'active'].includes(campaign.status)) {
    return { status: 'skipped', imported: 0, duplicates: 0, suppressed: 0, rejected: 0, processed: 0, page: 1, nextPage: null, dailyImported: 0, dailyProcessed: 0, message: 'Apollo campaign must be approved or active' }
  }

  await client.from('marketing_integration_cursors').upsert({
    organization_id: config.organizationId,
    provider: PROVIDER,
    campaign_id: config.campaignId,
    status: 'idle',
    import_cap: config.dailyCap,
    metadata: { dailyDate: today, dailyImported: 0, dailyProcessed: 0, audienceHash: config.audienceHash },
    updated_at: now.toISOString(),
  }, { onConflict: 'organization_id,provider,campaign_id', ignoreDuplicates: true })

  const { data: cursor, error: cursorError } = await client.from('marketing_integration_cursors')
    .select('id,cursor_value,status,imported_count,last_success_at,last_error,metadata,updated_at')
    .eq('organization_id', config.organizationId).eq('provider', PROVIDER).eq('campaign_id', config.campaignId).single()
  if (cursorError || !cursor) throw new Error(`Apollo cursor lookup failed: ${cursorError?.message ?? 'not found'}`)
  const metadata = (cursor.metadata ?? {}) as CursorMetadata
  const cursorAge = Date.now() - new Date(cursor.updated_at).getTime()
  if (cursor.status === 'running' && cursorAge < LEASE_MS) {
    return { status: 'skipped', imported: 0, duplicates: 0, suppressed: 0, rejected: 0, processed: 0, page: Number(cursor.cursor_value ?? 1), nextPage: null, dailyImported: metadata.dailyDate === today ? metadata.dailyImported ?? 0 : 0, dailyProcessed: metadata.dailyDate === today ? metadata.dailyProcessed ?? 0 : 0, message: 'Apollo import already running' }
  }
  const dailyImported = metadata.dailyDate === today ? metadata.dailyImported ?? 0 : 0
  const dailyProcessed = metadata.dailyDate === today ? metadata.dailyProcessed ?? 0 : 0
  if (metadata.lastRun && cursorAge < config.minIntervalMinutes * 60 * 1000) {
    return { status: 'skipped', imported: 0, duplicates: 0, suppressed: 0, rejected: 0, processed: 0, page: Number(cursor.cursor_value ?? 1), nextPage: null, dailyImported, dailyProcessed, message: `Apollo import interval is ${config.minIntervalMinutes} minutes` }
  }
  const remainingDaily = Math.max(0, config.dailyCap - dailyProcessed)
  if (remainingDaily === 0) {
    return { status: 'skipped', imported: 0, duplicates: 0, suppressed: 0, rejected: 0, processed: 0, page: Number(cursor.cursor_value ?? 1), nextPage: null, dailyImported, dailyProcessed, message: 'Apollo daily processing cap reached' }
  }

  const { data: claimed } = await client.from('marketing_integration_cursors').update({ status: 'running', last_error: null, updated_at: now.toISOString() })
    .eq('id', cursor.id).eq('updated_at', cursor.updated_at).select('id').maybeSingle()
  if (!claimed) {
    return { status: 'skipped', imported: 0, duplicates: 0, suppressed: 0, rejected: 0, processed: 0, page: Number(cursor.cursor_value ?? 1), nextPage: null, dailyImported, dailyProcessed, message: 'Apollo import lease was claimed by another worker' }
  }

  const audienceChanged = Boolean(metadata.audienceHash && metadata.audienceHash !== config.audienceHash)
  const page = audienceChanged ? 1 : Math.max(1, Number.parseInt(cursor.cursor_value ?? '1', 10) || 1)
  const requested = Math.min(config.perRunCap, remainingDaily)
  let result: ApolloImportResult
  let processedThisRun = 0
  try {
    const response = await apollo.searchPeople(buildApolloSearchInput(config.audience), page, requested)
    processedThisRun = response.people.length
    const searchable = response.people
      .map(person => ({ id: typeof person.id === 'string' ? person.id : '' }))
      .filter(person => Boolean(person.id))
    const enrichment = await apollo.enrichPeople(searchable)
    const mapped = (enrichment.people as ApolloPerson[]).map(person => mapApolloPerson(person, config))
    const candidates = mapped.filter((item): item is NonNullable<typeof item> => Boolean(item))
    const rejected = processedThisRun - candidates.length
    const suppressedKeys = await getSuppressedKeys(client, config.organizationId, config.campaignId, candidates)
    let imported = 0
    let duplicates = 0
    let suppressed = 0
    for (const candidate of candidates) {
      if (isCandidateSuppressed(suppressedKeys, candidate)) { suppressed += 1; continue }
      const ingested = await ingestCanonicalLead(candidate, client)
      if (ingested.duplicate) duplicates += 1
      else imported += 1
    }
    const nextPage = response.nextPage ?? 1
    const processed = processedThisRun
    result = { status: 'completed', imported, duplicates, suppressed, rejected, processed, page, nextPage, dailyImported: dailyImported + imported, dailyProcessed: dailyProcessed + processed }
    await client.from('marketing_integration_cursors').update({
      cursor_value: String(nextPage), status: 'idle', imported_count: (cursor.imported_count ?? 0) + imported,
      import_cap: config.dailyCap, last_success_at: new Date().toISOString(), last_error: null,
      metadata: { dailyDate: today, dailyImported: result.dailyImported, dailyProcessed: result.dailyProcessed, audienceHash: config.audienceHash, consecutiveFailures: 0, lastRun: result },
      updated_at: new Date().toISOString(),
    }).eq('id', cursor.id)
  } catch (error) {
    const rateLimited = error instanceof ApolloRateLimitError
    result = { status: rateLimited ? 'rate_limited' : 'failed', imported: 0, duplicates: 0, suppressed: 0, rejected: processedThisRun, processed: processedThisRun, page, nextPage: page, dailyImported, dailyProcessed: dailyProcessed + processedThisRun, message: error instanceof Error ? error.message : String(error) }
    await client.from('marketing_integration_cursors').update({
      status: rateLimited ? 'rate_limited' : 'failed', last_error: result.message,
      metadata: { ...metadata, dailyDate: today, dailyImported, dailyProcessed: result.dailyProcessed, audienceHash: config.audienceHash, consecutiveFailures: (metadata.consecutiveFailures ?? 0) + 1, lastRun: result },
      updated_at: new Date().toISOString(),
    }).eq('id', cursor.id)
  }
  await writeDailyMetrics(client, config, result)
  return result
}

export async function getApolloImportHealth(client: SupabaseClient = getSupabaseAdmin()) {
  let config: ApolloImportConfig
  try {
    config = loadApolloImportConfig()
  } catch (error) {
    return { enabled: true, healthy: false, status: 'configuration_error', error: error instanceof Error ? error.message : String(error) }
  }
  if (!config.enabled) return { enabled: false, healthy: true, status: 'disabled' }
  const { data, error } = await client.from('marketing_integration_cursors')
    .select('status,cursor_value,imported_count,import_cap,last_success_at,last_error,metadata,updated_at')
    .eq('organization_id', config.organizationId).eq('provider', PROVIDER).eq('campaign_id', config.campaignId).maybeSingle()
  if (error) return { enabled: true, healthy: false, status: 'failed', error: error.message }
  const stale = !data?.last_success_at || Date.now() - new Date(data.last_success_at).getTime() > 48 * 60 * 60 * 1000
  return { enabled: true, healthy: Boolean(data && !stale && !['failed', 'rate_limited'].includes(data.status)), stale, ...data, audienceHash: config.audienceHash }
}
