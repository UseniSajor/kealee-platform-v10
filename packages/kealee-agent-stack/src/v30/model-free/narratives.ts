/**
 * Concept, estimate and permit narratives — written from the order's data,
 * with no model.
 *
 * Every sentence is assembled from something the platform knows: the priced
 * lines of each tier (what is being installed), the intake (property type,
 * location, year built, budget, utilities, code considerations), the permit
 * types from the scope rules, and a small body of general construction
 * guidance — sequencing, and the model-code clearances every designer checks
 * (IRC / NKBA figures, cited, "as adopted locally").
 *
 * What is NOT here: anything specific a template would have to guess — a
 * room's existing layout, a brand, a fee, a review time. Those are either
 * left to the site visit or stated as "confirm".
 *
 * A hosted model may later polish this text (`model-assist`), but only under a
 * guard that rejects any rewrite that changes a number.
 */

import type { CostTier, PricedEstimate } from './costs'

export interface NarrativeSection { heading: string; body: string }
export interface ConceptNarrative { overview: string; sections: NarrativeSection[] }

export interface NarrativeContext {
  family: string
  label: string
  propertyType: string
  location: string
  yearBuilt: string
  budgetRange: string
  timeline: string
  naturalGas: boolean
  codeConsiderations: string[]
  permitTypes: string[]
  jurisdictionName: string | null
}

const money = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`
const list = (xs: string[]) => xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`

// ── Existing conditions from the year built ────────────────────────────────

/** "1985", "1970s", "pre-1950", "before 1940" → a year, or null. */
export function yearOf(raw: string): number | null {
  const s = raw.toLowerCase()
  const y = s.match(/(1[6-9]\d\d|20\d\d)/)?.[1]
  if (!y) return null
  const n = Number(y)
  return /pre|before|older/.test(s) ? n - 1 : n
}

export function existingConditions(ctx: NarrativeContext): string[] {
  const y = yearOf(ctx.yearBuilt)
  const out: string[] = []
  if (y != null && y < 1978) {
    out.push(`Built ${y < 1950 ? 'before 1950' : `around ${y}`}, the house predates 1978, so paint disturbed by the work is presumed to contain lead: the EPA Renovation, Repair and Painting Rule requires an RRP-certified contractor and lead-safe work practices.`)
  }
  if (y != null && y < 1981) {
    out.push('Materials of that era can contain asbestos (older flooring, pipe and duct insulation, drywall compound); sample anything the demolition will disturb before it starts.')
  }
  if (y != null && y < 1950) {
    out.push('Houses of this age often retain knob-and-tube wiring or galvanized supply piping; budget for replacing what the walls reveal once they are open.')
  } else if (y != null && y < 1975) {
    out.push('Electrical service of this age is often 60–100 A; confirm the panel can carry new circuits before finishes are ordered.')
  }
  if (y == null) out.push('The year built was not given; the site visit establishes it, along with any lead, asbestos or wiring conditions that follow from it.')
  if (ctx.naturalGas && /kitchen|addition/.test(ctx.family)) {
    out.push('The house has natural gas; relocating or adding a gas appliance is a gas-fitting permit item.')
  }
  for (const c of ctx.codeConsiderations) out.push(`Noted at intake: ${c}.`)
  return out
}

// ── Budget fit ──────────────────────────────────────────────────────────────

/** "$50k-$100k", "50,000 - 100,000", "under $40k", "$150k+" → [min, max]. */
export function parseBudget(raw: string): [number, number] | null {
  const nums = [...raw.toLowerCase().matchAll(/\$?\s*(\d+(?:[.,]\d+)?)\s*(k|m)?/g)]
    .map(m => {
      const v = Number(m[1].replace(/,/g, ''))
      return m[2] === 'k' ? v * 1_000 : m[2] === 'm' ? v * 1_000_000 : v
    })
    .filter(v => v >= 1000)
  if (!nums.length) return null
  if (/under|less than|below|up to/.test(raw.toLowerCase())) return [0, nums[0]]
  if (/\+|over|more than|above/.test(raw) && nums.length === 1) return [nums[0], Number.POSITIVE_INFINITY]
  return nums.length === 1 ? [nums[0] * 0.9, nums[0] * 1.1] : [Math.min(...nums), Math.max(...nums)]
}

