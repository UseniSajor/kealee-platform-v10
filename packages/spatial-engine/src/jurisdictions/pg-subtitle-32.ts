/**
 * Prince George's County Code, Subtitle 32 — Water Resources Protection and
 * Grading Code.
 *
 * This is the code that actually governs a grading / site development plan, and
 * it was the largest gap in the rule pack: Subtitles 24, 25 and 27 were mapped
 * and 32 was not. The DPIE Site Rough Grading Design Review Checklist cites it
 * on nearly every line.
 *
 * ── A different publisher, and a different trap ─────────────────────────────
 *
 * The Zoning Ordinance is on EncodePlus. Subtitle 32 is NOT — it is part of the
 * Code of Ordinances, published server-rendered at princegeorges-md.elaws.us.
 * That host is a valid hash target: 21 KB of real section text, tables
 * included.
 *
 * Its trap is different from the EncodePlus one. eLaws slugs encode the
 * hierarchy, and the hierarchy is not uniform:
 *
 *     coor_subtitle32_div2_sec32-130            Division 2, no subdivision
 *     coor_subtitle32_div1_subdiv2_sec32-106    Division 1, SUBDIVISION 2
 *
 * A hand-built `div1_sec32-106` returns **HTTP 200** with a fallback page that
 * carries no section heading. Hashing it would produce a stable value that
 * never changes when 32-106 is amended — silently inert, the same failure mode
 * as the EncodePlus shell but arrived at from the opposite direction.
 *
 * Every slug below was therefore taken from the division table of contents and
 * verified by reading back the section heading, not constructed by pattern.
 * `assertSectionHeading()` exists so a refresh re-checks that at run time.
 *
 * ── Verified against the live site on 2026-08-22 ────────────────────────────
 */

import type { RegionLocator } from '../rules/source-refresh'
import type { SourceAuthority } from '../rules/model'
import type { CertifiableRule } from '../rules/certification'
import type { PgSourceBundle } from './pg-source-locators'

export const PG_ELAWS_HOST = 'https://princegeorges-md.elaws.us/code'

/** Divisions of Subtitle 32, for orientation and for future mapping. */
export const PG_SUBTITLE_32_DIVISIONS = [
  { division: 1, title: 'ADMINISTRATIVE PROVISIONS.', slug: 'coor_subtitle32_div1' },
  { division: 2, title: 'GRADING, DRAINAGE AND EROSION AND SEDIMENT CONTROL.', slug: 'coor_subtitle32_div2' },
  { division: 3, title: 'STORMWATER MANAGEMENT.', slug: 'coor_subtitle32_div3' },
  { division: 4, title: 'FLOODPLAIN ORDINANCE.', slug: 'coor_subtitle32_div4' },
  { division: 5, title: 'NONTIDAL WETLAND PROTECTION ORDINANCE.', slug: 'coor_subtitle32_div5' },
] as const

export interface PgSubtitle32Section {
  section: string
  /** Verified slug. NEVER build one of these by pattern — see the header. */
  slug: string
  /** Heading as the code prints it, used to prove the fetch landed. */
  heading: string
  ruleKeys: string[]
  /** Which Design Review Checklist items this section backs. */
  checklistItems: string[]
}

/**
 * The sections the Site Rough Grading Design Review Checklist cites.
 *
 * `ruleKeys` is deliberately sparse. A section is listed here because it is a
 * verified, hashable locator; binding a rule to it is a separate act that
 * requires the rule to actually exist in the pack. An empty `ruleKeys` means
 * "mapped and watchable, nothing extracted yet" — the same convention
 * PG_SUBTITLE_24_SECTIONS uses.
 */
