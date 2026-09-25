/**
 * What a sheet says about WHO reviews it, per jurisdiction.
 *
 * The renderer, the classifier and the lot package were written for Prince
 * George's County and print its agencies by name: the DPIE approval block, the
 * PGC DPW&T curb detail, "UTILITIES SHOWN PER PGC CODE SEC. 32-106". On a DC
 * plan every one of those is wrong in a way a reviewer notices in seconds and
 * that costs the true statements on the sheet their credibility.
 *
 * A profile holds only what is established. Where a threshold or code section
 * has not been read from the jurisdiction's own text, the profile names the
 * AGENCY and the ITEM TO CONFIRM rather than a number — an invented citation
 * is worse than none, for the same reason an invented setback is.
 */

export interface JurisdictionProfile {
  code: string
  /** As printed in the title block: "District of Columbia". */
  displayName: string
  state: 'DC' | 'MD' | 'VA'
  /** Issues the building permit the site plan accompanies. */
  permitAuthority: string
  /** Empty signature boxes on the approval panel. The engine never fills them. */
  approvalBlocks: [title: string, subtitle: string][]
  /** Water and sewer utility, named on the utility plan. */
  waterSewerUtility: string
  /** The general utility note. PG cites its code; others state the source plainly. */
  utilitiesNote: string
  /** SSURGO survey area. */
  soilSurveyArea: string
  soilsTableSubtitle: string
  /** County standard details the engine reproduces. Only PG's are held. */
  reproducesStandardDetails: boolean
  /** PG's DPIE checklist notes apply only to PG. */
  usesPgRequiredNotes: boolean
  /** Whose standard governs a driveway apron in the right-of-way, as lettered on the plan. */
  apronStandard: string
  /** How the engineer's certification names the licensing jurisdiction. */
  licensingJurisdiction: string
  /** Reviews stormwater management; named on the site-analysis table outside PG. */
  stormwaterAgency: string
  /** Jurisdiction-specific items for the reviewer's pre-seal worklist. */
  beforeSeal: string[]
}

const GENERIC_UTILITIES_NOTE =
  'EXISTING UTILITIES ARE SHOWN FROM PUBLIC RECORD AND ARE APPROXIMATE. LOCATION AND DEPTH ' +
  'SHALL BE FIELD-VERIFIED BY TEST PIT BEFORE CONSTRUCTION.'

