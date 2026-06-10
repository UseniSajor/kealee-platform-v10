import { Worker, type Job } from 'bullmq'
import IORedis from 'ioredis'
import { getMarketingQueue, MARKETING_OS_QUEUE } from '@/lib/queue'
import type { MarketingJobPayload } from '@/lib/domain'
import { getSupabaseAdmin } from '@/lib/supabase'
import { executeAgent } from '@/lib/agents'
import { ingestSourceById } from '@/lib/ingestion'
import { fetchSocialMetrics, publishSocial } from '@/lib/social-publishers'
import { pollVideoGeneration, submitVideoGeneration } from '@/lib/video-factory'

if (!process.env.REDIS_URL) throw new Error('REDIS_URL is required for Marketing OS worker')

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  connectionName: 'kealee-marketing-os-worker',
})

async function markJob(job: Job<MarketingJobPayload>, status: string, patch: Record<string, unknown> = {}) {
  await getSupabaseAdmin()
    .from('marketing_os_jobs')
    .update({ status, ...patch })
    .eq('external_job_id', String(job.id))
}

async function processJob(job: Job<MarketingJobPayload>) {
  await markJob(job, 'running', { started_at: new Date().toISOString(), attempts: job.attemptsMade + 1 })
  const { type, input } = job.data

  switch (type) {
    case 'market.ingest':
      return runEnabledIngestion(job)
    case 'market.enrich':
      return runEnrichment(input)
    case 'seo.plan':
      return runAgent('seo', input)
    case 'seo.generate':
      return generateSeoContent(input)
    case 'content.research':
      return runAgent('research', input)
    case 'content.write':
      return runAgent('content', input)
    case 'content.edit':
      return runAgent('editor', input)
    case 'video.generate':
      return submitVideoJob(input)
    case 'social.publish':
      return publishSocialJob(job)
    case 'content.publish':
      return publishContentJob(job)
    case 'social.sync_metrics':
      return syncSocialMetrics(input)
    case 'analytics.rollup':
      return rollupAnalytics(input)
    case 'search.monitor':
      return monitorAiSearch(input)
    case 'video.poll':
      return pollVideoJob(input)
    default:
      throw new Error(`Unsupported Marketing OS job: ${String(type)}`)
  }
}

async function runEnabledIngestion(job: Job<MarketingJobPayload>) {
  const requestedSourceId = typeof job.data.input.sourceId === 'string' ? job.data.input.sourceId : null
  if (requestedSourceId) return ingestSourceById(requestedSourceId)

  const supabase = getSupabaseAdmin()
  const { data: sources, error } = await supabase
    .from('marketing_os_sources')
    .select('id, name, base_url, parser_key, authentication_type, metadata')
    .eq('enabled', true)
  if (error) throw error
  const childJobs = []
  for (const source of sources ?? []) {
    const child = await getMarketingQueue().add('market.ingest', {
      ...job.data,
      correlationId: crypto.randomUUID(),
      input: { sourceId: source.id },
    }, {
      jobId: `source:${source.id}:${new Date().toISOString().slice(0, 10)}`,
    })
    childJobs.push(child.id)
  }
  return { sources: sources?.length ?? 0, childJobs }
}

async function runEnrichment(input: Record<string, unknown>) {
  const execution = await executeAgent({ agent: 'research', input })
  return execution.result
}

async function runAgent(agent: 'research' | 'seo' | 'content' | 'editor' | 'video', input: Record<string, unknown>) {
  const execution = await executeAgent({ agent, input })
  return execution.result
}

