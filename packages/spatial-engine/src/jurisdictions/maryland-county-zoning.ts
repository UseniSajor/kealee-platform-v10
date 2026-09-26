/**
 * Zoning limits for Anne Arundel, Frederick, Calvert, St. Mary's, Charles and
 * Howard counties — EVERY district on each county's zoning map, hand-read from
 * the county's own code with a citation on every value.
 *
 * Two layers per district:
 *
 *   · `sfd` — the single-family detached envelope the engine DRAWS: lot area,
 *     width, front / side / rear, coverage, height. Present only where the
 *     ordinance itself fixes those numbers for a detached house. Where it does
 *     not (planned districts, commercial and industrial districts, districts
 *     whose yards are set by a plan or by the neighbours) nothing is drawn.
 *   · `limits` — every other limit as printed (setbacks from rights-of-way and
 *     from residential districts, heights that rise with setback, FAR, density,
 *     district size), listed on the sheet for the reviewer.
 *
 * SOURCES, AND HOW CURRENT EACH IS (read 2026-09-26)
 *
 *   Howard       Zoning Regulations on Municode, product updated 2026-09-16
 *                (through Bill 3-2026). Current.
 *   Charles      Ch. 297, Attachment 3 (Figure VI), Supp. 15, July 2025, from
 *                eCode360. Current to that supplement.
 *   Calvert      Zoning Ordinance adopted by Ord. 13-25, effective 2025-03-01,
 *                the County's PDF of 2025-04-08. Amendments codified on
 *                eCode360 after that date were not read (eCode360 challenges
 *                this environment's requests).
 *   Frederick    Chapter 1-19, §1-19-6.100, Supp. S-40 (2024), read from the
 *                Internet Archive's copy of the County's code (American Legal
 *                challenges this environment). Bill 25-05 (2025-05-20) later
 *                changed only the critical-digital-infrastructure rows, which
 *                are therefore not relied on here.
 *   Anne Arundel Article 18 bulk regulations as codified (Supp. S-84, 2023; the
 *                R2 section at S-87, 2024), read from the Internet Archive's
 *                copies. The Council's bill logs for 2023–2026 and its list of
 *                ordinances pending codification show NO enacted amendment to
 *                these tables since. The County's online "Zoning Classifications
 *                Guide" prints different lot sizes and coverages (e.g. R2 10,000
 *                SF / 60%); those match no enacted text and are not used. The
 *                comprehensive Article 18 update introduced 2026-07-20 is not
 *                law and is not used.
 *   St. Mary's   Schedule 32.1 as amended 2012-07-31, from the County's
 *                consolidated ordinance (amended through 2014-11-18). The current
 *                code on Municode does not reproduce the schedule. The 2019
 *                Lexington Park Development District update added RM, MXL, MXM,
 *                MXH and LCI; their standards are NOT in the 2012 schedule and
 *                are not transcribed. Other districts carry the 2012 figures and
 *                say so.
 */

import type { CountyZoneStandard } from './county-zoning'

export type DistrictCategory =
  | 'agricultural' | 'rural_residential' | 'residential' | 'commercial' | 'industrial'
  | 'mixed_use' | 'planned' | 'maritime' | 'overlay' | 'municipal' | 'other'

/** One limit as printed. */
export type Limit = [label: string, value: string]

export interface MarylandDistrict {
  code: string
  zone: string
  name: string
  category: DistrictCategory
  citation: string
  /** The detached-house envelope the engine draws; null where the ordinance fixes none. */
  sfd: CountyZoneStandard | null
  limits: Limit[]
  notes: string[]
  /**
   *  current        — read from the code in force.
   *  dated          — read from an older edition; later amendments not reconciled.
   *  plan_governed  — the standards are set by an approved plan, not by a table.
   *  not_read       — the district's standards could not be read from here.
   *  municipal      — the land is zoned by an incorporated town, not the county.
   */
  status: 'current' | 'dated' | 'plan_governed' | 'not_read' | 'municipal'
}

const sfd = (
  zone: string, citation: string,
  v: { area: number | null; width: number | null; front: number; side: number; sideSum?: number | null; rear: number; cov?: number | null; height: number },
  notes: string[] = [],
): CountyZoneStandard => ({
  zone,
  // CountyZoneStandard carries numbers; a district with no minimum records 0
  // here and the note says "no minimum" — countyStandardRows prints the note.
  lotAreaSqFt: v.area ?? 0,
  lotWidthFt: v.width ?? 0,
  frontFt: v.front, sideFt: v.side, sideSumFt: v.sideSum ?? null, rearFt: v.rear,
  coveragePct: v.cov ?? null, heightFt: v.height, citation,
  notes: [
    ...(v.area == null ? ['No minimum lot area in this district.'] : []),
    ...(v.width == null ? ['No minimum lot width in this district.'] : []),
    ...notes,
  ],
})

const d = (code: string, zone: string, name: string, category: DistrictCategory, citation: string,
  opts: { sfd?: CountyZoneStandard | null; limits?: Limit[]; notes?: string[]; status?: MarylandDistrict['status'] } = {},
): MarylandDistrict => ({
  code, zone, name, category, citation,
  sfd: opts.sfd ?? null, limits: opts.limits ?? [], notes: opts.notes ?? [],
  status: opts.status ?? 'current',
})

// ═══ HOWARD ═════════════════════════════════════════════════════════════════
const HW = (s: string) => `Howard County Zoning Regulations §${s} (Municode, updated 2026-09-16)`
const HW_ROW = 'Setbacks from public street rights-of-way govern where larger; see the limits listed.'
const HW_PLANNED = 'Setbacks, lot sizes, heights and coverage are set by the approved development plan and criteria; nothing is drawn from a table.'

