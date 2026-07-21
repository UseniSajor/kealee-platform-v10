/**
 * services/keabots/types.ts
 * Core types for the KeaBot orchestration system
 */

export type BotStage =
  | 'intake'
  | 'design'
  | 'permit'
  | 'estimate'
  | 'contractor'
  | 'feasibility'
  | 'payments'
  | 'execution'
  | 'monitoring'
  | 'support'
  | 'marketing';

export type BotStatus = 'idle' | 'running' | 'completed' | 'failed' | 'timeout';

export interface BotRequest {
  projectId: string;
  stage: BotStage;
  data: Record<string, unknown>;
  userId?: string;
  timeout?: number; // ms, default 30000
}

export interface BotResponse {
  success: boolean;
  stage: BotStage;
  botName: string;
  data: Record<string, unknown>;
  nextStage?: BotStage;
  errors?: string[];
  latencyMs: number;
  cost?: number;
}

export interface BotRunLog {
  id: string;
  botName: string;
  stage: BotStage;
  projectId: string;
  status: BotStatus;
  latencyMs: number;
  cost?: number;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  createdAt: Date;
}

export interface BotHealthStatus {
  botName: string;
  status: 'ok' | 'degraded' | 'offline';
  lastCheck: Date;
  avgLatencyMs?: number;
  errorRate?: number;
}

export interface OrchestratorHealthReport {
  status: 'ok' | 'degraded' | 'critical';
  bots: Record<string, BotHealthStatus>;
  database: 'ok' | 'error';
  redis: 'ok' | 'error';
  anthropicApi: 'ok' | 'error';
  checkedAt: Date;
}

// Stage flow definition
export const STAGE_FLOW: Record<BotStage, BotStage | null> = {
  intake: 'design',
  design: 'permit',
  permit: 'estimate',
  estimate: 'contractor',
  contractor: 'feasibility',
  feasibility: 'payments',
  payments: 'execution',
  execution: 'monitoring',
  monitoring: 'support',
  support: null,
  marketing: null,
};

export const STAGE_TO_BOT: Record<BotStage, string> = {
  intake: 'keabot-owner',
  design: 'keabot-design',
  permit: 'keabot-permit',
  estimate: 'keabot-estimate',
  contractor: 'keabot-contractor-match',
  feasibility: 'keabot-feasibility',
  payments: 'keabot-payments',
  execution: 'keabot-construction',
  monitoring: 'keabot-project-monitor',
  support: 'keabot-support',
  marketing: 'keabot-marketing',
};
