/**
 * Product- and flow-specific textarea / search placeholders for intakes,
 * contact forms, and marketing search bars. Used across web-main and other apps.
 */

const INTAKE_CHECKOUT_DESCRIPTION_DEFAULT =
  'E.g., Your goals, what is changing on site, timeline, budget band, and anything the team must know before starting your package…'

/** Keys align with web-main `intake/[projectPath]` PRICE_MAP / AGENT_MAP. */
const INTAKE_CHECKOUT_DESCRIPTION_BY_PATH: Record<string, string> = {
  exterior_concept:
    'E.g., Re-side in fiber cement, black windows, new front porch roof, and foundation plantings — HOA requires color board approval…',
  garden_concept:
    'E.g., Backyard food garden: raised beds, small chicken coop with run, drip irrigation, compost zone, and shaded gravel seating…',
  whole_home_concept:
    'E.g., Phased whole-home update — open kitchen/living, both full baths, basement finish, exterior trim refresh, and HVAC zoning…',
  interior_reno_concept:
    'E.g., First-floor refresh: LVP, new trim and doors, built-ins at fireplace, layered lighting in living/dining — kitchen later phase…',
  developer_concept:
    'E.g., R-2 infill — duplex + ADU pro forma, target GFA, utility assumptions, and what you need for early massing / zoning narrative…',
  kitchen_remodel:
    'E.g., Remove wall to dining, 10 ft island, quartz, pantry wall, relocate sink — panel-ready fridge, 36 in induction…',
  bathroom_remodel:
    'E.g., Primary bath: curbless shower, bench, heated floors, double vanity, better exhaust — tub removed…',
  whole_home_remodel:
    'E.g., Kitchen + both baths + basement + exterior in one program — phasing while living in home, priorities per floor…',
  addition_expansion:
    'E.g., 400 sq ft rear addition — primary suite + enlarged family room, match brick colonial, tie into existing roof…',
  permit_path_only:
    'E.g., Load-bearing wall removal with beam calc, or new deck ledger + stairs, or ADU — list each item plans will show…',
  cost_estimate:
    'E.g., RSMeans-style takeoff for kitchen gut with layout change — include allowance tier for cabinets and counters…',
  certified_estimate:
    'E.g., Lender-grade scope: SFH interior reno with documented allowances, GC quote comparison, and contingency line…',
  contractor_match:
    'E.g., Need vetted GC for bath + hall reno — licensed, insured, can start in Q3, Arlington VA rowhouse…',
  development_feasibility:
    'E.g., MU-3 corner lot — target 4k retail + 24 units, parking waiver questions, and utility capacity unknowns…',
  design_build:
    'E.g., Design-build for custom SFR — want single contract through CDs, phasing, and allowance schedule for owner selections…',
  capture_site_concept:
    'E.g., As-built capture before second-story addition — exterior elevations + key interior rooms for existing conditions…',
  multi_unit_residential:
    'E.g., Low-rise wood frame, 24 units, surface parking ratio concern, and stormwater detention sketch assumptions…',
  mixed_use:
    'E.g., Podium retail + 5 stories residential — loading, trash, and vertical circulation core placement questions…',
  commercial_office:
    'E.g., 25k SF TI — open office + 6 meeting rooms, IDF closets, and base building HVAC VAV reuse assumptions…',
  townhome_subdivision:
    'E.g., 42 fee-simple townhomes, alley-loaded garages, HOA common landscape, and PD plat notes…',
  single_family_subdivision:
    'E.g., 18 lots averaging 65 ft frontage, private road maintenance entity, and erosion control during mass grading…',
  single_lot_development:
    'E.g., Single teardown — new 3,200 SF with side-loaded garage, setback variances, and tree preservation…',
  interior_renovation:
    'E.g., Replace carpet with LVP, new doors/trim, paint, recessed lighting — no kitchen cabinet line changes…',
}

export function getIntakeCheckoutProjectDescriptionPlaceholder(projectPath: string): string {
  return INTAKE_CHECKOUT_DESCRIPTION_BY_PATH[projectPath] ?? INTAKE_CHECKOUT_DESCRIPTION_DEFAULT
}

