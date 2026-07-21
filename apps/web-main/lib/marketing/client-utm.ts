'use client'

import { UTM_SESSION_KEY } from '@/lib/marketing/utm-metadata'
import type { UTMParams } from '@/lib/marketing/utm'

export function readStoredUtm(): UTMParams | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(UTM_SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as UTMParams
  } catch {
    return null
  }
}

export function storeUtm(params: UTMParams): void {
  if (typeof window === 'undefined') return
  if (!params.source && !params.medium && !params.campaign) return
  try {
    sessionStorage.setItem(UTM_SESSION_KEY, JSON.stringify(params))
  } catch {
    // ignore quota errors
  }
}

export function utmForApiBody(): Record<string, string | undefined> {
  const u = readStoredUtm()
  if (!u) return {}
  return {
    utm_source: u.source,
    utm_medium: u.medium,
    utm_campaign: u.campaign,
    utm_term: u.term,
    utm_content: u.content,
  }
}
