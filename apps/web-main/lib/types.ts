export interface Concept {
  id: string
  service: string
  serviceSlug: string
  scope: string
  budget: number
  location: string
  name: string
  email: string
  phone?: string
  tier: 1 | 2 | 3
  status: 'processing' | 'completed' | 'error'
  /** AI-generated design language: style name, materials/finishes palette, key features */
  designConcept?: {
    style: string
    colorPalette: string[]
    keyFeatures: string[]
  }
  /** AI-generated MEP specification strings from Claude conceptOutput */
  mepSystem?: {
    electrical: string
    plumbing: string
    hvac: string
    lighting: string
  }
  /** 2–3 sentence concept summary written by Claude for the client */
  description?: string
  /** Buildability assessment from Claude zoning/scope analysis */
  buildabilityFlag?: 'feasible' | 'feasible-with-variance' | 'challenging'
  /** Permit readiness score 0–100 from Claude readinessScore */
  readinessScore?: number
  videoUrl?: string
  videoDuration?: number
  videoFormatUrls?: Record<string, string>
  floorPlanUrl?: string
  mepSchematic?: Record<string, unknown>
  estimatedCost?: number
  timeline?: string
  renderings?: string[]
  /** Replicate prediction IDs for in-flight AI render jobs. Portal polls /api/concept/renders/[id] per entry. */
  renderJobs?: string[]
  /** Client-uploaded "before" photos from intake. When present, renders are img2img transformations. */
  beforeUrls?: string[]
  zoningAnalysis?: Record<string, unknown>
  permits?: PermitItem[]
  billOfMaterials?: BOMItem[]
  createdAt: string
  updatedAt: string
}

export interface PermitItem {
  name: string
  jurisdiction: string
  estimatedFee: number
  leadTime: string
  required: boolean
}

export interface BOMItem {
  category: string
  item: string
  quantity: number
  unit: string
  unitCost: number
  total: number
}

export interface ConceptIntakePayload {
  service: string
  serviceSlug: string
  scope: string
  budget: string
  zip: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  address?: string
  tier: 1 | 2 | 3
}