export const HOWARD_DISTRICTS: MarylandDistrict[] = [
  ...(['RC', 'RR'] as const).map(z => d('howard_md', z, z === 'RC' ? 'Rural Conservation' : 'Rural Residential', 'rural_residential',
    HW(z === 'RC' ? '104.0.E' : '105.0.E'), {
      sfd: sfd(z, HW(z === 'RC' ? '104.0.E' : '105.0.E'),
        { area: 40000, width: 100, front: 50, side: 10, rear: 30, height: 34 },
        ['Drawn for a lot under 3 acres (cluster lot, individual septic: 40,000 SF min). A lot of 3 acres or more takes front 75, side 30, rear 60 ft and 200 ft width.',
          'Height 34 ft; 40 ft with a gable, hip or gambrel roof.',
          'From a collector or arterial right-of-way: 75 ft. From a public street right-of-way at the side: 30 ft (60 ft on 3+ acres).']),
      limits: [['Non-cluster lot', '3 acres'], ['Cluster lot, shared drainfield', '33,000 SF'], ['Cluster lot maximum', '50,000 SF (60,000 SF by DPZ)'],
        ['Uses other than structures', '50 ft from street ROW, 30 ft from other lot lines']],
    })),
  d('howard_md', 'R-ED', 'Residential: Environmental Development', 'residential', HW('107.0.D'), {
    sfd: sfd('R-ED', HW('107.0.D'), { area: 6000, width: 50, front: 20, side: 7.5, rear: 25, height: 34 },
      ['Zero-lot-line: 4,000 SF, 40 ft width, 0 ft side with 15 ft between structures.', 'From an external public street right-of-way: 75 ft.']),
    limits: [['Density', '2 du per net acre'], ['From project boundary (SFD)', '30 ft'], ['SFA lot coverage', '60%'], ['SFA height (gable/hip/gambrel)', '40 ft']],
  }),
  d('howard_md', 'R-20', 'Residential: Single', 'residential', HW('108.0.D'), {
    sfd: sfd('R-20', HW('108.0.D'), { area: 20000, width: 60, front: 50, side: 10, rear: 30, height: 34 },
      ['Front 50 ft from a public street right-of-way; 30 ft where the street was constructed after 1993-10-18 — drawn at 50, the restrictive reading.',
        'From an arterial or collector: 40/50 ft front or side, 50 ft rear.', 'From lot lines (no street): front 20 ft.']),
  }),
  d('howard_md', 'R-12', 'Residential: Single', 'residential', HW('109.0.D'), {
    sfd: sfd('R-12', HW('109.0.D'), { area: 12000, width: 60, front: 20, side: 7.5, rear: 30, height: 34 },
      ['From an arterial or collector: 30 ft front or side, 50 ft rear.', 'Semi-detached: 15 ft one side. Zero-lot-line: 0 ft with 15 ft between structures.']),
  }),
  ...([
    ['R-SC', 'Residential: Single Cluster', '110.0.D', 34, [['Density', '4.0 du per net acre'], ['SFA building length', '120 ft (200 ft by DPZ)']]],
    ['R-SA-8', 'Residential: Single Attached', '111.0.D', 40, [['Density', '8.0 du per net acre'], ['Apartments from single-family districts', '100 ft']]],
    ['R-H-ED', 'Residential: Historic—Environmental', '111.1.D', 40, [['Density', '10.0 du per net acre'], ['From streams', '250 ft']]],
    ['R-A-15', 'Residential: Apartments', '112.0.D', 55, [['Density', '15 du per net acre'], ['Apartments from single-family districts', '100 ft']]],
    ['R-APT', 'Residential: Apartments', '112.1.D', 65, [['Density', '25 du per net acre'], ['Height with extra setback', '80 ft (1 ft per 2 ft of added setback)']]],
  ] as const).map(([z, name, s, h, lim]) => d('howard_md', z, name, 'residential', HW(s), {
    sfd: sfd(z, HW(s), { area: 6000, width: 60, front: 20, side: 7.5, rear: 30, height: h },
      [`Principal structure height ${h} ft.`, 'From an arterial or major collector: 30 ft front or side, 50 ft rear.', HW_ROW]),
    limits: [...lim] as Limit[],
  })),
  d('howard_md', 'R-MH', 'Residential: Mobile Home', 'residential', HW('113.1.D'), {
    limits: [['District size', '10 acres'], ['Mobile home lot', '4,000 SF (2,000 SF in a Traditional Residential Neighborhood)'], ['Lot width', '45 ft (20 ft TRN)'],
      ['Setbacks', 'front 5 ft from internal street, side 10, rear 10; 50 ft from external streets and other districts'], ['Height', '34 ft'], ['Coverage', '60%'], ['Density', '8 du per net acre'],
      ['Apartments and attached', 'R-A-15 standards apply']],
  }),
  d('howard_md', 'R-SI', 'Residential: Senior—Institutional', 'residential', HW('113.2.D'), {
    limits: [['Height', '40 ft; age-restricted apartments 50 ft and 4 stories'], ['From RC–R-SC residential lots', '75 ft'], ['From street ROW and other districts', '30 ft'], ['Density', '25 units per net acre']],
  }),
  d('howard_md', 'R-VH', 'Residential: Village Housing', 'residential', HW('114.1.D'), {
    limits: [['Single-family detached lot', '6,000 SF'], ['Height', '34 ft (45 ft for spires, belfries etc.)'], ['Density', '8 du per net acre']],
    notes: ['§114.1.D sets no yards; §128.0.A supplementary bulk regulations apply.'],
  }),
  d('howard_md', 'HO', 'Historic: Office', 'commercial', HW('114.2.D'), {
    limits: [['Height', '40 ft'], ['FAR', '3 to 1'], ['Density', '15 du per net acre'], ['SFD lot', '6,000 SF'], ['Front yard', 'equal to the nearest structure on the same side of the street']],
    notes: ['The front yard is set by the neighbouring building, so no envelope is drawn.'],
  }),
  d('howard_md', 'HC', 'Historic: Commercial', 'commercial', HW('114.3.D'), {
    limits: [['Height', '40 ft'], ['FAR', '3 to 1'], ['Front yard', 'equal to the nearest structure on the same side of the street'], ['Lot area per new dwelling', '2,000 SF']],
  }),
  d('howard_md', 'POR', 'Planned Office Research', 'commercial', HW('115.0.D'), {
    limits: [['Height', '50 ft; 80 ft with 1 ft per 2 ft of added setback'], ['District size', '2 acres'], ['From residential districts', '75 ft (restaurants 100 ft)'], ['From street ROW', '30 ft']],
  }),
  d('howard_md', 'PEC', 'Planned Employment Center', 'commercial', HW('116.0.D'), {
    limits: [['Open space', '25% of gross area'], ['Height', '80 ft from a street; 50 ft at the residential setback, to 80 ft with added setback'], ['District size', '50 contiguous acres'],
      ['From residential districts', '75 ft'], ['From street ROW', '30 ft (parking 10 ft)']],
  }),
  d('howard_md', 'BR', 'Business: Rural', 'commercial', HW('117.1.F'), {
    limits: [['Height', '34 ft'], ['Coverage', '30%'], ['From street ROW', '50 ft'], ['From residential property', '100 ft'], ['From business or industrial', '30 ft']],
  }),
  d('howard_md', 'OT', 'Office Transition', 'commercial', HW('117.3.E'), {
    limits: [['District size', '20,000 SF – 2 acres (in the PSA); 2–5 acres outside'], ['Height', '34 ft'], ['From arterial/major collector', '20 ft (30 ft outside PSA)'],
      ['From other streets', '40 ft (50 ft outside PSA)'], ['From residential districts', '30 ft (50 ft outside PSA)']],
  }),
  d('howard_md', 'CCT', 'Community Center Transition', 'commercial', HW('117.4.D'), {
    limits: [['Height', '40 ft; age-restricted apartments 50 ft'], ['From RC–R-SC districts', '50 ft'], ['From street ROW and other districts', '30 ft']],
  }),
  ...(['B-1', 'B-2'] as const).map(z => d('howard_md', z, z === 'B-1' ? 'Business: Local' : 'Business: General', 'commercial', HW(z === 'B-1' ? '118.0.D' : '119.0.D'), {
    limits: [['Height', '40 ft; 48 ft with a pitched roof'], ['From street ROW', '30 ft (parking 10 ft)'], ['From residential districts', '30 ft']],
  })),
  d('howard_md', 'SC', 'Shopping Center', 'commercial', HW('120.0.D'), {
    limits: [['Height', '40 ft'], ['District size', '10 acres'], ['From street ROW', '100 ft (parking 30 ft)'], ['From residential districts', '100 ft']],
  }),
  d('howard_md', 'CEF', 'Community Enhancement Floating', 'planned', HW('121.0.H'), {
    status: 'plan_governed', limits: [['Height', 'not over five stories']], notes: [HW_PLANNED],
  }),
  ...(['M-1', 'M-2'] as const).map(z => d('howard_md', z, z === 'M-1' ? 'Manufacturing: Light' : 'Manufacturing: Heavy', 'industrial', HW(z === 'M-1' ? '122.0.D' : '123.0.D'), {
    limits: [['Height', '50 ft; 100 ft with 1 ft per 2 ft of added setback'], ['From street ROW', '50 ft (parking 30 ft external / 10 ft internal)'],
      ['From residential districts', z === 'M-1' ? '100 ft (75 ft from CAC/TOD residential)' : '150 ft (100 ft from CAC/TOD residential)']],
  })),
  d('howard_md', 'NT', 'New Town', 'planned', HW('125.0'), { status: 'plan_governed', notes: ['Bulk requirements are those of the applicable Final Development Plan.'] }),
  d('howard_md', 'PGCC', 'Planned Golf Course Community', 'planned', HW('126.0.D'), {
    status: 'plan_governed',
    limits: [['SFD / SFA height', '34 ft (SFA gable roofs 40 ft)'], ['Apartments', '40 ft residential subdistrict; 80 ft multi-use'], ['Commercial', '120 ft'], ['Density', '2.0 du per gross acre']],
    notes: [HW_PLANNED],
  }),
  d('howard_md', 'MXD', 'Mixed Use', 'planned', HW('127.0'), { status: 'plan_governed', notes: [HW_PLANNED] }),
  d('howard_md', 'PSC', 'Planned Senior Community', 'planned', HW('127.1.F'), {
    status: 'plan_governed',
    limits: [['Density', '8 du per net acre (12 with added MIHU)'], ['From arterial/collector', '50 ft'], ['From other streets', '40 ft'], ['Height', 'apartments 60 ft; other 34 ft']],
    notes: [HW_PLANNED],
  }),
  d('howard_md', 'CE', 'Corridor Employment', 'mixed_use', HW('127.2.E'), {
    limits: [['Height', '60 ft; 100 ft with added setback'], ['From Route 1 ROW (Manual-compliant)', '10 ft; parking 40 ft; docks 60 ft'], ['From residential districts', '30–100 ft by use']],
  }),
  d('howard_md', 'TOD', 'Transit Oriented Development', 'mixed_use', HW('127.4.E'), {
    limits: [['Minimum density', '20 units per net acre'], ['Height', '60 ft; 100 ft with added setback; to 180 ft within 750 ft of a MARC platform'], ['From arterial', 'principal 20 ft, other 30 ft'], ['From residential districts', '30 ft']],
  }),
  d('howard_md', 'CAC', 'Corridor Activity Center', 'mixed_use', HW('127.5.D'), {
    limits: [['Density', '15–50 units per net acre by size'], ['Height', '55 ft on Route 1 (65 / 100 / 120 ft by use); 40 ft elsewhere; minimum 25 ft'], ['From residential districts', '20–30 ft']],
  }),
  // Overlays — the base district's standards apply, with the overlay's additions.
  ...([['DEO', 'Density Exchange Option overlay', '106.0'], ['I', 'Institutional overlay', '113.3'], ['CR', 'Commercial Redevelopment overlay', '121.1'],
    ['SW', 'Solid Waste overlay', '124.0'], ['CLI', 'Continuing Light Industrial overlay', '127.3'], ['TNC', 'Traditional Neighborhood Center overlay', '127.6.E']] as const)
    .map(([z, name, s]) => d('howard_md', z, name, 'overlay', HW(s), { notes: ['An overlay: the underlying district\'s standards apply, with this section\'s additions.'] })),
]