export const JURISDICTION_PROFILES: Record<string, JurisdictionProfile> = {
  prince_georges_md: {
    code: 'prince_georges_md',
    displayName: "Prince George's County, Maryland",
    state: 'MD',
    permitAuthority: "Prince George's County Department of Permitting, Inspections and Enforcement (DPIE)",
    approvalBlocks: [
      ["PRINCE GEORGE'S COUNTY SOIL CONSERVATION DISTRICT APPROVAL", 'SEDIMENT CONTROL, GRADING, SOILS & DRAINAGE'],
      ['DPIE SITE/ROAD PLAN REVIEW DIVISION APPROVAL', ''],
    ],
    waterSewerUtility: 'WSSC Water',
    utilitiesNote: 'ALL EXISTING AND PROPOSED UTILITIES SHOWN PER PGC CODE SEC. 32-106.',
    soilSurveyArea: 'MD033',
    soilsTableSubtitle: 'USDA NRCS SSURGO — PGC Code Sec. 32-130(a)(13)',
    reproducesStandardDetails: true,
    usesPgRequiredNotes: true,
    stormwaterAgency: 'DPIE',
    apronStandard: 'DPW&T STANDARD',
    licensingJurisdiction: 'THE STATE OF MARYLAND',
    beforeSeal: [],
  },
  district_of_columbia: {
    code: 'district_of_columbia',
    displayName: 'District of Columbia',
    state: 'DC',
    permitAuthority: 'DC Department of Buildings (DOB)',
    approvalBlocks: [
      ['DC DEPARTMENT OF BUILDINGS — ZONING REVIEW', 'ZONING ADMINISTRATOR, TITLE 11 DCMR'],
      ['DC DEPARTMENT OF ENERGY & ENVIRONMENT', 'STORMWATER MANAGEMENT / EROSION & SEDIMENT CONTROL'],
      ['DDOT PUBLIC SPACE', 'CURB CUT, DRIVEWAY APRON AND WORK IN PUBLIC SPACE'],
    ],
    waterSewerUtility: 'DC Water',
    utilitiesNote: GENERIC_UTILITIES_NOTE,
    soilSurveyArea: 'DC001',
    soilsTableSubtitle: 'USDA NRCS SSURGO — survey area DC001, District of Columbia',
    reproducesStandardDetails: false,
    usesPgRequiredNotes: false,
    stormwaterAgency: 'DOEE',
    apronStandard: 'DDOT STANDARD DRAWINGS',
    licensingJurisdiction: 'THE DISTRICT OF COLUMBIA',
    beforeSeal: [
      'DC front setback (11-D § 206.2 / 11-E § 206.2) is the RANGE of the blockface. The range on ' +
      'this plan is measured from District footprints; confirm it against the Zoning ' +
      "Administrator's reading before relying on it.",
      'Any driveway apron, curb cut or work in public space needs a DDOT public space permit.',
      'Confirm with DOEE whether the land disturbance triggers stormwater management and ' +
      'erosion and sediment control review.',
      'Confirm tree protection: DDOT Urban Forestry permits removal of Special and Heritage trees.',
    ],
  },
  montgomery_md: {
    code: 'montgomery_md',
    displayName: 'Montgomery County, Maryland',
    state: 'MD',
    permitAuthority: 'Montgomery County Department of Permitting Services (DPS)',
    approvalBlocks: [
      ['MONTGOMERY COUNTY DPS — ZONING AND SITE PLAN REVIEW', ''],
      ['MONTGOMERY COUNTY DPS — SEDIMENT CONTROL / STORMWATER', ''],
    ],
    waterSewerUtility: 'WSSC Water',
    utilitiesNote: GENERIC_UTILITIES_NOTE,
    soilSurveyArea: 'MD031',
    soilsTableSubtitle: 'USDA NRCS SSURGO — survey area MD031, Montgomery County',
    reproducesStandardDetails: false,
    usesPgRequiredNotes: false,
    stormwaterAgency: 'MONTGOMERY COUNTY DPS',
    apronStandard: 'MCDOT STANDARD',
    licensingJurisdiction: 'THE STATE OF MARYLAND',
    beforeSeal: [
      'Confirm with DPS whether the disturbance requires a sediment control permit and a ' +
      'stormwater concept.',
      'Confirm Forest Conservation Law applicability with M-NCPPC Montgomery Planning.',
    ],
  },
  fairfax_va: {
    code: 'fairfax_va',
    displayName: 'Fairfax County, Virginia',
    state: 'VA',
    permitAuthority: 'Fairfax County Land Development Services (LDS)',
    approvalBlocks: [
      ['FAIRFAX COUNTY LAND DEVELOPMENT SERVICES', 'GRADING PLAN / SITE REVIEW'],
      ['FAIRFAX COUNTY ZONING ADMINISTRATION', 'ZONING PERMIT REVIEW'],
    ],
    waterSewerUtility: 'Fairfax Water (water) / Fairfax County DPWES (sanitary sewer)',
    utilitiesNote: GENERIC_UTILITIES_NOTE,
    soilSurveyArea: 'VA059',
    soilsTableSubtitle: 'USDA NRCS SSURGO — survey area VA059, Fairfax County',
    reproducesStandardDetails: false,
    usesPgRequiredNotes: false,
    stormwaterAgency: 'FAIRFAX COUNTY LDS',
    apronStandard: 'VDOT STANDARD',
    licensingJurisdiction: 'THE COMMONWEALTH OF VIRGINIA',
    beforeSeal: [
      'Confirm with LDS whether the disturbance requires an infill lot grading plan.',
      'Check the lot against Chesapeake Bay Preservation Area (RPA/RMA) mapping.',
    ],
  },
  arlington_va: {
    code: 'arlington_va',
    displayName: 'Arlington County, Virginia',
    state: 'VA',
    permitAuthority: 'Arlington County Department of Community Planning, Housing and Development — Inspection Services',
    approvalBlocks: [
      ['ARLINGTON COUNTY ZONING OFFICE', 'ZONING REVIEW'],
      ['ARLINGTON COUNTY DES', 'LAND DISTURBANCE / STORMWATER'],
    ],
    waterSewerUtility: 'Arlington County Department of Environmental Services',
    utilitiesNote: GENERIC_UTILITIES_NOTE,
    soilSurveyArea: 'VA013',
    soilsTableSubtitle: 'USDA NRCS SSURGO — survey area VA013, Arlington County',
    reproducesStandardDetails: false,
    usesPgRequiredNotes: false,
    stormwaterAgency: 'ARLINGTON COUNTY DES',
    apronStandard: 'ARLINGTON COUNTY STANDARD',
    licensingJurisdiction: 'THE COMMONWEALTH OF VIRGINIA',
    beforeSeal: [
      'Confirm with DES whether the disturbance requires a Land Disturbing Activity permit.',
      'Check the lot against Chesapeake Bay Preservation Area (RPA) mapping.',
    ],
  },
}

export function profileFor(code: string | null | undefined): JurisdictionProfile | null {
  return code ? JURISDICTION_PROFILES[code] ?? null : null
}

/**
 * Who may certify the boundary. Licensure is by STATE: a Maryland licence does
 * not reach a DC lot. Absent means Prince George's, i.e. Maryland.
 */
export function licensedSurveyor(code: string | null | undefined): string {
  const state = profileFor(code)?.state ?? 'MD'
  return state === 'DC' ? 'District of Columbia licensed land surveyor'
    : state === 'VA' ? 'Virginia licensed land surveyor'
    : 'Maryland licensed surveyor'
}

/**
 * A licensure title in the jurisdiction's state: "Maryland Professional
 * Engineer" becomes "District of Columbia Professional Engineer" on a DC plan.
 * The discipline tables were written for PG; the licence is the state's.
 */
export function localiseLicensure(title: string, code: string | null | undefined): string {
  const state = profileFor(code)?.state ?? 'MD'
  if (state === 'MD') return title
  return title.replace(/\bMaryland\b/g, state === 'DC' ? 'District of Columbia' : 'Virginia')
}

/** As the title block prints it. Falls back to the slug in words, never the raw slug. */
export function jurisdictionDisplayName(code: string): string {
  const p = profileFor(code)
  if (p) return p.displayName
  return code.replace(/_/g, ' ').trim().split(/\s+/)
    .map(w => (/^[a-z]{2}$/i.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
}
