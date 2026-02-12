/**
 * Autonomous Action Engine — Default Rules per Level
 */

import { AutonomyConfig, AutonomyCategory, AutonomyRule } from './types.js';

// ============================================================================
// DEFAULT RULES BY LEVEL
// ============================================================================

/** Level 1: AI recommends, human decides (current default behavior) */
const LEVEL_1_RULES: Record<AutonomyCategory, AutonomyRule> = {
  change_order: { enabled: false },
  bid_management: { enabled: false },
  budget_variance: { enabled: false },
  schedule_adjustment: { enabled: false },
  qa_action: { enabled: false },
  phase_management: { enabled: false },
  task_escalation: { enabled: false },
};

/** Level 2: AI decides routine items, human approves major items */
const LEVEL_2_RULES: Record<AutonomyCategory, AutonomyRule> = {
  change_order: {
    enabled: true,
    maxAutoApprove: 500, // Auto-approve COs <= $500
    minConfidence: 70,
  },
  bid_management: {
    enabled: true,
    // Auto-reject bids submitted after deadline
    // Auto-reject bids >25% over budget
    minConfidence: 60,
  },
  budget_variance: {
    enabled: true,
    maxPercentage: 2, // Auto-acknowledge variances <= 2%
    minConfidence: 60,
  },
  schedule_adjustment: {
    enabled: true,
    maxDays: 3, // Auto-reschedule weather delays <= 3 working days
    minConfidence: 70,
  },
  qa_action: {
    enabled: true,
    // Auto-create corrective tasks for minor findings
    // Critical findings ALWAYS escalated
    minConfidence: 70,
  },
  phase_management: {
    enabled: true,
    // Auto-advance phase when 100% of tasks are complete
    minConfidence: 80,
  },
  task_escalation: {
    enabled: true,
    maxDays: 3, // Auto-escalate tasks overdue by 3+ days
    minConfidence: 60,
  },
};

/** Level 3: AI decides most items, human reviews weekly */
const LEVEL_3_RULES: Record<AutonomyCategory, AutonomyRule> = {
  change_order: {
    enabled: true,
    maxAutoApprove: 2000, // Auto-approve COs <= $2,000
    minConfidence: 60,
  },
  bid_management: {
    enabled: true,
    // All Level 2 auto-actions PLUS:
    // Auto-award to top bidder if score >85 and gap >15 from #2
    minConfidence: 50,
  },
  budget_variance: {
    enabled: true,
    maxPercentage: 5, // Auto-acknowledge variances <= 5%
    minConfidence: 50,
  },
  schedule_adjustment: {
    enabled: true,
    maxDays: 7, // Auto-reschedule delays <= 7 working days
    minConfidence: 60,
  },
  qa_action: {
    enabled: true,
    // Auto-create corrective tasks for minor AND major findings
    // Critical findings STILL escalated
    minConfidence: 60,
  },
  phase_management: {
    enabled: true,
    // Auto-advance phase when >= 95% of tasks complete
    minConfidence: 70,
  },
  task_escalation: {
    enabled: true,
    maxDays: 1, // Auto-escalate tasks overdue by 1+ day
    minConfidence: 50,
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

const DEFAULT_RULES: Record<1 | 2 | 3, Record<AutonomyCategory, AutonomyRule>> = {
  1: LEVEL_1_RULES,
  2: LEVEL_2_RULES,
  3: LEVEL_3_RULES,
};

export function getDefaultRules(level: 1 | 2 | 3): Record<AutonomyCategory, AutonomyRule> {
  return DEFAULT_RULES[level];
}

/**
 * Build full autonomy config, merging project overrides with defaults
 */
export function buildAutonomyConfig(
  level: number,
  projectRules?: Record<string, unknown> | null,
  enabledAt?: Date | null,
  enabledBy?: string | null
): AutonomyConfig {
  const safeLevel = Math.min(3, Math.max(1, level)) as 1 | 2 | 3;
  const defaults = getDefaultRules(safeLevel);

  // Merge project-specific overrides on top of defaults
  const mergedRules = { ...defaults };
  if (projectRules && typeof projectRules === 'object') {
    for (const [key, overrides] of Object.entries(projectRules)) {
      const category = key as AutonomyCategory;
      if (mergedRules[category] && typeof overrides === 'object' && overrides !== null) {
        mergedRules[category] = { ...mergedRules[category], ...(overrides as Partial<AutonomyRule>) };
      }
    }
  }

  return {
    level: safeLevel,
    rules: mergedRules,
    enabledAt: enabledAt ?? undefined,
    enabledBy: enabledBy ?? undefined,
  };
}

/**
 * Minutes of PM time saved per auto-action category
 */
export const MINUTES_SAVED_PER_ACTION: Record<AutonomyCategory, number> = {
  change_order: 30,
  bid_management: 15,
  budget_variance: 10,
  schedule_adjustment: 20,
  qa_action: 15,
  phase_management: 10,
  task_escalation: 5,
};
