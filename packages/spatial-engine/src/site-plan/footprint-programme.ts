/**
 * Estimating a building footprint when the customer has no plans.
 *
 * Most people ordering a site plan know how big a house they want, not what
 * its footprint is. Those are different numbers and conflating them is the
 * usual way a site plan comes back wrong: a 3,000 sq ft house is not a 3,000
 * sq ft footprint unless it is single-storey.
 *
 * The rule that does the work:
 *
 *     single storey  ->  footprint = total floor area
 *     N storeys      ->  footprint = total floor area / N
 *
 * with three adjustments that are easy to get wrong in the other direction:
 *
 *   - A basement adds floor area but NO footprint. It is below grade and does
 *     not touch lot coverage.
 *   - An attached garage adds footprint but is usually NOT counted in the
 *     "square footage" a customer quotes, because that figure conventionally
 *     means finished living area.
 *   - A covered porch is footprint and often counts toward lot coverage,
 *     depending on the jurisdiction's definition of coverage.
 *
 * Every number here is an ESTIMATE from a stated assumption, not a design. It
 * exists to place a plausible envelope on the lot so the drawing is useful, and
 * it is labelled as such wherever it surfaces.
 */

export interface HouseProgramme {
  /** Finished living area the customer wants, all floors combined. */
  totalFloorAreaSqFt: number
  /** Storeys above grade. 1 means the footprint equals the floor area. */
  storeys: number
  /** Basements add floor area but never footprint. */
  hasBasement?: boolean
  garage?: 'none' | 'attached_1_car' | 'attached_2_car' | 'detached'
  coveredPorch?: boolean
  /**
   * Whether the quoted area already includes the garage. Customers usually
   * quote finished living area, so this defaults to false.
   */
  areaIncludesGarage?: boolean
}

export interface FootprintEstimate {
  footprintSqFt: number
  /** Living-area contribution to the footprint, before garage and porch. */
  livingFootprintSqFt: number
  garageFootprintSqFt: number
  porchFootprintSqFt: number
  basis: string
  assumptions: string[]
  /** True when nothing had to be assumed — a single storey with no additions. */
  exact: boolean
}

/** Typical attached garage footprints, in square feet. */
export const GARAGE_FOOTPRINT_SQFT = {
  none: 0,
  attached_1_car: 240,   // 12 x 20
  attached_2_car: 440,   // 22 x 20
  detached: 0,           // footprint on the lot, but a separate structure
} as const

/** A modest covered front porch. */
export const COVERED_PORCH_SQFT = 60

