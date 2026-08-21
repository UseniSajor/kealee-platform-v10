/**
 * Regulatory classification and the site-plan applicability decision report.
 *
 * The brief is explicit: do NOT assume every project requires a Detailed Site
 * Plan, and explain why every approval is or is not required. Most residential
 * work in Prince George's County needs a permit plot plan and nothing more; a
 * DSP is the exception, not the default.
 *
 * Every determination carries its reasoning, so the report can be read by an
 * applicant, a reviewer, and a County plan reviewer without any of them having
 * to reverse-engineer the logic.
 */

import {
  calculateDisturbance,
  requiresSedimentAndStormwaterReview,
  type DisturbanceComponents,
  type DisturbanceResult,
} from './disturbance'
import type { ReliabilityLevel, SourceRecord } from './reliability'
import { governingReliability, disclosureFor } from './reliability'

export type ProjectClassification =
  | 'feasibility_only'
  | 'permit_plot_plan'
  | 'site_development_concept'
  | 'detailed_site_plan'
  | 'preliminary_plan_of_subdivision'
  | 'fine_grading_permit'
  | 'rough_grading_permit'
  | 'street_construction_permit'
  | 'building_permit_site_road_review'
  | 'revision_to_approved_plan'

export const CLASSIFICATION_LABELS: Record<ProjectClassification, string> = {
  feasibility_only: 'Feasibility only',
  permit_plot_plan: 'Permit plot plan',
  site_development_concept: 'Site Development Concept',
  detailed_site_plan: 'Detailed Site Plan',
  preliminary_plan_of_subdivision: 'Preliminary Plan of Subdivision',
  fine_grading_permit: 'Fine grading permit',
  rough_grading_permit: 'Rough grading permit',
  street_construction_permit: 'Street construction permit',
  building_permit_site_road_review: 'Building-permit site/road review',
  revision_to_approved_plan: 'Revision to an approved plan',
}

export interface ProjectIntake {
  /** Purely exploratory — no permit intended yet. */
  feasibilityOnly?: boolean
  /** Amending something already approved. */
  revisesApprovedPlan?: boolean
  priorApprovals?: string[]

  zoneCode?: string
  overlayCodes?: string[]

  createsNewLots?: boolean
  newLotCount?: number

  dwellingUnitCount?: number
  proposedUse?: string
  isResidentialSingleFamily?: boolean

  buildsOrExtendsPublicRoad?: boolean
  disturbance?: Partial<DisturbanceComponents>

  /** Structures being removed. */
  demolition?: boolean
  /** Grading with no building permit attached (mass grading). */
  standaloneGrading?: boolean

  withinChesapeakeBayCriticalArea?: boolean
  withinFloodplain?: boolean
  affectsStreamOrWetlandBuffer?: boolean
  removesWoodland?: boolean

  sources?: SourceRecord[]
}

export interface ApprovalDetermination {
  approval: ProjectClassification
  required: boolean
  /** Set when the inputs cannot yet settle the question. */
  undetermined?: boolean
  reason: string
  /** What would settle an undetermined item. */
  toResolve?: string[]
}

export interface ApplicabilityReport {
  classifications: ProjectClassification[]
  determinations: ApprovalDetermination[]
  disturbance: DisturbanceResult
  sedimentAndStormwater: { required: boolean; certain: boolean; reason: string }
  reliabilityLevel: ReliabilityLevel
  disclosure: string | null
  openItems: string[]
  summary: string
}