const PRE_DESIGN_NOTES_BY_TYPE: Record<string, string> = {
  exterior:
    'E.g., Fiber cement palette, black windows, wider front steps, and low evergreens — want elevations that read from the street…',
  interior:
    'E.g., Rowhouse living/dining — furniture layout, lighting layers, and trim palette before we order flooring and paint…',
  landscape:
    'E.g., Rear yard: dining patio, fire pit ring, native pollinator strip, and path to vegetable beds — dog run on north side…',
}

export function getPreDesignCheckoutNotesPlaceholder(projectType: string): string {
  return (
    PRE_DESIGN_NOTES_BY_TYPE[projectType] ??
    'E.g., Goals, must-keep elements, budget band, and any HOA or zoning constraints for this pre-design tier…'
  )
}

const COST_ESTIMATE_SCOPE_BY_TYPE: Record<string, string> = {
  'Residential Remodel':
    'E.g., Whole first floor — LVP, paint, trim, 12 recessed cans in living, refinish stairs; no structural moves…',
  'Kitchen Remodel':
    'E.g., 180 sq ft galley opened 10 ft to dining — new cabinets to ceiling, island, quartz, relocate sink and DW…',
  'Bathroom Renovation':
    'E.g., Hall bath 5x8 — curbless shower, new vanity, toilet, exhaust upgrade, Schluter waterproofing scope…',
  'Exterior Work':
    'E.g., Re-side 2,400 SF two-story, 14 windows, wrap trim, and 320 sq ft composite deck with aluminum rail…',
  'Structural Repair':
    'E.g., Bouncy 12 ft span in 1960s ranch — sister joists, new LVL beam, posts to existing foundation in crawl…',
  'Mechanical/Electrical/Plumbing':
    'E.g., 200A panel upgrade, mini-split to attic bonus room, and repipe two baths with PEX homerun…',
  'Commercial Buildout':
    'E.g., 4,500 SF shell TI — open ceiling, 8 offices, 2 phone rooms, kitchenette, and access control rough-in…',
  Other:
    'E.g., Trade-by-trade scope, square footage affected, finishes level (builder grade / mid / high), and phasing…',
}

const COST_ESTIMATE_NAME_BY_TYPE: Record<string, string> = {
  'Residential Remodel': 'E.g., First-floor refresh — 123 Main St',
  'Kitchen Remodel': 'E.g., Kitchen gut + island — 456 Oak Ave',
  'Bathroom Renovation': 'E.g., Primary bath reno — 789 River Rd',
  'Exterior Work': 'E.g., Siding + windows — 321 Elm St',
  'Structural Repair': 'E.g., Floor bounce repair — 555 Pine Ln',
  'Mechanical/Electrical/Plumbing': 'E.g., Panel + mini-split — 888 Cedar Ct',
  'Commercial Buildout': 'E.g., Suite 400 TI — 100 Commerce Blvd',
  Other: 'E.g., Project nickname — full street address',
}

export function getCostEstimateScopePlaceholder(projectType: string): string {
  return COST_ESTIMATE_SCOPE_BY_TYPE[projectType] ?? COST_ESTIMATE_SCOPE_BY_TYPE.Other
}

export function getCostEstimateProjectNamePlaceholder(projectType: string): string {
  return COST_ESTIMATE_NAME_BY_TYPE[projectType] ?? COST_ESTIMATE_NAME_BY_TYPE.Other
}

export const CONTACT_PAGE_MESSAGE_PLACEHOLDER =
  'E.g., We need a feasibility package for a rear addition in Montgomery County, or a garden plan with raised beds and a coop — include jurisdiction and timeline…'

export const MARKETPLACE_CONTRACTOR_INQUIRY_PLACEHOLDER =
  'E.g., Licensed GC for kitchen + powder bath — permit-ready plans in hand, start in 8–12 weeks, zip 20814, need insurance certs upfront…'

export const NEW_CONSTRUCTION_SPECIAL_REQUIREMENTS_PLACEHOLDER =
  'E.g., Custom SFR on sloped lot — geothermal preferred, three-car side entry, and HOA design review before CDs…'

