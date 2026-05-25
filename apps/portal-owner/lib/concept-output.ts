/** Resolve concept package JSON from public_intake_leads.form_data (v20 + v30). */
export function getConceptOutputFromFormData(
  formData: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!formData) return null
  const raw = formData.conceptOutput ?? formData.v30ConceptOutput
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>
  }
  return null
}

export function isV30IntakeFormData(formData: Record<string, unknown> | null | undefined): boolean {
  if (!formData) return false
  return Boolean(formData.v30 || formData.v30Quote || formData.v30ProjectId)
}

export function webMainBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_WEB_MAIN_URL ?? 'https://kealee.com').replace(/\/$/, '')
}

/** Full v30 workspace (estimate, permits, floorplan, CAD) lives on web-main. */
export function v30WorkspaceUrl(intakeId: string): string {
  return `${webMainBaseUrl()}/workspace/${intakeId}`
}

export function v30CadDownloadUrl(intakeId: string): string {
  return `/api/v30/cad/${intakeId}`
}

export function v30TierLabel(tier: number): string {
  if (tier === 3) return 'Premium+'
  if (tier === 2) return 'Premium'
  return 'Basic'
}

export type DeliverableUiStatus = 'ready' | 'generating' | 'failed' | 'pending'

export function mapDeliverableUiStatus(
  status: string,
  formData?: Record<string, unknown> | null,
): DeliverableUiStatus {
  if (status === 'failed') return 'failed'
  const hasConcept = Boolean(getConceptOutputFromFormData(formData))
  if (status === 'concept_ready' && hasConcept) return 'ready'
  if (status === 'paid' && hasConcept) return 'ready'
  if (status === 'processing') return 'generating'
  if (status === 'paid') {
    return isV30IntakeFormData(formData) || !hasConcept ? 'generating' : 'ready'
  }
  return 'pending'
}

export function deliverableGeneratingLabel(isV30: boolean): string {
  return isV30
    ? 'Your Kealee v30 package is generating — design, estimate, permits, and floorplan bots run in parallel.'
    : 'Your concept package is being generated — usually ready within a few minutes.'
}

export function isConceptDeliverableReady(
  status: string,
  formData: Record<string, unknown> | null | undefined,
): boolean {
  return mapDeliverableUiStatus(status, formData) === 'ready'
}

export interface V30LandscapePackage {
  sitePlanImageUrl?: string
  plants?: Array<{ species: string; quantity: number; unit: string; lineTotal?: number }>
  trees?: Array<{ species: string; quantity: number; lineTotal?: number }>
  materials?: Array<{ material: string; quantity: number; unit: string; lineTotal?: number }>
  estimatedCost?: { low: number; high: number; mid: number }
}

export interface V30FloorplanDeliverables {
  sitePlanImageUrl?: string
  floorplanScope?: string
  cadExport?: { dxf?: string; dxfFilename?: string }
  lotContext?: { satelliteImageUrl?: string; googleEarthHint?: string }
  rooms?: Array<{ name: string; widthFt?: number; lengthFt?: number; areaSqft?: number }>
}

export function parseV30LandscapePackage(
  formData: Record<string, unknown> | null | undefined,
): V30LandscapePackage | null {
  if (!formData) return null
  const raw = formData.v30LandscapePremiumPlus
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  return raw as V30LandscapePackage
}

export function parseV30FloorplanDeliverables(
  formData: Record<string, unknown> | null | undefined,
): V30FloorplanDeliverables | null {
  if (!formData) return null
  const raw = formData.v30FloorplanDeliverables
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  return raw as V30FloorplanDeliverables
}

export function isGardenLandscapePath(projectPath: string): boolean {
  const p = projectPath.toLowerCase()
  return p.includes('garden') || p.includes('landscape')
}