async function generateSeoContent(input: Record<string, unknown>) {
  const contentItemId = typeof input.contentItemId === 'string' ? input.contentItemId : null
  if (!contentItemId) throw new Error('seo.generate requires input.contentItemId')
  const supabase = getSupabaseAdmin()
  const { data: item, error } = await supabase
    .from('marketing_os_content_items')
    .select('id, title, content_type, slug, current_version, primary_keyword, search_intent, target_audience, metadata')
    .eq('id', contentItemId)
    .single()
  if (error || !item) throw new Error(error?.message ?? 'Content item not found')

  const execution = await executeAgent({
    agent: 'content',
    input: {
      assignment: item,
      marketFacts: input.marketFacts,
      sourceDocuments: input.sourceDocuments,
      requirements: {
        factualCitationsRequired: true,
        unsupportedClaimsForbidden: true,
        outputFields: ['title', 'excerpt', 'bodyMarkdown', 'bodyHtml', 'seoTitle', 'metaDescription', 'schemaJson', 'sourceCitations'],
      },
    },
  })
  const output = execution.result.output
  const nextVersion = Number(item.current_version ?? 0) + 1
  const bodyMarkdown = String(output.bodyMarkdown ?? '')
  if (!bodyMarkdown) throw new Error('Content Agent returned no bodyMarkdown')

  const { error: versionError } = await supabase.from('marketing_os_content_versions').insert({
    content_item_id: item.id,
    version: nextVersion,
    title: String(output.title ?? item.title),
    excerpt: typeof output.excerpt === 'string' ? output.excerpt : null,
    body_markdown: bodyMarkdown,
    body_html: typeof output.bodyHtml === 'string' ? output.bodyHtml : null,
    seo_title: typeof output.seoTitle === 'string' ? output.seoTitle : null,
    meta_description: typeof output.metaDescription === 'string' ? output.metaDescription : null,
    schema_json: output.schemaJson && typeof output.schemaJson === 'object' ? output.schemaJson : {},
    source_citations: Array.isArray(output.sourceCitations) ? output.sourceCitations : [],
    generated_by_agent: 'content',
    model: execution.model,
    prompt_hash: execution.promptHash,
  })
  if (versionError) throw versionError
  await supabase.from('marketing_os_content_items').update({
    current_version: nextVersion,
    status: 'review',
  }).eq('id', item.id)
  return { contentItemId: item.id, version: nextVersion, status: 'review' }
}

async function requireApprovalOrExecute(job: Job<MarketingJobPayload>, action: string) {
  if (job.data.approvalMode !== 'automatic') {
    await markJob(job, 'awaiting_approval', { result: { action, approvalRequired: true } })
    return { approvalRequired: true, action }
  }
  return { approved: true, action }
}

async function submitVideoJob(input: Record<string, unknown>) {
  const mediaAssetId = typeof input.mediaAssetId === 'string' ? input.mediaAssetId : null
  if (!mediaAssetId) throw new Error('video.generate requires input.mediaAssetId')
  const supabase = getSupabaseAdmin()
  const { data: asset, error } = await supabase
    .from('marketing_os_media_assets')
    .select('id, provider, prompt, source_asset_urls, duration_seconds, aspect_ratio, status')
    .eq('id', mediaAssetId)
    .single()
  if (error || !asset) throw new Error(error?.message ?? 'Media asset not found')
  const sourceUrls = Array.isArray(asset.source_asset_urls) ? asset.source_asset_urls : []
  const submitted = await submitVideoGeneration({
    provider: asset.provider as 'runway' | 'kling' | 'veo',
    prompt: String(asset.prompt ?? ''),
    inputImageUrl: typeof sourceUrls[0] === 'string' ? sourceUrls[0] : undefined,
    durationSeconds: [5, 8, 10].includes(Number(asset.duration_seconds))
      ? Number(asset.duration_seconds) as 5 | 8 | 10
      : 5,
    aspectRatio: ['16:9', '9:16', '1:1'].includes(String(asset.aspect_ratio))
      ? asset.aspect_ratio as '16:9' | '9:16' | '1:1'
      : '16:9',
  })
  await supabase.from('marketing_os_media_assets').update({
    external_job_id: submitted.jobId,
    status: 'running',
    generation_metadata: submitted.response,
  }).eq('id', asset.id)
  return { mediaAssetId: asset.id, provider: submitted.provider, externalJobId: submitted.jobId }
}

async function publishContentJob(job: Job<MarketingJobPayload>) {
  if (job.data.approvalMode !== 'automatic') return requireApprovalOrExecute(job, 'Content publishing')
  const contentItemId = typeof job.data.input.contentItemId === 'string' ? job.data.input.contentItemId : null
  if (!contentItemId) throw new Error('content.publish requires input.contentItemId')
  const { data, error } = await getSupabaseAdmin().from('marketing_os_content_items').update({
    status: 'published',
    published_at: new Date().toISOString(),
  }).eq('id', contentItemId).eq('status', 'approved').select('id').maybeSingle()
  if (error) throw error
  if (!data) throw new Error('Content item must be approved before publishing')
  return { contentItemId, published: true }
}

