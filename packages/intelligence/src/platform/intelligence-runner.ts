import type { IntelligenceEngineTypeName } from '../constants/loop-types.js'
import { engineToLoopType } from '../constants/loop-types.js'
import type { IntelligenceEventType } from '../constants/events.js'
import { resolveEnginesForEvent, resolveNextEvents } from './loop-router.js'
import { intelligenceContextBuilder } from './intelligence-context-builder.js'
import { ruleBasedPropertyIntelligence } from '../agents/rule-based-property-intelligence.js'
import { ruleBasedOpportunityScoring } from '../agents/rule-based-opportunity-scoring.js'
import { ruleBasedLeadIntelligence } from '../agents/rule-based-lead-intelligence.js'
import { ruleBasedCapitalIntelligence } from '../agents/rule-based-capital-intelligence.js'
import { ruleBasedProjectIntelligence } from '../agents/rule-based-project-intelligence.js'
import {
  validatePropertyIntelligenceOutput,
  validateOpportunityScoringOutput,
  validateLeadIntelligenceOutput,
  validateCapitalIntelligenceOutput,
  validateProjectIntelligenceOutput,
} from '../validation/output-validator.js'
import { evaluateHumanReview } from '../validation/human-review.js'
import { complianceGuard } from '../services/compliance-guard.service.js'
import { prismaPropertyTwinService } from '../services/property-twin.service.js'
import { prismaLeadTwinService } from '../services/lead-twin.service.js'
import { prismaProjectTwinService } from '../services/project-twin.service.js'
import { prismaCapitalTwinService } from '../services/capital-twin.service.js'
import { loopRunService } from '../services/loop-run.service.js'
import { intelligenceRunService } from '../services/intelligence-run.service.js'
import { productAssignmentService } from '../services/product-assignment.service.js'
import { buildRoutingContext } from '../routing/property-product-rules.js'
import type { PropertyIntelligenceInput } from '../schemas/property-intelligence.js'
import type { LeadIntelligenceInput } from '../schemas/lead-intelligence.js'
import type { CapitalIntelligenceInput } from '../schemas/capital-intelligence.js'
import type { ProjectIntelligenceInput } from '../schemas/project-intelligence.js'

const AGENT_IDS: Record<IntelligenceEngineTypeName, string> = {
  property: 'PropertyIntelligenceAgent',
  opportunity: 'OpportunityScoringAgent',
  lead: 'LeadIntelligenceAgent',
  capital: 'CapitalIntelligenceAgent',
  project: 'ProjectIntelligenceEngine',
}

export interface RunIntelligenceParams {
  triggerEvent: IntelligenceEventType
  triggerEventId?: string
  orgId?: string
  engine?: IntelligenceEngineTypeName
  propertyTwinId?: string
  leadTwinId?: string
  projectTwinId?: string
  capitalTwinId?: string
  parcelId?: string
  address?: string
  jurisdiction?: string
  input?: Record<string, unknown>
}

export interface EngineRunOutcome {
  engine: IntelligenceEngineTypeName
  loopRunId: string
  intelligenceRunId: string
  output: Record<string, unknown>
  requiresHumanReview: boolean
  reviewReasons: string[]
}

export interface IntelligencePipelineResult {
  triggerEvent: IntelligenceEventType
  outcomes: EngineRunOutcome[]
  nextEvents: IntelligenceEventType[]
  requiresHumanReview: boolean
}

function twinToPropertyInput(
  twin: Record<string, unknown>,
  extras?: Record<string, unknown>,
): PropertyIntelligenceInput {
  return {
    address: String(twin.address ?? extras?.address ?? 'unknown'),
    parcelId: twin.parcelId ? String(twin.parcelId) : extras?.parcelId ? String(extras.parcelId) : undefined,
    propertyType: twin.propertyType ? String(twin.propertyType) : undefined,
    ownershipType: twin.ownershipType ? String(twin.ownershipType) : undefined,
    lotSize: typeof twin.lotSize === 'number' ? twin.lotSize : undefined,
    buildingSquareFootage: typeof twin.buildingSize === 'number' ? twin.buildingSize : undefined,
    yearBuilt: typeof twin.yearBuilt === 'number' ? twin.yearBuilt : undefined,
    assessedValue: typeof twin.assessedValue === 'number' ? twin.assessedValue : undefined,
    zoning: (twin.zoning as Record<string, unknown>) ?? undefined,
    permitHistory: Array.isArray(twin.permitHistory)
      ? (twin.permitHistory as Record<string, unknown>[])
      : undefined,
    serviceIntent: extras?.serviceIntent ? String(extras.serviceIntent) : undefined,
  }
}

