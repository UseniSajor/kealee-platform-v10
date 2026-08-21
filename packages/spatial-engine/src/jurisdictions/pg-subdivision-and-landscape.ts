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
 * Tree canopy coverage.
 *
 * The Landscape Manual states that regulated activities "shall provide the tree
 * canopy percentages listed in Table 1 of Section 25-128", calculated on GROSS
 * TRACT AREA. That table is in Subtitle 25 Division 3 of the County Code, which
 * this viewer does not publish — it carries Subtitles 27 and 24 and the
 * Landscape Manual only.
 *
 * Retrieval attempted 2026-08-21 via the EncodePlus viewer, the Municode API,
 * the county's Specimen Tree/TCC bulletin PDF, eCode360, and a scan of all 121
 * Landscape Manual tables. Not machine-retrievable from any of them.
 *
 * So the percentages are recorded as pending with their citation. L-100 can
 * still be produced — the canopy schedule carries this as an open item for the
 * reviewer, in the same way any other unresolved input does. Kealee does not
 * print a canopy percentage it has not sourced.
 */
export const PG_TREE_CANOPY_COVERAGE = {
  citation: 'Subtitle 25 Division 3, § 25-128 Table 1',
  basis: 'gross tract area',
  percentagesLoaded: false,
  whereToFind:
    "https://library.municode.com/md/prince_george's_county/codes/code_of_ordinances",
  note:
    'The Landscape Manual references this table but does not reproduce it. ' +
    'Load the percentages from Subtitle 25 and record them with a citation.',
} as const

export interface PgTreeCanopyRequirement {
  percent: number | null
  basis: string
  citation: string
  /** Open item carried into the package for the reviewer to close. */
  openItem: string | null
}

export function getPgTreeCanopyRequirement(): PgTreeCanopyRequirement {
  return {
    percent: null,
    basis: PG_TREE_CANOPY_COVERAGE.basis,
    citation: PG_TREE_CANOPY_COVERAGE.citation,
    openItem:
      `Tree canopy percentage is set by ${PG_TREE_CANOPY_COVERAGE.citation}, in ` +
      'Subtitle 25 of the County Code, which is not published in the Zoning ' +
      'Ordinance viewer. Load it and cite it before the canopy schedule is final.',
  }
}
