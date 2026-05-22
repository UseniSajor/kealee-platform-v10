import { isV30Enabled } from '@kealee/kealee-agent-stack'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { syncV30ConceptToIntakeLead } from '@/lib/v30-design-sync'

const API_BASE = () =>
  (process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')

export function isV30IntakeMetadata(meta: Record<string, string | undefined>): boolean {
  return meta.source === 'public_intake_v30' || meta.pricingModel === 'v30_dynamic'
}

/** Server-side v30 generation (Stripe webhook + idempotent retries). */
export async function triggerV30GenerationForIntake(
  intakeId: string,
): Promise<{ projectId?: string; packageId?: string } | null> {
  if (!isV30Enabled()) {
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
  if (formData.v30ProjectId && formData.v30GenerationStartedAt) {
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
      features: getV30Features(formData),
    }),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    console.error('[v30-trigger] API generate failed', res.status, err)
    return null
  }

  const payload = (await res.json()) as { projectId?: string; packageId?: string }
  await supabase
    .from('public_intake_leads')
    .update({
      form_data: {
        ...formData,
        v30ProjectId: payload.projectId,
        v30PackageId: payload.packageId,
        v30GenerationStartedAt: new Date().toISOString(),
        v30GenerationSource: 'webhook',
        v30SkipConceptGenerate: true,
      },
    })
    .eq('id', intakeId)

  void pollAndSyncV30Concept(intakeId, payload.projectId)

  return payload
}

/** Poll API workspace until DesignBot completes, then sync concept portal (no duplicate generate). */
async function pollAndSyncV30Concept(intakeId: string, projectId?: string): Promise<void> {
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
        executions?: Array<{ botType: string; status: string }>
      }
      const designDone = ws.executions?.some(e => e.botType === 'design' && e.status === 'COMPLETE')
      const concept = ws.v30ConceptOutput
      if (designDone && concept) {
        await syncV30ConceptToIntakeLead(intakeId, concept)
        return
      }
    } catch {
      /* retry */
    }
  }
}

function getV30Features(formData: Record<string, unknown>): string[] {
  const quote = formData.v30Quote as { features?: string[] } | undefined
  return quote?.features ?? (formData.v30Features as string[]) ?? []
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
    squareFeet: Number(answers.squareFeet ?? answers.squareFootage ?? 0),
    yearBuilt: String(answers.yearBuilt ?? ''),
    utilities: (answers.utilities as Record<string, boolean>) ?? {},
    codeConsiderations: (answers.codeConsiderations as string[]) ?? [],
  }
}
