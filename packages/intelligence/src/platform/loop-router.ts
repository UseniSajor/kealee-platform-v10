import type { IntelligenceEventType } from '../constants/events.js'
import type { IntelligenceEngineTypeName } from '../constants/loop-types.js'

/** Maps automation events to intelligence engine(s) to run in order */
export const EVENT_ENGINE_MAP: Partial<Record<IntelligenceEventType, IntelligenceEngineTypeName[]>> = {
  PROPERTY_IMPORTED: ['property', 'opportunity'],
  PARCEL_ANALYZED: ['property', 'opportunity'],
  OPPORTUNITY_SCORE_REQUESTED: ['opportunity'],
  LEAD_CREATED: ['lead', 'opportunity'],
  FORM_SUBMITTED: ['lead'],
  PAYMENT_COMPLETED: ['lead', 'project'],
  FINANCING_INTERESTED: ['capital'],
  CAPITAL_REVIEW_REQUESTED: ['capital'],
  CUSTOMER_OPTED_IN_FINANCING: ['capital'],
  PROJECT_CREATED: ['project'],
  INTAKE_UPDATED: ['project'],
  ESTIMATE_GENERATED: ['project', 'opportunity'],
  PERMIT_PACKAGE_REQUESTED: ['project', 'opportunity'],
}

export function resolveEnginesForEvent(event: IntelligenceEventType): IntelligenceEngineTypeName[] {
  return EVENT_ENGINE_MAP[event] ?? ['property']
}

export function resolveNextEvents(
  engine: IntelligenceEngineTypeName,
  _output: unknown,
): IntelligenceEventType[] {
  switch (engine) {
    case 'property':
      return ['OPPORTUNITY_SCORE_REQUESTED']
    case 'opportunity':
      return ['CAMPAIGN_RECOMMENDATION_REQUESTED']
    case 'lead':
      return ['CRM_STATUS_UPDATED']
    case 'capital':
      return ['LENDER_PACKAGE_REQUESTED']
    case 'project':
      return ['TASK_UPDATED']
    default:
      return []
  }
}
