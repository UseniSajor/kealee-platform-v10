/**
 * Core Rules Engine — evaluates configurable business rules
 * Extracted patterns from compliance + workflow modules
 */

import { z } from 'zod';

export type RuleCondition = {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'exists';
  value: unknown;
};

export type RuleAction = {
  type: 'require' | 'block' | 'warn' | 'notify' | 'auto_approve' | 'escalate';
  message?: string;
  target?: string;
  metadata?: Record<string, unknown>;
};

export interface Rule {
  id: string;
  name: string;
  description?: string;
  category: string; // 'compliance', 'workflow', 'financial', 'safety'
  priority: number; // Lower = higher priority
  enabled: boolean;
  conditions: RuleCondition[];
  conditionLogic: 'AND' | 'OR';
  actions: RuleAction[];
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  passed: boolean;
  triggeredActions: RuleAction[];
  evaluatedAt: string;
}

export class RuleEngine {
  private rules: Rule[] = [];

  /**
   * Load rules from configuration
   */
  loadRules(rules: Rule[]): void {
    this.rules = rules.filter(r => r.enabled).sort((a, b) => a.priority - b.priority);
  }

  /**
   * Add a single rule
   */
  addRule(rule: Rule): void {
    if (rule.enabled) {
      this.rules.push(rule);
      this.rules.sort((a, b) => a.priority - b.priority);
    }
  }

  /**
   * Evaluate all rules against a context
   */
  evaluate(context: Record<string, unknown>, category?: string): RuleEvaluationResult[] {
    const applicableRules = category
      ? this.rules.filter(r => r.category === category)
      : this.rules;

    return applicableRules.map(rule => {
      const passed = this.evaluateConditions(rule.conditions, rule.conditionLogic, context);
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        passed,
        triggeredActions: passed ? [] : rule.actions,
        evaluatedAt: new Date().toISOString(),
      };
    });
  }

  /**
   * Check if all rules pass (no blocking actions)
   */
  check(context: Record<string, unknown>, category?: string): {
    allowed: boolean;
    violations: RuleEvaluationResult[];
    warnings: RuleEvaluationResult[];
  } {
    const results = this.evaluate(context, category);
    const violations = results.filter(r =>
      !r.passed && r.triggeredActions.some(a => a.type === 'block' || a.type === 'require')
    );
    const warnings = results.filter(r =>
      !r.passed && r.triggeredActions.some(a => a.type === 'warn')
    );

    return {
      allowed: violations.length === 0,
      violations,
      warnings,
    };
  }

  private evaluateConditions(
    conditions: RuleCondition[],
    logic: 'AND' | 'OR',
    context: Record<string, unknown>,
  ): boolean {
    if (conditions.length === 0) return true;

    const results = conditions.map(c => this.evaluateCondition(c, context));

    return logic === 'AND'
      ? results.every(Boolean)
      : results.some(Boolean);
  }

  private evaluateCondition(condition: RuleCondition, context: Record<string, unknown>): boolean {
    const value = this.getNestedValue(context, condition.field);

    switch (condition.operator) {
      case 'eq': return value === condition.value;
      case 'neq': return value !== condition.value;
      case 'gt': return typeof value === 'number' && value > (condition.value as number);
      case 'gte': return typeof value === 'number' && value >= (condition.value as number);
      case 'lt': return typeof value === 'number' && value < (condition.value as number);
      case 'lte': return typeof value === 'number' && value <= (condition.value as number);
      case 'in': return Array.isArray(condition.value) && condition.value.includes(value);
      case 'nin': return Array.isArray(condition.value) && !condition.value.includes(value);
      case 'contains':
        return typeof value === 'string' && value.includes(condition.value as string);
      case 'exists': return value !== undefined && value !== null;
      default: return false;
    }
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((acc: any, key) => acc?.[key], obj);
  }
}