export function budgetFit(ctx: NarrativeContext, totals: Record<CostTier, number>): string {
  const b = parseBudget(ctx.budgetRange)
  if (!b) return `No budget was given; the three directions run from ${money(totals.BUDGET)} to ${money(totals.PREMIUM)}.`
  const inRange = (Object.keys(totals) as CostTier[]).filter(t => totals[t] >= b[0] && totals[t] <= b[1])
  const range = Number.isFinite(b[1]) ? `${money(b[0])}–${money(b[1])}` : `${money(b[0])} and up`
  if (inRange.length) {
    return `Against the stated budget of ${range}, the ${list(inRange.map(t => t.toLowerCase()))} direction${inRange.length > 1 ? 's fall' : ' falls'} inside it.`
  }
  if (totals.BUDGET > b[1]) {
    return `Even the budget direction (${money(totals.BUDGET)}) sits above the stated ${range}; reducing the area, keeping the existing layout or phasing the work brings it closer.`
  }
  return `All three directions sit below the stated ${range}, leaving room for the premium finishes or for work beyond this scope.`
}

// ── Family knowledge ────────────────────────────────────────────────────────

interface FamilyGuide {
  layout: string[]
  sequence: Array<[phase: string, weeks: string]>
  tierDirection: Record<CostTier, string>
  considerations: string[]
}

const IRC = 'IRC as adopted locally — confirm local amendments'