// ═══ ANNE ARUNDEL ═══════════════════════════════════════════════════════════
const AA = (s: string, sup = 'S-84, 2023') => `Anne Arundel County Code §${s} (codified, Supp. ${sup}; no amendment enacted since)`
const AA_ACC = 'Accessory structures (other than small sheds) keep their own, larger front setbacks — listed.'

const aaRes = (zone: string, s: string, name: string, v: Parameters<typeof sfd>[2], lim: Limit[], notes: string[], sup?: string) =>
  d('anne_arundel_md', zone, name, 'residential', AA(s, sup), { sfd: sfd(zone, AA(s, sup), v, notes), limits: lim })

export const ANNE_ARUNDEL_DISTRICTS: MarylandDistrict[] = [
  aaRes('RA', '18-4-301', 'Rural Agricultural', { area: 40000, width: 150, front: 40, side: 15, sideSum: 40, rear: 35, cov: 25, height: 45 },
    [['Corner side', '40 ft'], ['Principal arterial or higher', '50 ft'], ['Density', '1 du per 20 acres (plus residue rules)'], ['Cluster lot', '20,000–120,000 SF, 80 ft width']],
    [AA_ACC, 'Width is at the front building restriction line; for a waterfront lot it is measured from the rear lot line.']),
  aaRes('RLD', '18-4-401', 'Residential Low Density', { area: 40000, width: 150, front: 50, side: 20, sideSum: 50, rear: 40, cov: 25, height: 45 },
    [['Corner side', '40 ft'], ['Principal arterial', '75 ft'], ['Freeway', '150 ft'], ['Density', '1 du per 5 acres'], ['Crest of steep slopes', '50 ft planted buffer']],
    [AA_ACC, 'A lot under 40,000 SF platted before 1987-04-09 may be reviewed under R2 bulk (§18-4-601).']),
  aaRes('R1', '18-4-501', 'Residential', { area: 40000, width: 125, front: 40, side: 15, sideSum: 40, rear: 35, cov: 25, height: 45 },
    [['Corner side', '40 ft'], ['Principal arterial or higher', '50 ft'], ['Net density', '1 du per 40,000 SF'], ['Cluster', 'no minimum lot; coverage to 50%; front 5 ft (18 ft with front parking)']],
    [AA_ACC]),
  aaRes('R2', '18-4-601', 'Residential', { area: 15000, width: 80, front: 30, side: 7, rear: 25, cov: 30, height: 35 },
    [['Lot without public sewer', '20,000 SF'], ['Corner side', '20 ft'], ['Principal arterial or higher', '40 ft'], ['Net density', '2.5 du per acre (sewer); 1 per 20,000 SF without']],
    [AA_ACC, 'Drawn with public sewer (15,000 SF); without sewer the minimum is 20,000 SF.'], 'S-87, 2024'),
  aaRes('R5', '18-4-701', 'Residential', { area: 7000, width: 60, front: 25, side: 7, rear: 20, cov: 40, height: 35 },
    [['Corner side', '20 ft'], ['Principal arterial or higher', '35 ft'], ['Net density', '5 du per acre'], ['Cluster coverage', 'to 75%']],
    [AA_ACC]),
  ...(['R10', 'R15'] as const).map(z => d('anne_arundel_md', z, 'Residential', 'residential', AA(z === 'R10' ? '18-4-801' : '18-4-901'), {
    sfd: sfd(z, AA(`${z === 'R10' ? '18-4-801' : '18-4-901'}(b); §18-4-701`), { area: 7000, width: 60, front: 25, side: 7, rear: 20, cov: 40, height: 35 },
      ['A single-family detached dwelling on a recorded lot here complies with the R5 bulk regulations.']),
    limits: z === 'R10'
      ? [['Coverage (structures and parking)', '45%'], ['Front: arterial / collector', '35 / 20 ft'], ['Other lot lines', '15 ft'], ['Height', '50 ft with 1 ft per ft over 35'], ['Net density', '10 du per acre']]
      : [['Coverage (structures and parking)', '45%'], ['Front / side / rear', '20 / 15 / 30 ft'], ['Height', '55 ft with 1 ft per ft over 40'], ['Net density', '15 du per acre']],
  })),
  d('anne_arundel_md', 'R22', 'Residential', 'residential', AA('18-4-1001'), {
    limits: [['Coverage (structures and parking)', '45%'], ['Front / side / corner / rear', '20 / 25 / 30 / 30 ft'], ['Width (multiple dwellings)', '125 ft'],
      ['Height', 'none if all setbacks grow 1 ft per 2 ft over 45'], ['Net density', '22 du per acre']],
  }),
  d('anne_arundel_md', 'C1', 'Local Commercial', 'commercial', AA('18-5-201'), {
    limits: [['Lot', '11,000 SF; depth 100 ft'], ['Coverage (structures and parking)', '75%'], ['Front / side / rear', '20 / 10 / 20 ft'], ['From divided principal arterial', '60 ft'],
      ['FAR', '1.0'], ['Height', '45 ft; to 60 ft (72 ft with ESD) with added setback'], ['Establishment size', '25,000 SF retail; 50,000 SF office']],
  }),
  d('anne_arundel_md', 'C2', 'Commercial Office', 'commercial', AA('18-5-301'), {
    limits: [['Lot', '20,000 SF; depth 100 ft'], ['Coverage (structures and parking)', '80%'], ['Rear', '25 ft'], ['From divided principal arterial', '60 ft'], ['FAR', '1.0; 2.0 mixed with 30% residential'], ['Height', '60 ft (72 ft or none with ESD and added setback)']],
  }),
  d('anne_arundel_md', 'C3', 'General Commercial', 'commercial', AA('18-5-401'), {
    limits: [['Lot', '10,000 SF; depth 150 ft'], ['Coverage (structures and parking)', '80%'], ['Side / rear', 'none; 25 / 15 ft abutting residential'], ['From divided principal arterial', '60 ft'], ['FAR', '2.0'], ['Height', '60 ft (72 ft with ESD), setbacks +1 ft per ft over 45']],
  }),
  d('anne_arundel_md', 'C4', 'Highway Commercial', 'commercial', AA('18-5-501'), {
    limits: [['Lot', '10,000 SF; depth 150 ft'], ['Coverage (structures and parking)', '85%'], ['Front / rear', '20 / 20 ft'], ['From divided principal arterial', '60 ft'], ['FAR', '1.0'], ['Height', '60 ft (72 ft with ESD)']],
  }),
  d('anne_arundel_md', 'W1', 'Industrial Park', 'industrial', AA('18-6-201'), {
    limits: [['Lot', '40,000 SF min, 1 acre average; industrial park 20 acres'], ['Front / side / rear', '50 / 30 / 30 ft'], ['Freeway / divided arterial / other road', '100 / 60 / 50 ft'], ['Coverage (structures and parking)', '75%'], ['Width', '150 ft'], ['Height', 'none if setbacks grow 1 ft per 2 ft over 90']],
  }),
  d('anne_arundel_md', 'W2', 'Light Industrial', 'industrial', AA('18-6-301'), {
    limits: [['Lot', '8,000 SF; depth 100; width 75 ft'], ['Coverage (structures and parking)', '80%'], ['Front / side / rear', '20 / 15 / 30 ft'], ['Rear abutting residential', '100 ft'], ['Height', '75 ft (87 ft with ESD) with added setback'], ['Existing dwelling in a residential district (lot > 10 ac)', '100 ft (§18-6-102)']],
  }),
  d('anne_arundel_md', 'W3', 'Heavy Industrial', 'industrial', AA('18-6-401'), {
    limits: [['Lot', '6,000 SF; depth 100; width 75 ft'], ['Coverage (structures and parking)', '80%'], ['Front / side / rear', '10 / 10 / 20 ft'], ['Abutting residential / commercial', '200 / 50 ft'], ['Height', '75 ft (87 ft with ESD) with added setback']],
  }),
  ...(['MA1', 'MA1-B', 'MA2', 'MA3', 'MB', 'MC'] as const).map(z => d('anne_arundel_md', z, 'Maritime', 'maritime', AA('18-7-106'), {
    limits: [['Site', '1 acre above mean high water'], ['Coverage', ['MB', 'MC'].includes(z) ? '80% incl. dry storage' : '70%; dry storage 50%'], ['Side / rear / road ROW', '15 / 20 / 40 ft'],
      ['Front', 'by Critical Area criteria; no structures in the front yard (§18-7-105)'], ['Height', '40 ft; more if setbacks grow 2 ft per ft']],
  })),
  ...(['MXD-G', 'MXD-N', 'MXD-S', 'MXD-U'] as const).map(z => d('anne_arundel_md', z, 'Mixed Use', 'mixed_use', AA('18-8-303'), {
    status: 'not_read',
    notes: ['The codified text read (2023) names MXD-R, -C, -E and -T; the map now shows MXD-G, -N, -S and -U, so the districts were renamed after that text. Standards are prepared by staff from the current §18-8-303.'],
  })),
  ...([['OTC-C', 'Odenton Town Center'], ['OTC-E', 'Odenton Town Center'], ['OTC-FM', 'Odenton Town Center'], ['OTC-H', 'Odenton Town Center'], ['OTC-I', 'Odenton Town Center'], ['OTC-T', 'Odenton Town Center']] as const)
    .map(([z, name]) => d('anne_arundel_md', z, name, 'planned', AA('18-9-101'), { status: 'plan_governed', notes: ['Governed by the Odenton Town Center Master Plan and its design standards.'] })),
  d('anne_arundel_md', 'SB', 'Small Business', 'commercial', AA('18-9'), { status: 'not_read', notes: ['Title 9 district; its bulk regulations were not among the sections read.'] }),
  d('anne_arundel_md', 'TC', 'Town Center', 'planned', AA('18-9'), { status: 'plan_governed', notes: ['Governed by the applicable town center plan.'] }),
  d('anne_arundel_md', 'OS', 'Open Space', 'other', AA('18-9-201'), { status: 'not_read', notes: ['Open Space district; bulk regulations not read.'] }),
  d('anne_arundel_md', 'CITY', 'City of Annapolis', 'municipal', 'City of Annapolis Code, Title 21', { status: 'municipal', notes: ['Zoned by the City of Annapolis, not the County.'] }),
]

