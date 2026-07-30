/** Public contact + local business facts for marketing pages and JSON-LD. */

export const KEALEE_SITE_URL = 'https://kealee.com'

export const KEALEE_PHONE_DISPLAY =
  process.env.NEXT_PUBLIC_KEALEE_PHONE_DISPLAY ?? '(301) 575-8777'

export const KEALEE_PHONE_E164 =
  process.env.NEXT_PUBLIC_KEALEE_PHONE_E164 ?? '+13015758777'

export const KEALEE_EMAIL = 'hello@kealee.com'

/** Headquarters — Oxon Hill, MD (Prince George's County) */
export const KEALEE_HQ_CITY = 'Oxon Hill'
export const KEALEE_HQ_STATE = 'MD'
export const KEALEE_HQ_ZIP = '20745'
export const KEALEE_HQ_DISPLAY = 'Oxon Hill, MD headquarters — serving project owners nationwide'

/** Geo for JSON-LD (Oxon Hill town center) */
export const KEALEE_GEO_LAT = 38.8037
export const KEALEE_GEO_LNG = -76.9897

export const KEALEE_SERVICE_AREAS = [
  'United States',
  'Oxon Hill MD',
  'Prince George\'s County MD',
  'Washington DC',
  'Montgomery County MD',
  'Silver Spring MD',
  'Northern Virginia',
  'Fairfax County VA',
  'Arlington VA',
  'Alexandria VA',
] as const

export const KEALEE_ADDRESS = {
  streetAddress: process.env.NEXT_PUBLIC_KEALEE_STREET ?? 'Oxon Hill',
  addressLocality: process.env.NEXT_PUBLIC_KEALEE_CITY ?? KEALEE_HQ_CITY,
  addressRegion: process.env.NEXT_PUBLIC_KEALEE_STATE ?? KEALEE_HQ_STATE,
  postalCode: process.env.NEXT_PUBLIC_KEALEE_ZIP ?? KEALEE_HQ_ZIP,
  addressCountry: 'US',
} as const
