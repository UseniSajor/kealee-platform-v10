/**
 * Compliance Package
 * Exports compliance gates and enforcement functionality
 */

export {
  COMPLIANCE_GATES,
  ComplianceError,
  getAvailableGates,
  checkGate,
} from './gates'
export type {
  ModuleName,
  CheckType,
  GateCheck,
  GateResult,
} from './gates'