export function estimateFootprint(p: HouseProgramme): FootprintEstimate {
  const assumptions: string[] = []
  const storeys = Math.max(1, Math.round(p.storeys || 1))

  if (p.totalFloorAreaSqFt <= 0) {
    return {
      footprintSqFt: 0, livingFootprintSqFt: 0, garageFootprintSqFt: 0, porchFootprintSqFt: 0,
      basis: 'No floor area given, so no footprint can be estimated.',
      assumptions: ['Ask the customer how large a house they want before drawing an envelope.'],
      exact: false,
    }
  }

  let livingArea = p.totalFloorAreaSqFt

  if (p.areaIncludesGarage && p.garage && p.garage !== 'none' && p.garage !== 'detached') {
    const g = GARAGE_FOOTPRINT_SQFT[p.garage]
    livingArea = Math.max(0, livingArea - g)
    assumptions.push(
      `The quoted ${p.totalFloorAreaSqFt.toLocaleString()} sq ft was taken to include the garage, so ` +
      `${g} sq ft was removed before dividing by storeys.`)
  }

  const livingFootprintSqFt = Math.round(livingArea / storeys)

  let basis: string
  let exact = false
  if (storeys === 1) {
    basis = `Single storey, so the footprint equals the floor area: ${livingFootprintSqFt.toLocaleString()} sq ft.`
    exact = true
  } else {
    basis = `${livingArea.toLocaleString()} sq ft over ${storeys} storeys = ${livingFootprintSqFt.toLocaleString()} sq ft per floor.`
    assumptions.push(
      `Floors assumed EQUAL in area. A real ${storeys}-storey house often has a smaller upper floor, ` +
      'which would make the true footprint larger than this. Treat it as a lower bound until a floor plan exists.')
  }

  if (p.hasBasement) {
    assumptions.push(
      'A basement was included. It adds floor area but no footprint and does not count toward lot ' +
      'coverage, so it is excluded from this figure.')
  }

  const garageFootprintSqFt = p.garage ? GARAGE_FOOTPRINT_SQFT[p.garage] : 0
  if (p.garage === 'detached') {
    assumptions.push(
      'A detached garage is a separate structure with its own footprint and setbacks. It is not ' +
      'included here and must be sited separately.')
  } else if (garageFootprintSqFt > 0 && !p.areaIncludesGarage) {
    assumptions.push(
      `An attached ${p.garage === 'attached_2_car' ? 'two' : 'one'}-car garage adds ${garageFootprintSqFt} sq ft ` +
      'of footprint. Quoted house sizes conventionally exclude the garage, so it is added rather than ' +
      'assumed to be inside the figure.')
    exact = false
  }

  const porchFootprintSqFt = p.coveredPorch ? COVERED_PORCH_SQFT : 0
  if (porchFootprintSqFt) {
    assumptions.push(
      `A covered porch adds ${porchFootprintSqFt} sq ft. Whether a porch counts toward lot coverage ` +
      "depends on the jurisdiction's definition — confirm before relying on the coverage margin.")
    exact = false
  }

  const footprintSqFt = livingFootprintSqFt + garageFootprintSqFt + porchFootprintSqFt

  assumptions.push(
    'This is an ESTIMATE from the size the customer asked for, not a design. The footprint a builder ' +
    'produces will differ. It is drawn so the plan shows a plausible building envelope.')

  return {
    footprintSqFt, livingFootprintSqFt, garageFootprintSqFt, porchFootprintSqFt,
    basis, assumptions, exact,
  }
}

/**
 * The questions to put to a customer who has no plans.
 *
 * Deliberately short. Every one changes the footprint; nothing here is asked
 * for its own sake.
 */
export interface ProgrammeQuestion {
  id: keyof HouseProgramme
  question: string
  type: 'number' | 'choice' | 'boolean'
  choices?: { value: string; label: string }[]
  why: string
  required: boolean
}

export const HOUSE_PROGRAMME_QUESTIONS: ProgrammeQuestion[] = [
  {
    id: 'totalFloorAreaSqFt',
    question: 'How large a house do you want, in total square feet?',
    type: 'number',
    why: 'The starting figure. Everything else adjusts it.',
    required: true,
  },
  {
    id: 'storeys',
    question: 'How many storeys above ground?',
    type: 'choice',
    choices: [
      { value: '1', label: 'One — single level' },
      { value: '2', label: 'Two' },
      { value: '3', label: 'Three' },
    ],
    why: 'A single-level house has a footprint equal to its floor area. Two storeys roughly halve it.',
    required: true,
  },
  {
    id: 'hasBasement',
    question: 'Do you want a basement?',
    type: 'boolean',
    why: 'A basement adds living area but no footprint, so it must not inflate the building outline.',
    required: false,
  },
  {
    id: 'garage',
    question: 'Do you want a garage?',
    type: 'choice',
    choices: [
      { value: 'none', label: 'No garage' },
      { value: 'attached_1_car', label: 'Attached, one car' },
      { value: 'attached_2_car', label: 'Attached, two cars' },
      { value: 'detached', label: 'Detached' },
    ],
    why: 'An attached garage adds footprint and is usually excluded from a quoted house size.',
    required: false,
  },
  {
    id: 'coveredPorch',
    question: 'Do you want a covered front porch?',
    type: 'boolean',
    why: 'A porch is footprint and may count toward lot coverage.',
    required: false,
  },
]
