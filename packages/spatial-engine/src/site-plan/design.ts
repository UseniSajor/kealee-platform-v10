/**
 * Design generation — the drafting step.
 *
 * Takes the site model plus the calculation package and produces the proposed
 * features each discipline sheet draws: demolition items, proposed grading,
 * utility runs, drainage areas and practices, sediment controls, paving, and
 * planting.
 *
 * This is what a designer does before a PE reviews. Where an input is missing,
 * the design proceeds on a STATED ASSUMPTION recorded on the feature, exactly as
 * a drafter would note it on the drawing — it does not stop.
 */

import type { SiteTwin, SiteFeature, Ring, Position } from './site-twin'
import { featuresOfKind, ringAreaSqFt } from './site-twin'
import {
  waterQualityVolume, practiceFootprint, sedimentTrapVolume,
  compositeRunoffCoefficient, peakDischargeRational, timeOfConcentrationKirpich,
  type Calculation,
} from './engineering'

export interface DesignAssumption {
  feature: string
  assumption: string
  resolvedBy: 'survey' | 'geotechnical' | 'applicant' | 'engineer' | 'utility_owner'
}

export interface DesignResult {
  features: SiteFeature[]
  assumptions: DesignAssumption[]
  calculations: Record<string, Calculation<unknown>>
  notes: string[]
}

/** Offsets a ring inward by a distance in feet (approximate, centroid-based). */
function insetRing(ring: Ring, feet: number): Ring {
  const pts = ring.coordinates
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length
  const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length
  return {
    coordinates: pts.map(p => {
      const dx = p[0] - cx
      const dy = p[1] - cy
      const d = Math.hypot(dx, dy) || 1
      const k = Math.max(0, (d - feet) / d)
      return [cx + dx * k, cy + dy * k] as Position
    }),
  }
}

function ringCentroid(ring: Ring): Position {
  const pts = ring.coordinates
  return [
    pts.reduce((s, p) => s + p[0], 0) / pts.length,
    pts.reduce((s, p) => s + p[1], 0) / pts.length,
  ]
}

function boxAt(center: Position, widthFt: number, heightFt: number): Ring {
  const [x, y] = center
  const w = widthFt / 2
  const h = heightFt / 2
  return { coordinates: [[x - w, y - h], [x + w, y - h], [x + w, y + h], [x - w, y + h], [x - w, y - h]] }
}

let seq = 0
const nextId = (p: string) => `${p}-${++seq}`

/** Even-odd point-in-ring. EPSG:2248 feet, so no projection. */
function pointInRing(p: Position, ring: readonly Position[]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j]
    if ((yi > p[1]) !== (yj > p[1])
        && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi || 1e-9) + xi) inside = !inside
  }
  return inside
}

export interface DesignInput {
  twin: SiteTwin
  /** Design storm depth for water quality, inches. */
  waterQualityStormIn?: number
  /** Rainfall intensity for peak flow, in/hr. */
  designIntensityInPerHr?: number
  /** Assumed contour interval, feet. */
  contourIntervalFt?: number
  /**
   * Midpoint of the FRONT lot line, from the street-based edge classification.
   *
   * Service runs and the driveway start here. Without it this module used
   * `site.coordinates[0]` — an arbitrary parcel vertex — which ran the utility
   * runs off the property on any lot whose first vertex is not the frontage.
   */
  frontPoint?: Position
  /**
   * The WHOLE front lot line, vertex by vertex.
   *
   * `frontPoint` is the midpoint of ONE front edge, which on a curved frontage
   * carried as short chords is an 11 ft fragment. Projecting a service tap onto
   * that fragment clamps it to the fragment's end, and the lateral then runs
   * diagonally across the yard to reach it. The run is what a tap is placed
   * against.
   */
  frontagePath?: Position[]
  /** Keep-out from the front lot line for practices, ft. */
  frontageKeepOutFt?: number
  /** Frontage geometry, for street trees in the planting strip. */
  frontageAxis?: {
    along: [number, number]
    outward: [number, number]
    lengthFt: number
    /** Distance out from the property line to the middle of the strip. */
    stripCentreFt: number
  } | null
  /** Mid of the lot line furthest from the street, for a rear connection. */
  rearPoint?: Position | null
  /** Which main the sanitary lateral runs to. Defaults to the frontage. */
  sanitaryFrom?: 'frontage' | 'rear'
  /**
   * An explicit sanitary connection, when the main is neither on the frontage
   * nor directly behind — an easement through an adjoining lot, for instance.
   * Overrides `sanitaryFrom`.
   */
  sanitaryPoint?: Position | null
  /**
   * The ROUTE the utility runs follow to reach the main, main end first.
   *
   * A service does not travel as the crow flies. The recorded connection
   * sketch takes both WHC and SHC out of the cul-de-sac, east through the 20 ft
   * WSSC easement to a cleanout at Lot 1's west corner, then south-east inside
   * a private utility easement along the Lot 1 / Lot 12 line. Drawn as a
   * straight line from main to dwelling instead, the run crossed Lot 15 —
   * property it has no right to be on and does not touch.
   */
  utilityRoute?: Position[] | null
  /**
   * Where a storm drain may legitimately discharge, and how it gets there.
   *
   * A storm run used to be drawn to the street unconditionally, and it was
   * removed because it was invented: a third service to a main nobody had
   * identified, drawn so it read exactly like the two that were real. It comes
   * back ONLY when a caller names a real outfall — `to` is the discharge point
   * and `via` an optional easement or corridor the run must follow. Absent
   * this, no storm drain is drawn, which is the previous behaviour.
   */
  stormOutfall?: {
    to: Position; via?: Position[] | null; label?: string; sizeIn?: number
    /** Width of a PROPOSED storm drainage easement over the run, ft. */
    easementWidthFt?: number | null
    /** RCP class as the county letters it, e.g. 'CL III', 'CL IV'. */
    pipeClass?: string | null
  } | null
  /**
   * Suppress the water and sanitary house connections.
   *
   * They are drawn from the frontage to the dwelling on the assumption that
   * mains run in the street. That assumption is backed by a recorded
   * connection sketch on the Rollins Avenue project and by nothing at all on
   * others, and a lateral drawn to a main nobody has located is the same defect
   * as the storm run that used to be invented. Set where no connection record
   * has been obtained.
   */
  omitWaterAndSewer?: boolean | null
  /**
   * Omit the on-lot ESD micro-bioretention practice.
   *
   * The practice is the right answer for a lot that must manage its own runoff
   * on site. Where a piped storm drain system in a recorded easement collects
   * the lots and carries the water to an outfall, an ESD cell drawn as well is
   * a second, contradictory scheme on the same sheet — it implies runoff is
   * being retained on the lot when the design conveys it away.
   */
  omitSwmPractice?: boolean | null
  /**
   * Rings the stormwater practice must stay clear of that are NOT on the twin.
   *
   * The subdivision-level easements — the private utility easement inside
   * Lot 1 and the public WSSC corridor — are built by the subdivision
   * generator AFTER each lot package, so no filter over `twin.features` can
   * see them. Lot 1's practice landed 1.03 ft off the private easement for
   * exactly that reason. The generator knows both, so it passes them in.
   */
  keepOutRings?: Position[][] | null
  /** Buildable envelope. Planting and practices are kept inside the lot. */
  envelope?: Ring
  hasDemolition?: boolean
  hasRoadWork?: boolean
}