async function publishSocialJob(job: Job<MarketingJobPayload>) {
  if (job.data.approvalMode !== 'automatic') return requireApprovalOrExecute(job, 'Social publishing')
  const publicationId = typeof job.data.input.publicationId === 'string' ? job.data.input.publicationId : null
  if (!publicationId) throw new Error('social.publish requires input.publicationId')
  const supabase = getSupabaseAdmin()
  const { data: publication, error } = await supabase
    .from('marketing_os_publications')
    .select(`
      id, channel, caption, request_payload, status,
      content_item:marketing_os_content_items(title),
      media_asset:marketing_os_media_assets(storage_urls, output_urls),
      social_account:marketing_os_social_accounts(credential_reference, metadata)
    `)
    .eq('id', publicationId)
    .single()
  if (error || !publication) throw new Error(error?.message ?? 'Publication not found')
  const account = Array.isArray(publication.social_account) ? publication.social_account[0] : publication.social_account
  const media = Array.isArray(publication.media_asset) ? publication.media_asset[0] : publication.media_asset
  const content = Array.isArray(publication.content_item) ? publication.content_item[0] : publication.content_item
  if (!account?.credential_reference) throw new Error('Publication has no social account credential reference')
  const storageUrls = Array.isArray(media?.storage_urls) ? media.storage_urls : []
  const outputUrls = Array.isArray(media?.output_urls) ? media.output_urls : []
  const mediaUrl = [...storageUrls, ...outputUrls].find((url): url is string => typeof url === 'string')
  const result = await publishSocial({
    channel: publication.channel as 'youtube' | 'instagram' | 'facebook' | 'linkedin' | 'tiktok',
    credentialReference: account.credential_reference,
    text: String(publication.caption ?? ''),
    title: content?.title,
    mediaUrl,
    metadata: {
      ...(account.metadata && typeof account.metadata === 'object' ? account.metadata as Record<string, unknown> : {}),
      ...(publication.request_payload && typeof publication.request_payload === 'object'
        ? publication.request_payload as Record<string, unknown>
        : {}),
    },
  })
  await supabase.from('marketing_os_publications').update({
    status: 'completed',
    external_id: result.externalId,
    response_payload: result.response,
    published_at: new Date().toISOString(),
  }).eq('id', publication.id)
  return { publicationId, externalId: result.externalId }
}

async function pollVideoJob(input: Record<string, unknown>) {
  const mediaAssetId = typeof input.mediaAssetId === 'string' ? input.mediaAssetId : null
  if (!mediaAssetId) throw new Error('video.poll requires input.mediaAssetId')
  const supabase = getSupabaseAdmin()
  const { data: asset, error } = await supabase
    .from('marketing_os_media_assets')
    .select('id, provider, external_job_id, generation_metadata')
    .eq('id', mediaAssetId)
    .single()
  if (error || !asset) throw new Error(error?.message ?? 'Media asset not found')
  if (!asset.external_job_id) throw new Error('Media asset has no external generation job')
  if (!['runway', 'kling', 'veo'].includes(asset.provider)) throw new Error(`Unsupported video provider: ${asset.provider}`)
  const result = await pollVideoGeneration(
    asset.provider as 'runway' | 'kling' | 'veo',
    asset.external_job_id,
  )
  const completedAt = result.status === 'completed' || result.status === 'failed'
    ? new Date().toISOString()
    : null
  const { error: updateError } = await supabase.from('marketing_os_media_assets').update({
    status: result.status,
    output_urls: result.outputUrls,
    error: result.error,
    completed_at: completedAt,
    generation_metadata: {
      ...(asset.generation_metadata && typeof asset.generation_metadata === 'object'
        ? asset.generation_metadata as Record<string, unknown>
        : {}),
      pollResponse: result.response,
    },
  }).eq('id', asset.id)
  if (updateError) throw updateError
  return { mediaAssetId, status: result.status, outputUrls: result.outputUrls }
}

