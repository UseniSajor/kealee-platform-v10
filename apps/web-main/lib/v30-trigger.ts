import { isV30Enabled } from '@kealee/kealee-agent-stack'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { syncV30ConceptToIntakeLead } from '@/lib/v30-design-sync'
import { finalizeV30FloorplanDeliverables } from '@/lib/v30-floorplan-deliverables'
import { syncLandscapePremiumPlusPackage } from '@/lib/v30-landscape-package'
import { isGardenLandscapeScope } from '@kealee/kealee-agent-stack'
import type { V30BotType } from '@kealee/kealee-agent-stack'
import type { PropertyIntelligenceDepth } from './revenue-product-catalog'
import { recordPaidOrderIncident } from '@/lib/paid-order-incident'

export interface V30FulfillmentOptions {
  fulfillmentBotTypes?: V30BotType[]
  workflowTemplateId?: string
  propertyIntelligenceDepth?: PropertyIntelligenceDepth
  /** Permit purchases are an active v30 product even during a broader staged rollout. */
  forceEnabled?: boolean
}

const API_BASE = () =>
  (process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')

export function isV30IntakeMetadata(meta: Record<string, string | undefined>): boolean {
  return meta.source === 'public_intake_v30' || meta.pricingModel === 'v30_dynamic'
}

/** Server-side v30 generation (Stripe webhook + idempotent retries). */
export async function triggerV30GenerationForIntake(
  intakeId: string,
  options: V30FulfillmentOptions = {},
): Promise<{ projectId?: string; packageId?: string } | null> {
  if (!options.forceEnabled && !isV30Enabled()) {
    console.warn('[v30-trigger] KEALEE_V30_ENABLED is off — skip generation')
    return null
  }

  const supabase = getSupabaseAdmin()
  const { data: intake } = await supabase
    .from('public_intake_leads')
    .select('id, project_path, client_name, contact_email, project_address, form_data, status')
    .eq('id', intakeId)
    .single()

  if (!intake) {
    console.error('[v30-trigger] intake not found', intakeId)
    return null
  }

  const formData = (intake.form_data as Record<string, unknown>) ?? {}
  const fulfillmentBotTypes = options.fulfillmentBotTypes ?? formData.fulfillmentBotTypes as V30BotType[] | undefined
  const workflowTemplateId = options.workflowTemplateId ?? formData.workflowTemplateId as string | undefined
  const propertyIntelligenceDepth = options.propertyIntelligenceDepth ?? formData.propertyIntelligenceDepth as PropertyIntelligenceDepth | undefined
  if (formData.v30ProjectId && formData.v30GenerationStartedAt && !['failed', 'retryable'].includes(String(formData.fulfillmentStatus ?? ''))) {
    console.log('[v30-trigger] generation already started', intakeId)
    return {
      projectId: formData.v30ProjectId as string,
      packageId: formData.v30PackageId as string | undefined,
    }
  }

  const base = API_BASE()
  if (!base) {
    console.error('[v30-trigger] INTERNAL_API_URL / NEXT_PUBLIC_API_URL not set')
    return null
  }

  const res = await fetch(`${base}/v30/public-intake/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intakeLeadId: intake.id,
      projectPath: intake.project_path,
      clientName: intake.client_name,
      contactEmail: intake.contact_email,
      projectAddress: intake.project_address,
      answers: buildV30Answers(formData, intake.project_address),
      features: getV30Features(formData, Boolean(fulfillmentBotTypes?.length)),
      fulfillmentBotTypes,
      workflowTemplateId,
      propertyIntelligenceDepth,
    }),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    console.error('[v30-trigger] API generate failed', res.status, err)
    return null
  }

  const payload = (await res.json()) as { projectId?: string; packageId?: string }
  const { data: latest } = await supabase.from('public_intake_leads').select('form_data').eq('id', intakeId).single()
  const latestFormData = (latest?.form_data as Record<string, unknown>) ?? formData
  await supabase
    .from('public_intake_leads')
    .update({
      form_data: {
        ...latestFormData,
        v30ProjectId: payload.projectId,
        v30PackageId: payload.packageId,
        v30GenerationStartedAt: new Date().toISOString(),
        v30GenerationSource: 'webhook',
        v30SkipConceptGenerate: true,
        fulfillmentStatus: 'processing',
        fulfillmentProcessingAt: new Date().toISOString(),
      },
    })
    .eq('id', intakeId)

  void pollAndSyncV30Concept(intakeId, payload.projectId, fulfillmentBotTypes)

  return payload
}

/** Poll API workspace until DesignBot completes, then sync concept portal (no duplicate generate). */
async function pollAndSyncV30Concept(intakeId: string, projectId?: string, requiredBotTypes: V30BotType[] = []): Promise<void> {
  if (!projectId) return
  const base = API_BASE()
  if (!base) return

  const maxAttempts = 60
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 10_000))
    try {
      const res = await fetch(`${base}/v30/project/${encodeURIComponent(projectId)}/workspace`, {
        cache: 'no-store',
      })
      if (!res.ok) continue
      const ws = (await res.json()) as {
        v30ConceptOutput?: Record<string, unknown>
        executions?: Array<{
          botType: string
          status: string
          outputData?: Record<string, unknown>
        }>
        package?: { features?: string[] }
      }
      const designDone = ws.executions?.some(e => e.botType === 'design' && e.status === 'COMPLETE')
      const floorplanExec = ws.executions?.find(e => e.botType === 'floorplan')
      const concept = ws.v30ConceptOutput

      if (designDone && concept) {
        await syncV30ConceptToIntakeLead(intakeId, concept)
      }

      const executions = ws.executions ?? []
      const requiredPresent = requiredBotTypes.every(botType => executions.some(e => e.botType === botType))
      const allComplete = executions.length > 0 && requiredPresent && executions.every(e => e.status === 'COMPLETE' || e.status === 'FAILED')

      if (allComplete) {
        await syncV30OutputsToIntake(intakeId, executions, requiredBotTypes)
        return
      }

      if (floorplanExec?.status === 'COMPLETE' && floorplanExec.outputData) {
        const supabase = getSupabaseAdmin()
        const { data: intake } = await supabase
          .from('public_intake_leads')
          .select('project_path, project_address, form_data')
          .eq('id', intakeId)
          .single()
        const fd = (intake?.form_data as Record<string, unknown>) ?? {}
        const tier = typeof fd.tier === 'number' ? (fd.tier as 1 | 2 | 3) : undefined
        const deliverables = await finalizeV30FloorplanDeliverables({
          intakeId,
          projectPath: intake?.project_path ?? 'kitchen_remodel',
          floorplanOutput: floorplanExec.outputData,
          tier,
          features: ws.package?.features ?? getV30Features(fd),
          address: intake?.project_address,
        })
        if (
          tier === 3 &&
          intake?.project_path &&
          isGardenLandscapeScope(intake.project_path) &&
          ws.executions
        ) {
          await syncLandscapePremiumPlusPackage({
            intakeId,
            projectPath: intake.project_path,
            tier: 3,
            executions: ws.executions,
            sitePlanImageUrl: (deliverables.floorplanImageUrl ?? deliverables.sitePlanImageUrl) as string | undefined,
          })
        }
      }
    } catch {
      /* retry */
    }
  }

  // Never leave a paid order in a permanent “generating” state when the
  // monitoring process itself was interrupted. Mark it retryable so the
  // watchdog/admin retry path can recover it.
  const supabase = getSupabaseAdmin()
  const { data } = await supabase.from('public_intake_leads').select('form_data').eq('id', intakeId).single()
  const formData = (data?.form_data as Record<string, unknown>) ?? {}
  await supabase.from('public_intake_leads').update({
    status: 'failed',
    form_data: {
      ...formData,
      fulfillmentStatus: 'retryable',
      fulfillmentError: 'Generation exceeded the monitoring window; retry is required.',
      fulfillmentRetryableAt: new Date().toISOString(),
    },
  }).eq('id', intakeId)
}

async function syncV30OutputsToIntake(
  intakeId: string,
  executions: Array<{ botType: string; status: string; outputData?: Record<string, unknown>; errorMessage?: string }>,
  requiredBotTypes: V30BotType[] = [],
): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { data: intake } = await supabase.from('public_intake_leads').select('form_data, contact_email, client_name, project_path, stripe_session_id').eq('id', intakeId).single()
  const formData = (intake?.form_data as Record<string, unknown>) ?? {}
  const outputs = Object.fromEntries(executions.filter(e => e.outputData).map(e => [e.botType, e.outputData]))
  const failed = executions.filter(e => e.status === 'FAILED').map(e => e.botType)
  const missing = requiredBotTypes.filter(botType => {
    const execution = executions.find(e => e.botType === botType)
    return !execution || execution.status !== 'COMPLETE' || !execution.outputData
  })
  const fulfillmentFailures = [...new Set([...failed, ...missing])]
  const professionalReviewRequired = intake?.project_path === 'certified_estimate' && !formData.professionalReviewEvidence
  const status = fulfillmentFailures.length === 0
    ? professionalReviewRequired ? 'partially_completed' : 'completed'
    : 'failed'

  if (fulfillmentFailures.length > 0 && intake) {
    // design/floorplan are the two customer-paid-for generators that must work
    // every time — a failure here means the customer is missing the actual
    // product they paid for, not a nice-to-have. Always alert, never silent.
    const coreGeneratorsFailed = fulfillmentFailures.filter(bt => bt === 'design' || bt === 'floorplan' || bt === 'estimate' || bt === 'permit' || bt === 'zoning')
    const failureDetail = executions
      .filter(e => fulfillmentFailures.includes(e.botType))
      .map(e => `${e.botType}: ${e.errorMessage ?? (e.outputData as { error?: string } | undefined)?.error ?? 'unknown error'}`)
      .join('; ')
    await recordPaidOrderIncident({
      intakeId,
      projectPath: intake.project_path,
      stripeSessionId: intake.stripe_session_id ?? 'unknown',
      stage: coreGeneratorsFailed.length > 0 ? 'core-generator-failed' : 'bot-generation-failed',
      error: `${fulfillmentFailures.length} required bot outputs failed or were missing after retries — ${failureDetail}`,
      customerEmail: intake.contact_email,
    }).catch(err => console.error('[v30-trigger] incident recording failed', err))
  }

  await supabase.from('public_intake_leads').update({
    status: status === 'completed' ? 'concept_ready' : 'failed',
    form_data: {
      ...formData,
      fulfillmentOutputs: { ...((formData.fulfillmentOutputs as Record<string, unknown>) ?? {}), ...outputs },
      estimateOutput: outputs.estimate ?? formData.estimateOutput,
      zoningOutput: outputs.zoning ?? formData.zoningOutput,
      permitOutput: outputs.permit ?? formData.permitOutput,
      designOutput: outputs.design ?? formData.designOutput,
      fulfillmentStatus: status,
      professionalReviewStatus: professionalReviewRequired ? 'required' : formData.professionalReviewStatus,
      fulfillmentFailedBotTypes: fulfillmentFailures,
      fulfillmentMissingBotTypes: missing,
      fulfillmentCompletedAt: new Date().toISOString(),
    },
  }).eq('id', intakeId)
  const notificationSent = professionalReviewRequired ? false : await notifyCustomerDeliverable({
    intakeId,
    email: typeof intake?.contact_email === 'string' ? intake.contact_email : undefined,
    clientName: typeof intake?.client_name === 'string' ? intake.client_name : undefined,
    projectPath: typeof intake?.project_path === 'string' ? intake.project_path : undefined,
    partial: status !== 'completed',
  })
  await syncAutonomousProjection(
    String(formData.autonomousRunId ?? ''), intakeId, executions, status, notificationSent, professionalReviewRequired,
  )
  await prismaRevenueStatus(intakeId, status)
}

async function notifyCustomerDeliverable(input: { intakeId: string; email?: string; clientName?: string; projectPath?: string; partial: boolean }): Promise<boolean> {
  if (!input.email) return false
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')
  if (!appUrl) return false
  try {
    const response = await fetch(`${appUrl}/api/emails/deliverable-ready`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: input.email, firstName: input.clientName?.split(' ')[0] ?? '',
        service: input.projectPath ?? 'homeowner report', intakeId: input.intakeId,
        headline: input.partial ? 'Your project report is ready with some items still under review' : 'Your homeowner project report is ready',
      }),
    })
    return response.ok
  } catch { return false }
}

async function syncAutonomousProjection(
  runId: string,
  intakeId: string,
  executions: Array<{ botType: string; status: string; outputData?: Record<string, unknown> }>,
  fulfillmentStatus: string,
  notificationSent: boolean,
  professionalReviewRequired: boolean,
): Promise<void> {
  if (!runId) return
  const { prisma } = await import('@kealee/database')
  const capabilityByBot: Record<string, string> = {
    design: 'design.concept.generate', estimate: 'estimate.plan.generate', zoning: 'zoning.property.analyze',
    permit: 'permit.roadmap.generate', floorplan: 'floorplan.concept.generate', contractor: 'contractor.match',
    project: 'project.plan.generate', sales: 'sales.support.prepare',
  }
  try {
    await prisma.$transaction(async tx => {
      await tx.autonomousStep.updateMany({ where: { runId, capability: 'intake.validate' }, data: { status: 'COMPLETE', completedAt: new Date() } })
      for (const execution of executions) {
        const capability = capabilityByBot[execution.botType]
        if (!capability) continue
        await tx.autonomousStep.updateMany({ where: { runId, capability }, data: {
          status: execution.status === 'COMPLETE' ? 'COMPLETE' : 'FAILED', output: execution.outputData as any,
          completedAt: new Date(), errorMessage: execution.status === 'FAILED' ? `${execution.botType} execution failed` : null,
        } })
      }
      if (professionalReviewRequired) {
        await tx.autonomousStep.updateMany({
          where: { runId, capability: 'professional.review' },
          data: { status: 'AWAITING_APPROVAL' },
        })
      }
      const reportReady = !professionalReviewRequired && (fulfillmentStatus === 'completed' || fulfillmentStatus === 'partially_completed')
      if (reportReady) {
        await tx.autonomousStep.updateMany({ where: { runId, capability: { in: ['deliverable.assemble', 'deliverable.publish'] } }, data: { status: 'COMPLETE', completedAt: new Date() } })
        if (notificationSent) await tx.autonomousStep.updateMany({ where: { runId, capability: 'customer.notify' }, data: { status: 'COMPLETE', completedAt: new Date() } })
        await tx.autonomousEvidence.create({ data: { runId, evidenceType: 'published-deliverable', sourceUri: `/concept/${intakeId}`, verifiedAt: new Date(), payload: { fulfillmentStatus } } })
        if (notificationSent) await tx.autonomousEvidence.create({ data: { runId, evidenceType: 'notification-receipt', verifiedAt: new Date(), payload: { channel: 'email' } } })
      }
      await tx.autonomousRun.update({ where: { id: runId }, data: {
        status: professionalReviewRequired ? 'AWAITING_APPROVAL' : fulfillmentStatus === 'completed' && notificationSent ? 'COMPLETE' : reportReady ? 'PARTIAL' : 'FAILED',
        completedAt: reportReady ? new Date() : undefined,
      } })
      if (fulfillmentStatus === 'completed' && notificationSent) {
        const run = await tx.autonomousRun.findUnique({ where: { id: runId }, select: { goalId: true } })
        if (run) await tx.autonomousGoal.update({ where: { id: run.goalId }, data: { status: 'COMPLETE', completedAt: new Date() } })
      }
    })
  } catch (error) {
    console.error('[v30-trigger] autonomous projection sync failed', error)
  }
}

async function prismaRevenueStatus(intakeId: string, status: string): Promise<void> {
  const { prisma } = await import('@kealee/database')
  await prisma.revenueTransaction.updateMany({
    where: { intakeId, status: 'processing' },
    data: { status: status === 'completed' ? 'cleared' : status },
  }).catch(() => undefined)
}

function getV30Features(formData: Record<string, unknown>, isProductAutomation = false): string[] {
  const quote = formData.v30Quote as { features?: string[] } | undefined
  const features = quote?.features ?? (formData.v30Features as string[]) ?? []
  return features.length || !isProductAutomation ? features : ['product-automation']
}

function buildV30Answers(
  formData: Record<string, unknown>,
  projectAddress: string,
): Record<string, unknown> {
  const answers = (formData.v30Answers ?? formData) as Record<string, unknown>
  return {
    propertyType: String(answers.propertyType ?? ''),
    primaryScope: String(answers.primaryScope ?? ''),
    budgetRange: String(answers.budgetRange ?? ''),
    timeline: String(answers.timeline ?? ''),
    location: String(answers.location ?? projectAddress),
    squareFeet: Math.max(1, Number(answers.squareFeet ?? answers.squareFootage ?? 1) || 1),
    yearBuilt: String(answers.yearBuilt ?? ''),
    utilities: (answers.utilities as Record<string, boolean>) ?? {},
    codeConsiderations: (answers.codeConsiderations as string[]) ?? [],
  }
}