const PERMITS_ONLY_SCOPE_BY_TYPE: Record<string, string> = {
  kitchen_remodel:
    'E.g., Kitchen gut with load-bearing wall removal — beam callout on plans, exhaust duct to exterior, panel capacity note…',
  bathroom_remodel:
    'E.g., Primary bath wet-area remodel — curbless pan, waterproofing assembly, GFCIs, and exhaust CFM on plans…',
  addition_expansion:
    'E.g., Rear addition ~400 sq ft — foundation type, roof tie-in, and side setback dimensions matching survey…',
  deck_patio:
    'E.g., New composite deck with stairs to grade — guard height, post spacing, and ledger flashing detail on sheets…',
  exterior_concept:
    'E.g., Window package + new fiber cement — structural sill repair pages and energy compliance forms for jurisdiction…',
  interior_renovation:
    'E.g., First-floor LVP + trim only — confirm no bearing wall removal; electrical device count changes only…',
  new_construction:
    'E.g., New single-family — full arch/struct index for first submittal, stormwater as applicable, and trades list…',
  commercial_office:
    'E.g., Suite TI — occupancy, egress, and sprinkler mode changes with reflected ceiling and RCP loads…',
}

const PERMITS_ONLY_SCOPE_DEFAULT =
  'E.g., List each scope item the plans show — structural, mechanical, electrical, and envelope — plus jurisdiction (county/city)…'

const PERMIT_FUNNEL_DESCRIPTION_BY_TYPE: Record<string, string> = {
  residential:
    'E.g., Service upgrade to 200A + kitchen rewire — load calc, AFCI schedule, and panel location on plans for submittal…',
  addition:
    'E.g., Two-story rear addition — new stair from existing hall, beam at removed bearing wall, footing schedule along rear setback…',
  'new-construction':
    'E.g., New SFR on infill lot — full arch/struct index, stormwater BMP notes, and temporary power / erosion narrative…',
  commercial:
    'E.g., Office TI change of use — occupant load, exit count, accessible restroom layout, and reflected ceiling for sprinklers…',
}

export function getPermitFunnelProjectDescriptionPlaceholder(projectType: string | null): string {
  if (!projectType) return PERMITS_ONLY_SCOPE_DEFAULT
  return PERMIT_FUNNEL_DESCRIPTION_BY_TYPE[projectType] ?? PERMITS_ONLY_SCOPE_DEFAULT
}

export function getPermitsOnlyScopePlaceholder(projectType: string): string {
  if (!projectType) return PERMITS_ONLY_SCOPE_DEFAULT
  return PERMITS_ONLY_SCOPE_BY_TYPE[projectType] ?? PERMITS_ONLY_SCOPE_DEFAULT
}

export const PROFESSIONAL_DRAWINGS_SCOPE_PLACEHOLDER =
  'E.g., Architect stamped set for second-story addition — load path to existing first floor, new stair, and matching exterior brick…'

/** Homepage / hero search — multi-product examples (not kitchen-only). */
export const HERO_PROJECT_SEARCH_PLACEHOLDER =
  'Kitchen gut, ADU over garage, garden + chicken coop, deck replacement, whole-home phased reno…'

export const HERO_ASK_ANYTHING_PLACEHOLDER =
  'Ask about permits for a deck, RSMeans estimate bands, or a bathroom wet-area package…'

export const ASK_ANYTHING_BAR_PLACEHOLDER =
  'Ask anything — setback rules for an ADU, realistic kitchen allowances, or how permit scope shows in your package…'

export const MARKETPLACE_DIRECTORY_SEARCH_PLACEHOLDER =
  'E.g., tile setter curbless shower, structural GC beam replacement, or landscape irrigator…'

export const GALLERY_SEARCH_PLACEHOLDER =
  'E.g., kitchen package, garden concept, deck permit scope, whole-home feasibility…'

export const PORTAL_OWNER_NEW_PROJECT_NAME_PLACEHOLDER =
  'E.g., Rear ADU + garage conversion — Oak Lane'

export const PORTAL_OWNER_NEW_PROJECT_SCOPE_PLACEHOLDER =
  'E.g., Goals by phase, must-haves vs nice-to-haves, jurisdiction, HOA or lender requirements, and who needs access in the portal…'