// ═══ FREDERICK ══════════════════════════════════════════════════════════════
const FR = 'Frederick County Code §1-19-6.100 (Supp. S-40, 2024)'
const FR_NOTE = 'Lot area, width and yards may be modified under §1-19-8.620 (R3–R16, VC) and §1-19-7.520 (MX).'
const frRes = (zone: string, name: string, area: number, width: number, front: number, side: number, rear: number, height = 30, extra: Limit[] = []) =>
  d('frederick_md', zone, name, 'residential', FR, {
    sfd: sfd(zone, `${FR}, ${zone} single-family row`, { area, width, front, side, rear, height }, [FR_NOTE, 'The table sets no lot coverage.']),
    limits: extra,
  })

export const FREDERICK_DISTRICTS: MarylandDistrict[] = [
  d('frederick_md', 'RC', 'Resource Conservation', 'rural_residential', FR, {
    sfd: sfd('RC', `${FR}, RC single-family row`, { area: 435600, width: 300, front: 50, side: 50, rear: 50, height: 30 }, ['10 acres per dwelling.']),
  }),
  d('frederick_md', 'A', 'Agricultural', 'agricultural', FR, {
    sfd: sfd('A', `${FR}, A residential row; §1-19-7.300`, { area: null, width: 100, front: 40, side: 10, rear: 30, height: 30 },
      ['Lot area for a dwelling is set by §1-19-7.300 (agricultural lot rules), not by this table.', 'Two-family: 150 ft width, 15 ft sides.']),
    limits: [['Natural resource and other uses', '5 acres, 300 ft width, 40 / 50 / 50 ft']],
  }),
  frRes('R1', 'Residential One', 40000, 100, 40, 10, 30, 30, [['Two-family', '2 acres; 150 ft width; 15 ft sides']]),
  frRes('R3', 'Residential Three', 12000, 80, 30, 10, 30, 30, [['Two-family', '24,000 SF; 100 ft width']]),
  frRes('R5', 'Residential Five', 8000, 70, 30, 8, 30, 30, [['Two-family', '16,000 SF; 80 ft width'], ['Townhouse', '§§1-19-8.470 to .470.7']]),
  frRes('R8', 'Residential Eight', 6000, 65, 25, 8, 30, 30, [['Multifamily', '5,000 SF per unit; 150 ft width; 40 / 30 / 50 ft; 40 ft height']]),
  frRes('R12', 'Residential Twelve', 6000, 65, 25, 8, 30, 30, [['Multifamily', '3,600 SF per unit; 150 ft width; height to 100 ft, side yard equal to height']]),
  frRes('R16', 'Residential Sixteen', 6000, 60, 25, 8, 30, 30, [['Multifamily', '2,700 SF per unit; 100 ft width; height to 100 ft, side yard equal to height']]),
  d('frederick_md', 'VC', 'Village Center', 'mixed_use', FR, {
    limits: [['Single-family', '6,000 SF per unit; 65 ft width; 30 ft height'], ['Yards', 'per §1-19-7.500(B)(2)–(3)'], ['Density', 'per §1-19-7.500(B)(1)']],
    notes: ['Yards are set by §1-19-7.500(B), which was not read, so no envelope is drawn.'],
  }),
  d('frederick_md', 'MX', 'Mixed Use', 'mixed_use', FR, {
    sfd: sfd('MX', `${FR}, MX single-family row`, { area: 6000, width: 60, front: 20, side: 8, rear: 30, height: 40 }, [FR_NOTE]),
    limits: [['Commercial', '12,000 SF; 75 ft width; 20 / 8 / 35 ft; 60 ft height'], ['Multifamily', '2,700 SF per unit; 60 ft height']],
  }),
  d('frederick_md', 'GC', 'General Commercial', 'commercial', FR, {
    limits: [['Commercial use', '12,000 SF; 100 ft width; front 25, side 8, rear 25 ft; 60 ft height'], ['Hotel', '20,000 SF; 25 / 15 / 40 ft'], ['Institutional/utility', '12,000 SF; 40 / 40 / 40 ft; 30 ft']],
  }),
  d('frederick_md', 'LI', 'Limited Industrial', 'industrial', FR, {
    limits: [['Industrial', '20,000 SF; 100 ft width; front 25, side equal to building height, rear 20 ft; 60 ft height'], ['Utilities', '200 ft width; 40–50 ft yards; 30 ft']],
    notes: ['Critical digital infrastructure rows were amended by Bill 25-05 and are not relied on.'],
  }),
  d('frederick_md', 'GI', 'General Industrial', 'industrial', FR, {
    limits: [['All permitted uses', '1 acre; 150 ft width; front 25, side 15, rear 40 ft; 60 ft height']],
    notes: ['Critical digital infrastructure rows were amended by Bill 25-05 and are not relied on.'],
  }),
  d('frederick_md', 'ORI', 'Office/Research Industrial', 'industrial', FR, {
    limits: [['Industrial and office', '80,000 SF; 200 ft width'], ['Other commercial', '40,000 SF; 100 ft width'], ['Yards', 'front 50, side 25, rear 40 ft — or the building height if greater'], ['Height', '60 ft']],
  }),
  d('frederick_md', 'PUD', 'Planned Unit Development', 'planned', 'Frederick County Code §1-19-10.500', { status: 'plan_governed', notes: ['Standards set by the approved PUD plan.'] }),
  d('frederick_md', 'MXD', 'Mixed Use Development', 'planned', 'Frederick County Code §1-19-10.500', { status: 'plan_governed', notes: ['Standards set by the approved MXD plan.'] }),
  d('frederick_md', 'MUN', 'Municipality', 'municipal', 'the municipality\'s own code', { status: 'municipal', notes: ['Inside an incorporated municipality that zones its own land.'] }),
  ...(['MM', 'OSR', 'W', 'IE'] as const).map(z => d('frederick_md', z, 'District not in §1-19-6.100', 'other', FR, { status: 'not_read', notes: [`"${z}" appears on the County map but has no rows in the design-requirements table; its standards are prepared by staff.`] })),
]

