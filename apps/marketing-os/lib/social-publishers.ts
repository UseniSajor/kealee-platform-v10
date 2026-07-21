import { requireProvider } from './providers'

export type SocialChannel = 'youtube' | 'instagram' | 'facebook' | 'linkedin' | 'tiktok'

export interface SocialPublishRequest {
  channel: SocialChannel
  credentialReference: string
  text: string
  mediaUrl?: string
  title?: string
  metadata?: Record<string, unknown>
}

function credential(reference: string) {
  if (!/^[A-Z][A-Z0-9_]+$/.test(reference)) throw new Error('Invalid credential reference')
  const value = process.env[reference]
  if (!value) throw new Error(`Credential ${reference} is not configured`)
  return value
}

export async function publishSocial(input: SocialPublishRequest) {
  switch (input.channel) {
    case 'linkedin':
      return publishLinkedIn(input)
    case 'facebook':
      return publishFacebook(input)
    case 'instagram':
      return publishInstagram(input)
    case 'youtube':
      return publishYouTube(input)
    case 'tiktok':
      return publishTikTok(input)
  }
}

export async function fetchSocialMetrics(input: {
  channel: SocialChannel
  credentialReference: string
  externalId: string
  metadata?: Record<string, unknown>
}) {
  const token = credential(input.credentialReference)
  switch (input.channel) {
    case 'youtube': {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${encodeURIComponent(input.externalId)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      const body = await response.json().catch(() => ({})) as {
        items?: Array<{ statistics?: Record<string, string> }>
      }
      if (!response.ok) throw new Error(`YouTube metrics failed (${response.status}): ${JSON.stringify(body).slice(0, 400)}`)
      const stats = body.items?.[0]?.statistics ?? {}
      return {
        views: Number(stats.viewCount ?? 0),
        engagements: Number(stats.likeCount ?? 0) + Number(stats.commentCount ?? 0),
        metadata: body,
      }
    }
    case 'facebook':
    case 'instagram': {
      const fields = input.channel === 'instagram'
        ? 'impressions,reach,plays,likes,comments,shares,saved'
        : 'post_impressions,post_impressions_unique,post_engaged_users,post_clicks'
      const graphVersion = process.env.META_GRAPH_VERSION ?? 'v23.0'
      const response = await fetch(
        `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(input.externalId)}/insights?metric=${fields}&access_token=${encodeURIComponent(token)}`,
      )
      const body = await response.json().catch(() => ({})) as {
        data?: Array<{ name?: string; values?: Array<{ value?: number }> }>
      }
      if (!response.ok) throw new Error(`Meta metrics failed (${response.status}): ${JSON.stringify(body).slice(0, 400)}`)
      const values = Object.fromEntries((body.data ?? []).map((metric) => [metric.name, metric.values?.[0]?.value ?? 0]))
      return {
        impressions: Number(values.impressions ?? values.post_impressions ?? 0),
        reach: Number(values.reach ?? values.post_impressions_unique ?? 0),
        views: Number(values.plays ?? 0),
        engagements: Number(values.likes ?? 0) + Number(values.comments ?? 0) + Number(values.shares ?? 0)
          + Number(values.saved ?? 0) + Number(values.post_engaged_users ?? 0),
        clicks: Number(values.post_clicks ?? 0),
        metadata: body,
      }
    }
    case 'linkedin': {
      const urn = encodeURIComponent(input.externalId)
      const response = await fetch(`https://api.linkedin.com/rest/socialActions/${urn}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'LinkedIn-Version': process.env.LINKEDIN_API_VERSION ?? '202506',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      })
      const body = await response.json().catch(() => ({})) as Record<string, unknown>
      if (!response.ok) throw new Error(`LinkedIn metrics failed (${response.status}): ${JSON.stringify(body).slice(0, 400)}`)
      return {
        engagements: Number(body.likesSummary && typeof body.likesSummary === 'object'
          ? (body.likesSummary as Record<string, unknown>).totalLikes ?? 0
          : 0) + Number(body.commentsSummary && typeof body.commentsSummary === 'object'
          ? (body.commentsSummary as Record<string, unknown>).totalFirstLevelComments ?? 0
          : 0),
        metadata: body,
      }
    }
    case 'tiktok': {
      const response = await fetch(
        'https://open.tiktokapis.com/v2/video/query/?fields=id,view_count,like_count,comment_count,share_count',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ filters: { video_ids: [input.externalId] } }),
        },
      )
      const body = await response.json().catch(() => ({})) as {
        data?: { videos?: Array<Record<string, number>> }
      }
      if (!response.ok) throw new Error(`TikTok metrics failed (${response.status}): ${JSON.stringify(body).slice(0, 400)}`)
      const stats = body.data?.videos?.[0] ?? {}
      return {
        views: Number(stats.view_count ?? 0),
        engagements: Number(stats.like_count ?? 0) + Number(stats.comment_count ?? 0) + Number(stats.share_count ?? 0),
        metadata: body,
      }
    }
  }
}

async function publishYouTube(input: SocialPublishRequest) {
  requireProvider('YouTube', ['YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET'])
  if (!input.mediaUrl) throw new Error('YouTube mediaUrl is required')
  const token = credential(input.credentialReference)
  const media = await fetch(input.mediaUrl, { signal: AbortSignal.timeout(120_000) })
  if (!media.ok) throw new Error(`YouTube could not download media (${media.status})`)
  const boundary = `kealee_${crypto.randomUUID()}`
  const metadata = JSON.stringify({
    snippet: {
      title: input.title ?? input.text.slice(0, 90),
      description: input.text,
      categoryId: String(input.metadata?.categoryId ?? '22'),
    },
    status: {
      privacyStatus: String(input.metadata?.privacyStatus ?? 'private'),
      selfDeclaredMadeForKids: Boolean(input.metadata?.madeForKids ?? false),
    },
  })
  const mediaBytes = Buffer.from(await media.arrayBuffer())
  const contentType = media.headers.get('content-type') ?? 'video/mp4'
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n`),
    mediaBytes,
    Buffer.from(`\r\n--${boundary}--`),
  ])
  const response = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
      'Content-Length': String(body.length),
    },
    body,
  })
  const json = await response.json().catch(() => ({})) as Record<string, unknown>
  if (!response.ok) throw new Error(`YouTube publish failed (${response.status}): ${JSON.stringify(json).slice(0, 400)}`)
  return { externalId: String(json.id ?? ''), response: json }
}

