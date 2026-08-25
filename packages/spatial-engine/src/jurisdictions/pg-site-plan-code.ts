/**
 * Every Prince George's County code section that governs a site plan, native
 * to the repo.
 *
 * Previously these were scattered: Subtitle 27 dimensional standards in one
 * module, Subtitle 32 grading in another, Subtitle 24 subdivision in a third,
 * and several sections cited only in a code comment — which meant they were
 * documentation, not something the engine could evaluate or watch for change.
 *
 * All slugs below were taken from the division table of contents on
 * princegeorges-md.elaws.us and verified by reading back the section heading.
 * Never construct one by pattern: the hierarchy is not uniform and an unknown
 * slug returns HTTP 200 with a headingless fallback page.
 *
 * Verified against the live site on 2026-08-25.
 */

export type SitePlanCodeArea =
  | 'zoning_dimensional'
  | 'subdivision_access'
  | 'subdivision_design'
  | 'grading'
  | 'environmental'

export interface SitePlanCodeSection {
  section: string
  title: string
  subtitle: 24 | 27 | 32
  area: SitePlanCodeArea
  /** Verified elaws slug, or null where the section lives on EncodePlus. */
  elawsSlug: string | null
  /** Why a site plan depends on it. */
  bearing: string
}

/**
 * Subtitle 24 — Subdivisions.
 *
 * Sec. 24-128 is the one that decides whether a lot is legally buildable at
 * all: a parcel reached only by an ingress/egress easement needs a recorded
 * private right-of-way. DPIE Design Review item E-4 asks for that recorded
 * easement, and the checklist's citation of "Code 24-128" is CURRENT — it
 * survived the 2022 rewrite and sits in Division 4.
 */
