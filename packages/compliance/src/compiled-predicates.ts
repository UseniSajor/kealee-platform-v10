import type { RuleLeaf } from './rule-engine'

/**
 * Escape hatch for jurisdiction rule logic that can't be expressed as a RuleNode condition
 * tree. A JurisdictionRuleVersion row with kind='COMPILED' stores { predicateKey } in its
 * requirements column; evaluateJurisdictionRules looks up the named function here.
 *
 * Empty today — every migrated jurisdiction (Prince George's County) fits the condition-tree
 * DSL with zero compiled predicates needed. Register a new key here only when a future
 * jurisdiction's logic genuinely cannot be expressed as a condition tree.
 */
export const COMPILED_PREDICATES: Record<string, (input: Record<string, unknown>) => RuleLeaf> = {}