export const PORTAL_DEVELOPER_SERVICE_DESCRIPTION_PLACEHOLDER =
  'E.g., MU-4 corner — 8k SF retail podium + 42 units; need LOA assumptions, laydown limits, and target first submittal date…'

/** portal-owner dashboard KeaBot input. */
export const PORTAL_OWNER_ASK_BOT_PLACEHOLDER =
  'E.g., Next milestone payment date, or what is still open for permit final?'

/** Ops / GC marketing contact forms (m-ops-services, m-marketplace ops). */
export const OPS_MARKETPLACE_CONTACT_MESSAGE_PLACEHOLDER =
  'E.g., Active GC with 4–8 concurrent permits — need weekly roll-ups, revision log template, and inspection scheduling cadence…'

/** m-estimation marketing contact — scope for estimating services. */
export const ESTIMATION_MARKETING_CONTACT_SCOPE_PLACEHOLDER =
  'E.g., ROM + trade breakdown for 2,400 SF whole-home reno — 1998 Colonial, mid-grade finishes, Montgomery County jurisdiction…'

/** m-estimation dashboard AI tools — narrative scope input. */
export const ESTIMATION_AI_TOOLS_DESCRIPTION_PLACEHOLDER =
  'E.g., Type IIB office TI — 18k SF, VAV reuse vs new RTU, demo by GC vs owner, and AHJ energy / accessibility triggers…'

/** m-marketplace estimation wizard — first-step scope narrative. */
export const ESTIMATION_WIZARD_SCOPE_DETAIL_PLACEHOLDER =
  'E.g., 2,200 SF interior package — LVP first floor, 18 recessed cans, repaint all rooms, swap 12 doors; note if any plaster or lead testing is pending…'

/** m-marketplace smart estimate AI prompt. */
export const SMART_ESTIMATE_AI_PROMPT_PLACEHOLDER =
  'E.g., 175 SF hall bath to curbless shower + double vanity — Fairfax County, Schluter waterproofing, mid-grade fixtures, GC labor only…'

/** Owner-facing marketplace project creation (match + concepts). */
export const MARKETPLACE_OWNER_PROJECT_DESCRIPTION_PLACEHOLDER =
  'E.g., Rowhouse kitchen + powder room — permit plans in review, need insured GC for mechanical + tile, start window Sept–Oct…'

export const MARKETPLACE_NEW_PROJECT_TITLE_PLACEHOLDER =
  'E.g., Garden hardscape + coop run — Elm Street'

export const MARKETPLACE_PROJECT_SPECIAL_NOTES_PLACEHOLDER =
  'E.g., HOA quiet hours, driveway staging only, pets at home — side entrance; COI $2M aggregate minimum…'

/** m-permits-inspections — contractor marketing contact (permit services). */
export const PERMITS_MARKETING_CONTRACTOR_MESSAGE_PLACEHOLDER =
  'E.g., Plan review + filing for deck replacement in Arlington — stamped structural sheets next week, AHJ Arlington County, target COA in ~4 weeks…'

/** In-app permit application — project narrative. */
export const PERMIT_APPLICATION_PROJECT_DESCRIPTION_PLACEHOLDER =
  'E.g., Interior remodel with load-bearing wall removal at kitchen/living — beam schedule on sheets, plus MEP permit disciplines as shown…'

/** Permit intake — first-step address. */
export const PERMIT_NEW_FLOW_ADDRESS_PLACEHOLDER =
  'E.g., 1425 Oak Grove Rd, Bethesda, MD 20814'

/** portal-contractor — company bio on profile. */
export const PORTAL_CONTRACTOR_COMPANY_BIO_PLACEHOLDER =
  'E.g., Class A GC — kitchens, baths, additions; EPA RRP; typical radius DC/MD/VA inner suburbs; COI $2M aggregate within 24h…'

/** portal-contractor — KeaBot GC quick ask. */
export const PORTAL_CONTRACTOR_ASK_BOT_PLACEHOLDER =
  'E.g., Summarize new leads this week, or which bids are waiting on owner signature…'
