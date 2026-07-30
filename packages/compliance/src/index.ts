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
export { canLabelPermitReady } from './jurisdiction-rules'
export type {
  JurisdictionCheckResult,
  JurisdictionOutcome,
  JurisdictionRulePack,
  RuleAuthority,
} from './jurisdiction-rules'
export { evaluateProfessionalRelease } from './professional-release'
export type { ProfessionalReleaseDecision, ProfessionalReleaseInput } from './professional-release'
export {
  evalCondition,
  evalNode,
  evaluateRuleVersion,
  evaluateJurisdictionRules,
  assertJurisdictionHasActiveRules,
} from './rule-engine'
export type {
  ConditionExpr,
  RuleNode,
  RuleLeaf,
  JurisdictionRuleRequirements,
  JurisdictionRuleVersionRow,
  JsonScalar,
} from './rule-engine'
export { PGC_RULES } from './prince-georges-rule-data'
export type { PgcRuleDefinition } from './prince-georges-rule-data'