export class IntelligenceRunner {
  async run(params: RunIntelligenceParams): Promise<IntelligencePipelineResult> {
    const engines = params.engine ? [params.engine] : resolveEnginesForEvent(params.triggerEvent)
    const outcomes: EngineRunOutcome[] = []
    const nextEvents: IntelligenceEventType[] = []

    let propertyTwin = params.propertyTwinId
      ? await prismaPropertyTwinService.getById(params.propertyTwinId)
      : null
    let leadTwin = params.leadTwinId ? await prismaLeadTwinService.getById(params.leadTwinId) : null
    let projectTwin = params.projectTwinId
      ? await prismaProjectTwinService.getById(params.projectTwinId)
      : null
    let capitalTwin = params.capitalTwinId
      ? await prismaCapitalTwinService.getById(params.capitalTwinId)
      : null

    let lastPropertyOutput: Record<string, unknown> | undefined

    for (const engine of engines) {
      const loopType = engineToLoopType(engine)
      const loopRun = await loopRunService.create({
        loopType,
        triggerEventType: params.triggerEvent,
        triggerEventId: params.triggerEventId,
        propertyTwinId: propertyTwin?.id,
        leadTwinId: leadTwin?.id,
        projectTwinId: projectTwin?.id,
        capitalTwinId: capitalTwin?.id,
        orgId: params.orgId,
        context: { engine, triggerEvent: params.triggerEvent },
      })

      let stepOrder = 1
      await loopRunService.recordStep({
        loopRunId: loopRun.id,
        stepOrder: stepOrder++,
        stepName: 'loop_router',
        output: { engine, triggerEvent: params.triggerEvent },
      })

      const context = await intelligenceContextBuilder.build({
        engine,
        triggerEvent: params.triggerEvent,
        propertyTwinId: propertyTwin?.id,
        leadTwinId: leadTwin?.id,
        projectTwinId: projectTwin?.id,
        capitalTwinId: capitalTwin?.id,
        parcelId: params.parcelId ?? propertyTwin?.parcelId,
        address: params.address ?? propertyTwin?.address,
        jurisdiction: params.jurisdiction ?? propertyTwin?.jurisdiction,
        snapshots: {
          propertyTwin: propertyTwin as unknown as Record<string, unknown> | undefined,
          leadTwin: leadTwin as unknown as Record<string, unknown> | undefined,
          projectTwin: projectTwin as unknown as Record<string, unknown> | undefined,
          capitalTwin: capitalTwin as unknown as Record<string, unknown> | undefined,
        },
      })

      await loopRunService.recordStep({
        loopRunId: loopRun.id,
        stepOrder: stepOrder++,
        stepName: 'context_builder',
        output: { retrievedAt: context.retrievedAt, dataSources: context.parcelData },
      })

      const agentId = AGENT_IDS[engine]
      let output: Record<string, unknown>
      let validationErrors: string[] = []
      let requiresReview = false
      let reviewReasons: string[] = []

      switch (engine) {
        case 'property': {
          const input = twinToPropertyInput(
            (propertyTwin ?? {}) as unknown as Record<string, unknown>,
            { ...params.input, address: params.address, parcelId: params.parcelId },
          )
          const raw = await ruleBasedPropertyIntelligence.analyze(input, context)
          const validated = validatePropertyIntelligenceOutput(raw)
          if (!validated.success || !validated.data) {
            await loopRunService.fail(loopRun.id, validated.errors.join('; '))
            throw new Error(validated.errors.join('; '))
          }
          output = validated.data as unknown as Record<string, unknown>
          lastPropertyOutput = output
          if (propertyTwin?.id) {
            propertyTwin = await prismaPropertyTwinService.applyAgentOutput(propertyTwin.id, validated.data)
          }
          const review = evaluateHumanReview({
            dataQualityScore: validated.data.dataQualityScore,
            confidenceScore: validated.data.confidenceScore,
            permitRisk: validated.data.permitRisk,
            zoningRisk: validated.data.zoningRisk,
            agentRequiresReview: validated.data.requiresHumanReview,
          })
          requiresReview = review.requiresHumanReview
          reviewReasons = review.reasons
          break
        }
        case 'opportunity': {
          if (!lastPropertyOutput && propertyTwin) {
            const input = twinToPropertyInput(propertyTwin as unknown as Record<string, unknown>, params.input)
            const propRaw = await ruleBasedPropertyIntelligence.analyze(input, context)
            const propVal = validatePropertyIntelligenceOutput(propRaw)
            if (propVal.success && propVal.data) lastPropertyOutput = propVal.data as unknown as Record<string, unknown>
          }
          if (!lastPropertyOutput) {
            await loopRunService.fail(loopRun.id, 'Property intelligence required for opportunity scoring')
            throw new Error('Property intelligence output required')
          }
          const raw = await ruleBasedOpportunityScoring.score(
            {
              propertyIntelligence: lastPropertyOutput as never,
              ownerLeadData: params.input,
            },
            context,
          )
          const validated = validateOpportunityScoringOutput(raw)
          if (!validated.success || !validated.data) {
            await loopRunService.fail(loopRun.id, validated.errors.join('; '))
            throw new Error(validated.errors.join('; '))
          }
          output = validated.data as unknown as Record<string, unknown>
          const propertyTwinId = propertyTwin?.id
          if (propertyTwinId) {
            propertyTwin = await prismaPropertyTwinService.applyAgentOutput(propertyTwinId, validated.data)
            await loopRunService.recordOpportunityScore(propertyTwinId, loopRun.id, {
              ...validated.data,
              reviewReasons,
            })

            const propertyCtx = buildRoutingContext(
              twinToPropertyInput(propertyTwin as unknown as Record<string, unknown>, params.input),
              {
                hasDocuments: Boolean(params.input?.hasDocuments),
                hasPlans: Boolean(params.input?.hasPlans),
                permitStatus: params.input?.permitStatus ? String(params.input.permitStatus) : undefined,
                budgetGap: Boolean(params.input?.budgetGap),
                constructionActive: Boolean(params.input?.constructionActive),
              },
            )
            const assignment = productAssignmentService.assign({
              propertyTwinId,
              loopRunId: loopRun.id,
              productScores: validated.data.productScores,
              propertyContext: propertyCtx,
              totalOpportunityScore: validated.data.totalOpportunityScore,
            })
            if (assignment.autoAssigned) {
              await productAssignmentService.persist(
                { propertyTwinId, loopRunId: loopRun.id, productScores: validated.data.productScores },
                assignment,
              )
            }
            output = { ...output, productAssignment: assignment }
            if (assignment.autoAssigned && !assignment.requiresHumanReview) {
              requiresReview = false
              reviewReasons = []
            }
          }
          const review = evaluateHumanReview({
            dataQualityScore: validated.data.dataQualityScore,
            confidenceScore: validated.data.confidenceScore,
            estimatedProjectValue: validated.data.estimatedProjectValue,
            agentRequiresReview: validated.data.requiresHumanReview,
          })
          requiresReview = review.requiresHumanReview
          reviewReasons = review.reasons
          break
        }
        case 'lead': {
          const leadInput: LeadIntelligenceInput = {
            leadTwin: leadTwin as unknown as Record<string, unknown>,
            propertyTwin: propertyTwin as unknown as Record<string, unknown>,
            ...(params.input as LeadIntelligenceInput),
          }
          const raw = await ruleBasedLeadIntelligence.analyze(leadInput, context)
          const validated = validateLeadIntelligenceOutput(raw)
          if (!validated.success || !validated.data) {
            await loopRunService.fail(loopRun.id, validated.errors.join('; '))
            throw new Error(validated.errors.join('; '))
          }
          output = validated.data as unknown as Record<string, unknown>
          if (leadTwin?.id) {
            leadTwin = await prismaLeadTwinService.applyAgentOutput(leadTwin.id, validated.data)
          }
          const compliance = await complianceGuard.check({
            crmTags: validated.data.crmTags,
            audienceSegment: validated.data.leadSegment,
          })
          requiresReview =
            validated.data.requiresHumanReview || !compliance.passed || compliance.flags.length > 0
          reviewReasons = [
            ...(validated.data.requiresHumanReview ? ['agent_flagged_review'] : []),
            ...compliance.violations,
            ...compliance.flags,
          ]
          break
        }
        case 'capital': {
          const capInput: CapitalIntelligenceInput = {
            propertyTwin: propertyTwin as unknown as Record<string, unknown>,
            leadTwin: leadTwin as unknown as Record<string, unknown>,
            projectTwin: projectTwin as unknown as Record<string, unknown>,
            ...(params.input as CapitalIntelligenceInput),
            consentFinancing: Boolean(params.input?.consentFinancing),
          }
          const raw = await ruleBasedCapitalIntelligence.analyze(capInput, context)
          const validated = validateCapitalIntelligenceOutput(raw)
          if (!validated.success || !validated.data) {
            await loopRunService.fail(loopRun.id, validated.errors.join('; '))
            throw new Error(validated.errors.join('; '))
          }
          output = validated.data as unknown as Record<string, unknown>
          capitalTwin = await prismaCapitalTwinService.applyAgentOutput({
            id: capitalTwin?.id,
            propertyTwinId: propertyTwin?.id,
            leadTwinId: leadTwin?.id,
            projectTwinId: projectTwin?.id,
            orgId: params.orgId,
            output: validated.data,
            consentFinancing: capInput.consentFinancing,
          })
          requiresReview = true
          reviewReasons = ['financing_review_required', ...(validated.data.complianceFlags ?? [])]
          break
        }
        case 'project': {
          if (!projectTwin) {
            projectTwin = await prismaProjectTwinService.ensure({
              orgId: params.orgId,
              propertyTwinId: propertyTwin?.id,
              leadTwinId: leadTwin?.id,
              name: params.input?.name ? String(params.input.name) : undefined,
              scope: params.input?.scope as Record<string, unknown> | undefined,
              budget: typeof params.input?.budget === 'number' ? params.input.budget : undefined,
            })
          }
          const projInput: ProjectIntelligenceInput = {
            ...(params.input as ProjectIntelligenceInput),
            projectTwin: projectTwin as unknown as Record<string, unknown>,
            propertyTwin: propertyTwin as unknown as Record<string, unknown>,
            leadTwin: leadTwin as unknown as Record<string, unknown>,
            capitalTwin: capitalTwin as unknown as Record<string, unknown>,
          }
          const raw = await ruleBasedProjectIntelligence.analyze(projInput, context)
          const validated = validateProjectIntelligenceOutput(raw)
          if (!validated.success || !validated.data) {
            await loopRunService.fail(loopRun.id, validated.errors.join('; '))
            throw new Error(validated.errors.join('; '))
          }
          output = validated.data as unknown as Record<string, unknown>
          projectTwin = await prismaProjectTwinService.applyAgentOutput(projectTwin.id, validated.data)
          const review = evaluateHumanReview({
            confidenceScore: validated.data.confidenceScore,
            estimatedProjectValue: typeof params.input?.budget === 'number' ? params.input.budget : undefined,
            agentRequiresReview: validated.data.requiresHumanReview,
          })
          requiresReview = review.requiresHumanReview
          reviewReasons = review.reasons
          break
        }
        default:
          throw new Error(`Unknown engine: ${engine}`)
      }

      await loopRunService.recordStep({
        loopRunId: loopRun.id,
        stepOrder: stepOrder++,
        stepName: 'agent',
        agentId,
        output,
      })

      await loopRunService.recordStep({
        loopRunId: loopRun.id,
        stepOrder: stepOrder++,
        stepName: 'output_validator',
        output: { valid: true },
      })

      await loopRunService.recordStep({
        loopRunId: loopRun.id,
        stepOrder: stepOrder++,
        stepName: 'twin_update',
        output: {
          propertyTwinId: propertyTwin?.id,
          leadTwinId: leadTwin?.id,
          projectTwinId: projectTwin?.id,
          capitalTwinId: capitalTwin?.id,
        },
      })

      const intelligenceRun = await intelligenceRunService.record({
        engineType: engine,
        loopRunId: loopRun.id,
        triggerEvent: params.triggerEvent,
        triggerEventId: params.triggerEventId,
        propertyTwinId: propertyTwin?.id,
        leadTwinId: leadTwin?.id,
        projectTwinId: projectTwin?.id,
        capitalTwinId: capitalTwin?.id,
        agentId,
        inputSnapshot: params.input ?? {},
        outputSnapshot: output,
        confidenceScore: Number(output.confidenceScore ?? 0),
        requiresHumanReview: requiresReview,
        reviewReasons,
      })

      await loopRunService.complete(
        loopRun.id,
        { engine, output, intelligenceRunId: intelligenceRun.id },
        requiresReview,
      )

      outcomes.push({
        engine,
        loopRunId: loopRun.id,
        intelligenceRunId: intelligenceRun.id,
        output,
        requiresHumanReview: requiresReview,
        reviewReasons,
      })

      nextEvents.push(...resolveNextEvents(engine, output))
    }

    return {
      triggerEvent: params.triggerEvent,
      outcomes,
      nextEvents: [...new Set(nextEvents)],
      requiresHumanReview: outcomes.some((o) => o.requiresHumanReview),
    }
  }
}

export const intelligenceRunner = new IntelligenceRunner()
