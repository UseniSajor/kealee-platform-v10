/**
 * Intake Resolver
 * Maps polymorphic intake sources (PublicIntakeLead, ConceptPackageOrder, DevelopmentLead,
 * FunnelSession) to the normalized ConceptIntakeInput interface used throughout the concept engine.
 */

import type { ConceptIntakeInput } from '../floorplan/types'

/**
 * Raw shape from public_intake_leads table (selected columns).
 */
export interface PublicIntakeLeadRow {
  id: string
  contact_email?: string | null
  contact_name?: string | null
  project_address?: string | null
  project_type?: string | null
  budget_range?: string | null
  style_preference?: string | null
  constraints?: string[] | null
  jurisdiction?: string | null
  uploaded_photos?: string[] | null
  design_brief?: Record<string, unknown> | null
  source?: string | null
  metadata?: Record<string, unknown> | null
}

/**
 * Raw shape from concept_package_orders table (Prisma model ConceptPackageOrder).
 */
export interface ConceptPackageOrderRow {
  id: string
  email?: string | null
  name?: string | null
  address?: string | null
  projectPath?: string | null
  budgetRange?: string | null
  style?: string | null
  constraints?: string[] | null
  jurisdiction?: string | null
  photos?: string[] | null
  metadata?: Record<string, unknown> | null
}

/**
 * Raw shape from capture_sessions table.
 */
export interface CaptureSessionRow {
  id: string
  intakeId?: string | null
  scanZones?: string[] | null
  assetCount?: number | null
  voiceNoteCount?: number | null
  completedAt?: string | null
}

export interface CaptureAssetRow {
  id: string
  sessionId: string
  zone?: string | null
  fileUrl?: string | null
  aiLabel?: string | null
  aiDescription?: string | null
  aiTags?: string[] | null
  systemCategory?: string | null
}

export interface ResolveOptions {
  source: 'public_intake' | 'concept_package_order' | 'development_lead' | 'capture_site'
  intake?: PublicIntakeLeadRow | null
  order?: ConceptPackageOrderRow | null
  captureSession?: CaptureSessionRow | null
  captureAssets?: CaptureAssetRow[]
}

function normalizeBudget(raw: string | null | undefined): string {
  if (!raw) return 'under_10k'
  const lower = raw.toLowerCase()
  if (lower.includes('under') || lower.includes('less') || lower.includes('10k') || lower.includes('10,000')) return 'under_10k'
  if (lower.includes('10') && lower.includes('25')) return '10k_to_25k'
  if (lower.includes('25') && lower.includes('50')) return '25k_to_50k'
  if (lower.includes('50') && lower.includes('100')) return '50k_to_100k'
  if (lower.includes('100') || lower.includes('100k') || lower.includes('100,000')) return '100k_plus'
  return 'under_10k'
}

function normalizeProjectPath(raw: string | null | undefined): ConceptIntakeInput['projectPath'] {
  const allowed: ConceptIntakeInput['projectPath'][] = [
    'kitchen_remodel',
    'bathroom_remodel',
    'interior_renovation',
    'whole_home_remodel',
    'addition_expansion',
    'exterior_concept',
    'capture_site_concept',
  ]

  if (!raw) return 'interior_renovation'
  const lower = raw.toLowerCase().replace(/[^a-z_]/g, '_')
  if (allowed.includes(lower as ConceptIntakeInput['projectPath'])) {
    return lower as ConceptIntakeInput['projectPath']
  }

  // Fuzzy match
  if (lower.includes('kitchen')) return 'kitchen_remodel'
  if (lower.includes('bath')) return 'bathroom_remodel'
  if (lower.includes('whole') || lower.includes('full')) return 'whole_home_remodel'
  if (lower.includes('addition') || lower.includes('expansion') || lower.includes('adu')) return 'addition_expansion'
  if (lower.includes('exterior') || lower.includes('outdoor') || lower.includes('landscape')) return 'exterior_concept'
  if (lower.includes('capture')) return 'capture_site_concept'
  return 'interior_renovation'
}

function normalizeStyles(raw: string | null | undefined): string[] {
  if (!raw) return ['modern']
  const lower = raw.toLowerCase()
  const styles = ['modern', 'traditional', 'transitional', 'industrial', 'farmhouse', 'mediterranean', 'contemporary', 'minimalist']
  for (const style of styles) {
    if (lower.includes(style)) return [style]
  }
  return [raw]
}

function buildCaptureAssetSummary(
  assets: CaptureAssetRow[]
): ConceptIntakeInput['captureAssets'] {
  return assets.map((a) => ({
    zone: a.zone ?? 'unknown',
    aiLabel: a.aiLabel ?? undefined,
    aiDescription: a.aiDescription ?? undefined,
    aiTags: a.aiTags ?? undefined,
    systemCategory: a.systemCategory ?? undefined,
  }))
}

function buildSpatialNodeSummary(
  session: CaptureSessionRow | null | undefined
): ConceptIntakeInput['spatialNodes'] {
  if (!session?.scanZones) return []
  return session.scanZones.map((zone) => ({
    nodeType: 'scan_zone',
    label: zone,
  }))
}

/**
 * Resolve a ConceptIntakeInput from any intake source.
 */
export function resolveIntakeInput(opts: ResolveOptions): ConceptIntakeInput {
  const { source, intake, order, captureSession, captureAssets = [] } = opts

  if (source === 'public_intake' && intake) {
    return {
      intakeId: intake.id,
      projectPath: normalizeProjectPath(intake.project_type),
      clientName: intake.contact_name ?? '',
      contactEmail: intake.contact_email ?? '',
      projectAddress: intake.project_address ?? '',
      budgetRange: normalizeBudget(intake.budget_range),
      stylePreferences: normalizeStyles(intake.style_preference),
      knownConstraints: intake.constraints ?? [],
      jurisdiction: intake.jurisdiction ?? undefined,
      uploadedPhotos: intake.uploaded_photos ?? [],
      captureZones: captureSession?.scanZones ?? [],
      captureAssets: buildCaptureAssetSummary(captureAssets),
      spatialNodes: buildSpatialNodeSummary(captureSession),
    }
  }

  if (source === 'concept_package_order' && order) {
    return {
      intakeId: order.id,
      projectPath: normalizeProjectPath(order.projectPath),
      clientName: order.name ?? '',
      contactEmail: order.email ?? '',
      projectAddress: order.address ?? '',
      budgetRange: normalizeBudget(order.budgetRange),
      stylePreferences: normalizeStyles(order.style),
      knownConstraints: order.constraints ?? [],
      jurisdiction: order.jurisdiction ?? undefined,
      uploadedPhotos: order.photos ?? [],
      captureZones: captureSession?.scanZones ?? [],
      captureAssets: buildCaptureAssetSummary(captureAssets),
      spatialNodes: buildSpatialNodeSummary(captureSession),
    }
  }

  if (source === 'capture_site' && captureSession) {
    return {
      intakeId: captureSession.id,
      projectPath: 'capture_site_concept',
      clientName: '',
      contactEmail: '',
      projectAddress: '',
      budgetRange: 'under_10k',
      stylePreferences: ['modern'],
      knownConstraints: [],
      uploadedPhotos: captureAssets.map((a) => a.fileUrl ?? '').filter(Boolean),
      captureZones: captureSession.scanZones ?? [],
      captureAssets: buildCaptureAssetSummary(captureAssets),
      spatialNodes: buildSpatialNodeSummary(captureSession),
    }
  }

  throw new Error(`resolveIntakeInput: cannot resolve source=${source} with provided data`)
}