export const PG_SITE_PLAN_CODE: SitePlanCodeSection[] = [
  // ── Access and frontage — is this a legal lot? ────────────────────────────
  {
    section: '24-128', title: 'Private roads and easements', subtitle: 24,
    area: 'subdivision_access', elawsSlug: 'coor_subtitle24_div4_sec24-128',
    bearing:
      'A lot without public road frontage requires a recorded private right-of-way easement. ' +
      'Without street frontage there is no front lot line, so setbacks cannot be assigned and the ' +
      'building cannot be oriented. DPIE Design Review item E-4.',
  },
  {
    section: '24-124', title: 'Adequate roads required', subtitle: 24,
    area: 'subdivision_access', elawsSlug: 'coor_subtitle24_div4_sec24-124',
    bearing: 'Road adequacy test the subdivision must satisfy.',
  },
  {
    section: '24-123', title: 'General requirements', subtitle: 24,
    area: 'subdivision_access', elawsSlug: 'coor_subtitle24_div4_sec24-123',
    bearing: 'General transportation and circulation requirements.',
  },
  {
    section: '24-127', title: 'Secondary rural roads', subtitle: 24,
    area: 'subdivision_access', elawsSlug: 'coor_subtitle24_div4_sec24-127',
    bearing: 'Applies where the fronting road is a designated secondary rural road.',
  },
  {
    section: '24-125', title: 'Commercial and industrial subdivisions', subtitle: 24,
    area: 'subdivision_access', elawsSlug: 'coor_subtitle24_div4_sec24-125',
    bearing: 'Access standards for non-residential subdivisions.',
  },

  // ── Design and public facilities ──────────────────────────────────────────
  {
    section: '24-121', title: 'Planning and design requirements', subtitle: 24,
    area: 'subdivision_design', elawsSlug: 'coor_subtitle24_div3_sec24-121',
    bearing: 'Lot layout and design standards the site plan must reflect.',
  },
  {
    section: '24-122', title: 'Public facilities requirements', subtitle: 24,
    area: 'subdivision_design', elawsSlug: 'coor_subtitle24_div3_sec24-122',
    bearing:
      'Adequate public facilities. Includes the police/fire/rescue mitigation fee the Fine Grading ' +
      'Submittal Checklist cites at issuance (24-122.01).',
  },
  {
    section: '24-126', title: 'Topography and drainage', subtitle: 24,
    area: 'subdivision_design', elawsSlug: 'coor_subtitle24_div4_sec24-126',
    bearing: 'Subdivision-level topography and drainage requirements, upstream of the grading plan.',
  },

  // ── Subtitle 32 — the grading code ────────────────────────────────────────
  {
    section: '32-130', title: 'Contents of Grading/Site Development Plan', subtitle: 32,
    area: 'grading', elawsSlug: 'coor_subtitle32_div2_sec32-130',
    bearing:
      'THE controlling section for what appears on the sheet: paper size, scale floor, contour ' +
      'interval, peripheral strip, per-discipline preparer identification and certification. ' +
      'Fifteen paragraphs, transcribed as PG_PLAN_CONTENT_STANDARDS.',
  },
  {
    section: '32-106', title: 'Administration; Construction Documents', subtitle: 32,
    area: 'grading', elawsSlug: 'coor_subtitle32_div1_subdiv2_sec32-106',
    bearing: 'Existing and proposed utilities must be shown. DPIE item B-2.',
  },
  {
    section: '32-151', title: 'Site Grades', subtitle: 32,
    area: 'grading', elawsSlug: 'coor_subtitle32_div2_sec32-151',
    bearing: 'Table 4 slope limitations — pad shelf, swales, driveways, parking. Factor of safety 1.5.',
  },
  {
    section: '32-156', title: 'Fill — Classes', subtitle: 32,
    area: 'grading', elawsSlug: 'coor_subtitle32_div2_sec32-156',
    bearing: 'Class 1/2/3 fill classification required by 32-130(a)(7).',
  },
  {
    section: '32-161', title: 'Slopes — Setbacks', subtitle: 32,
    area: 'grading', elawsSlug: 'coor_subtitle32_div2_sec32-161',
    bearing: 'Setback of slopes steeper than 4:1 from property lines and buildings.',
  },
  {
    section: '32-162', title: 'On-Site Drainage', subtitle: 32,
    area: 'grading', elawsSlug: 'coor_subtitle32_div2_sec32-162',
    bearing: '100-year overflow path; building entries set above it. Slope terracing.',
  },
  {
    section: '32-131', title: 'Soils Investigation Report', subtitle: 32,
    area: 'grading', elawsSlug: 'coor_subtitle32_div2_sec32-131',
    bearing: 'Soils report recommendations must be incorporated into the grading plan.',
  },

  // ── Subtitle 27 — zoning. Published on EncodePlus, not elaws. ─────────────
  {
    section: '27-4202', title: 'Residential Base Zones — dimensional standards', subtitle: 27,
    area: 'zoning_dimensional', elawsSlug: null,
    bearing:
      'Front, side and rear yard depths, lot coverage maximum, minimum net lot area and lot width. ' +
      'Drives the buildable envelope and the footprint cap. Use pgPrintUrl(634).',
  },
]

/** Sections governing whether the lot is legally buildable. */
export const PG_ACCESS_SECTIONS = PG_SITE_PLAN_CODE.filter(s => s.area === 'subdivision_access')

export function sitePlanCodeFor(area: SitePlanCodeArea): SitePlanCodeSection[] {
  return PG_SITE_PLAN_CODE.filter(s => s.area === area)
}

export function findSitePlanCode(section: string): SitePlanCodeSection | undefined {
  return PG_SITE_PLAN_CODE.find(s => s.section === section)
}

/**
 * The citation to give when a lot has no resolved street frontage.
 *
 * Kept here rather than inline so the requirement and its source stay together
 * — this was previously only a code comment, which made it documentation
 * rather than something the engine could cite.
 */
export const NO_STREET_FRONTAGE_FINDING = {
  code: 'NO_STREET_FRONTAGE',
  citation: "PGC Code Sec. 24-128, Private roads and easements; DPIE Design Review item E-4",
  message:
    'No fronting street was resolved for this lot. A legal buildable lot fronts a street; a parcel ' +
    'reached only by an ingress/egress easement requires a recorded private right-of-way easement.',
  effect:
    'Without a front lot line the front, side and rear setbacks cannot be assigned and the building ' +
    'cannot be oriented to the street. Every edge falls back to the front setback, which understates ' +
    'the buildable envelope.',
} as const
