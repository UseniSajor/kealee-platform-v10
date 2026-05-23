/**
 * GHL is legacy — disabled unless GHL_ENABLED=true and keys are set.
 */
export function isGhlEnabled(): boolean {
  const flag = process.env.GHL_ENABLED
  if (flag === 'false' || flag === '0') return false
  return Boolean(process.env.GHL_API_KEY?.trim() && process.env.GHL_LOCATION_ID?.trim())
}
