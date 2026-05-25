/** v30 feature gate — default off until KEALEE_V30_ENABLED=true */
export function isV30Enabled(): boolean {
  const raw = process.env.KEALEE_V30_ENABLED ?? process.env.NEXT_PUBLIC_KEALEE_V30_ENABLED
  return raw === 'true' || raw === '1'
}
