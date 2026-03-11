/**
 * RuleEngine Integration Tests
 * Tests condition evaluation, AND/OR logic, action execution, and priority ordering
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RuleEngine, type Rule, type RuleCondition, type RuleAction } from '../rule-engine';

// ── Helper: build a Rule ─────────────────────────────────────

function buildRule(overrides: Partial<Rule> = {}): Rule {
  return {
    id: overrides.id ?? 'rule_001',
    name: overrides.name ?? 'Test Rule',
    description: overrides.description,
    category: overrides.category ?? 'compliance',
    priority: overrides.priority ?? 10,
    enabled: overrides.enabled ?? true,
    conditions: overrides.conditions ?? [],
    conditionLogic: overrides.conditionLogic ?? 'AND',
    actions: overrides.actions ?? [{ type: 'block', message: 'Blocked' }],
  };
}

describe('RuleEngine', () => {
  let engine: RuleEngine;

  beforeEach(() => {
    engine = new RuleEngine();
  });

  // ── Condition Operators ────────────────────────────────────

  describe('condition operators', () => {
    it('evaluates "eq" (equals) correctly', () => {
      engine.loadRules([
        buildRule({
          conditions: [{ field: 'status', operator: 'eq', value: 'ACTIVE' }],
          actions: [{ type: 'block', message: 'Must be ACTIVE' }],
        }),
      ]);

      const passResult = engine.evaluate({ status: 'ACTIVE' });
      expect(passResult[0].passed).toBe(true);
      expect(passResult[0].triggeredActions).toEqual([]);

      const failResult = engine.evaluate({ status: 'INACTIVE' });
      expect(failResult[0].passed).toBe(false);
      expect(failResult[0].triggeredActions).toHaveLength(1);
    });

    it('evaluates "neq" (not equals) correctly', () => {
      engine.loadRules([
        buildRule({
          conditions: [{ field: 'status', operator: 'neq', value: 'ARCHIVED' }],
        }),
      ]);

      expect(engine.evaluate({ status: 'ACTIVE' })[0].passed).toBe(true);
      expect(engine.evaluate({ status: 'ARCHIVED' })[0].passed).toBe(false);
    });

    it('evaluates "gt" (greater than) correctly', () => {
      engine.loadRules([
        buildRule({
          conditions: [{ field: 'budget', operator: 'gt', value: 100000 }],
        }),
      ]);

      expect(engine.evaluate({ budget: 150000 })[0].passed).toBe(true);
      expect(engine.evaluate({ budget: 100000 })[0].passed).toBe(false);
      expect(engine.evaluate({ budget: 50000 })[0].passed).toBe(false);
    });

    it('evaluates "gte" (greater than or equal) correctly', () => {
      engine.loadRules([
        buildRule({
          conditions: [{ field: 'score', operator: 'gte', value: 80 }],
        }),
      ]);

      expect(engine.evaluate({ score: 80 })[0].passed).toBe(true);
      expect(engine.evaluate({ score: 90 })[0].passed).toBe(true);
      expect(engine.evaluate({ score: 79 })[0].passed).toBe(false);
    });

    it('evaluates "lt" (less than) correctly', () => {
      engine.loadRules([
        buildRule({
          conditions: [{ field: 'riskLevel', operator: 'lt', value: 50 }],
        }),
      ]);

      expect(engine.evaluate({ riskLevel: 30 })[0].passed).toBe(true);
      expect(engine.evaluate({ riskLevel: 50 })[0].passed).toBe(false);
      expect(engine.evaluate({ riskLevel: 70 })[0].passed).toBe(false);
    });

    it('evaluates "lte" (less than or equal) correctly', () => {
      engine.loadRules([
        buildRule({
          conditions: [{ field: 'daysOverdue', operator: 'lte', value: 5 }],
        }),
      ]);

      expect(engine.evaluate({ daysOverdue: 5 })[0].passed).toBe(true);
      expect(engine.evaluate({ daysOverdue: 3 })[0].passed).toBe(true);
      expect(engine.evaluate({ daysOverdue: 6 })[0].passed).toBe(false);
    });

    it('evaluates "in" (value in array) correctly', () => {
      engine.loadRules([
        buildRule({
          conditions: [{ field: 'phase', operator: 'in', value: ['CONSTRUCTION', 'CLOSEOUT'] }],
        }),
      ]);

      expect(engine.evaluate({ phase: 'CONSTRUCTION' })[0].passed).toBe(true);
      expect(engine.evaluate({ phase: 'CLOSEOUT' })[0].passed).toBe(true);
      expect(engine.evaluate({ phase: 'INTAKE' })[0].passed).toBe(false);
    });

    it('evaluates "nin" (value not in array) correctly', () => {
      engine.loadRules([
        buildRule({
          conditions: [{ field: 'role', operator: 'nin', value: ['ADMIN', 'SUPER_ADMIN'] }],
        }),
      ]);

      expect(engine.evaluate({ role: 'MEMBER' })[0].passed).toBe(true);
      expect(engine.evaluate({ role: 'ADMIN' })[0].passed).toBe(false);
    });

    it('evaluates "contains" (string contains) correctly', () => {
      engine.loadRules([
        buildRule({
          conditions: [{ field: 'description', operator: 'contains', value: 'hazardous' }],
        }),
      ]);

      expect(
        engine.evaluate({ description: 'Contains hazardous materials' })[0].passed,
      ).toBe(true);
      expect(
        engine.evaluate({ description: 'Normal materials only' })[0].passed,
      ).toBe(false);
    });

    it('evaluates "exists" (field is defined and non-null) correctly', () => {
      engine.loadRules([
        buildRule({
          conditions: [{ field: 'permit', operator: 'exists', value: true }],
        }),
      ]);

      expect(engine.evaluate({ permit: 'PERM-001' })[0].passed).toBe(true);
      expect(engine.evaluate({ permit: null })[0].passed).toBe(false);
      expect(engine.evaluate({})[0].passed).toBe(false);
    });

    it('supports nested field paths via dot notation', () => {
      engine.loadRules([
        buildRule({
          conditions: [{ field: 'project.budget.amount', operator: 'gt', value: 50000 }],
        }),
      ]);

      expect(
        engine.evaluate({ project: { budget: { amount: 75000 } } })[0].passed,
      ).toBe(true);
      expect(
        engine.evaluate({ project: { budget: { amount: 30000 } } })[0].passed,
      ).toBe(false);
    });

    it('returns false for non-numeric values with numeric operators', () => {
      engine.loadRules([
        buildRule({
          conditions: [{ field: 'amount', operator: 'gt', value: 100 }],
        }),
      ]);

      expect(engine.evaluate({ amount: 'not-a-number' })[0].passed).toBe(false);
      expect(engine.evaluate({ amount: undefined })[0].passed).toBe(false);
    });
  });

  // ── AND / OR Logic ─────────────────────────────────────────

  describe('condition logic', () => {
    it('AND logic requires all conditions to pass', () => {
      engine.loadRules([
        buildRule({
          conditionLogic: 'AND',
          conditions: [
            { field: 'status', operator: 'eq', value: 'ACTIVE' },
            { field: 'budget', operator: 'gt', value: 50000 },
            { field: 'phase', operator: 'in', value: ['CONSTRUCTION', 'CLOSEOUT'] },
          ],
        }),
      ]);

      // All pass
      expect(
        engine.evaluate({ status: 'ACTIVE', budget: 100000, phase: 'CONSTRUCTION' })[0].passed,
      ).toBe(true);

      // One fails
      expect(
        engine.evaluate({ status: 'ACTIVE', budget: 30000, phase: 'CONSTRUCTION' })[0].passed,
      ).toBe(false);

      // Multiple fail
      expect(
        engine.evaluate({ status: 'INACTIVE', budget: 30000, phase: 'INTAKE' })[0].passed,
      ).toBe(false);
    });

    it('OR logic requires at least one condition to pass', () => {
      engine.loadRules([
        buildRule({
          conditionLogic: 'OR',
          conditions: [
            { field: 'role', operator: 'eq', value: 'ADMIN' },
            { field: 'role', operator: 'eq', value: 'SUPER_ADMIN' },
            { field: 'isOwner', operator: 'eq', value: true },
          ],
        }),
      ]);

      expect(engine.evaluate({ role: 'ADMIN', isOwner: false })[0].passed).toBe(true);
      expect(engine.evaluate({ role: 'MEMBER', isOwner: true })[0].passed).toBe(true);
      expect(engine.evaluate({ role: 'MEMBER', isOwner: false })[0].passed).toBe(false);
    });

    it('empty conditions always pass', () => {
      engine.loadRules([
        buildRule({
          conditionLogic: 'AND',
          conditions: [],
        }),
      ]);

      expect(engine.evaluate({})[0].passed).toBe(true);
    });
  });

  // ── Action Types ───────────────────────────────────────────

  describe('action execution', () => {
    it('triggers "require" action when conditions fail', () => {
      engine.loadRules([
        buildRule({
          conditions: [{ field: 'hasPermit', operator: 'eq', value: true }],
          actions: [{ type: 'require', message: 'Building permit is required', target: 'permit' }],
        }),
      ]);

      const result = engine.evaluate({ hasPermit: false });
      expect(result[0].passed).toBe(false);
      expect(result[0].triggeredActions).toEqual([
        { type: 'require', message: 'Building permit is required', target: 'permit' },
      ]);
    });

    it('triggers "block" action when conditions fail', () => {
      engine.loadRules([
        buildRule({
          conditions: [{ field: 'insuranceVerified', operator: 'eq', value: true }],
          actions: [{ type: 'block', message: 'Insurance verification required before proceeding' }],
        }),
      ]);

      const result = engine.evaluate({ insuranceVerified: false });
      expect(result[0].triggeredActions[0].type).toBe('block');
    });

    it('triggers "warn" action when conditions fail', () => {
      engine.loadRules([
        buildRule({
          conditions: [{ field: 'budgetVariance', operator: 'lte', value: 10 }],
          actions: [{ type: 'warn', message: 'Budget variance exceeds threshold' }],
        }),
      ]);

      const result = engine.evaluate({ budgetVariance: 15 });
      expect(result[0].triggeredActions[0].type).toBe('warn');
    });

    it('triggers "notify" action with target when conditions fail', () => {
      engine.loadRules([
        buildRule({
          conditions: [{ field: 'inspectionScore', operator: 'gte', value: 70 }],
          actions: [
            { type: 'notify', message: 'Inspection score below threshold', target: 'project_manager' },
          ],
        }),
      ]);

      const result = engine.evaluate({ inspectionScore: 55 });
      expect(result[0].triggeredActions).toEqual([
        { type: 'notify', message: 'Inspection score below threshold', target: 'project_manager' },
      ]);
    });

    it('returns no triggered actions when conditions pass', () => {
      engine.loadRules([
        buildRule({
          conditions: [{ field: 'score', operator: 'gte', value: 80 }],
          actions: [
            { type: 'block', message: 'Score too low' },
            { type: 'notify', message: 'Alert PM', target: 'pm' },
          ],
        }),
      ]);

      const result = engine.evaluate({ score: 95 });
      expect(result[0].passed).toBe(true);
      expect(result[0].triggeredActions).toEqual([]);
    });

    it('triggers multiple actions on failure', () => {
      engine.loadRules([
        buildRule({
          conditions: [{ field: 'safetyScore', operator: 'gte', value: 80 }],
          actions: [
            { type: 'block', message: 'Safety score too low' },
            { type: 'notify', message: 'Alert safety officer', target: 'safety_officer' },
            { type: 'escalate', message: 'Escalate to management' },
          ],
        }),
      ]);

      const result = engine.evaluate({ safetyScore: 50 });
      expect(result[0].triggeredActions).toHaveLength(3);
      expect(result[0].triggeredActions.map(a => a.type)).toEqual(['block', 'notify', 'escalate']);
    });
  });

  // ── Priority Ordering ──────────────────────────────────────

  describe('rule priority ordering', () => {
    it('evaluates rules in priority order (lower number = higher priority)', () => {
      engine.loadRules([
        buildRule({ id: 'low_priority', priority: 100, name: 'Low Priority Rule', conditions: [] }),
        buildRule({ id: 'high_priority', priority: 1, name: 'High Priority Rule', conditions: [] }),
        buildRule({ id: 'mid_priority', priority: 50, name: 'Mid Priority Rule', conditions: [] }),
      ]);

      const results = engine.evaluate({});
      expect(results[0].ruleId).toBe('high_priority');
      expect(results[1].ruleId).toBe('mid_priority');
      expect(results[2].ruleId).toBe('low_priority');
    });

    it('maintains priority order when adding rules individually', () => {
      engine.addRule(buildRule({ id: 'r3', priority: 30, conditions: [] }));
      engine.addRule(buildRule({ id: 'r1', priority: 5, conditions: [] }));
      engine.addRule(buildRule({ id: 'r2', priority: 15, conditions: [] }));

      const results = engine.evaluate({});
      expect(results.map(r => r.ruleId)).toEqual(['r1', 'r2', 'r3']);
    });

    it('skips disabled rules', () => {
      engine.loadRules([
        buildRule({ id: 'enabled', enabled: true, priority: 1, conditions: [] }),
        buildRule({ id: 'disabled', enabled: false, priority: 2, conditions: [] }),
        buildRule({ id: 'also_enabled', enabled: true, priority: 3, conditions: [] }),
      ]);

      const results = engine.evaluate({});
      expect(results).toHaveLength(2);
      expect(results.map(r => r.ruleId)).toEqual(['enabled', 'also_enabled']);
    });

    it('does not add disabled rules via addRule', () => {
      engine.addRule(buildRule({ id: 'disabled', enabled: false }));
      const results = engine.evaluate({});
      expect(results).toHaveLength(0);
    });
  });

  // ── Category Filtering ─────────────────────────────────────

  describe('category filtering', () => {
    it('filters evaluation by category', () => {
      engine.loadRules([
        buildRule({ id: 'compliance_1', category: 'compliance', conditions: [] }),
        buildRule({ id: 'financial_1', category: 'financial', conditions: [] }),
        buildRule({ id: 'safety_1', category: 'safety', conditions: [] }),
      ]);

      const complianceResults = engine.evaluate({}, 'compliance');
      expect(complianceResults).toHaveLength(1);
      expect(complianceResults[0].ruleId).toBe('compliance_1');

      const safetyResults = engine.evaluate({}, 'safety');
      expect(safetyResults).toHaveLength(1);
      expect(safetyResults[0].ruleId).toBe('safety_1');
    });

    it('returns all rules when no category filter specified', () => {
      engine.loadRules([
        buildRule({ id: 'r1', category: 'compliance', conditions: [] }),
        buildRule({ id: 'r2', category: 'financial', conditions: [] }),
      ]);

      const results = engine.evaluate({});
      expect(results).toHaveLength(2);
    });
  });

  // ── check() method ─────────────────────────────────────────

  describe('check method', () => {
    it('returns allowed=true when all rules pass', () => {
      engine.loadRules([
        buildRule({
          conditions: [{ field: 'status', operator: 'eq', value: 'ACTIVE' }],
          actions: [{ type: 'block', message: 'Must be active' }],
        }),
      ]);

      const result = engine.check({ status: 'ACTIVE' });
      expect(result.allowed).toBe(true);
      expect(result.violations).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    it('returns allowed=false with violations for block/require actions', () => {
      engine.loadRules([
        buildRule({
          id: 'block_rule',
          conditions: [{ field: 'hasPermit', operator: 'eq', value: true }],
          actions: [{ type: 'block', message: 'Permit required' }],
        }),
      ]);

      const result = engine.check({ hasPermit: false });
      expect(result.allowed).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].ruleId).toBe('block_rule');
    });

    it('separates warnings from violations', () => {
      engine.loadRules([
        buildRule({
          id: 'warn_rule',
          conditions: [{ field: 'budgetVariance', operator: 'lte', value: 5 }],
          actions: [{ type: 'warn', message: 'Budget variance high' }],
        }),
        buildRule({
          id: 'block_rule',
          conditions: [{ field: 'hasInsurance', operator: 'eq', value: true }],
          actions: [{ type: 'block', message: 'Insurance required' }],
        }),
      ]);

      const result = engine.check({ budgetVariance: 8, hasInsurance: false });
      expect(result.allowed).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].ruleId).toBe('block_rule');
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].ruleId).toBe('warn_rule');
    });

    it('returns allowed=true when only warnings exist (no block/require)', () => {
      engine.loadRules([
        buildRule({
          conditions: [{ field: 'score', operator: 'gte', value: 90 }],
          actions: [{ type: 'warn', message: 'Score below ideal' }],
        }),
      ]);

      const result = engine.check({ score: 85 });
      expect(result.allowed).toBe(true);
      expect(result.warnings).toHaveLength(1);
    });
  });

  // ── evaluatedAt timestamp ──────────────────────────────────

  describe('result metadata', () => {
    it('includes evaluatedAt timestamp in each result', () => {
      engine.loadRules([buildRule({ conditions: [] })]);

      const results = engine.evaluate({});
      expect(results[0].evaluatedAt).toBeDefined();
      expect(new Date(results[0].evaluatedAt).getTime()).not.toBeNaN();
    });

    it('includes ruleId and ruleName in each result', () => {
      engine.loadRules([
        buildRule({ id: 'rule_xyz', name: 'XYZ Rule', conditions: [] }),
      ]);

      const results = engine.evaluate({});
      expect(results[0].ruleId).toBe('rule_xyz');
      expect(results[0].ruleName).toBe('XYZ Rule');
    });
  });
});
