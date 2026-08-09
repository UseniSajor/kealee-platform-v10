import type { ProjectIntelligenceInput, ProjectIntelligenceOutput } from '../schemas/project-intelligence.js'
import type { ContextBuilderPayload } from '../schemas/context.js'

export class RuleBasedProjectIntelligenceAgent {
  async analyze(input: ProjectIntelligenceInput, _ctx: ContextBuilderPayload): Promise<ProjectIntelligenceOutput> {
    const twin = input.projectTwin
    const scope = input.scope ?? (twin.scope as Record<string, unknown> | undefined)
    const budget = input.budget ?? Number(twin.budget ?? 0)
    const permitStatus = input.permitStatus ?? String(twin.permitStatus ?? 'unknown')
    const tasks = input.tasks ?? []
    const documents = input.documents ?? []
    const bids = input.contractorBids ?? []

    const missing: string[] = []
    if (!documents.length) missing.push('project_documents')
    if (!bids.length) missing.push('contractor_bids')
    if (permitStatus === 'unknown' || permitStatus === 'not_started') missing.push('permit_status')
    if (!scope) missing.push('defined_scope')

    let health = 70
    health -= missing.length * 12
    if (tasks.some((t) => t.status === 'overdue')) health -= 15
    if (permitStatus === 'failed') health -= 20
    health = Math.max(0, Math.min(100, health))

    const risks: string[] = []
    if (missing.includes('permit_status')) risks.push('permit_risk')
    if (budget > 250_000) risks.push('high_value_project')

    return {
      projectHealthScore: health,
      missingItems: missing,
      riskFlags: risks,
      budgetImpact: budget > 200_000 ? 'high_budget_project' : 'standard',
      scheduleImpact: tasks.some((t) => t.status === 'overdue') ? 'schedule_slip' : 'on_track',
      recommendedNextActions: missing.map((m) => ({
        action: `resolve_${m}`,
        priority: 'high' as const,
      })),
      deliverableUpdates: [],
      projectTwinUpdates: [{ field: 'healthScore', value: health }, { field: 'missingItems', value: missing }],
      customerSummary: `Project health is ${health}/100. ${missing.length ? `Missing: ${missing.join(', ')}.` : 'All core items present.'}`,
      adminSummary: `Health ${health}. Permit: ${permitStatus}. Budget $${budget.toLocaleString()}. Risks: ${risks.join(', ') || 'none'}.`,
      confidenceScore: 0.8,
      requiresHumanReview: health < 50 || budget > 250_000,
      scoreExplanation: `Project health ${health} based on ${missing.length} missing items and permit status ${permitStatus}.`,
    }
  }
}

export const ruleBasedProjectIntelligence = new RuleBasedProjectIntelligenceAgent()
