/**
 * Canonical identity and provenance for Kealee's master estimation cost book.
 *
 * Kealee owns and maintains this platform schema, normalization, crosswalks,
 * and derived allocations. Gordian remains the copyright holder of the
 * underlying Construction Task Catalog publication.
 */
export const CTC_MASTER_DATABASE_ID = 'CTC-2023' as const
export const CTC_LEGACY_DATABASE_IDS = [
  'CTC-2026',
  'CTC-Gordian-MD-DGS-2023',
] as const
export const CTC_DATABASE_IDS = [
  CTC_MASTER_DATABASE_ID,
  ...CTC_LEGACY_DATABASE_IDS,
] as const

export const CTC_MASTER_PROVENANCE = {
  publisher: 'Gordian',
  copyrightHolder: 'Gordian',
  publicationLicensee: 'Maryland Department of General Services',
  platformCustodian: 'Kealee Services LLC',
  redistributionAllowed: false,
  rightsBasis:
    'Kealee platform schema, normalization, crosswalks, and derived allocations. Publication rights remain subject to the applicable Gordian/MD DGS license.',
} as const

