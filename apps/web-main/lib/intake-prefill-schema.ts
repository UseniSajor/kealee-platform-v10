import { SERVICE_BY_INTAKE } from './services-config'

export interface IntakePrefill {
  description: string
  propertyDetails: string
  stylePreferences: string
  priorities: string
  mustStay: string
  problemsToSolve: string
  budgetComfort: string
  timeline: string
}

const EMPTY_PREFILL: IntakePrefill = {
  description: '',
  propertyDetails: '',
  stylePreferences: '',
  priorities: '',
  mustStay: '',
  problemsToSolve: '',
  budgetComfort: '',
  timeline: '',
}

/**
 * Default form values for the intake form, keyed by projectPath.
 * Grounded in services-config.ts (the services single source of truth) rather
 * than generic placeholder copy — unknown paths just get empty defaults.
 */
export function getIntakePrefill(projectPath: string): IntakePrefill {
  const service = SERVICE_BY_INTAKE[projectPath]
  if (!service) return EMPTY_PREFILL

  return {
    ...EMPTY_PREFILL,
    description: service.description,
    timeline: service.timeline,
  }
}
