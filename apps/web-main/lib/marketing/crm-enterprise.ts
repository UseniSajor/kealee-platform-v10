/**
 * Enterprise CRM (GHL + HubSpot) is opt-in until Kealee is on a paid enterprise subscription.
 * Default: Kealee native drip (Resend + marketing_drip_queue).
 *
 * Enable with KEALEE_ENTERPRISE_CRM_ENABLED=true plus GHL and/or HubSpot credentials.
 */

export function isEnterpriseCrmEnabled(): boolean {
  const flag = process.env.KEALEE_ENTERPRISE_CRM_ENABLED
  if (flag !== 'true' && flag !== '1') return false

  const hasGhl = Boolean(
    process.env.GHL_API_KEY?.trim() && process.env.GHL_LOCATION_ID?.trim(),
  )
  const hasHubspot = Boolean(
    process.env.HUBSPOT_API_KEY?.trim() || process.env.HUBSPOT_ACCESS_TOKEN?.trim(),
  )

  return hasGhl || hasHubspot
}

export function isNativeDripMode(): boolean {
  return !isEnterpriseCrmEnabled()
}