export const PG_SUBTITLE_32_SECTIONS: PgSubtitle32Section[] = [
  {
    section: '32-106',
    slug: 'coor_subtitle32_div1_subdiv2_sec32-106',
    heading: 'Administration; Construction Documents.',
    ruleKeys: [],
    checklistItems: ['B-2'],
  },
  {
    // The one that carries drafting standards the renderer must obey:
    // sheet size, scale floor, contour interval, peripheral strip, and the
    // per-discipline preparer and certification requirements.
    section: '32-130',
    slug: 'coor_subtitle32_div2_sec32-130',
    heading: 'Contents of Grading/Site Development Plan.',
    ruleKeys: ['plan.content.grading'],
    checklistItems: ['B-10', 'A-9', 'B-4', 'B-5', 'B-6', 'B-7'],
  },
  {
    section: '32-131',
    slug: 'coor_subtitle32_div2_sec32-131',
    heading: 'Soils Investigation Report.',
    ruleKeys: [],
    checklistItems: ['C-2'],
  },
  {
    section: '32-151',
    slug: 'coor_subtitle32_div2_sec32-151',
    heading: 'Site Grades.',
    ruleKeys: [],
    checklistItems: ['A.1', 'A.2', 'A.3', 'A.4'],
  },
  {
    section: '32-156',
    slug: 'coor_subtitle32_div2_sec32-156',
    heading: 'Fill — Classes.',
    ruleKeys: [],
    checklistItems: ['C-3'],
  },
  {
    section: '32-161',
    slug: 'coor_subtitle32_div2_sec32-161',
    heading: 'Slopes — Setbacks.',
    ruleKeys: [],
    checklistItems: ['A.5'],
  },
  {
    section: '32-162',
    slug: 'coor_subtitle32_div2_sec32-162',
    heading: 'On-Site Drainage.',
    ruleKeys: [],
    checklistItems: ['A-6', 'A.7'],
  },
]

/** The only sanctioned way to build a Subtitle 32 URL. */
export function pgElawsUrl(section: PgSubtitle32Section): string {
  return `${PG_ELAWS_HOST}/${section.slug}`
}

/**
 * Proves a fetched document is the section it claims to be.
 *
 * eLaws answers an unknown slug with HTTP 200 and a page that has no section
 * heading, so status alone establishes nothing. A refresh that cannot find the
 * heading must be treated as a failed fetch, never as an empty region.
 */
export function assertSectionHeading(
  section: PgSubtitle32Section,
  normalized: string,
): { ok: true } | { ok: false; reason: string } {
  const needle = `§ ${section.section}.`.toLowerCase()
  const alt = `${section.section}.`.toLowerCase()
  const hay = normalized.toLowerCase()
  if (hay.includes(needle) || hay.includes(alt)) return { ok: true }
  return {
    ok: false,
    reason:
      `Fetched ${pgElawsUrl(section)} but the body carries no "§ ${section.section}." heading. ` +
      'eLaws serves unknown slugs as HTTP 200 with a fallback page; treat this as a failed ' +
      'fetch, not as an emptied section.',
  }
}

/** Region text for one section: heading to the amendment marker or next section. */
function sectionBody(section: PgSubtitle32Section): RegionLocator['extract'] {
  const marker = `§ ${section.section}.`.toLowerCase()
  return normalized => {
    const hay = normalized.toLowerCase()
    // The heading appears in the <title> as well as the body; the body copy is
    // the last one, and it is the one that carries the text.
    const at = hay.lastIndexOf(marker)
    if (at < 0) return null
    return normalized.slice(at, at + 60_000)
  }
}

/** One source per mapped section that actually backs a rule. */
export function buildPgSubtitle32Sources(
  rules: CertifiableRule[],
  opts: { retrievedAt?: string; version?: string } = {},
): PgSourceBundle[] {
  const retrievedAt = opts.retrievedAt ?? new Date().toISOString()
  const byKey = new Map(rules.map(r => [r.ruleKey, r.identity]))

  return PG_SUBTITLE_32_SECTIONS
    // Same convention as Subtitle 24: a section with no rule behind it is
    // documentation, not a refresh target. Hashing it would generate change
    // events nobody can act on.
    .filter(section => section.ruleKeys.length > 0)
    .map(section => {
      const ruleIdentities = section.ruleKeys
        .map(k => byKey.get(k))
        .filter((x): x is string => Boolean(x))

      return {
        authority: 'OFFICIAL_CODE' as SourceAuthority,
        locators: [{
          regionId: `sec-${section.section}`,
          label: `Sec. ${section.section} ${section.heading}`,
          ruleIdentities,
          extract: sectionBody(section),
        }],
        source: {
          sourceId: `pgc-elaws-${section.section}`,
          jurisdiction: 'prince_georges_md',
          title: `Prince George's County Code, Subtitle 32, Sec. ${section.section} — ${section.heading}`,
          url: pgElawsUrl(section),
          documentId: null,
          documentHash: '',
          version: opts.version ?? 'CB-15-2011',
          retrievedAt,
          regions: [],
          history: [],
        },
      }
    })
}

// ── Sec. 32-130(a) as data ──────────────────────────────────────────────────

/**
 * The drafting standards the renderer is bound by, quoted from 32-130(a).
 *
 * These are transcribed from the code text, not from the DPIE checklist. The
 * checklist paraphrases and in one place drops a qualifier that matters: it
 * states the 1"=50' floor flatly, where (a)(5) ends "...provided that such
 * other interval and scale has the Director's approval in advance of plan
 * preparation". A rule taken from the checklist alone would have been stricter
 * than the code and would have blocked legitimate plans.
 */
