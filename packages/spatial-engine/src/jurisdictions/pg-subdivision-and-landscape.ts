/**
 * Prince George's County — Subdivision Regulations (Subtitle 24) and the
 * Landscape Manual, from the same adopted publication as the Zoning Ordinance.
 *
 * SOURCE  online.encodeplus.com — "Zoning Ordinance, Subdivision Regulations &
 *         Landscape Manual (Effective 4/1/2022)".
 *         Subtitle 24 = secid 1063, Landscape Manual = secid 2005.
 * STATUS  MACHINE-EXTRACTED, NOT VERIFIED BY A REVIEWER.
 */

export const PG_SUBDIVISION_SOURCE = {
  publication:
    "Prince George's County Zoning Ordinance, Subdivision Regulations & Landscape Manual (Effective 4/1/2022)",
  subdivisionUrl:
    'https://online.encodeplus.com/regs/princegeorgescounty-md/doc-viewer.aspx#secid-1063',
  landscapeManualUrl:
    'https://online.encodeplus.com/regs/princegeorgescounty-md/doc-viewer.aspx#secid-2005',
  effectiveDate: '2022-04-01',
  extraction: 'machine' as const,
  verifiedBy: null as string | null,
}

/**
 * Table 24-4303(c) — Regulated Stream Buffers.
 *
 * Drives the environmental constraint on C-100 and C-600. Note the buffer is
 * NARROWER inside Transit Oriented Centers, so the answer depends on the
 * overlay context, not the base zone alone.
 */
export const PG_REGULATED_STREAM_BUFFERS = {
  citation: 'Table 24-4303(c)',
  withinTransitOrientedCentersFt: 75,
  outsideTransitOrientedCentersFt: 100,
  note:
    'For the purposes of this table the county defines Transit Oriented Centers ' +
    'specifically — confirm the definition applies before using the 75 ft buffer.',
} as const

export function pgRegulatedStreamBufferFt(withinTransitOrientedCenter: boolean): number {
  return withinTransitOrientedCenter
    ? PG_REGULATED_STREAM_BUFFERS.withinTransitOrientedCentersFt
    : PG_REGULATED_STREAM_BUFFERS.outsideTransitOrientedCentersFt
}

/**
 * Subdivision procedures from Table 24-3200. Used by the applicability report to
 * explain WHICH approval a project needs and who decides it — the brief requires
 * a decision report, and explicitly warns against assuming every project needs a
 * Detailed Site Plan.
 */
export const PG_SUBDIVISION_PROCEDURES: readonly string[] = [
  'Subdivision Regulations Amendment',
  'Minor Subdivision or Resubdivision — Preliminary Plan',
  'Minor Subdivision or Resubdivision — Final Plat',
  'Final Plat Not Otherwise Subject to a Preliminary Plan',
  'Major Subdivision (Conventional, Conservation, or Cluster)',
]

/**
 * Tree canopy coverage — NOT AVAILABLE HERE.
 *
 * The Landscape Manual states that activities subject to the Tree Canopy
 * Coverage Ordinance "shall provide the tree canopy percentages listed in
 * Table 1 of Section 25-128", and that requirements are based on GROSS TRACT
 * AREA. But §25-128 sits in Subtitle 25 Division 3 of the County Code, which is
 * not published in this viewer — the viewer carries Subtitles 27 and 24 and the
 * Landscape Manual only.
 *
 * So the percentages themselves must come from Subtitle 25 via the County Code.
 * L-100 cannot compute a canopy schedule until they are loaded.
 */
export const PG_TREE_CANOPY_COVERAGE = {
  citation: 'Subtitle 25 Division 3, § 25-128 Table 1',
  basis: 'gross tract area',
  percentagesAvailable: false,
  whereToFind:
    "https://library.municode.com/md/prince_george's_county/codes/code_of_ordinances",
  note:
    'The Landscape Manual references this table but does not reproduce it. ' +
    'Kealee does not publish a canopy percentage it has not sourced.',
} as const

export function getPgTreeCanopyRequirement(): {
  percent: number | null
  requiresManualLookup: true
  reason: string
} {
  return {
    percent: null,
    requiresManualLookup: true,
    reason:
      `Tree canopy percentages are set by ${PG_TREE_CANOPY_COVERAGE.citation}, ` +
      'which is in Subtitle 25 of the County Code and is not published in the ' +
      'Zoning Ordinance viewer. Look it up and record it with a citation before ' +
      'producing an L-100 canopy schedule.',
  }
}
