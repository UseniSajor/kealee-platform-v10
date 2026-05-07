/**
 * UTM Parameter Utilities
 *
 * Build and parse UTM parameters for campaign tracking.
 */

// ── Constants ─────────────────────────────────────────────────────────────────

export const UTM_SOURCES = [
  'google',
  'facebook',
  'instagram',
  'nextdoor',
  'linkedin',
  'email',
  'sms',
  'direct',
  'referral',
  'organic',
  'bing',
  'youtube',
] as const

export const UTM_MEDIUMS = [
  'cpc',          // paid search
  'paid_social',  // paid social
  'organic',      // organic search/social
  'email',        // email campaigns
  'sms',          // SMS campaigns
  'referral',     // referral links
  'display',      // display ads
  'video',        // video ads
  'none',         // direct
] as const

export const UTM_CAMPAIGNS = [
  'concept_packages',
  'permit_filing',
  'cost_estimation',
  'contractor_match',
  'brand',
  'remarketing',
  'nurture',
  'post_purchase',
  'newsletter',
  'adu_bundle',
] as const

export type UTMSource   = (typeof UTM_SOURCES)[number]
export type UTMMedium   = (typeof UTM_MEDIUMS)[number]
export type UTMCampaign = (typeof UTM_CAMPAIGNS)[number]

// ── Typed UTM object ──────────────────────────────────────────────────────────

export interface UTMParams {
  source?:   string
  medium?:   string
  campaign?: string
  term?:     string    // keyword
  content?:  string    // ad variant
}

// ── Build UTM string ──────────────────────────────────────────────────────────

/**
 * Build a UTM query string from params.
 * Returns empty string if no params provided.
 *
 * @example
 * buildUTM({ source: 'google', medium: 'cpc', campaign: 'concept_packages' })
 * // → "utm_source=google&utm_medium=cpc&utm_campaign=concept_packages"
 */
export function buildUTM(params: UTMParams): string {
  const sp = new URLSearchParams()

  if (params.source)   sp.set('utm_source',   params.source)
  if (params.medium)   sp.set('utm_medium',   params.medium)
  if (params.campaign) sp.set('utm_campaign',  params.campaign)
  if (params.term)     sp.set('utm_term',      params.term)
  if (params.content)  sp.set('utm_content',   params.content)

  return sp.toString()
}

/**
 * Append UTM params to a base URL.
 *
 * @example
 * buildUTMUrl('https://kealee.com/concept', { source: 'facebook', medium: 'paid_social' })
 * // → "https://kealee.com/concept?utm_source=facebook&utm_medium=paid_social"
 */
export function buildUTMUrl(baseUrl: string, params: UTMParams): string {
  const utmString = buildUTM(params)
  if (!utmString) return baseUrl
  const separator = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${separator}${utmString}`
}

// ── Parse UTM from searchParams ───────────────────────────────────────────────

/**
 * Parse UTM parameters from a URL's search params.
 * Works with Next.js searchParams (ReadonlyURLSearchParams or plain URLSearchParams).
 */
export function parseUTM(
  searchParams: URLSearchParams | ReadonlyMap<string, string> | Record<string, string>,
): UTMParams {
  const get = (key: string): string | undefined => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key) ?? undefined
    }
    if (searchParams instanceof Map) {
      return (searchParams as Map<string, string>).get(key)
    }
    return (searchParams as Record<string, string>)[key]
  }

  return {
    source:   get('utm_source'),
    medium:   get('utm_medium'),
    campaign: get('utm_campaign'),
    term:     get('utm_term'),
    content:  get('utm_content'),
  }
}

// ── Pre-built URL builders for common campaigns ───────────────────────────────

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kealee.com'

export const UTM_URLS = {
  conceptFromGoogle:   buildUTMUrl(`${SITE_URL}/concept`, { source: 'google',    medium: 'cpc',        campaign: 'concept_packages' }),
  conceptFromFacebook: buildUTMUrl(`${SITE_URL}/concept`, { source: 'facebook',  medium: 'paid_social', campaign: 'concept_packages' }),
  conceptFromEmail:    buildUTMUrl(`${SITE_URL}/concept`, { source: 'email',     medium: 'email',       campaign: 'nurture' }),
  conceptFromSMS:      buildUTMUrl(`${SITE_URL}/concept`, { source: 'sms',       medium: 'sms',         campaign: 'nurture' }),
  permitsFromGoogle:   buildUTMUrl(`${SITE_URL}/permits`, { source: 'google',    medium: 'cpc',         campaign: 'permit_filing' }),
  permitsFromEmail:    buildUTMUrl(`${SITE_URL}/permits`, { source: 'email',     medium: 'email',       campaign: 'permit_filing' }),
} as const
