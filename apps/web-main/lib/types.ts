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
  videoUrl?: string
  videoDuration?: number
  floorPlanUrl?: string
  mepSchematic?: Record<string, unknown>
  estimatedCost?: number
  timeline?: string
  renderings?: string[]
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