async function syncSocialMetrics(input: Record<string, unknown>) {
  const publicationId = typeof input.publicationId === 'string' ? input.publicationId : null
  if (!publicationId) throw new Error('social.sync_metrics requires input.publicationId')
  const supabase = getSupabaseAdmin()
  const { data: publication, error } = await supabase
    .from('marketing_os_publications')
    .select(`
      id, content_item_id, channel, external_id, published_at,
      social_account:marketing_os_social_accounts(credential_reference, metadata)
    `)
    .eq('id', publicationId)
    .single()
  if (error || !publication) throw new Error(error?.message ?? 'Publication not found')
  if (!publication.external_id) throw new Error('Publication has no external platform ID')
  const account = Array.isArray(publication.social_account) ? publication.social_account[0] : publication.social_account
  if (!account?.credential_reference) throw new Error('Publication has no social account credential reference')
  const metrics = await fetchSocialMetrics({
    channel: publication.channel,
    credentialReference: account.credential_reference,
    externalId: publication.external_id,
    metadata: account.metadata,
  })
  const metricDate = String(publication.published_at ?? new Date().toISOString()).slice(0, 10)
  const { error: metricError } = await supabase.from('marketing_os_performance_metrics').upsert({
    content_item_id: publication.content_item_id,
    publication_id: publication.id,
    channel: publication.channel,
    metric_date: metricDate,
    impressions: metrics.impressions ?? 0,
    reach: metrics.reach ?? 0,
    views: metrics.views ?? 0,
    engagements: metrics.engagements ?? 0,
    clicks: metrics.clicks ?? 0,
    metadata: metrics.metadata,
  }, { onConflict: 'content_item_id,publication_id,channel,metric_date' })
  if (metricError) throw metricError
  return { publicationId, metricDate, metrics }
}

function normalizeLeadChannel(source: string) {
  const value = source.toLowerCase()
  if (value.includes('youtube')) return 'youtube'
  if (value.includes('instagram')) return 'instagram'
  if (value.includes('facebook') || value.includes('meta')) return 'facebook'
  if (value.includes('linkedin')) return 'linkedin'
  if (value.includes('tiktok')) return 'tiktok'
  if (value.includes('email')) return 'email'
  if (value.includes('google') || value.includes('paid_search')) return 'paid_search'
  if (value.includes('blog') || value.includes('seo') || value.includes('organic')) return 'organic'
  if (value.includes('referr')) return 'referral'
  return 'direct'
}

async function rollupAnalytics(input: Record<string, unknown>) {
  const metricDate = typeof input.metricDate === 'string'
    ? input.metricDate
    : new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(metricDate)) throw new Error('analytics.rollup metricDate must be YYYY-MM-DD')
  const start = `${metricDate}T00:00:00.000Z`
  const end = new Date(new Date(start).getTime() + 86_400_000).toISOString()
  const supabase = getSupabaseAdmin()
  const [{ data: leads, error: leadsError }, { data: spend, error: spendError }] = await Promise.all([
    supabase.from('public_intake_leads')
      .select('source, status, payment_amount, metadata, form_data')
      .gte('created_at', start)
      .lt('created_at', end),
    supabase.from('marketing_channel_spend')
      .select('provider, spend_cents, metadata')
      .eq('spend_date', metricDate),
  ])
  if (leadsError) throw leadsError
  if (spendError) throw spendError
  const byChannel = new Map<string, {
    leads: number
    conversions: number
    revenue: number
    spend: number
    sources: Set<string>
  }>()
  const getBucket = (channel: string) => {
    const existing = byChannel.get(channel)
    if (existing) return existing
    const bucket = { leads: 0, conversions: 0, revenue: 0, spend: 0, sources: new Set<string>() }
    byChannel.set(channel, bucket)
    return bucket
  }
  for (const lead of leads ?? []) {
    const metadata = lead.metadata && typeof lead.metadata === 'object' ? lead.metadata as Record<string, unknown> : {}
    const formData = lead.form_data && typeof lead.form_data === 'object' ? lead.form_data as Record<string, unknown> : {}
    const source = String(metadata.utm_source ?? formData.utm_source ?? lead.source ?? 'direct')
    const bucket = getBucket(normalizeLeadChannel(source))
    bucket.leads += 1
    bucket.sources.add(source)
    if (['paid', 'concept_ready', 'converted', 'won'].includes(String(lead.status))) {
      bucket.conversions += 1
      bucket.revenue += Number(lead.payment_amount ?? 0) / 100
    }
  }
  for (const row of spend ?? []) {
    const channel = normalizeLeadChannel(String(row.provider ?? 'direct'))
    getBucket(channel).spend += Number(row.spend_cents ?? 0) / 100
  }
  const rows = [...byChannel.entries()].map(([channel, totals]) => ({
    content_item_id: null,
    publication_id: null,
    channel,
    metric_date: metricDate,
    leads: totals.leads,
    conversions: totals.conversions,
    revenue: totals.revenue,
    spend: totals.spend,
    metadata: { sources: [...totals.sources], rollup: 'public_intake_leads+marketing_channel_spend' },
  }))
  if (rows.length) {
    const { error } = await supabase.from('marketing_os_performance_metrics')
      .upsert(rows, { onConflict: 'content_item_id,publication_id,channel,metric_date' })
    if (error) throw error
  }
  return { metricDate, channels: rows.length, leads: leads?.length ?? 0 }
}