export const FAMILY_GUIDES: Record<string, FamilyGuide> = {
  kitchen: {
    layout: [
      'Keep the sink, range and refrigerator in a working triangle: each leg 4–9 ft and the three together no more than 26 ft (NKBA planning guideline).',
      'Hold work aisles to at least 42 in for one cook and 48 in for two (NKBA).',
      'Leave landing counter of at least 24 in on one side of the sink and 18 in on the other, 12 in and 15 in either side of the range, and 15 in on the refrigerator\'s handle side (NKBA).',
      'Countertop receptacles need GFCI protection (NEC 210.8(A)) and spacing so no point along the counter is more than 24 in from one (NEC 210.52(C)), as adopted locally.',
    ],
    sequence: [['Demolition and protection', '1 week'], ['Rough plumbing, electrical and any gas, then inspections', '1–2 weeks'], ['Drywall and paint', '1 week'],
      ['Cabinet installation', '1–2 weeks'], ['Countertop template, fabrication and install', '2–3 weeks (template after cabinets)'], ['Backsplash, fixtures, appliances and final inspection', '1–2 weeks']],
    tierDirection: {
      BUDGET: 'retains the existing footprint and plumbing locations, replacing cabinet boxes, surfaces and appliances in place',
      BALANCED: 'keeps the footprint but upgrades to semi-custom cabinetry and engineered-stone counters, with lighting reworked around the tasks',
      PREMIUM: 'treats the kitchen as a built-in: custom cabinetry to the ceiling, stone counters and a luxury appliance package',
    },
    considerations: ['Cabinet and appliance lead times drive the schedule; order both before demolition.', 'Moving the sink or range moves plumbing, venting and possibly gas — it is the largest cost lever after the finishes.'],
  },
  bath: {
    layout: [
      `Set the toilet's centerline at least 15 in from any side wall or fixture, with 21 in clear in front of it (${IRC}, R307).`,
      `A shower needs at least 900 sq in of floor and 30 in in its smallest dimension (${IRC}, P2708.1).`,
      'Waterproof the full wet area — pan, curb and walls — before tile; this is where bathroom failures start.',
      'Every bathroom needs mechanical ventilation exhausted outdoors when it has a tub or shower.',
    ],
    sequence: [['Demolition', '2–4 days'], ['Rough plumbing and electrical, then inspection', '1 week'], ['Backer board and waterproofing', '3–5 days'],
      ['Tile', '1–2 weeks'], ['Vanity, fixtures, glass and final inspection', '1 week']],
    tierDirection: {
      BUDGET: 'keeps the fixtures where they are and renews them with ceramic tile and a stock vanity',
      BALANCED: 'rebuilds the wet area with porcelain tile, a custom shower and a floating vanity',
      PREMIUM: 'uses natural stone, a custom vanity and wall-mounted fixtures for a spa-grade room',
    },
    considerations: ['Glass enclosures are measured after tile, so they arrive last.', 'Relocating the toilet moves the drain; on a slab or over finished space it is the costliest change.'],
  },
  basement: {
    layout: [
      `A sleeping room needs an emergency escape opening: at least 5.7 sq ft clear, 20 in wide, 24 in high, with the sill no more than 44 in above the floor (${IRC}, R310).`,
      `Habitable basement space needs a 7 ft ceiling; beams and ducts may project to 6 ft 4 in (${IRC}, R305).`,
      'Frame exterior walls off the foundation with a moisture break, and insulate them before drywall.',
    ],
    sequence: [['Moisture check, framing and insulation', '2 weeks'], ['Rough electrical, plumbing and HVAC, then inspections', '1–2 weeks'],
      ['Drywall and ceiling', '2 weeks'], ['Flooring, trim, doors and paint', '2 weeks'], ['Final inspection', '1 week']],
    tierDirection: {
      BUDGET: 'finishes the open area with a drop ceiling and carpet, keeping the mechanicals accessible',
      BALANCED: 'finishes with a drywall ceiling and luxury vinyl plank, suited to below-grade moisture',
      PREMIUM: 'finishes to main-floor quality with tile and a drywall ceiling throughout',
    },
    considerations: ['Any sign of water must be solved before finishes go in.', 'A basement bathroom below the sewer line needs an ejector pump.'],
  },
  addition: {
    layout: [
      'The zoning setbacks, lot coverage and height limit for the lot decide how large the addition can be; the site-plan engine draws that envelope from the county\'s ordinance.',
      `New space must meet the energy code in force for insulation and air sealing (${IRC}, Chapter 11).`,
      'Tie the new roof and floor into the existing structure with a sealed engineer\'s detail.',
    ],
    sequence: [['Permits, engineering and site layout', '3–6 weeks'], ['Excavation and foundation, then inspection', '2–3 weeks'],
      ['Framing, roof, windows and doors', '3–4 weeks'], ['Rough MEP, insulation, then inspections', '2–3 weeks'], ['Drywall, finishes and final inspection', '4–6 weeks']],
    tierDirection: {
      BUDGET: 'builds a simple rectangle on a slab with finishes matched to the house',
      BALANCED: 'adds the room with mid-grade windows, flooring and trim that carry the house\'s character',
      PREMIUM: 'specifies premium windows and finishes, with the new room designed as a feature of the house',
    },
    considerations: ['An addition needs a building permit, a zoning check and usually a sealed structural design.', 'Utility capacity — the electrical panel and the heating system — is often the hidden cost.'],
  },
  deck: {
    layout: [
      `Any deck surface more than 30 in above grade needs a guard at least 36 in high (${IRC}, R312).`,
      `Stairs: risers no more than 7¾ in and treads at least 10 in deep (${IRC}, R311.7.5).`,
      'Flash the ledger where it meets the house, or free-stand the deck; the ledger is where decks fail.',
    ],
    sequence: [['Permit and layout', '1–3 weeks'], ['Footings, then inspection', '1 week'], ['Framing, then inspection', '1 week'], ['Decking, rails, stairs and final inspection', '1–2 weeks']],
    tierDirection: {
      BUDGET: 'uses pressure-treated decking and wood railings',
      BALANCED: 'uses composite decking and composite railings for low maintenance',
      PREMIUM: 'uses PVC decking with cable railings for a slimmer, open edge',
    },
    considerations: ['Setbacks and lot coverage can limit the deck\'s size; check them before design.'],
  },
  landscape: {
    layout: ['Grade the soil away from the foundation at least 6 in over the first 10 ft (IRC R401.3).', 'Group plants by water need so irrigation zones stay simple.'],
    sequence: [['Clearing and grading', '1 week'], ['Hardscape', '1–2 weeks'], ['Planting, turf and mulch', '1 week']],
    tierDirection: {
      BUDGET: 'seeds the lawn and plants beds with shrubs and perennials',
      BALANCED: 'lays sod and adds a paver patio with layered planting',
      PREMIUM: 'adds a larger patio and specimen planting',
    },
    considerations: ['Irrigation needs a backflow preventer and usually a plumbing permit.'],
  },
  flooring: {
    layout: ['Acclimate wood flooring to the room before installation.', 'Check the subfloor for flatness; most floors need it within 3/16 in over 10 ft.'],
    sequence: [['Removal and subfloor preparation', '2–4 days'], ['Installation', '3–7 days'], ['Trim and transitions', '1–2 days']],
    tierDirection: { BUDGET: 'uses luxury vinyl plank', BALANCED: 'uses engineered hardwood', PREMIUM: 'uses solid hardwood' },
    considerations: ['Floors in a pre-1981 house may sit over asbestos-containing tile; test before removal.'],
  },
  painting: {
    layout: ['Repair and prime patched areas before finish coats.', 'Use a mildew-resistant finish in baths and kitchens.'],
    sequence: [['Protection and preparation', '1–3 days'], ['Ceilings, walls and trim', '3–7 days']],
    tierDirection: { BUDGET: 'uses a standard two-coat system', BALANCED: 'uses a standard two-coat system with full trim', PREMIUM: 'uses premium paint throughout' },
    considerations: [],
  },
}

// ── Assembly ────────────────────────────────────────────────────────────────

function materialsOf(e: PricedEstimate): string[] {
  return [...new Set(e.lines.filter(l => !/General|Permit|Demolition|Paint|Prep|Engineering|Tie-in/.test(l.trade)).map(l => l.name.toLowerCase()))]
}