// ═══ CALVERT ════════════════════════════════════════════════════════════════
const CV = (t: string) => `Calvert County Zoning Ordinance ${t} (Ord. 13-25, eff. 2025-03-01)`
const CV_H = 'Height 40 ft including the roof (§25-5.B).'
const CV_FRONT = 'Front drawn at 60 ft ("all other roads"); 25 ft on an interior subdivision road; 100 ft on MD 2, 4, 2/4, 231, 260, 261 and 263. Front roadway buffer §25-2.B.4 may add to it.'
export const CALVERT_DISTRICTS: MarylandDistrict[] = [
  d('calvert_md', 'FFD', 'Farm and Forest', 'agricultural', CV('Table 4-1'), {
    sfd: sfd('FFD', CV('Table 4-1'), { area: 43560, width: 100, front: 60, side: 10, rear: 35, height: 40 },
      ['Drawn for a 1-acre clustered lot; a non-clustered lot is 25 acres.', CV_FRONT, CV_H]),
    limits: [['Base density', '1 du per 20 acres'], ['Non-residential', '3 acres; front 100/60, side 50, rear 50 ft']],
  }),
  ...([['RCD', 'Rural Community', 43560, 100, 60, 10, 35, '1 du per 20 acres; 1 per 5 with TDRs', 'Drawn for a 1-acre clustered lot; non-clustered 3 acres.'],
    ['RND', 'Rural Neighborhood', 43560, 100, 60, 10, 35, '1 du per 20 acres; 1 per acre with TDRs', '']] as const)
    .map(([z, name, area, width, front, side, rear, dens, note]) => d('calvert_md', z, name, 'rural_residential', CV('Table 5-1'), {
      sfd: sfd(z, CV('Table 5-1'), { area, width, front, side, rear, height: 40 }, [note, CV_FRONT, CV_H].filter(Boolean)),
      limits: [['Density', dens], ['Non-residential', '3 acres; front 100/60, side 50, rear 50 ft']],
    })),
  d('calvert_md', 'WCD', 'Waterfront Community', 'rural_residential', CV('Table 5-1'), {
    sfd: sfd('WCD', CV('Table 5-1'), { area: null, width: 75, front: 25, side: 6, rear: 20, height: 40 }, ['Water-frontage width 100 ft.', CV_H]),
  }),
  d('calvert_md', 'RD', 'Residential', 'residential', CV('Table 6-1'), {
    sfd: sfd('RD', CV('Table 6-1'), { area: 10000, width: 75, front: 60, side: 10, rear: 35, height: 40 },
      ['Drawn with sewer (10,000 SF); without sewer 1 acre.', CV_FRONT, CV_H]),
    limits: [['Density', '1 du per 4 acres; 1 per acre with TDRs'], ['Townhouse / multi-family', 'Table 25-1: front 100/25/60, side 10, rear 35, 50 ft from outside'], ['Non-residential', '1 acre; front 100/35, side 35, rear 35 ft']],
  }),
  ...([['RC', 'Rural Commercial'], ['MC', 'Marine Commercial'], ['EC', 'Employment Center']] as const).map(([z, name]) => d('calvert_md', z, name, 'commercial', CV('Table 7-1'), {
    limits: [['Front: MD routes / local / other', '100 / 35 / 50 ft'], ['Side / rear', '50 / 50 ft'], ['Height', '40 ft (§25-5.B)'], ...(z === 'MC' ? [['Water-frontage width', '60 ft'] as Limit] : [])],
  })),
  ...([['I-1', 'Light Industrial and Mixed-Use', '40 ft'], ['I-2', 'Heavy Industrial', '75 ft, set back twice its height from all property lines']] as const)
    .map(([z, name, h]) => d('calvert_md', z, name, 'industrial', CV('Table 8-1'), {
      limits: [['Front: MD routes / local / other', '100 / 35 / 50 ft'], ['Side / rear', '50 / 50 ft'], ['Height', `${h} (§25-5.B)`]],
    })),
  d('calvert_md', 'TC', 'Town Center', 'planned', 'the Town Center Zoning Ordinance for that town center', {
    status: 'plan_governed', notes: ['Regulated by the town center\'s own zoning ordinance (§1-3.F); the County ordinance applies only where it is silent.'],
  }),
]

