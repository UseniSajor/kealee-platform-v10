import type { NextRequest } from 'next/server'
import { parseUTM, type UTMParams } from '@/lib/marketing/utm'
import { marketingChannelFromUtm } from '@/lib/marketing/channel-attribution'
import { mergeMarketingMetadata, type MarketingLeadMetadata } from '@/lib/marketing/types'

export const UTM_SESSION_KEY = 'kealee_utm_v1'

/** Map UTM params → metadata fields (Supabase JSON). */
export function utmToMetadataFields(utm: UTMParams): MarketingLeadMetadata {
  return {
    utm_source: utm.source,
    utm_medium: utm.medium,
    utm_campaign: utm.campaign,
    utm_term: utm.term,
    utm_content: utm.content,
  }
}

export function parseUtmFromBody(body: Record<string, unknown>): UTMParams {
  return {
    source:
      (body.utm_source as string) ??
      (body.utmSource as string) ??
      undefined,
    medium:
      (body.utm_medium as string) ??
      (body.utmMedium as string) ??
      undefined,
    campaign:
      (body.utm_campaign as string) ??
      (body.utmCampaign as string) ??
      undefined,
    term: (body.utm_term as string) ?? undefined,
    content: (body.utm_content as string) ?? undefined,
  }
}

export function parseUtmFromRequest(
  req: NextRequest,
  body?: Record<string, unknown>,
): UTMParams {
  const fromUrl = parseUTM(req.nextUrl.searchParams)
  const fromBody = body ? parseUtmFromBody(body) : {}
  return {
    source: fromBody.source ?? fromUrl.source,
    medium: fromBody.medium ?? fromUrl.medium,
    campaign: fromBody.campaign ?? fromUrl.campaign,
    term: fromBody.term ?? fromUrl.term,
    content: fromBody.content ?? fromUrl.content,
  }
}

export function mergeAttributionMetadata(
  existing: Record<string, unknown> | null | undefined,
  utm: UTMParams,
  extra?: MarketingLeadMetadata,
): MarketingLeadMetadata {
  const utmFields = utmToMetadataFields(utm)
  const hasUtm = Boolean(utm.source || utm.medium || utm.campaign)
  const marketingChannel = marketingChannelFromUtm(
    utm,
    (extra?.marketingSource as string) ?? undefined,
  )
  return mergeMarketingMetadata(existing, {
    ...extra,
    marketingChannel,
    ...(hasUtm ? utmFields : {}),
    ...(utm.source ? { tags: [`utm-${utm.source}`, `channel-${marketingChannel}`] } : { tags: [`channel-${marketingChannel}`] }),
  })
}