export function conceptNarrative(ctx: NarrativeContext, tier: CostTier, e: PricedEstimate, totals: Record<CostTier, number>): ConceptNarrative {
  const guide = FAMILY_GUIDES[ctx.family]
  const place = ctx.location || 'the property'
  const where = ctx.jurisdictionName ? `${place} (${ctx.jurisdictionName})` : place
  const mats = materialsOf(e)
  const weeks = guide?.sequence.map(([p, w]) => `${p}: ${w}`) ?? []
  const overview =
    `The ${tier.toLowerCase()} direction for this ${e.sqft.toLocaleString()} sq ft ${ctx.label.toLowerCase()} in a ${ctx.propertyType || 'home'} in ${where} ` +
    `${guide?.tierDirection[tier] ?? 'renews the space'}. It is priced at ${money(e.total)} — ${money(e.costPerSqFt)} per sq ft — including a ${e.contingencyPct}% contingency.`

  const byTradeTop = Object.entries(e.byTrade).sort((a, b) => b[1] - a[1]).slice(0, 4)
  const sections: NarrativeSection[] = [
    { heading: 'Design direction', body: `This direction ${guide?.tierDirection[tier] ?? 'renews the space'}. ${budgetFit(ctx, totals)}` },
    { heading: 'Materials and finishes', body: mats.length ? `Specified: ${list(mats.slice(0, 8))}.` : 'Finishes are selected at the design meeting.' },
    { heading: 'Layout and function', body: (guide?.layout ?? []).join(' ') },
    { heading: 'Where the money goes', body: `The largest shares are ${list(byTradeTop.map(([t, v]) => `${t.toLowerCase()} (${money(v)})`))}. Every line is priced from Kealee's assembly library for the ${e.region.key} market.` },
    { heading: 'Existing conditions to confirm', body: existingConditions(ctx).join(' ') },
    { heading: 'Sequence and timeline', body: weeks.length ? `Typical sequence — ${weeks.join('; ')}.${ctx.timeline ? ` Stated timeline: ${ctx.timeline}.` : ''}` : '' },
    {
      heading: 'Permits',
      body: ctx.permitTypes.length
        ? `Expected: ${list(ctx.permitTypes.map(p => p.toLowerCase()))}${ctx.jurisdictionName ? `, filed with ${ctx.jurisdictionName}` : ''}. Fees and review times are set by the permit office and confirmed at submission.`
        : 'No permit is expected for this scope; confirm with the local permit office.',
    },
    ...(guide?.considerations.length ? [{ heading: 'Things to decide early', body: guide.considerations.join(' ') }] : []),
    ...(e.caution ? [{ heading: 'About this estimate', body: e.caution }] : []),
    { heading: 'Next steps', body: 'A site visit confirms dimensions and existing conditions; the chosen direction then becomes a detailed estimate and, where required, permit drawings.' },
  ].filter(s => s.body.trim())
  return { overview, sections }
}

export function estimateNarrative(ctx: NarrativeContext, mid: PricedEstimate, totals: Record<CostTier, number>): string {
  const top = Object.entries(mid.byTrade).sort((a, b) => b[1] - a[1]).slice(0, 3)
  return [
    `This preliminary estimate prices a ${mid.sqft.toLocaleString()} sq ft ${ctx.label.toLowerCase()} in ${ctx.location || 'the DMV'} from Kealee's assembly library: ${money(totals.BUDGET)} (budget), ${money(totals.BALANCED)} (balanced) and ${money(totals.PREMIUM)} (premium), each including contingency.`,
    `At the balanced level the largest costs are ${list(top.map(([t, v]) => `${t.toLowerCase()} at ${money(v)}`))}.`,
    budgetFit(ctx, totals),
    existingConditions(ctx).slice(0, 2).join(' '),
    'A detailed estimate follows the site visit, when quantities are measured rather than derived from the area.',
  ].filter(Boolean).join(' ')
}

export function permitNarrative(ctx: NarrativeContext): string {
  if (!ctx.permitTypes.length) return 'No permit is expected for this scope. Confirm with the local permit office before work starts.'
  return [
    `This ${ctx.label.toLowerCase()} is expected to need ${list(ctx.permitTypes.map(p => p.toLowerCase()))}${ctx.jurisdictionName ? ` from ${ctx.jurisdictionName}` : ''}.`,
    'The submission carries the application, a site plan or plat showing the work, plans of the work area and, for structural work, drawings sealed by a licensed engineer.',
    'Fees and review times are set by the permit office and are confirmed at submission; inspections follow the rough-in and final stages of the work.',
  ].join(' ')
}