export interface PlanContentStandard {
  /** Subsection of 32-130(a). */
  paragraph: string
  requirement: string
  /** Where the engine honours it, or null if nothing does yet. */
  enforcedBy: string | null
}

export const PG_PLAN_CONTENT_STANDARDS: PlanContentStandard[] = [
  { paragraph: '(a)(1)', requirement: 'Paper size for plans shall not exceed 30" x 42".',
    enforcedBy: 'sheets/viewport.ts ARCH_D (24" x 36")' },
  { paragraph: '(a)(2)', requirement:
      'Date, name, address and telephone number of preparer of plans, or each discipline, and owner of site.',
    enforcedBy: 'review/content-scope.ts — divided-responsibility title block' },
  { paragraph: '(a)(3)', requirement:
      'Certification from preparer of the plan, or each discipline (surveying existing conditions, proposed ' +
      'surface grade establishments, load-bearing fills and slope stabilities, storm drainage, retaining walls, ' +
      'etc.), attesting to completeness and correctness of existing conditions and compliance of proposed work.',
    enforcedBy: 'review/content-scope.ts' },
  { paragraph: '(a)(4)', requirement:
      'Clear and definite delineation of limits of disturbance and areas where vegetation is to remain, with a ' +
      'calculation of the disturbed area in square feet.',
    enforcedBy: 'site-plan/disturbance.ts' },
  { paragraph: '(a)(5)', requirement:
      'Contours at one (1) or two (2) foot intervals, drawn at a scale no smaller than 1" = 50\' of the entire ' +
      'site, plus a minimum twenty (20) foot adjacent peripheral strip; or another interval and scale with the ' +
      "Director's approval in advance of plan preparation.",
    enforcedBy: 'sheets/viewport.ts PG_SCALE_GENERAL' },
  { paragraph: '(a)(6)', requirement:
      'Surplus earth disposal on sites ten (10) acres or larger: contours at no greater than five (5) foot ' +
      'intervals, scale no smaller than 1" = 200\'; work within fifty (50) feet of any property line reverts ' +
      'to paragraph (5).',
    enforcedBy: 'sheets/viewport.ts PG_SCALE_SURPLUS_EARTH_10AC' },
  { paragraph: '(a)(7)', requirement:
      'Delineation with dimensions sizing and locating areas for each class of fill proposed.', enforcedBy: null },
  { paragraph: '(a)(8)', requirement:
      'Established or approved tentative street grades (elevations), including M-NCPPC and/or DPW&T file numbers.',
    enforcedBy: null },
  { paragraph: '(a)(9)', requirement:
      'Basement, first floor and ground elevations at corners of all buildings, spot elevations at critical ' +
      'points, and profiles and/or cross sections of driveways, access lanes, walks and watercourses.',
    enforcedBy: null },
  { paragraph: '(a)(10)', requirement: 'Size, location and construction details of all proposed site development.',
    enforcedBy: null },
  { paragraph: '(a)(11)', requirement:
      'Drainage area map and study including computations covering the entire tributary area, showing calculated ' +
      'runoff to all structures, lines and open channel facilities.', enforcedBy: null },
  { paragraph: '(a)(12)', requirement:
      'Delineation of the proposed subdivision of the site for staging, with sequential construction order and a ' +
      'statement of respective areas in square feet.', enforcedBy: null },
  { paragraph: '(a)(13)', requirement:
      'Soil type per the USDA Soil Survey of Prince George\'s County or as determined by a professional engineer ' +
      'at each proposed residential building; for lots with a proposed basement, hydrological characteristics to ' +
      'six (6) feet below finished basement floor and depth to the closest aquifer.', enforcedBy: null },
  { paragraph: '(a)(14)', requirement:
      'Time required for performing and completing all work, with anticipated start and completion dates for each ' +
      'staged subdivision.', enforcedBy: null },
  { paragraph: '(a)(15)', requirement:
      'An approved Type 2 Tree Conservation Plan or valid letter of exemption from the Woodland Conservation ' +
      'Ordinance in conformance with Subtitle 25.',
    enforcedBy: null },
]

/** The 32-130(a) paragraphs nothing in the engine honours yet. */
export function unenforcedPlanContentStandards(): PlanContentStandard[] {
  return PG_PLAN_CONTENT_STANDARDS.filter(s => s.enforcedBy === null)
}