export function classifyProject(intake: ProjectIntake): ApplicabilityReport {
  const determinations: ApprovalDetermination[] = []
  const openItems: string[] = []

  const disturbance = calculateDisturbance(intake.disturbance ?? {}, {
    reliabilityLevel: governingReliability(intake.sources ?? []),
  })
  const sed = requiresSedimentAndStormwaterReview(disturbance)

  const add = (d: ApprovalDetermination) => determinations.push(d)

  // Feasibility short-circuits everything — no approval is being sought.
  if (intake.feasibilityOnly) {
    add({
      approval: 'feasibility_only',
      required: true,
      reason:
        'Requested as a feasibility study. No County approval is being sought, so no ' +
        'application requirements attach yet.',
    })
    return finish(['feasibility_only'])
  }

  // Revision to an approved plan.
  add({
    approval: 'revision_to_approved_plan',
    required: Boolean(intake.revisesApprovedPlan),
    reason: intake.revisesApprovedPlan
      ? `Amends previously approved work${
          intake.priorApprovals?.length ? ` (${intake.priorApprovals.join(', ')})` : ''
        }, so it is processed as a revision and must satisfy the original conditions of approval.`
      : 'No prior approval is being amended.',
  })

  // Subdivision.
  const subdividing = Boolean(intake.createsNewLots)
  add({
    approval: 'preliminary_plan_of_subdivision',
    required: subdividing,
    reason: subdividing
      ? `Creates ${intake.newLotCount ?? 'new'} lot(s), which requires subdivision review ` +
        'under Subtitle 24 before final plat.'
      : 'No new lots are proposed, so subdivision review is not triggered.',
  })

  // Detailed Site Plan — deliberately NOT the default.
  const dspTriggers: string[] = []
  if (intake.withinChesapeakeBayCriticalArea) dspTriggers.push('Chesapeake Bay Critical Area')
  if ((intake.overlayCodes ?? []).some(o => ['T-D-O', 'D-D-O'].includes(o))) {
    dspTriggers.push('Transit District or Development District Overlay')
  }
  if ((intake.dwellingUnitCount ?? 0) > 1 && !intake.isResidentialSingleFamily) {
    dspTriggers.push('multifamily or attached residential development')
  }
  const dspUndetermined = dspTriggers.length === 0 && !intake.zoneCode
  add({
    approval: 'detailed_site_plan',
    required: dspTriggers.length > 0,
    undetermined: dspUndetermined,
    reason:
      dspTriggers.length > 0
        ? `Triggered by: ${dspTriggers.join('; ')}. A Detailed Site Plan is required.`
        : dspUndetermined
          ? 'Cannot be determined without the zone and overlay context.'
          : 'No Detailed Site Plan trigger is present. Most single-family residential work ' +
            'in Prince George\'s County does not require one — it is the exception, not the default.',
    toResolve: dspUndetermined ? ['Confirm the base zone and any overlay zones'] : undefined,
  })

  // Site Development Concept follows the disturbance gate.
  add({
    approval: 'site_development_concept',
    required: sed.required,
    undetermined: !sed.certain,
    reason: sed.reason,
    toResolve: sed.certain ? undefined : disturbance.unknownComponents.map(c => `Quantify: ${c}`),
  })

  // Grading permits.
  add({
    approval: 'rough_grading_permit',
    required: Boolean(intake.standaloneGrading) && sed.required,
    reason:
      intake.standaloneGrading && sed.required
        ? 'Mass grading is proposed independently of a building permit and disturbance meets ' +
          'the threshold, so a rough grading permit is required.'
        : intake.standaloneGrading
          ? 'Standalone grading is proposed but disturbance is below the threshold.'
          : 'Grading is incidental to the building permit rather than a standalone operation.',
  })
  add({
    approval: 'fine_grading_permit',
    required: sed.required && !intake.standaloneGrading,
    undetermined: !sed.certain,
    reason:
      sed.required && !intake.standaloneGrading
        ? 'Site grading accompanies the building permit and disturbance meets the threshold.'
        : 'Fine grading review is not triggered on the information supplied.',
  })

  // Road work.
  add({
    approval: 'street_construction_permit',
    required: Boolean(intake.buildsOrExtendsPublicRoad),
    reason: intake.buildsOrExtendsPublicRoad
      ? 'New or extended public road is proposed, which requires street construction permitting ' +
        'and roadway coordination.'
      : 'No public road construction or extension is proposed.',
  })

  // Building permit site/road review, and the plot plan baseline.
  const buildingWork =
    (intake.dwellingUnitCount ?? 0) > 0 ||
    Boolean(intake.disturbance?.buildingFootprintSqFt) ||
    Boolean(intake.proposedUse)
  add({
    approval: 'building_permit_site_road_review',
    required: buildingWork,
    reason: buildingWork
      ? 'A building permit is contemplated, so DPIE site/road review applies.'
      : 'No building permit work is described.',
  })
  add({
    approval: 'permit_plot_plan',
    required: buildingWork && !sed.required && !subdividing,
    reason:
      buildingWork && !sed.required && !subdividing
        ? 'Building work below the disturbance threshold with no subdivision — a permit plot ' +
          'plan is the appropriate submission.'
        : buildingWork
          ? 'Superseded by a higher-order approval (disturbance threshold and/or subdivision).'
          : 'No building work described.',
  })

  // Environmental coordination surfaces as open items rather than approvals.
  if (intake.affectsStreamOrWetlandBuffer) {
    openItems.push(
      'Work affects a regulated stream or wetland buffer — confirm the buffer width under ' +
        'Table 24-4303(c) (75 ft within Transit Oriented Centers, 100 ft outside) and route for ' +
        'environmental review.',
    )
  }
  if (intake.removesWoodland) {
    openItems.push(
      'Woodland removal is proposed — Natural Resource Inventory and Tree Conservation Plan ' +
        'coordination is required. Kealee coordinates these; it does not recreate approved ' +
        'environmental findings.',
    )
  }
  if (intake.withinFloodplain) {
    openItems.push('Site intersects mapped floodplain — floodplain review applies and the floodway must be confirmed.')
  }
  if (intake.withinChesapeakeBayCriticalArea) {
    openItems.push(
      'Site is in the Chesapeake Bay Critical Area — impervious limits, buffer, and a ' +
        'Chesapeake Bay Conservation Plan apply.',
    )
  }

  const selected = determinations.filter(d => d.required).map(d => d.approval)
  return finish(selected.length ? selected : ['permit_plot_plan'])

  function finish(classifications: ProjectClassification[]): ApplicabilityReport {
    const level = governingReliability(intake.sources ?? [])
    for (const d of determinations) {
      if (d.undetermined && d.toResolve) openItems.push(...d.toResolve)
    }
    const required = determinations.filter(d => d.required)
    const summary =
      required.length === 0
        ? 'No County approvals were identified from the information supplied.'
        : `${required.length} approval${required.length === 1 ? '' : 's'} identified: ` +
          required.map(d => CLASSIFICATION_LABELS[d.approval]).join(', ') + '.'
    return {
      classifications,
      determinations,
      disturbance,
      sedimentAndStormwater: sed,
      reliabilityLevel: level,
      disclosure: disclosureFor(level),
      openItems: [...new Set(openItems)],
      summary,
    }
  }
}