// ═══ ST. MARY'S ═════════════════════════════════════════════════════════════
const SM = "St. Mary's County Comprehensive Zoning Ordinance, Schedule 32.1 (as amended 2012-07-31)"
const SM_NOTE = "From the 2012 schedule (the current code on Municode does not reproduce it); later amendments are not reconciled — confirm against the County's current Schedule 32.1."
const SM_FRONT = 'Front 25 ft on a minor collector or lesser road; 35 ft on a major collector; 50 ft on an arterial (footnote 1). Setbacks apply from the edge of the right-of-way and from Sensitive Areas (§32.3.2).'
const smRes = (zone: string, name: string, width: number | null, side: number, rear: number, height: number, extra: string[] = [], lim: Limit[] = []) =>
  d('st_marys_md', zone, name, zone.startsWith('R') ? 'residential' : 'mixed_use', SM, {
    status: 'dated',
    sfd: sfd(zone, `${SM}, ${zone} column`, { area: null, width, front: 25, side, rear, height },
      [SM_FRONT, height === 40 ? 'Height 40 ft; 50 ft if side and rear yards grow 1 ft per ft (footnote 7).' : `Height ${height} ft.`, ...extra, SM_NOTE]),
    limits: lim,
  })
export const ST_MARYS_DISTRICTS: MarylandDistrict[] = [
  smRes('RPD', 'Rural Preservation', 150, 15, 20, 40, ['Depth 160 ft; frontage 75 ft.'], [['Density', '1 du per 5 acres base; 1 per 3 maximum']]),
  smRes('RSC', 'Rural Service Center', null, 15, 20, 40),
  smRes('RCL', 'Rural Commercial Limited', null, 15, 20, 40),
  smRes('RL-T', 'Residential Low-Density Transitional', 75, 10, 20, 40, ['Depth 100 ft; frontage 50 ft.']),
  smRes('RL', 'Residential Low-Density', 75, 10, 20, 40, ['Depth 100 ft; frontage 50 ft.'], [['Density', '1 du per acre base; 5 maximum']]),
  smRes('RH', 'Residential High-Density', null, 10, 20, 75, ['Depth 60 ft.'], [['Density', '10 base; 20 maximum']]),
  smRes('RNC', 'Residential Neighborhood Conservation', 75, 10, 20, 40, ['Depth 100 ft; frontage 50 ft.', 'Front yard may be set by setback averaging (footnote 9).']),
  smRes('RMX', 'Residential Mixed-Use', null, 15, 25, 40),
  smRes('VMX', 'Village Center Mixed-Use', 80, 15, 25, 40, ['Depth 100 ft; frontage 50 ft.']),
  smRes('TMX', 'Town Center Mixed-Use', 80, 15, 25, 40, ['Depth 100 ft; frontage 50 ft.']),
  d('st_marys_md', 'CMX', 'Corridor Mixed-Use', 'mixed_use', SM, {
    status: 'dated',
    limits: [['Front: minor collector / major / arterial', '20 / 30 / 50 ft'], ['Side / rear', '10 / 20 ft; +50 ft abutting RL or RNC'], ['Width', '80 ft'], ['Height', '100 ft']],
    notes: [SM_NOTE],
  }),
  ...([['OBP', 'Office Business Park', '100', '20 / 25', '100 ft'], ['I', 'Industrial', '100', '25 / 25', '100 ft'], ['CM', 'Commercial Marine', 'none (lot 1 acre)', '25 / 25', '60 ft']] as const)
    .map(([z, name, w, sr, h]) => d('st_marys_md', z, name, z === 'I' ? 'industrial' : 'commercial', SM, {
      status: 'dated', limits: [['Width', w], ['Front: minor collector / major / arterial', '25 / 35 / 50 ft'], ['Side / rear', `${sr} ft`], ['Height', h]], notes: [SM_NOTE],
    })),
  ...([['RM', 'Residential Medium-Density'], ['MXL', 'Low-Intensity Mixed-Use'], ['MXM', 'Medium-Intensity Mixed-Use'], ['MXH', 'High-Intensity Mixed-Use'], ['LCI', 'Limited Commercial Industrial']] as const)
    .map(([z, name]) => d('st_marys_md', z, name, z === 'RM' ? 'residential' : 'mixed_use', "St. Mary's County Comprehensive Zoning Ordinance, Schedule 32.1 (2019 Lexington Park update)", {
      status: 'not_read', notes: ['Added by the 2019 Lexington Park Development District update; its Schedule 32.1 column is published only as a scanned attachment and was not read. Standards are prepared by staff.'],
    })),
]

// ═══ CHARLES ════════════════════════════════════════════════════════════════
const CH = (f: string) => `Charles County Code Ch. 297, Figure ${f} (Attachment 3, Supp. 15, Jul 2025)`
const CH_H = 'Height 36 ft and 3 stories; a habitable roof level may be added under §297-27A(3).'
const chRes = (zone: string, name: string, fig: string, cat: DistrictCategory, v: Parameters<typeof sfd>[2], notes: string[] = [], lim: Limit[] = []) =>
  d('charles_md', zone, name, cat, CH(fig), { sfd: sfd(zone, CH(fig), v, notes), limits: lim })

