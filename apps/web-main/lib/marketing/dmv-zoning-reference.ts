/**
 * DMV jurisdiction zoning reference — sourced from data/zoning/dmv_zoning_seed.csv
 *
 * IMPORTANT: R-1 / R-2 are NOT universal DMV codes.
 * - Fairfax County uses R-1, R-2, R-3, R-20, RL, PDH-3
 * - Arlington County uses R-5, R-6, R-10, RA6-15 (not R-1/R-2)
 * - DC uses R-1-B, R-2, R-3, R-4, RF-1 (different numbering than Fairfax)
 * - Montgomery County uses R-60, R-90, RE-2, TLD, CBD-1
 * - Prince George's County uses R-S, R-R, R-T, R-M
 *
 * Marketing copy must name the jurisdiction or use {{zoning}} from a parcel lookup —
 * never imply "R-1 through R-4" applies across all of NoVA.
 */

export interface JurisdictionZoningProfile {
  jurisdiction: string
  /** Primary residential zoning codes in this jurisdiction */
  residentialCodes: string[]
  /** Human-readable description for marketers */
  residentialLabel: string
  /** Minimum lot sizes (sq ft) for common detached SF zones, if known */
  typicalMinLotSqft?: Record<string, number>
  aduNotes: string
  lookupUrl: string
}

export const DMV_JURISDICTION_ZONING: JurisdictionZoningProfile[] = [
  {
    jurisdiction: 'Fairfax County, VA',
    residentialCodes: ['R-1', 'R-2', 'R-3', 'R-20', 'RL', 'PDH-3'],
    residentialLabel: 'R-1 (large-lot), R-2 (8,000 sq ft min), R-3, R-20, RL townhouse',
    typicalMinLotSqft: { 'R-1': 20000, 'R-2': 8000, 'R-3': 11000 },
    aduNotes:
      'ADU rules vary by Fairfax zoning district — R-1 through R-20 each have different setbacks and lot minimums. Verify your district at gis.fairfaxcounty.gov.',
    lookupUrl: 'https://www.fairfaxcounty.gov/planning-development/zoning',
  },
  {
    jurisdiction: 'Arlington County, VA',
    residentialCodes: ['R-5', 'R-6', 'R-10', 'RA6-15'],
    residentialLabel: 'R-5 (5,000 sq ft min), R-6 (6,000 sq ft min), R-10 (10,000 sq ft min)',
    typicalMinLotSqft: { 'R-5': 5000, 'R-6': 6000, 'R-10': 10000 },
    aduNotes:
      'Arlington is among the more permissive NoVA jurisdictions for ADUs. R-6 and R-10 are common single-family zones — not R-1/R-2.',
    lookupUrl:
      'https://www.arlingtonva.us/Government/Programs/Building/Codes-Ordinances/Zoning',
  },
  {
    jurisdiction: 'Washington, DC',
    residentialCodes: ['R-1-B', 'R-2', 'R-3', 'R-4', 'RF-1'],
    residentialLabel: 'R-1-B detached, R-2 duplex/detached, R-3 rowhouse, R-4 apartment, RF-1 row/flat',
    aduNotes:
      'DC ADU rules are zone-specific under the 2016 zoning rewrite. R-2 allows detached and duplex; row zones (R-3, RF-1) have different constraints.',
    lookupUrl: 'https://maps.dcoz.dc.gov',
  },
  {
    jurisdiction: 'City of Alexandria, VA',
    residentialCodes: ['R-20', 'R-8', 'MU-1'],
    residentialLabel: 'R-20 single-family (common), mixed-use MU districts in corridors',
    typicalMinLotSqft: { 'R-20': 6000 },
    aduNotes: 'Alexandria ADU allowance depends on R-20 vs overlay districts — verify by address.',
    lookupUrl: 'https://www.alexandriava.gov/zoning',
  },
  {
    jurisdiction: 'Montgomery County, MD',
    residentialCodes: ['R-60', 'R-90', 'RE-2', 'TLD', 'CBD-1'],
    residentialLabel: 'R-60 (6,000 sq ft), R-90 (9,000 sq ft), RE-2 estate, TLD townhouse',
    typicalMinLotSqft: { 'R-60': 6000, 'R-90': 9000 },
    aduNotes:
      'Montgomery uses R-60/R-90 numbering — not R-1/R-2. ADU accessory rules are in the county zoning ordinance by zone.',
    lookupUrl: 'https://montgomeryplanning.org/planning/zoning/',
  },
  {
    jurisdiction: 'Prince Georges County, MD',
    residentialCodes: ['R-S', 'R-R', 'R-T', 'R-M'],
    residentialLabel: 'R-S suburban SF, R-R rural, R-T rowhouse, R-M multifamily',
    typicalMinLotSqft: { 'R-S': 8000 },
    aduNotes: "PG County uses R-S/R-R codes — not Fairfax-style R-1/R-2.",
    lookupUrl: 'https://www.pgatlas.com/zoning',
  },
]

/** Marketing-safe ADU zoning checklist — jurisdiction-neutral */
export const ADU_ZONING_CHECKLIST_COPY = `ADU feasibility depends on your specific zoning district — not a single "R-1/R-2" rule across the DMV:

• Fairfax County: R-1, R-2, R-3, R-20 (each with different lot minimums)
• Arlington County: R-5, R-6, R-10 (not R-1/R-2)
• Washington DC: R-1-B, R-2, R-3, RF-1
• Montgomery County: R-60, R-90, RE-2
• Prince George's County: R-S, R-R, R-T

Always look up your address in your jurisdiction's GIS portal before assuming you qualify.`

export function zoningProfileForJurisdiction(
  jurisdiction: string,
): JurisdictionZoningProfile | undefined {
  const norm = jurisdiction.toLowerCase()
  return DMV_JURISDICTION_ZONING.find(
    (j) =>
      j.jurisdiction.toLowerCase().includes(norm) ||
      norm.includes(j.jurisdiction.split(',')[0].toLowerCase()),
  )
}

/** Replace generic R-1/R-4 claims with jurisdiction-accurate text when jurisdiction is known */
export function aduZoningCopyForJurisdiction(jurisdiction?: string): string {
  const profile = jurisdiction ? zoningProfileForJurisdiction(jurisdiction) : undefined
  if (profile) {
    return `Your lot's zoning (${profile.residentialLabel}) determines ADU eligibility in ${profile.jurisdiction.split(',')[0]}. ${profile.aduNotes}`
  }
  return ADU_ZONING_CHECKLIST_COPY
}
