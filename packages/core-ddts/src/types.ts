/**
 * Core DDTS Types — Digital Development Twin System
 */

export type TwinTier = 'L1' | 'L2' | 'L3';

export type TwinStatus =
  | 'INTAKE'
  | 'LAND_ANALYSIS'
  | 'FEASIBILITY'
  | 'ENTITLEMENT'
  | 'PRE_CONSTRUCTION'
  | 'CONSTRUCTION'
  | 'CLOSEOUT'
  | 'OPERATIONS'
  | 'ARCHIVED';

export type TwinHealthStatus = 'HEALTHY' | 'AT_RISK' | 'CRITICAL' | 'UNKNOWN';

export interface TwinMetrics {
  budgetVariance: number | null;
  scheduleVariance: number | null;
  riskScore: number | null;
  qualityScore: number | null;
  safetyScore: number | null;
  completionPercent: number | null;
  openIssues: number;
  overdueTasks: number;
}

export interface TwinKPIDefinition {
  kpiKey: string;
  label: string;
  category: 'cost' | 'schedule' | 'quality' | 'risk' | 'safety';
  unit?: string;
  targetValue?: number;
  warningMin?: number;
  warningMax?: number;
  criticalMin?: number;
  criticalMax?: number;
}

export interface PhaseTransition {
  from: TwinStatus;
  to: TwinStatus;
  timestamp: string;
  reason?: string;
  triggeredBy?: string;
}

export interface CreateTwinInput {
  projectId: string;
  orgId: string;
  tier?: TwinTier;
  label?: string;
  enabledModules?: string[];
}

export interface UpdateTwinInput {
  tier?: TwinTier;
  label?: string;
  enabledModules?: string[];
  config?: Record<string, unknown>;
}

export interface TwinSnapshotInput {
  label?: string;
  trigger?: 'manual' | 'phase_change' | 'scheduled' | 'event';
}

export interface TwinEventInput {
  eventType: string;
  source: string;
  severity?: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  payload: Record<string, unknown>;
  description?: string;
  correlationId?: string;
  causedBy?: string;
  actorType?: 'USER' | 'SYSTEM' | 'AI' | 'BOT';
  actorId?: string;
}

export interface KPIUpdate {
  kpiKey: string;
  value: number;
}

/** Lifecycle phase order — defines valid transitions */
export const PHASE_ORDER: TwinStatus[] = [
  'INTAKE',
  'LAND_ANALYSIS',
  'FEASIBILITY',
  'ENTITLEMENT',
  'PRE_CONSTRUCTION',
  'CONSTRUCTION',
  'CLOSEOUT',
  'OPERATIONS',
  'ARCHIVED',
];

/** Default KPIs created for each tier */
export const DEFAULT_KPIS: Record<TwinTier, TwinKPIDefinition[]> = {
  L1: [
    { kpiKey: 'budget_variance', label: 'Budget Variance %', category: 'cost', unit: '%', targetValue: 0, warningMax: 5, criticalMax: 10 },
    { kpiKey: 'schedule_spi', label: 'Schedule Performance Index', category: 'schedule', unit: 'ratio', targetValue: 1, warningMin: 0.9, criticalMin: 0.8 },
    { kpiKey: 'completion_pct', label: 'Completion %', category: 'schedule', unit: '%' },
  ],
  L2: [
    { kpiKey: 'budget_variance', label: 'Budget Variance %', category: 'cost', unit: '%', targetValue: 0, warningMax: 5, criticalMax: 10 },
    { kpiKey: 'schedule_spi', label: 'Schedule Performance Index', category: 'schedule', unit: 'ratio', targetValue: 1, warningMin: 0.9, criticalMin: 0.8 },
    { kpiKey: 'completion_pct', label: 'Completion %', category: 'schedule', unit: '%' },
    { kpiKey: 'risk_score', label: 'Risk Score', category: 'risk', unit: 'score', targetValue: 0, warningMax: 40, criticalMax: 70 },
    { kpiKey: 'quality_score', label: 'Quality Score', category: 'quality', unit: 'score', targetValue: 100, warningMin: 80, criticalMin: 60 },
    { kpiKey: 'open_issues', label: 'Open Issues', category: 'quality', unit: 'count', warningMax: 10, criticalMax: 25 },
  ],
  L3: [
    { kpiKey: 'budget_variance', label: 'Budget Variance %', category: 'cost', unit: '%', targetValue: 0, warningMax: 5, criticalMax: 10 },
    { kpiKey: 'schedule_spi', label: 'Schedule Performance Index', category: 'schedule', unit: 'ratio', targetValue: 1, warningMin: 0.9, criticalMin: 0.8 },
    { kpiKey: 'completion_pct', label: 'Completion %', category: 'schedule', unit: '%' },
    { kpiKey: 'risk_score', label: 'Risk Score', category: 'risk', unit: 'score', targetValue: 0, warningMax: 40, criticalMax: 70 },
    { kpiKey: 'quality_score', label: 'Quality Score', category: 'quality', unit: 'score', targetValue: 100, warningMin: 80, criticalMin: 60 },
    { kpiKey: 'open_issues', label: 'Open Issues', category: 'quality', unit: 'count', warningMax: 10, criticalMax: 25 },
    { kpiKey: 'safety_score', label: 'Safety Score', category: 'safety', unit: 'score', targetValue: 100, warningMin: 85, criticalMin: 70 },
    { kpiKey: 'cost_performance_index', label: 'Cost Performance Index', category: 'cost', unit: 'ratio', targetValue: 1, warningMin: 0.9, criticalMin: 0.8 },
    { kpiKey: 'rfi_response_time', label: 'Avg RFI Response Time', category: 'quality', unit: 'days', warningMax: 5, criticalMax: 10 },
    { kpiKey: 'change_order_rate', label: 'Change Order Rate %', category: 'cost', unit: '%', warningMax: 5, criticalMax: 10 },
  ],
};
