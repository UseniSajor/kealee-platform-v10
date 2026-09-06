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
/**
 * Sec. 25-128 Table 1 — Tree Canopy Requirements by Zone.
 *
 * RETRIEVED AND LOADED. This was recorded as unavailable — the Landscape
 * Manual cites the table without reproducing it and it is not in the zoning
 * viewer — so the engine carried `percent: null` and told every reader the
 * canopy schedule could not be finalised. It is published in the County Code
 * on Municode, a host the earlier search never asked.
 *
 * Basis is the NET TRACT AREA and the requirement must be met WITHIN it.
 *
 * SOURCE  Prince George's County Code, Subtitle 25 Division 3, Sec. 25-128,
 *         via Municode (client 14221, product 15209). Retrieved 2026-09-06.
 *         Amendments in the text: CB-27-2010, CB-33-2011, CB-19-2013,
 *         CB-99-2021, CB-021-2024.
 */
export const PG_TREE_CANOPY_COVERAGE = {
  citation: 'Subtitle 25 Division 3, Sec. 25-128 Table 1',
  basis: 'net tract area',
  percentagesLoaded: true,
  retrieved: '2026-09-06',
  byZone: [
    { zones: ['ROS', 'AG', 'AR'], percent: null, note: 'Exempt' },
    { zones: ['RE'], percent: 25, note: null },
    { zones: ['RR', 'RSF-95', 'RSF-65', 'RSF-A', 'RMF-12', 'RMF-20', 'RMF-48', 'RMH', 'R-PD'],
      percent: 20, note: null },
    { zones: ['CGO', 'CS', 'IH', 'IE', 'IE-PD', 'CN', 'NAC', 'TAC', 'LTO', 'RTO-L', 'RTO-H',
              'NAC-PD', 'TAC-PD', 'LTO-PD', 'RTO-PD', 'MU-PD'], percent: 15, note: null },
    { zones: ['LCD', 'LMXC', 'LMUTC'], percent: null,
      note: 'Thresholds per CB-27-2010 for the prior zoning before legacy designation' },
  ] as { zones: string[]; percent: number | null; note: string | null }[],
  credits:
    'Sec. 25-129: existing trees preserved, on-site woodland conservation, trees planted through ' +
    'the site, and STREET TREES in the right-of-way along the property frontage may all count. ' +
    'Credit is the canopy a planted tree provides in ten years.',
  waiver: 'A waiver may be granted under Sec. 25-130.',
} as const

export interface PgTreeCanopyRequirement {
  percent: number | null
  basis: string
  citation: string
  /** Open item carried into the package for the reviewer to close. */
  openItem: string | null
}

export function getPgTreeCanopyRequirement(zoneCode?: string | null): PgTreeCanopyRequirement {
  const zone = (zoneCode ?? '').trim().toUpperCase()
  const row = PG_TREE_CANOPY_COVERAGE.byZone.find(r => r.zones.includes(zone))
  if (!zone) {
    return {
      percent: null, basis: PG_TREE_CANOPY_COVERAGE.basis,
      citation: PG_TREE_CANOPY_COVERAGE.citation,
      openItem: 'No zone is established, so the canopy percentage cannot be selected from ' +
        `${PG_TREE_CANOPY_COVERAGE.citation}.`,
    }
  }
  if (!row) {
    return {
      percent: null, basis: PG_TREE_CANOPY_COVERAGE.basis,
      citation: PG_TREE_CANOPY_COVERAGE.citation,
      openItem: `Zone ${zone} is not listed in ${PG_TREE_CANOPY_COVERAGE.citation}.`,
    }
  }
  return {
    percent: row.percent, basis: PG_TREE_CANOPY_COVERAGE.basis,
    citation: PG_TREE_CANOPY_COVERAGE.citation,
    openItem: row.percent == null
      ? `Zone ${zone}: ${row.note ?? 'no percentage published'}.`
      : null,
  }
}

/**
 * Sec. 23-135 — Curb and gutter; hiker-biker trails; sidewalk.
 *
 * SOURCE  Prince George's County Code, Subtitle 23 Division 3, Sec. 23-135,
 *         via Municode. Retrieved 2026-09-06. CB-98-1989, CB-19-2018.
 */
export const PG_CURB_AND_SIDEWALK = {
  citation: 'Subtitle 23 Division 3, Sec. 23-135',
  curbRequiredWhen: [
    'The majority of individual lots abutting the road have a frontage of 100 ft or less',
    'The road abuts property developed for multidwelling, commercial or industrial use and not ' +
      'subdivided into individual building lots',
    'The road abuts townhouse, cluster or similar development whose building lots are interior ' +
      'and the road abuts common or open space',
    'Traffic or pedestrian conditions require it, as determined by the Director',
  ],
  curbFrontageThresholdFt: 100,
  sidewalkByRoadClass: {
    arterial: 'both sides',
    collector: 'both sides',
    commercial_industrial: 'as determined by the Director',
    primary_residential: 'one side',
    secondary_residential: 'one side',
  } as Record<string, string>,
  bothSidesContinuation:
    'Where existing sidewalks are on BOTH sides, both are continued to the next intersection ' +
    'before transitioning to one-sided construction.',
  stateRoads:
    'Sec. 23-135(d): along State roads a sidewalk may be required where there is concrete curb ' +
    'and gutter, or where SHA requires it.',
} as const
