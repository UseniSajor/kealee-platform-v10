/**
 * GHL is legacy — requires enterprise CRM subscription + keys.
 * Default: Kealee native drip (marketing_drip_queue via Resend).
 */
import { isEnterpriseCrmEnabled } from './crm-enterprise'

export function isGhlEnabled(): boolean {
  if (!isEnterpriseCrmEnabled()) return false
  const flag = process.env.GHL_ENABLED
  if (flag === 'false' || flag === '0') return false
  return Boolean(process.env.GHL_API_KEY?.trim() && process.env.GHL_LOCATION_ID?.trim())
}