/**
 * Produces the full proposed design from the model.
 *
 * Every generated feature carries `sourceId: 'design'` so it is distinguishable
 * from surveyed or GIS-sourced geometry — a reviewer can tell at a glance what
 * Kealee drew versus what was measured.
 */
export function generateDesign(input: DesignInput): DesignResult {
  const { twin } = input
  const features: SiteFeature[] = []
  const assumptions: DesignAssumption[] = []
  const calculations: Record<string, Calculation<unknown>> = {}
  const notes: string[] = []

  const base = { sourceId: 'design', reliabilityLevel: twin.sources.length ? 1 : 0, crs: twin.crs, revision: 1 } as const

  const parcel = featuresOfKind(twin, 'Parcel')[0]
  if (!parcel) {
    notes.push('No parcel geometry — design produced against the limit of disturbance only.')
  }
  const site = parcel?.ring
  const siteAreaSqFt = site ? ringAreaSqFt(site) : 0
  const siteAcres = siteAreaSqFt / 43_560

  const proposedBuildings = featuresOfKind(twin, 'Building').filter(b => !b.existing)
  const existingBuildings = featuresOfKind(twin, 'Building').filter(b => b.existing)
  const lod = featuresOfKind(twin, 'LimitOfDisturbance')[0]

  // ── C-300 Demolition ──────────────────────────────────────────────────────
  if (input.hasDemolition || existingBuildings.length > 0) {
    for (const b of existingBuildings) {
      features.push({
        ...base, kind: 'DemolitionFeature', id: nextId('demo'), ring: b.ring,
        attributes: { action: 'Remove existing structure', protectDuringDemolition: 'Adjacent structures and utilities' },
      } as SiteFeature)
    }
    notes.push('Demolition limits follow the existing structure footprints in the model.')
  }

  // ── C-400 Grading and drainage ────────────────────────────────────────────
  const contourIntervalFt = input.contourIntervalFt ?? 1
  if (!twin.verticalDatum) {
    assumptions.push({
      feature: 'Proposed grading',
      assumption:
        'No vertical datum is established. Proposed contours are shown on an ASSUMED datum with ' +
        'the benchmark to be set by the surveyor; all elevations are relative until then.',
      resolvedBy: 'survey',
    })
  }
  if (site) {
    // Drainage arrows follow the fall from the building pad toward the low side.
    const c = ringCentroid(site)
    features.push({
      ...base, kind: 'ProposedFeature', id: nextId('grade'),
      ring: insetRing(site, 5),
      attributes: {
        type: 'Graded area',
        // Routes this to the grading sheet. Without it `ProposedFeature` maps
        // to site_layout and the grading sheet draws no grading.
        proposed: true,
        contourIntervalFt,
        note: 'Positive drainage away from structure at 2% minimum for the first 10 ft.',
      },
    } as SiteFeature)
    features.push({
      ...base, kind: 'SpotElevation', id: nextId('ffe'), point: c,
      attributes: { label: 'FFE', note: 'Finished floor elevation to be set above the adjacent grade per code.' },
    } as SiteFeature)
  }

  // ── C-500 Utilities ───────────────────────────────────────────────────────
  if (site && proposedBuildings[0]) {
    const bc = ringCentroid(proposedBuildings[0].ring)
    const frontage = input.frontPoint ?? site.coordinates[0]
    // WHERE EACH SERVICE COMES FROM IS A FACT ABOUT THE SITE, not a default.
    //
    // All three ran from the frontage because that is the usual case. It is not
    // always the case: a lot can be sewered from a main in the rear, and drawing
    // that lateral out to the street instead is a connection to the wrong main.
    // `sanitaryFrom` says which, and the rear point is the mid of the edge
    // furthest from the street.
    const rearPoint: Position | null = input.rearPoint ?? null
    // The sanitary can run to a POINT that is neither the frontage nor the
    // rear: these lots are sewered from Lot 13 in the adjoining subdivision,
    // through the north-east boundary. An edge name cannot express that, and
    // routing the lateral to the street instead would connect it to a main it
    // does not reach.
    const sanitaryStart: Position =
      input.sanitaryPoint ??
      (input.sanitaryFrom === 'rear' && rearPoint ? rearPoint : frontage)
    // SIZES ARE LETTERED, because a service run without one is not a service a
    // plumber can install or an inspector can check. These are the ordinary
    // residential sizes — a 1 in copper water service and a 4 in PVC sanitary
    // lateral — and they are labelled as STANDARD, not as a design: WSSC sizes
    // the water service from fixture count and the lateral from the invert it
    // has to meet.
    // WATER COMES FROM THE SAME PLACE AS THE SEWER.
    //
    // The recorded WATER & SEWER CONNECTION SKETCH shows WHC and SHC — the
    // water and sewer house connections — running TOGETHER in the 20 ft WSSC
    // easement from the mains in Modupeola Way. This had water tapping Rollins
    // Avenue because that is the usual case; the recorded sketch says it is not
    // the case here, and a service drawn to a main it does not reach is a
    // connection nobody can build.
    //
    // Storm stays on the frontage: it is a roof drain to the street, not a WSSC
    // connection, and the sketch does not carry it.
    const utilityStart: Position = input.sanitaryPoint ?? frontage
    // The services enter the SIDE of the dwelling nearest where they come from,
    // not its centre. Run to the centroid they crossed the whole footprint —
    // under the house — to reach a point inside it.
    // THE SERVICES ENTER THE FACE NEAREST WHERE THEY COME FROM, and they stop
    // at it.
    //
    // This took the NORTH face unconditionally, which is right for Rollins —
    // the recorded connection sketch brings the corridor down from Modupeola
    // Way to the north — and wrong the moment the main is anywhere else. On
    // Fort Foote Road the water and sewer are in the STREET, at the front, so a
    // run to the north face left the frontage, crossed the entire dwelling
    // underneath it, and surfaced at the back wall. A service drawn through a
    // house is not a service anybody can install, and on the sheet it reads as
    // a pipe under the foundation.
    //
    // Choosing the face whose midpoint is nearest the source restores the
    // Rollins behaviour for Rollins — the north face IS the nearest one there —
    // without asserting a compass direction that only ever suited one project.
    // The line ends ON the wall: nothing is drawn inside the footprint.
    const entry: Position = (() => {
      const fp = proposedBuildings[0]?.ring?.coordinates as Position[] | undefined
      if (!fp?.length) return bc
      let best: Position = fp[0], bestD = Infinity
      for (let i = 0; i < fp.length - 1; i++) {
        const m: Position = [(fp[i][0] + fp[i + 1][0]) / 2, (fp[i][1] + fp[i + 1][1]) / 2]
        const d = Math.hypot(m[0] - utilityStart[0], m[1] - utilityStart[1])
        if (d < bestD) { bestD = d; best = m }
      }
      return best
    })()

    /**
     * WHERE THE SERVICES LEAVE THE HOUSE — the left-hand end of the face
     * nearest the main, clear of the driveway.
     *
     * Entering at the MIDDLE of the face put both services under the concrete
     * driveway, which is centred on the garage door and takes up the right-hand
     * half of the frontage: a water service under a driveway is one that cannot
     * be excavated without breaking the slab, and the sheet showed it crossing
     * paving that had not been detailed for it.
     *
     * The driveway is placed by `site-improvements.ts` on the POSITIVE side of
     * the front-edge direction — `centreOffset + DRIVEWAY_WIDTH_FT` — so the
     * far end of that axis is the side the services take, by the same
     * convention rather than by a compass direction.
     *
     * `along` is the front lot line's own direction, so "left" here means the
     * same thing it means to somebody standing in the street.
     */
    const serviceExit = (offsetAlongFt: number): Position => {
      const fp = proposedBuildings[0]?.ring?.coordinates as Position[] | undefined
      const axis = input.frontageAxis?.along
      if (!fp?.length || !axis) return entry
      // The face the services use: the one `entry` sits on.
      let faceI = 0, bestD = Infinity
      for (let i = 0; i < fp.length - 1; i++) {
        const m: Position = [(fp[i][0] + fp[i + 1][0]) / 2, (fp[i][1] + fp[i + 1][1]) / 2]
        const d = Math.hypot(m[0] - entry[0], m[1] - entry[1])
        if (d < bestD) { bestD = d; faceI = i }
      }
      const a2 = fp[faceI], b2 = fp[faceI + 1]
      // The low end of the face along the frontage axis is the left-hand one.
      const along = (q: Position) => q[0] * axis[0] + q[1] * axis[1]
      const lo = along(a2) <= along(b2) ? a2 : b2
      const hi = along(a2) <= along(b2) ? b2 : a2
      const ex = hi[0] - lo[0], ey = hi[1] - lo[1]
      const el = Math.hypot(ex, ey) || 1
      // Scaled to the face, so a short wall still separates the two services
      // instead of clamping both to its far end. On Lot 54 the run leaves a
      // 26 ft side wall and the fixed 3 ft / 13 ft offsets collapsed to 1.5 ft
      // apart — a tenth of the separation the pair is meant to hold.
      const frac = offsetAlongFt <= 3 ? 0.12 : 0.55
      const d2 = Math.max(1, Math.min(offsetAlongFt, el * frac))
      return [lo[0] + (ex / el) * d2, lo[1] + (ey / el) * d2]
    }
    // STORM DRAIN — only to a NAMED outfall.
    //
    // A storm run to Rollins Avenue was previously drawn unconditionally. It
    // was not on that connection sketch, and inventing a third service on a
    // permit set — one nobody has designed, to a main nobody has identified —
    // is worse than an absent one: it reads exactly like the two that are
    // real. So it is now driven by `stormOutfall`, which a caller supplies
    // only when there is somewhere real for the water to go.
    if (input.stormOutfall) {
      const so = input.stormOutfall
      // RCP WITH A CLASS, and 15 in minimum — county practice, not a guess.
      //
      // This defaulted to 6 in HDPE. The DPW&T-approved 'STORM DRAIN & PAVING
      // PLAN' for Yocum Property / Joseph Drive (permit 25927-2020) uses
      // reinforced concrete pipe with a CLASS designation throughout and its
      // smallest run is 15 in RCP CL III. A 6 in pipe at 1.08% carries 0.58
      // cfs, which is under the 10-year flow from even the smallest of these
      // lots, so the old default was both non-standard and undersized.
      const sizeIn = Math.max(15, so.sizeIn ?? 15)
      const pipeClass = so.pipeClass ?? 'CL IV'
      // THE STORM LEAVES THE FACE NEAREST ITS OWN DESTINATION.
      //
      // It shared `entry` with the water and sewer, which is the face nearest
      // the MAIN — on Fort Foote Road that is the front of the house, while the
      // storm runs to a structure at the REAR. The consequence was a storm
      // lateral drawn from the front wall, straight under the dwelling, out of
      // the back: measured on the model it crossed the footprint on three of
      // the four lots.
      //
      // Water and sewer come from one place and storm goes to another, so they
      // do not share an entry point.
      const stormEntry: Position = (() => {
        const fp = proposedBuildings[0]?.ring?.coordinates as Position[] | undefined
        if (!fp?.length) return entry
        const target = (so.via?.[0] ?? so.to) as Position
        let best: Position = fp[0], bestD = Infinity
        for (let i = 0; i < fp.length - 1; i++) {
          const m: Position = [(fp[i][0] + fp[i + 1][0]) / 2, (fp[i][1] + fp[i + 1][1]) / 2]
          const d = Math.hypot(m[0] - target[0], m[1] - target[1])
          if (d < bestD) { bestD = d; best = m }
        }
        return best
      })()
      const line: Position[] = [stormEntry, ...(so.via ?? []), so.to]
      features.push({
        ...base, kind: 'Utility', id: nextId('util'),
        line,
        attributes: {
          type: 'Storm drain',
          size: `${sizeIn}" RCP ${pipeClass}`,
          from: 'rear',
          sizeAtHouse: `${sizeIn}" RCP ${pipeClass}`,
          note: so.label
            ?? 'Roof and driveway runoff collected and conveyed to the outfall shown. '
               + 'Invert elevations, pipe class and outfall protection are the engineer\'s at '
               + 'design; the run shows the ROUTE and the discharge point, both of which are '
               + 'named rather than assumed.',
        },
      } as SiteFeature)
      // A PROPOSED STORM DRAINAGE EASEMENT OVER THE RUN.
      //
      // A storm drain that crosses ground on its way to an outfall needs a
      // recorded right, and a plan that draws the pipe without the easement
      // shows half the proposal. The strip is centred on the run and follows
      // every leg of it, so it is the pipe's own corridor rather than a box
      // drawn near it.
      const ew = so.easementWidthFt ?? 0
      if (ew > 0 && line.length >= 2) {
        const half = ew / 2
        const left: Position[] = [], right: Position[] = []
        for (let i = 0; i < line.length; i++) {
          // Direction at this vertex: the mean of the legs meeting there, so
          // the strip does not pinch at a bend.
          const prev = line[Math.max(0, i - 1)], next = line[Math.min(line.length - 1, i + 1)]
          const dx = next[0] - prev[0], dy = next[1] - prev[1]
          const ln = Math.hypot(dx, dy) || 1
          const nx = -dy / ln, ny = dx / ln
          left.push([line[i][0] + nx * half, line[i][1] + ny * half])
          right.push([line[i][0] - nx * half, line[i][1] - ny * half])
        }
        const ring: Position[] = [...left, ...right.reverse(), left[0]]
        features.push({
          ...base, kind: 'Easement', id: nextId('esmt'),
          ring: { coordinates: ring },
          easementType: 'Storm Drainage',
          widthFt: ew,
          beneficiary: 'Prince George\'s County — storm drainage',
          recordReference: 'PROPOSED — TO BE RECORDED',
        } as never as SiteFeature)
      }
      assumptions.push({
        feature: 'Storm drain',
        assumption:
          `Storm drainage is conveyed to ${so.label ?? 'the named outfall'} at `
          + `[${so.to[0].toFixed(2)}, ${so.to[1].toFixed(2)}]. Pipe shown ${sizeIn}" RCP `
          + `${pipeClass}, the county minimum for a storm drain main. `
          + 'Sizing by the rational method against the site rainfall point; inverts, slope, '
          + 'outfall protection and any easement over intervening ground are still to be set.',
        resolvedBy: 'engineer',
      })
    }
    // ONLY WHAT THE RECORDED SKETCH SHOWS FOR WATER AND SEWER: WHC and SHC.
    //
    // ONE TRENCH. The two were offset four feet either side of centre, drawn as
    // separate excavations. They are laid in the same trench, so they are drawn
    // a foot apart: close enough to read as one run, far enough to tell apart.
    // THE TAP IS IN FRONT OF THE HOUSE IT SERVES, and the run is square to the
    // street.
    //
    // Every lateral started at ONE point on the frontage — whichever the caller
    // supplied — so on a lot whose dwelling sits away from that point the
    // service crossed the front yard on the diagonal. Services are not laid
    // diagonally; they leave the main at right angles and run straight to the
    // house, which is also what keeps them inside the strip the utility has a
    // right in.
    //
    // The tap is the point on the FRONT LOT LINE nearest the dwelling's service
    // face, found by projecting onto the frontage edge itself, so the run is
    // perpendicular to the street by construction.
    const tapOnFrontage = (at: Position): Position => {
      // The nearest point on the FRONT RUN — every segment of it, not the one
      // chord nearest a supplied point. Where no run was given this falls back
      // to the whole ring, which is still nearer the truth than one edge.
      const path = input.frontagePath?.length && input.frontagePath.length >= 2
        ? input.frontagePath
        : site.coordinates
      let bestP: Position = at, bestD = Infinity
      for (let i = 0; i < path.length - 1; i++) {
        const a2 = path[i], b2 = path[i + 1]
        const vx = b2[0] - a2[0], vy = b2[1] - a2[1]
        const L2 = vx * vx + vy * vy
        if (!L2) continue
        const tt = Math.max(0, Math.min(1, ((at[0] - a2[0]) * vx + (at[1] - a2[1]) * vy) / L2))
        const q: Position = [a2[0] + vx * tt, a2[1] + vy * tt]
        const d = Math.hypot(q[0] - at[0], q[1] - at[1])
        if (d < bestD) { bestD = d; bestP = q }
      }
      return bestP
    }

    // WATER AND SEWER ARE SEPARATE SERVICES AND MUST LOOK LIKE IT.
    //
    // The two runs were offset ONE FOOT either side of the same line, in X
    // only. At 1" = 20' that is a tenth of an inch on paper: they printed as a
    // single service with two labels, and on a skewed lot the X-only offset put
    // them closer still. WSSC requires 10 ft of horizontal separation between a
    // water service and a sewer lateral, so 5 ft either side of the centreline
    // is the real dimension AND the legible one — and it is measured
    // PERPENDICULAR TO THE RUN, which is where separation is actually required.
    const SERVICE_SEPARATION_HALF_FT = 5
    const runs: [string, number, Position, string][] = [
      ['Water service (WHC)', -SERVICE_SEPARATION_HALF_FT, utilityStart,
       '1" COPPER FROM EX. 8" MAIN'],
      ['Sanitary lateral (SHC)', SERVICE_SEPARATION_HALF_FT, sanitaryStart,
       '4" PVC TO EX. 8" MAIN'],
    ]
    for (const [type, offset, from, size] of (input.omitWaterAndSewer ? [] : runs)) {
      // Offset ACROSS the run, not along one axis.
      const startsAtFrontage = from === utilityStart || from === sanitaryStart
      // WHERE IT LEAVES THE HOUSE, and the tap DIRECTLY OPPOSITE IT.
      //
      // The services shared one entry point and were then thrown 5 ft apart at
      // the main, which made both runs diagonal — the separation was bought
      // with an angle. They now leave the wall 10 ft apart and each runs to the
      // point on the front lot line straight in front of where it left, so both
      // are perpendicular to the street and parallel to each other.
      //
      // Water at 3 ft from the left corner, sanitary at 13 ft: the WSSC 10 ft
      // horizontal separation, held the whole length of both runs.
      const houseExit = startsAtFrontage && !input.utilityRoute?.length
        ? serviceExit(/water/i.test(type) ? 3 : 13)
        : entry
      const tap = startsAtFrontage && !input.utilityRoute?.length
        ? tapOnFrontage(houseExit) : from
      const shift = (q: Position): Position => q
      features.push({
        ...base, kind: 'Utility', id: nextId('util'),
        // The ROUTE, then the house. Every vertex carries the same lateral
        // offset so the three services run parallel down the corridor rather
        // than converging on one line.
        // SEPARATED AT THE MAIN, TOUCHING THE HOUSE AT THE OTHER END.
        //
        // The 10 ft separation belongs in the ground between the main and the
        // building, not at the wall: offsetting BOTH ends moved each service 5
        // ft sideways off the face it enters, so neither line reached the house
        // it serves. They now diverge at the tap and converge on the dwelling,
        // which is how they are laid and how an approved sheet draws them.
        line: input.utilityRoute?.length && startsAtFrontage
          ? [
              ...input.utilityRoute.map(q => [q[0] + offset, q[1]] as Position),
              entry,
            ]
          : [tap, houseExit],
        attributes: {
          type,
          size,
          // SIZE AT EACH END. `size` is the run's own caption along the line;
          // these are lettered AT the two connections, which is where a
          // builder and an inspector look for them: the main it comes from and
          // the service that enters the dwelling.
          sizeAtHouse: /water/i.test(type) ? '1" COPPER' : '4" PVC',
          from: from === frontage ? 'frontage'
            : input.sanitaryPoint && from === input.sanitaryPoint ? 'offsite' : 'rear',
          note: 'Record information. Field verification required before excavation — call Miss Utility.',
        },
      } as SiteFeature)
    }
    assumptions.push({
      feature: 'Utility connections',
      assumption:
        'Sizes shown are the ordinary residential standards — 1 in copper water service, 4 in PVC ' +
        'sanitary lateral and storm. WSSC sizes the water service from fixture count and the lateral ' +
        'from the invert it must meet; main locations and inverts are not in the model and must be ' +
        'confirmed against utility-owner records and field locates.',
      resolvedBy: 'utility_owner',
    })
  }

  // ── C-600 Stormwater ──────────────────────────────────────────────────────
  const impervious =
    proposedBuildings.reduce((s, b) => s + ringAreaSqFt(b.ring), 0) +
    (lod ? ringAreaSqFt(lod.ring) * 0.15 : 0)
  const percentImpervious = siteAreaSqFt > 0 ? Math.min(100, (impervious / siteAreaSqFt) * 100) : 0

  if (siteAcres > 0) {
    const wq = waterQualityVolume(input.waterQualityStormIn ?? 1.0, percentImpervious, siteAcres)
    calculations.waterQualityVolume = wq as Calculation<unknown>
    const fp = practiceFootprint(wq.value.wqvCubicFeet, 2)
    calculations.practiceFootprint = fp as Calculation<unknown>

    const cComposite = compositeRunoffCoefficient([
      { areaAcres: impervious / 43_560, surface: 'roof' },
      { areaAcres: Math.max(0, siteAcres - impervious / 43_560), surface: 'lawn_average' },
    ])
    calculations.compositeRunoffCoefficient = cComposite as Calculation<unknown>
    const tc = timeOfConcentrationKirpich(Math.max(50, Math.sqrt(siteAreaSqFt)), 0.02)
    calculations.timeOfConcentration = tc as Calculation<unknown>
    calculations.peakDischarge = peakDischargeRational(
      cComposite.value, input.designIntensityInPerHr ?? 6.2, siteAcres,
    ) as Calculation<unknown>

    if (site) {
      // Place the practice at the low corner — INSIDE THE LOT.
      //
      // A fixed offset from the lowest vertex is fine on a rectangle and lands
      // off the property on a triangle: Lot 2 had no practice at all, because
      // the containment filter quite correctly threw the box away. The position
      // is walked in toward the centroid until the whole footprint is contained,
      // so the practice stays as low as it can be while being on the lot.
      const low = site.coordinates.reduce((a, p) => (p[1] < a[1] ? p : a), site.coordinates[0])
      const side = Math.sqrt(fp.value.footprintSqFt)
      const sc = ringCentroid(site)
      // Inside the lot AND clear of everything already placed. Containment
      // alone put Lot 2's practice on top of the sidewalk: a bioretention cell
      // under a public walk is not a practice, it is two things drawn in the
      // same place.
      // FROM THE TWIN AS WELL AS FROM THIS FUNCTION'S OWN OUTPUT.
      //
      // `features` is the array of features THIS call is generating. The
      // dwelling, driveway, leadwalk, stoop, sidewalk and curb are on the TWIN,
      // put there before `generateDesign` runs — so filtering `features` for
      // 'Building' matched nothing and the 3 ft clearance was measured against
      // an empty list. The practice cleared the frontage strip and then landed
      // 0.99 ft off the dwelling. The tree placement below already works around
      // this by pushing `footprintRing` in by hand; the fix belongs here, on
      // the source of the rings.
      // 'Easement' is in the list: a bioretention cell in a utility easement is
      // a conflict a reviewer rejects, and Lot 1's landed 1.03 ft off the
      // private easement because easements were never treated as obstacles.
      const OBSTACLE_KINDS = [
        'Building', 'Pavement', 'Sidewalk', 'Surface', 'Tree', 'SWMPractice', 'Easement',
      ]
      const placedRings: Position[][] = [
        ...[...twin.features, ...features]
          .filter(f => OBSTACLE_KINDS.includes(f.kind))
          .map(f => ((f as { ring?: { coordinates: Position[] } }).ring?.coordinates ?? [])),
        // Easements the twin does not carry yet, handed in by the caller.
        ...(input.keepOutRings ?? []),
      ].filter(r => r.length > 2)
      const CLEAR = 3
      // AND CLEAR OF THE FRONTAGE STRIP.
      //
      // The sidewalk and planting strip are added to the drawing AFTER the
      // practice is placed — they belong to the frontage, not to the lot — so
      // checking against what exists at this moment cannot see them, and Lot
      // 2's cell landed on the walk twice. The front band is kept clear by
      // distance instead of by geometry that does not exist yet.
      // Measured from the front LINE, not from a point on it.
      //
      // A keep-out radius around `frontPoint` clears one spot and leaves the
      // rest of a 134 ft frontage open, which is how Lot 2's cell landed on the
      // walk again after the first fix. The strip runs the whole line, so the
      // distance has to be to the line.
      const frontKeepOutFt = input.frontageKeepOutFt ?? 0
      const frontSeg = input.frontageAxis && input.frontPoint
        ? (() => {
            const [ux, uy] = input.frontageAxis.along
            const h = input.frontageAxis.lengthFt / 2
            const c = input.frontPoint
            return [
              [c[0] - ux * h, c[1] - uy * h] as Position,
              [c[0] + ux * h, c[1] + uy * h] as Position,
            ] as [Position, Position]
          })()
        : null
      const fits = (q: Position) => {
        const box = boxAt(q, side, side).coordinates as Position[]
        if (!box.every(v => pointInRing(v, site.coordinates as Position[]))) return false
        if (frontKeepOutFt > 0 && frontSeg) {
          const [fa, fb] = frontSeg
          const vx = fb[0] - fa[0], vy = fb[1] - fa[1]
          for (const v of box) {
            const t = Math.max(0, Math.min(1,
              ((v[0] - fa[0]) * vx + (v[1] - fa[1]) * vy) / (vx * vx + vy * vy || 1)))
            const d = Math.hypot(v[0] - (fa[0] + t * vx), v[1] - (fa[1] + t * vy))
            if (d < frontKeepOutFt) return false
          }
        }
        for (const rg of placedRings) {
          if (box.some(v => pointInRing(v, rg))) return false
          if (rg.some(v => pointInRing(v, box))) return false
          for (const v of box) {
            for (let i = 0; i < rg.length - 1; i++) {
              const a2 = rg[i], b2 = rg[i + 1]
              const vx = b2[0] - a2[0], vy = b2[1] - a2[1]
              const t = Math.max(0, Math.min(1,
                ((v[0] - a2[0]) * vx + (v[1] - a2[1]) * vy) / (vx * vx + vy * vy || 1)))
              if (Math.hypot(v[0] - (a2[0] + t * vx), v[1] - (a2[1] + t * vy)) < CLEAR) return false
            }
          }
        }
        return true
      }
      // THE SEARCH IS OVER THE LOT, and there is NO fallback onto the walk.
      //
      // It walked 41 points along the single line from the low corner to the
      // centroid. On Lot 2 that line found nothing, and the `??` fallback then
      // placed the box at exactly the raw low-corner offset the search exists
      // to avoid — 0.62 ft off the front property line, on the public walk,
      // with the 14 ft frontage keep-out silently discarded. A fallback that
      // ignores every constraint the search enforces is worse than no practice:
      // it looks placed.
      //
      // A grid over the lot is searched instead, lowest first — the practice
      // still goes as low as it can, but only where it actually fits. If
      // nothing fits, NOTHING IS DRAWN and it is reported as unplaced.
      const xs = site.coordinates.map(q => q[0]), ys = site.coordinates.map(q => q[1])
      const minX = Math.min(...xs), maxX = Math.max(...xs)
      const minY = Math.min(...ys), maxY = Math.max(...ys)
      const STEP = Math.max(2, side / 3)
      const cands: Position[] = []
      for (let gy = minY + side / 2; gy <= maxY - side / 2; gy += STEP) {
        for (let gx = minX + side / 2; gx <= maxX - side / 2; gx += STEP) {
          cands.push([gx, gy] as Position)
        }
      }
      // Lowest ground first, and among equals the one nearest the low corner,
      // so the choice is stable rather than whatever the scan order gives.
      cands.sort((a2, b2) =>
        a2[1] - b2[1] ||
        Math.hypot(a2[0] - low[0], a2[1] - low[1]) - Math.hypot(b2[0] - low[0], b2[1] - low[1]))
      // Keep the original line search as the first preference: it encodes the
      // low-corner-toward-centroid intent and usually succeeds.
      const preferred: Position[] = []
      for (let k = 0; k <= 40; k++) {
        const t = k / 40
        preferred.push([
          low[0] + (sc[0] - low[0]) * t + (t === 0 ? side / 2 + 6 : 0),
          low[1] + (sc[1] - low[1]) * t + (t === 0 ? side / 2 + 6 : 0),
        ] as Position)
      }
      let swmAt: Position | null = null
      for (const q of [...preferred, ...cands]) {
        if (fits(q)) { swmAt = q; break }
      }
      if (swmAt && !input.omitSwmPractice) {
        features.push({
          ...base, kind: 'SWMPractice', id: nextId('swm'),
          ring: boxAt(swmAt, side, side),
          attributes: {
            practice: 'Environmental Site Design — micro-bioretention',
            requiredVolumeCf: wq.value.wqvCubicFeet,
            footprintSqFt: fp.value.footprintSqFt,
            pondingDepthFt: 2,
          },
        } as SiteFeature)
      } else {
        assumptions.push({
          feature: 'Stormwater practice',
          assumption:
            `NO LOCATION FOUND on this lot for a ${Math.round(fp.value.footprintSqFt)} sq ft ` +
            `micro-bioretention practice clear of the dwelling, the paving, the trees and the ` +
            `${frontKeepOutFt} ft frontage strip. The practice is REQUIRED and is NOT DRAWN: ` +
            'the volume is computed and tabulated, and the facility needs a designer to place it — ' +
            'a smaller or linear practice, more than one cell, or a different practice type.',
          resolvedBy: 'engineer',
        })
      }
      features.push({
        ...base, kind: 'DrainageArea', id: nextId('da'), ring: site,
        attributes: {
          areaAcres: Number(siteAcres.toFixed(4)),
          percentImpervious: Number(percentImpervious.toFixed(1)),
          compositeC: cComposite.value,
        },
      } as SiteFeature)
    }
    assumptions.push({
      feature: 'Stormwater practice',
      assumption:
        'Infiltration feasibility is assumed pending geotechnical testing. Practice type and sizing ' +
        'change if infiltration rates or groundwater separation do not support ESD.',
      resolvedBy: 'geotechnical',
    })
  }

  // ── C-700 Sediment and erosion control ────────────────────────────────────
  if (lod) {
    const lodAcres = ringAreaSqFt(lod.ring) / 43_560
    const trap = sedimentTrapVolume(lodAcres)
    calculations.sedimentTrapVolume = trap as Calculation<unknown>
    features.push({
      ...base, kind: 'ProposedFeature', id: nextId('esc'), ring: lod.ring,
      attributes: {
        type: 'Silt fence / super silt fence',
        note: 'Perimeter control on the down-gradient limit of disturbance.',
      },
    } as SiteFeature)
    const entry = lod.ring.coordinates[0]
    features.push({
      ...base, kind: 'ProposedFeature', id: nextId('sce'),
      ring: boxAt([entry[0] + 15, entry[1] - 8], 30, 16),
      attributes: { type: 'Stabilized construction entrance', note: 'Mountable berm, washrack where required.' },
    } as SiteFeature)
    notes.push(
      'Sequence of construction: install perimeter controls and stabilized entrance, ' +
      'then clear and grub, rough grade, install utilities and stormwater practices, ' +
      'fine grade, stabilize, and remove controls only after permanent stabilization.',
    )
  }

  // ── C-800 Paving and access ───────────────────────────────────────────────
  if (input.hasRoadWork || proposedBuildings[0]) {
    if (site && proposedBuildings[0]) {
      const bc = ringCentroid(proposedBuildings[0].ring)
      const front = input.frontPoint ?? site.coordinates[0]
      features.push({
        ...base, kind: 'Pavement', id: nextId('drive'),
        ring: {
          coordinates: [
            [front[0] + 4, front[1]], [front[0] + 16, front[1]],
            [bc[0] + 16, bc[1]], [bc[0] + 4, bc[1]], [front[0] + 4, front[1]],
          ],
        },
        attributes: { type: 'Driveway', widthFt: 12, surface: 'Asphalt over compacted base' },
      } as SiteFeature)
    }
  }

  // ── L-100 Landscape and canopy ────────────────────────────────────────────
  if (site) {
    const c = ringCentroid(site)
    // Inside the buildable envelope when there is one: a shade tree drawn
    // over the neighbour's lot is a defect, and on an infill lot a fixed
    // 30 ft offset from the centroid lands there.
    const plantRef = input.envelope ?? { coordinates: site.coordinates }
    const pc = ringCentroid(plantRef)
    const spread = Math.max(8, Math.min(24, Math.sqrt(ringAreaSqFt(plantRef)) / 4))

    // TREES GO IN THE YARD, NOT ON THE HOUSE.
    //
    // They were offset from the ENVELOPE centroid — which is where the dwelling
    // sits, because the dwelling is placed against the front of that same
    // envelope. All three landed on the roof.
    //
    // Candidates now ring the footprint and are kept only where they fall
    // inside the lot and clear of the building. A tree that cannot be placed is
    // not placed: a shade tree drawn through a wall is a defect a reviewer sees
    // before anything else on the sheet.
    const footprintRing = proposedBuildings[0]?.ring?.coordinates as Position[] | undefined
    const TREE_HALF = 6, CLEAR_FT = 8
    // Clear of EVERY structure and paved surface, not just the dwelling.
    // Checking the footprint alone left trees standing in the walk, the
    // driveway and the stoop.
    const obstacles: Position[][] = features
      .filter(f => ['Building', 'Pavement', 'Sidewalk', 'SWMPractice'].includes(f.kind))
      .map(f => ((f as { ring?: { coordinates: Position[] } }).ring?.coordinates ?? []))
      .filter(r => r.length > 2)
    if (footprintRing) obstacles.push(footprintRing)
    const clearOfHouse = (q: Position) => {
      if (!obstacles.length) return true
      for (const ring2 of obstacles) {
        if (pointInRing(q, ring2)) return false
        for (let i = 0; i < ring2.length - 1; i++) {
          const a2 = ring2[i], b2 = ring2[i + 1]
          const vx = b2[0] - a2[0], vy = b2[1] - a2[1]
          const t = Math.max(0, Math.min(1,
            ((q[0] - a2[0]) * vx + (q[1] - a2[1]) * vy) / (vx * vx + vy * vy || 1)))
          const d = Math.hypot(q[0] - (a2[0] + t * vx), q[1] - (a2[1] + t * vy))
          if (d < CLEAR_FT + TREE_HALF) return false
        }
      }
      return true
    }
    const inLot = (q: Position) => pointInRing(q, site.coordinates as Position[])
    const anchor: Position = footprintRing ? ringCentroid({ coordinates: footprintRing }) : pc
    const placed: Position[] = []
    for (let ring2 = 1; ring2 <= 4 && placed.length < 3; ring2++) {
      const r2 = spread * ring2
      for (let k = 0; k < 12 && placed.length < 3; k++) {
        const th = (k / 12) * Math.PI * 2
        const q: Position = [anchor[0] + Math.cos(th) * r2, anchor[1] + Math.sin(th) * r2]
        if (!inLot(q) || !clearOfHouse(q)) continue
        if (placed.some(p2 => Math.hypot(p2[0] - q[0], p2[1] - q[1]) < spread)) continue
        placed.push(q)
      }
    }
    // STREET TREES IN THE PLANTING STRIP.
    //
    // Sec. 25-129 counts street trees in the right-of-way toward the canopy
    // requirement, which is the whole reason the strip is on the drawing. A
    // planting strip with no trees in it is a mown verge.
    if (input.frontPoint && input.frontageAxis) {
      const [ux, uy] = input.frontageAxis.along
      const [nx, ny] = input.frontageAxis.outward
      const fLen = input.frontageAxis.lengthFt
      const OFFSET_FT = input.frontageAxis.stripCentreFt
      const SPACING_FT = 35
      const count = Math.max(1, Math.floor(fLen / SPACING_FT))
      for (let k = 1; k <= count; k++) {
        const along = (fLen * k) / (count + 1)
        const q: Position = [
          input.frontPoint[0] + ux * (along - fLen / 2) + nx * OFFSET_FT,
          input.frontPoint[1] + uy * (along - fLen / 2) + ny * OFFSET_FT,
        ]
        features.push({
          ...base, kind: 'Tree', id: nextId('street-tree'),
          ring: boxAt(q, 10, 10),
          designation: 'Street tree in planting strip',
        } as SiteFeature)
      }
    }

    for (const q of placed) {
      features.push({
        ...base, kind: 'Tree', id: nextId('tree'),
        ring: boxAt(q, TREE_HALF * 2, TREE_HALF * 2),
        designation: 'Proposed shade tree',
      } as SiteFeature)
    }
    assumptions.push({
      feature: 'Tree canopy schedule',
      assumption:
        'Subtitle 25 § 25-128 Table 1 is loaded: RSF-65 requires 20% canopy on the NET TRACT AREA. ' +
        'The trees drawn are a layout, not the schedule — quantity and species come from the ' +
        'Landscape Manual, and § 25-129 lets preserved trees and street trees in the right-of-way ' +
        'count at ten-year canopy.',
      resolvedBy: 'engineer',
    })
  }

  return { features, assumptions, calculations, notes }
}
