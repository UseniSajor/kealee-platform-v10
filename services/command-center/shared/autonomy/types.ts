/**
 * Autonomous Action Engine — Type Definitions
 */

// ============================================================================
// AUTONOMY CATEGORIES
// ============================================================================

export type AutonomyCategory =
  | 'change_order'
  | 'bid_management'
  | 'budget_variance'
  | 'schedule_adjustment'
  | 'qa_action'
  | 'phase_management'
  | 'task_escalation';

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface AutonomyRule {
  /** Maximum dollar amount for auto-approval */
  maxAutoApprove?: number;
  /** Maximum percentage threshold for auto-action */
  maxPercentage?: number;
  /** Maximum days for auto-reschedule */
  maxDays?: number;
  /** Whether this category is enabled for auto-action */
  enabled: boolean;
  /** Minimum confidence score required (0-100) */
  minConfidence?: number;
}

export interface AutonomyConfig {
  level: 1 | 2 | 3;
  rules: Record<AutonomyCategory, AutonomyRule>;
  enabledAt?: Date;
  enabledBy?: string;
}

// ============================================================================
// ACTION CONTEXT (input to evaluateAndAct)
// ============================================================================

export interface ActionContext {
  projectId: string;
  category: AutonomyCategory;
  appSource: string; // e.g. "APP-03"
  actionType: string; // e.g. "change_order_approve"
  description: string;
  confidence: number; // 0-100

  /** Category-specific data */
  amount?: number; // Dollar amount (change orders, budget)
  percentage?: number; // Percentage value (budget variance)
  days?: number; // Day count (schedule shifts)
  severity?: 'critical' | 'major' | 'minor' | 'observation'; // QA severity
  metadata?: Record<string, unknown>; // Additional context
}

// ============================================================================
// ACTION RESULT (output from evaluateAndAct)
// ============================================================================

export type ActionDecision = 'AUTO_APPROVED' | 'AUTO_REJECTED' | 'AUTO_EXECUTED' | 'ESCALATED';

export interface ActionResult {
  decision: ActionDecision;
  reasoning: string;
  actionLogId?: string; // ID of the AutonomousActionLog record
  escalationData?: {
    decisionLogId?: string;
    notifiedUsers: string[];
  };
}

// ============================================================================
// LOG & STATS
// ============================================================================

export interface ActionLogFilters {
  appSource?: string;
  category?: AutonomyCategory;
  decision?: ActionDecision;
  reviewedByPM?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface AutonomyStats {
  totalActions: number;
  autoApproved: number;
  autoRejected: number;
  autoExecuted: number;
  escalated: number;
  revertedCount: number;
  reviewedCount: number;
  estimatedHoursSaved: number; // Each auto-action saves ~15 min of PM time
  topCategories: Array<{ category: string; count: number }>;
}

export interface RevertResult {
  success: boolean;
  message: string;
  revertedActionId: string;
}