export const CHARLES_DISTRICTS: MarylandDistrict[] = [
  chRes('AC', 'Agricultural Conservation', 'VI-1', 'agricultural', { area: 130680, width: 150, front: 75, side: 40, sideSum: 80, rear: 50, height: 40 },
    ['Depth 200 ft; frontage 120 ft.', 'A residential lot under 3 acres created before 1974-12-31: 20,000 SF; 30 / 8 (18 total) / 20 ft.']),
  chRes('RC', 'Rural Conservation', 'VI-2', 'rural_residential', { area: 130680, width: 120, front: 50, side: 30, sideSum: 60, rear: 50, height: 36 },
    ['RC(D): 10 acres.', 'A lot under 3 acres existing before 2000-10-31: 30 / 15 (35 total) / 36 ft.', CH_H]),
  chRes('RR', 'Rural Residential', 'VI-2', 'rural_residential', { area: 30000, width: 100, front: 40, side: 20, sideSum: 40, rear: 40, cov: 25, height: 36 },
    ['Depth 150 ft; frontage 80 ft. Minimum open space 15%.', CH_H]),
  chRes('RV', 'Village Residential', 'VI-3', 'rural_residential', { area: 20000, width: 80, front: 30, side: 10, sideSum: 25, rear: 30, cov: 30, height: 36 },
    ['Depth 100 ft; frontage 65 ft. Minimum open space 15%.', CH_H], [['Duplex', '18,000 SF; 50 ft width; 30 / 15 / 40 ft']]),
  chRes('CV', 'Village Commercial', 'VI-3', 'commercial', { area: 43560, width: 100, front: 30, side: 6, sideSum: 12, rear: 10, height: 36 },
    ['Residential row; 20,000 SF per dwelling unit. FAR 0.35; ISR 0.7.', CH_H]),
  chRes('RL', 'Low Density Suburban Residential', 'VI-4', 'residential', { area: 18000, width: 70, front: 30, side: 15, sideSum: 35, rear: 30, cov: 30, height: 36 },
    ['Depth 80 ft; frontage 65 ft. Minimum open space 15%.', CH_H]),
  chRes('RM', 'Medium Density Suburban Residential', 'VI-4', 'residential', { area: 12000, width: 60, front: 25, side: 8, sideSum: 20, rear: 25, cov: 35, height: 36 },
    ['Depth 65 ft; frontage 50 ft. Minimum open space 15%.', CH_H], [['Townhouse', '1,500 SF lot; front 18 ft; rear 15–35 ft by garage type; 60% coverage']]),
  chRes('RH', 'High Density Suburban Residential', 'VI-4', 'residential', { area: 8000, width: 50, front: 20, side: 8, sideSum: 20, rear: 25, cov: 40, height: 36 },
    ['Depth 55 ft; frontage 45 ft. Minimum open space 15%.', CH_H], [['Townhouse', '1,500 SF lot; front 18 ft; rear 15–35 ft by garage type; 60% coverage']]),
  chRes('RO', 'Residential Office', 'VI-4', 'mixed_use', { area: 14000, width: 70, front: 30, side: 10, sideSum: 25, rear: 25, cov: 40, height: 36 },
    ['Depth 100 ft; frontage 60 ft.', CH_H], [['Apartments / mixed-use building', '10,000 SF; front 0; side 12; 90% coverage; FAR 0.5–1.0']]),
  chRes('CN', 'Neighborhood Commercial', 'VI-5', 'commercial', { area: 20000, width: 100, front: 30, side: 6, sideSum: 12, rear: 10, height: 36 },
    ['Residential row. FAR 0.30 for other uses.', CH_H]),
  chRes('CC', 'Community Commercial', 'VI-5', 'commercial', { area: 43560, width: 100, front: 75, side: 30, sideSum: 60, rear: 50, height: 36 },
    ['Residential row; 20,000 SF per dwelling unit.'], [['Commercial', '2 acres (10,000 SF with consolidated access); front 30, side 6, rear 10 ft; 40 ft; FAR 0.40; ISR 0.85']]),
  chRes('CB', 'Central Business', 'VI-5', 'commercial', { area: 43560, width: 100, front: 50, side: 30, sideSum: 60, rear: 50, height: 60 },
    ['Residential row; 10,000 SF per dwelling unit.'], [['Commercial', '2 acres; front 25, side 6, rear 10 ft; 60 ft / 5 stories; FAR 0.60; ISR 0.9']]),
  d('charles_md', 'BP', 'Business Park', 'commercial', CH('VI-5'), {
    limits: [['Lot', '2 acres (30,000 SF with consolidated access); tract 10 acres'], ['Front / side / rear', '50 / 20 / 25 ft'], ['Height', '60 ft / 5 stories'], ['FAR', '0.35 (hotels and flex 0.50)']],
  }),
  d('charles_md', 'ABP', 'Aviation Business Park', 'commercial', CH('VI-5'), {
    limits: [['Lot', '2 acres'], ['Front / side / rear', '50 / 20 / 25 ft'], ['Height', '36 ft / 3 stories'], ['FAR', '0.35'], ['Residential lot before 2017-06-06', 'front 30, side 8, rear 20 ft; 40 ft']],
  }),
  chRes('IG', 'Light Industrial', 'VI-6', 'industrial', { area: 43560, width: 100, front: 75, side: 30, sideSum: 60, rear: 50, height: 36 },
    ['Residential row. FAR 0.40.'], [['Industrial and commercial', '1 acre; front 50, side 6, rear 10 ft; FAR 0.50; ISR 0.75']]),
  d('charles_md', 'IH', 'Heavy Industrial', 'industrial', CH('VI-6'), {
    limits: [['Industrial', '3 acres; front 50, side 6, rear 10 ft'], ['Height', '50 ft / 4 stories'], ['FAR', '0.50'], ['ISR', '0.6']],
  }),
  ...([['CRR', 'Core Retail/Residential', 40], ['CER', 'Core Employment/Residential', 40], ['CMR', 'Core Mixed Residential', 36]] as const)
    .map(([z, name, h]) => chRes(z, name, 'VI-7', 'mixed_use', { area: 5000, width: 55, front: 10, side: 6, sideSum: 12, rear: 20, height: h },
      ['Depth 75 ft; frontage 30 ft. Minimum open space 20%.', 'Height to 3 stories; a habitable roof level may be added under §297-27A(3).'],
      [['Townhouse', '1,500 SF; front 16–18 ft; rear 18–35 ft'], ['Mixed-use building', '10,000 SF; front 10, max yard 18; 50 ft / 2–4 stories; FAR 0.50']])),
  ...([['WC', 'Waldorf Central'], ['AUC', 'Acton Urban Center']] as const).map(([z, name]) => d('charles_md', z, name, 'mixed_use', CH('VI-9'), {
    limits: [['Townhouse', 'front 16–18 ft (max 10), rear 18–35 ft; 2–3 (WC) or 2–4 (AUC) stories; 70% coverage'],
      ['Apartments / commercial', '10,000 SF; front 0 (max 12); FAR 0.5–1.6 (WC) or 0.7–2.0 (AUC), to 2.5 near light rail, to 6.0 in AUC'], ['Transitional provisions', '§297-97O']],
    notes: ['No single-family detached row in this district.'],
  })),
  chRes('WCD', 'Watershed Conservation District', 'VI-10', 'rural_residential', { area: 130680, width: 200, front: 50, side: 40, sideSum: 80, rear: 50, cov: 10, height: 40 },
    ['Depth and frontage 200 ft. Maximum ISR 8%.', 'A residential lot under 3 acres created before 2017-06-06: 20,000 SF; 30 / 8 (20 total) / 20 ft.']),
  ...([['HVC', 'Hughesville Village Core', 5000, 50, 10, 6, 12, 20, 50, 'Front 10 ft minimum, 25 ft maximum.'],
    ['HVG', 'Hughesville Village Gateway', 5000, 50, 10, 6, 12, 20, 50, 'Front 10 ft minimum, 25 ft maximum.'],
    ['HVR', 'Hughesville Village Residential', 10000, 70, 25, 8, 20, 25, 35, '']] as const)
    .map(([z, name, area, width, front, side, sum, rear, cov, note]) => chRes(z, name, 'VI-14', 'mixed_use',
      { area, width, front, side, sideSum: sum, rear, cov, height: 36 }, ['Height 36 ft / 2 stories.', note].filter(Boolean))),
  d('charles_md', 'HVE', 'Hughesville Village Employment', 'commercial', CH('VI-14'), {
    limits: [['Lot', '10,000 SF; 100 ft width'], ['Front / side / rear', '10 / 20 / 50 ft'], ['Height', '36 ft / 2 stories'], ['FAR', '0.75']],
  }),
  ...([['PRD', 'Planned Residential Development'], ['PUD', 'Planned Unit Development'], ['MX', 'Planned Mixed Use'], ['PEP', 'Planned Employment/Industrial Park'],
    ['PMH', 'Planned Manufactured Home Park'], ['WPC', 'Waterfront Planned Community'], ['TOD', 'Transit Oriented Development']] as const)
    .map(([z, name]) => d('charles_md', z, name, 'planned', 'Charles County Code Ch. 297, Article VII (planned development zones)', {
      status: 'plan_governed', notes: ['Planned development zone: standards are set by the approved plan, not by Figure VI.'],
    })),
  ...([['LA PLATA', 'Town of La Plata'], ['INDIAN HEAD', 'Town of Indian Head']] as const)
    .map(([z, name]) => d('charles_md', z, name, 'municipal', `${name} zoning ordinance`, { status: 'municipal', notes: [`Zoned by the ${name}, not the County.`] })),
]