async function monitorAiSearch(input: Record<string, unknown>) {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is required for AI search monitoring')
  const queries = Array.isArray(input.queries)
    ? input.queries.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    : []
  if (!queries.length) throw new Error('search.monitor requires input.queries')
  const locale = typeof input.locale === 'string' ? input.locale : 'en-US'
  const observations = []
  for (const query of queries) {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.MARKETING_OS_SEARCH_MODEL ?? 'gpt-4.1',
        tools: [{ type: 'web_search_preview', search_context_size: 'medium' }],
        input: `Search the web for: ${query}. Summarize the answer, identify whether Kealee is mentioned, list cited URLs, and name competing construction service brands.`,
      }),
      signal: AbortSignal.timeout(120_000),
    })
    const body = await response.json().catch(() => ({})) as {
      output_text?: string
      output?: Array<{ content?: Array<{ annotations?: Array<{ url?: string }> }> }>
    }
    if (!response.ok) throw new Error(`AI search monitor failed (${response.status}): ${JSON.stringify(body).slice(0, 400)}`)
    const citedUrls = body.output?.flatMap((item) => item.content ?? [])
      .flatMap((content) => content.annotations ?? [])
      .map((annotation) => annotation.url)
      .filter((url): url is string => typeof url === 'string') ?? []
    const excerpt = String(body.output_text ?? '')
    observations.push({
      engine: 'openai_web_search',
      query,
      locale,
      observed_at: new Date().toISOString(),
      kealee_mentioned: /\bkealee\b/i.test(excerpt),
      cited_urls: [...new Set(citedUrls)],
      response_excerpt: excerpt.slice(0, 5000),
      metadata: { model: process.env.MARKETING_OS_SEARCH_MODEL ?? 'gpt-4.1' },
    })
  }
  const { error } = await getSupabaseAdmin().from('marketing_os_ai_search_observations').insert(observations)
  if (error) throw error
  return { observations: observations.length, mentioned: observations.filter((row) => row.kealee_mentioned).length }
}

const worker = new Worker<MarketingJobPayload>(MARKETING_OS_QUEUE, processJob, {
  connection,
  concurrency: Number(process.env.MARKETING_OS_WORKER_CONCURRENCY ?? 8),
  limiter: {
    max: Number(process.env.MARKETING_OS_WORKER_RATE_MAX ?? 60),
    duration: Number(process.env.MARKETING_OS_WORKER_RATE_WINDOW_MS ?? 60_000),
  },
})

worker.on('completed', async (job, result) => {
  await markJob(job, 'completed', {
    result,
    completed_at: new Date().toISOString(),
  })
})

worker.on('failed', async (job, error) => {
  if (!job) return
  await markJob(job, 'failed', {
    error: error.message,
    completed_at: new Date().toISOString(),
  })
})

async function shutdown() {
  await worker.close()
  await connection.quit()
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

console.log(`[marketing-os] Worker listening on ${MARKETING_OS_QUEUE}`)
