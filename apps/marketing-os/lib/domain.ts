export const SEO_PAGE_TYPES = [
  'county_overview',
  'permit_guide',
  'adu_guide',
  'addition_guide',
  'kitchen_guide',
  'bathroom_guide',
  'deck_guide',
  'commercial_guide',
  'multifamily_guide',
  'cost_guide',
] as const

export type SeoPageType = (typeof SEO_PAGE_TYPES)[number]

export const AGENT_KEYS = [
  'cmo',
  'seo',
  'research',
  'content',
  'editor',
  'video',
  'social',
  'conversion',
] as const

export type AgentKey = (typeof AGENT_KEYS)[number]

export const JOB_TYPES = [
  'market.ingest',
  'market.enrich',
  'seo.plan',
  'seo.generate',
  'content.research',
  'content.write',
  'content.edit',
  'content.publish',
  'video.generate',
  'video.poll',
  'social.publish',
  'social.sync_metrics',
  'search.monitor',
  'analytics.rollup',
] as const

export type MarketingJobType = (typeof JOB_TYPES)[number]

export interface MarketingJobPayload {
  type: MarketingJobType
  actorId: string
  correlationId: string
  input: Record<string, unknown>
  approvalMode: 'automatic' | 'risk_based' | 'required'
}

export interface MarketingAgentDefinition {
  key: AgentKey
  name: string
  purpose: string
  upstream: AgentKey[]
  downstream: AgentKey[]
  tools: string[]
}

export const AGENT_DEFINITIONS: MarketingAgentDefinition[] = [
  {
    key: 'cmo',
    name: 'CMO Agent',
    purpose: 'Sets national priorities, portfolio allocation, approval policy, and growth targets.',
    upstream: [],
    downstream: ['research', 'seo', 'content', 'video', 'social', 'conversion'],
    tools: ['analytics', 'workflow_dispatch', 'budget_policy', 'notifications'],
  },
  {
    key: 'research',
    name: 'Research Agent',
    purpose: 'Builds citation-backed market, permit, zoning, cost, and competitor research.',
    upstream: ['cmo'],
    downstream: ['seo', 'content'],
    tools: ['market_intelligence', 'source_documents', 'citations'],
  },
  {
    key: 'seo',
    name: 'SEO Agent',
    purpose: 'Plans search demand, programmatic page topology, metadata, schema, and internal links.',
    upstream: ['cmo', 'research'],
    downstream: ['content'],
    tools: ['keyword_data', 'seo_pages', 'knowledge_graph', 'sitemaps'],
  },
  {
    key: 'content',
    name: 'Content Agent',
    purpose: 'Creates versioned articles, reports, landing pages, case studies, and email campaigns.',
    upstream: ['research', 'seo'],
    downstream: ['editor', 'video', 'social'],
    tools: ['content_versions', 'citations', 'brand_rules'],
  },
  {
    key: 'editor',
    name: 'Editor Agent',
    purpose: 'Checks evidence, duplication, tone, compliance, quality, and publish readiness.',
    upstream: ['content'],
    downstream: ['video', 'social'],
    tools: ['fact_checks', 'quality_scores', 'approval_gates'],
  },
  {
    key: 'video',
    name: 'Video Agent',
    purpose: 'Converts approved content into scripts, voice, video, captions, and channel variants.',
    upstream: ['editor'],
    downstream: ['social'],
    tools: ['runway', 'kling', 'veo', 'elevenlabs', 'media_archive'],
  },
  {
    key: 'social',
    name: 'Social Agent',
    purpose: 'Schedules, publishes, and synchronizes performance across supported social channels.',
    upstream: ['editor', 'video'],
    downstream: ['conversion'],
    tools: ['youtube', 'instagram', 'linkedin', 'facebook', 'tiktok'],
  },
  {
    key: 'conversion',
    name: 'Conversion Agent',
    purpose: 'Optimizes CTAs, lead routing, nurture, offers, and revenue attribution.',
    upstream: ['cmo', 'social'],
    downstream: ['cmo'],
    tools: ['public_intake_leads', 'resend', 'stripe', 'analytics', 'notifications'],
  },
]