async function publishTikTok(input: SocialPublishRequest) {
  requireProvider('TikTok', ['TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET'])
  if (!input.mediaUrl) throw new Error('TikTok mediaUrl is required')
  const token = credential(input.credentialReference)
  const response = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify({
      post_info: {
        title: input.text,
        privacy_level: String(input.metadata?.privacyLevel ?? 'SELF_ONLY'),
        disable_duet: Boolean(input.metadata?.disableDuet ?? false),
        disable_comment: Boolean(input.metadata?.disableComment ?? false),
        disable_stitch: Boolean(input.metadata?.disableStitch ?? false),
        video_cover_timestamp_ms: Number(input.metadata?.coverTimestampMs ?? 1000),
      },
      source_info: {
        source: 'PULL_FROM_URL',
        video_url: input.mediaUrl,
      },
    }),
  })
  const json = await response.json().catch(() => ({})) as {
    data?: { publish_id?: string }
    error?: { code?: string; message?: string }
  }
  if (!response.ok || json.error?.code) {
    throw new Error(`TikTok publish failed (${response.status}): ${JSON.stringify(json).slice(0, 400)}`)
  }
  return { externalId: String(json.data?.publish_id ?? ''), response: json }
}

async function publishLinkedIn(input: SocialPublishRequest) {
  requireProvider('LinkedIn', ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET'])
  const token = credential(input.credentialReference)
  const author = String(input.metadata?.authorUrn ?? '')
  if (!author.startsWith('urn:li:')) throw new Error('LinkedIn authorUrn is required')
  const response = await fetch('https://api.linkedin.com/rest/posts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': process.env.LINKEDIN_API_VERSION ?? '202506',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      author,
      commentary: input.text,
      visibility: 'PUBLIC',
      distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false,
    }),
  })
  const body = await response.text()
  if (!response.ok) throw new Error(`LinkedIn publish failed (${response.status}): ${body.slice(0, 400)}`)
  return { externalId: response.headers.get('x-restli-id'), response: body ? JSON.parse(body) : {} }
}

async function publishFacebook(input: SocialPublishRequest) {
  requireProvider('Meta', ['META_APP_ID', 'META_APP_SECRET'])
  const token = credential(input.credentialReference)
  const pageId = String(input.metadata?.pageId ?? '')
  if (!pageId) throw new Error('Facebook pageId is required')
  const endpoint = input.mediaUrl ? `${pageId}/photos` : `${pageId}/feed`
  const body = new URLSearchParams({
    access_token: token,
    message: input.text,
    ...(input.mediaUrl ? { url: input.mediaUrl } : {}),
  })
  const response = await fetch(`https://graph.facebook.com/${process.env.META_GRAPH_VERSION ?? 'v23.0'}/${endpoint}`, {
    method: 'POST',
    body,
  })
  const json = await response.json().catch(() => ({})) as Record<string, unknown>
  if (!response.ok) throw new Error(`Facebook publish failed (${response.status}): ${JSON.stringify(json).slice(0, 400)}`)
  return { externalId: String(json.id ?? json.post_id ?? ''), response: json }
}

async function publishInstagram(input: SocialPublishRequest) {
  requireProvider('Meta', ['META_APP_ID', 'META_APP_SECRET'])
  if (!input.mediaUrl) throw new Error('Instagram mediaUrl is required')
  const token = credential(input.credentialReference)
  const accountId = String(input.metadata?.accountId ?? '')
  if (!accountId) throw new Error('Instagram accountId is required')
  const graphVersion = process.env.META_GRAPH_VERSION ?? 'v23.0'
  const createBody = new URLSearchParams({
    access_token: token,
    caption: input.text,
    ...(input.mediaUrl.endsWith('.mp4')
      ? { media_type: 'REELS', video_url: input.mediaUrl }
      : { image_url: input.mediaUrl }),
  })
  const createResponse = await fetch(`https://graph.facebook.com/${graphVersion}/${accountId}/media`, {
    method: 'POST',
    body: createBody,
  })
  const container = await createResponse.json().catch(() => ({})) as Record<string, unknown>
  if (!createResponse.ok || !container.id) {
    throw new Error(`Instagram container failed (${createResponse.status}): ${JSON.stringify(container).slice(0, 400)}`)
  }
  const publishResponse = await fetch(`https://graph.facebook.com/${graphVersion}/${accountId}/media_publish`, {
    method: 'POST',
    body: new URLSearchParams({ access_token: token, creation_id: String(container.id) }),
  })
  const published = await publishResponse.json().catch(() => ({})) as Record<string, unknown>
  if (!publishResponse.ok) throw new Error(`Instagram publish failed (${publishResponse.status}): ${JSON.stringify(published).slice(0, 400)}`)
  return { externalId: String(published.id ?? ''), response: published }
}