// ═══ Registry ═══════════════════════════════════════════════════════════════

export const MARYLAND_DISTRICTS: Record<string, MarylandDistrict[]> = {
  howard_md: HOWARD_DISTRICTS,
  anne_arundel_md: ANNE_ARUNDEL_DISTRICTS,
  frederick_md: FREDERICK_DISTRICTS,
  calvert_md: CALVERT_DISTRICTS,
  st_marys_md: ST_MARYS_DISTRICTS,
  charles_md: CHARLES_DISTRICTS,
}

/** Howard's map joins a base district to its overlays: "R-20-MXD-3", "RC-DEO", "B -1-CR", "CEF-M". */
function howardBase(raw: string): { base: string; overlays: string[] } {
  let z = raw.toUpperCase().replace(/\s+/g, '')
  if (z === 'RSI') z = 'R-SI'
  const overlays: string[] = []
  const mxd = z.match(/-(MXD-\d)$/)
  if (mxd) return { base: 'MXD', overlays: [z.slice(0, -mxd[0].length)] }
  // Overlays stack in any order ("CAC-CLI-CR"): strip from the end until none is left.
  for (let stripped = true; stripped;) {
    stripped = false
    for (const o of ['-DEO', '-CLI', '-CR', '-TNC', '-I']) {
      if (z.endsWith(o)) { overlays.unshift(o.slice(1)); z = z.slice(0, -o.length); stripped = true }
    }
  }
  if (/^CEF-[MR]$/.test(z)) z = 'CEF'
  if (/^PGCC-\d$/.test(z)) z = 'PGCC'
  return { base: z, overlays }
}

/** The district record for a zone code as the county's map spells it. */
export function marylandDistrict(code: string, rawZone: string): (MarylandDistrict & { overlays: string[] }) | null {
  const list = MARYLAND_DISTRICTS[code]
  if (!list || !rawZone) return null
  const up = rawZone.trim().toUpperCase().replace(/\s+/g, ' ')
  const { base, overlays } = code === 'howard_md' ? howardBase(up) : { base: up, overlays: [] as string[] }
  const hit = list.find(x => x.zone === base) ?? list.find(x => x.zone.replace(/-/g, '') === base.replace(/[-\s]/g, ''))
  return hit ? { ...hit, overlays } : null
}

/**
 * Single-family tables in the shape `county-zoning.ts` draws from, with every
 * spelling the county's map uses for a district that has an envelope
 * (Howard's "RC-DEO", "R-12-CR" …) as its own key.
 */
export function marylandSfdTables(mapSpellings: Record<string, string[]> = MAP_SPELLINGS): Record<string, Record<string, CountyZoneStandard>> {
  const out: Record<string, Record<string, CountyZoneStandard>> = {}
  for (const [code, list] of Object.entries(MARYLAND_DISTRICTS)) {
    const t: Record<string, CountyZoneStandard> = {}
    for (const x of list) if (x.sfd) t[x.zone] = x.sfd
    for (const raw of mapSpellings[code] ?? []) {
      const dd = marylandDistrict(code, raw)
      if (dd?.sfd && !t[raw]) t[raw] = dd.sfd
    }
    out[code] = t
  }
  return out
}

/** Codes each county's zoning layer actually carries (read 2026-09-26), where they differ from the district key. */
export const MAP_SPELLINGS: Record<string, string[]> = {
  howard_md: ['B-1-CR', 'B-1-TNC', 'B-2-TNC', 'R-12-CR', 'R-A-15-TNC', 'R-MH-CR', 'R-SA-8-I', 'R-SC-I', 'RC-DEO', 'RR-DEO', 'CAC-CLI', 'CE-CLI', 'CEF-M', 'CEF-R', 'PGCC-1', 'PGCC-2', 'RSI'],
}

/** A one-paragraph statement of a district's limits for a sheet or a reviewer, when no envelope is drawn. */
export function marylandDistrictSummary(code: string, rawZone: string): string | null {
  const x = marylandDistrict(code, rawZone)
  if (!x) return null
  const status = {
    current: '', dated: ' (from an older edition — confirm)', plan_governed: ' (set by the approved plan)',
    not_read: ' (not read — prepared by staff)', municipal: ' (municipal zoning)',
  }[x.status]
  const lim = x.limits.map(([k, v]) => `${k}: ${v}`).join('; ')
  const over = x.overlays.length ? ` Overlay(s): ${x.overlays.join(', ')}.` : ''
  return `${x.zone} — ${x.name}${status}, ${x.citation}.${lim ? ` ${lim}.` : ''}${over} ${x.notes.join(' ')}`.trim()
}
