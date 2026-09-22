import { resolveConceptTier } from '@kealee/core-rules'
import { featuresForConceptTier, type V30BotType } from '@kealee/kealee-agent-stack'
import { resolveProductAutomationRoute } from '@/lib/product-automation'
import { SERVICE_DELIVERABLES } from '@/lib/service-deliverables'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import {
  triggerV30GenerationForIntake,
  type V30FulfillmentOptions,
} from '@/lib/v30-trigger'

const PAID_STATUSES = new Set(['paid', 'concept_ready', 'processing', 'delivered'])

export class ConceptGenerationError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'ConceptGenerationError'
  }
}

export type ConceptGenerationResult =
  | {
      state: 'ready'
      cached: true
      intakeId: string
      conceptOutput: Record<string, unknown>
      source: 'v30' | 'legacy-existing'
    }
  | {
      state: 'accepted'
      cached: false
      intakeId: string
      projectId?: string
      packageId?: string
      source: 'v30'
    }

export interface RequestConceptGenerationOptions {
  /** Used by the staff retry action after it marks fulfillment retryable. */
  forceRestart?: boolean
  fulfillment?: V30FulfillmentOptions
}

/**
 * The single paid-order entry point for concept generation.
 *
 * v30 owns orchestration and DesignBot execution. Existing completed legacy
 * packages remain readable and are never regenerated merely because this
 * migration changed the producer behind the compatibility endpoints.
 */
export async function requestCanonicalConceptGeneration(
  intakeId: string,
  options: RequestConceptGenerationOptions = {},
): Promise<ConceptGenerationResult> {
  const supabase = getSupabaseAdmin()
  const { data: intake, error } = await supabase
    .from('public_intake_leads')
    .select('id, project_path, status, form_data')
    .eq('id', intakeId)
    .single()

  if (error || !intake) {
    throw new ConceptGenerationError('Intake not found', 404)
  }

  if (!PAID_STATUSES.has(String(intake.status))) {
    throw new ConceptGenerationError('Payment required before generation', 402)
  }

  const projectPath = String(intake.project_path ?? '')
  const deliverable = SERVICE_DELIVERABLES[projectPath]
  if (!deliverable?.generatesConcept) {
    throw new ConceptGenerationError('This order does not include a concept package', 400)
  }

  const formData = (intake.form_data as Record<string, unknown> | null) ?? {}
  const conceptOutput = formData.conceptOutput
  if (!options.forceRestart && conceptOutput && typeof conceptOutput === 'object') {
    return {
      state: 'ready',
      cached: true,
      intakeId,
      conceptOutput: conceptOutput as Record<string, unknown>,
      source: formData.v30ConceptOutput ? 'v30' : 'legacy-existing',
    }
  }

  const tier = resolveConceptTier(formData, { projectPath })
  const existingQuote = formData.v30Quote as { features?: string[] } | undefined
  const existingFeatures = existingQuote?.features ?? (formData.v30Features as string[] | undefined) ?? []
  const features = [...new Set([...existingFeatures, ...featuresForConceptTier(tier, projectPath)])]
  const automationRoute = resolveProductAutomationRoute({
    source: String(formData.source ?? 'public_intake'),
    productKey: typeof formData.productKey === 'string' ? formData.productKey : undefined,
    projectPath,
  })

  // Persist the resolved feature set before dispatch. The v30 bridge consumes
  // it to select optional floorplan, permit, video and CAD producers.
  if (features.length > 0 && !sameStringSet(existingFeatures, features)) {
    const { error: updateError } = await supabase
      .from('public_intake_leads')
      .update({
        form_data: {
          ...formData,
          v30Features: features,
          conceptGenerationPath: 'v30-canonical',
          conceptGenerationPathSetAt: new Date().toISOString(),
        },
      })
      .eq('id', intakeId)

    if (updateError) {
      throw new ConceptGenerationError('Could not prepare the concept package for generation', 500)
    }
  }

  const fulfillmentBotTypes = uniqueBotTypes([
    'design',
    ...(automationRoute?.fulfillmentBotTypes ?? []),
    ...(options.fulfillment?.fulfillmentBotTypes ?? []),
  ])
  const generation = await triggerV30GenerationForIntake(intakeId, {
    ...automationRoute,
    ...options.fulfillment,
    fulfillmentBotTypes,
    forceEnabled: true,
  })

  if (!generation) {
    throw new ConceptGenerationError(
      'Concept generation is temporarily unavailable. The paid order is safe and can be retried.',
      503,
    )
  }

  return {
    state: 'accepted',
    cached: false,
    intakeId,
    projectId: generation.projectId,
    packageId: generation.packageId,
    source: 'v30',
  }
}

function sameStringSet(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every(value => right.includes(value))
}

function uniqueBotTypes(values: V30BotType[]): V30BotType[] {
  return [...new Set(values)]
}
