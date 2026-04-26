/**
 * services/api/src/lib/orchestrator/retrieval/live-db.ts
 *
 * Live Prisma DB context fetcher for all agents.
 *
 * Priority rule: live DB data ALWAYS overrides RAG static data.
 * RAG is fallback only when no live record exists.
 *
 * Fetches per agent call:
 *   - Parcel         (by projectId or address)
 *   - ZoningProfile  (by address or parcel.address)
 *   - FeasibilityStudy (by projectId)
 *   - DigitalTwin    (by projectId)
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LiveParcel {
  id:               string
  acreage:          number | null
  squareFeet:       number | null
  developmentScore: number | null
  currentUse:       string | null
  status:           string
  address:          string | null
  city:             string | null
  state:            string | null
  zipCode:          string | null
}

export interface LiveZoning {
  id:                  string
  zoningDistrict:      string
  zoningCode:          string
  maxDensity:          number | null
  maxHeight:           number | null
  maxStories:          number | null
  maxFAR:              number | null
  maxLotCoverage:      number | null
  frontSetback:        number | null
  sideSetback:         number | null
  rearSetback:         number | null
  allowedHousingTypes: string[]
  nepaExemption:       string
}

export interface LiveFeasibility {
  id:               string
  status:           string
  decision:         string | null
  bestIRR:          number | null
  bestROI:          number | null
  totalProjectCost: number | null
  aiConfidence:     number | null
  targetUnits:      number | null
  targetSqFt:       number | null
  productType:      string | null
}

export interface LiveDigitalTwin {
  id:           string
  status:       string
  healthStatus: string
  healthScore:  number
  currentPhase: string | null
  tier:         string
  enabledModules: string[]
}

export interface LiveDBContext {
  parcel:      LiveParcel      | null
  zoning:      LiveZoning      | null
  feasibility: LiveFeasibility | null
  twin:        LiveDigitalTwin | null
  /** 'live_db' if at least one record was found; 'none' if all misses */
  source: 'live_db' | 'none'
}

// ── Lazy Prisma ───────────────────────────────────────────────────────────────

let _prisma: any = null

function getDB(): any {
  if (!_prisma) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { PrismaClient } = require('@prisma/client')
      _prisma = new PrismaClient()
    } catch {
      /* DB unavailable — callers receive null context */
    }
  }
  return _prisma
}

// ── Main fetch ────────────────────────────────────────────────────────────────

export async function fetchLiveDBContext(params: {
  projectId?: string
  address?:   string
}): Promise<LiveDBContext> {
  const db = getDB()

  const empty: LiveDBContext = {
    parcel: null, zoning: null, feasibility: null, twin: null, source: 'none',
  }

  if (!db) return empty
  if (!params.projectId && !params.address) return empty

  try {
    // ── Parcel ──────────────────────────────────────────────────────────────
    let parcel: LiveParcel | null = null
    try {
      const raw = params.projectId
        ? await db.parcel.findFirst({
            where: { projectId: params.projectId },
            select: parcelSelect,
          })
        : params.address
        ? await db.parcel.findFirst({
            where: { address: { contains: params.address, mode: 'insensitive' } },
            select: parcelSelect,
          })
        : null
      parcel = raw ?? null
    } catch { /* table may not exist yet */ }

    // ── ZoningProfile ────────────────────────────────────────────────────────
    let zoning: LiveZoning | null = null
    try {
      const lookupAddr = params.address ?? parcel?.address
      if (lookupAddr) {
        const raw = await db.zoningProfile.findFirst({
          where: { address: { contains: lookupAddr, mode: 'insensitive' } },
          select: zoningSelect,
        })
        zoning = raw ?? null
      }
    } catch { /* table may not exist yet */ }

    // ── FeasibilityStudy ─────────────────────────────────────────────────────
    let feasibility: LiveFeasibility | null = null
    try {
      if (params.projectId) {
        const raw = await db.feasibilityStudy.findFirst({
          where:   { projectId: params.projectId },
          orderBy: { createdAt: 'desc' },
          select:  feasibilitySelect,
        })
        feasibility = raw ?? null
      }
    } catch { /* table may not exist yet */ }

    // ── DigitalTwin ──────────────────────────────────────────────────────────
    let twin: LiveDigitalTwin | null = null
    try {
      if (params.projectId) {
        const raw = await db.digitalTwin.findUnique({
          where:  { projectId: params.projectId },
          select: twinSelect,
        })
        twin = raw ?? null
      }
    } catch { /* table may not exist yet */ }

    const anyFound = parcel !== null || zoning !== null || feasibility !== null || twin !== null

    return {
      parcel,
      zoning,
      feasibility,
      twin,
      source: anyFound ? 'live_db' : 'none',
    }
  } catch {
    return empty
  }
}

// ── Select projections (minimal — only what agents need) ──────────────────────

const parcelSelect = {
  id:               true,
  acreage:          true,
  squareFeet:       true,
  developmentScore: true,
  currentUse:       true,
  status:           true,
  address:          true,
  city:             true,
  state:            true,
  zipCode:          true,
}

const zoningSelect = {
  id:                  true,
  zoningDistrict:      true,
  zoningCode:          true,
  maxDensity:          true,
  maxHeight:           true,
  maxStories:          true,
  maxFAR:              true,
  maxLotCoverage:      true,
  frontSetback:        true,
  sideSetback:         true,
  rearSetback:         true,
  allowedHousingTypes: true,
  nepaExemption:       true,
}

const feasibilitySelect = {
  id:               true,
  status:           true,
  decision:         true,
  bestIRR:          true,
  bestROI:          true,
  totalProjectCost: true,
  aiConfidence:     true,
  targetUnits:      true,
  targetSqFt:       true,
  productType:      true,
}

const twinSelect = {
  id:             true,
  status:         true,
  healthStatus:   true,
  healthScore:    true,
  currentPhase:   true,
  tier:           true,
  enabledModules: true,
}

// ── Helper: serialize LiveDBContext for data_used ─────────────────────────────

export function liveDBSummary(ctx: LiveDBContext): Record<string, unknown> {
  return {
    source:             ctx.source,
    parcel_id:          ctx.parcel?.id ?? null,
    parcel_status:      ctx.parcel?.status ?? null,
    zoning_district:    ctx.zoning?.zoningDistrict ?? null,
    zoning_code:        ctx.zoning?.zoningCode ?? null,
    feasibility_status: ctx.feasibility?.status ?? null,
    feasibility_decision: ctx.feasibility?.decision ?? null,
    twin_status:        ctx.twin?.status ?? null,
    twin_health:        ctx.twin?.healthStatus ?? null,
  }
}
