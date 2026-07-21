/**
 * Autonomous Action Engine — Barrel Export
 */

export { AutonomousActionEngine, autonomyEngine } from './engine.js';
export { buildAutonomyConfig, getDefaultRules, MINUTES_SAVED_PER_ACTION } from './defaults.js';
export type {
  AutonomyCategory,
  AutonomyConfig,
  AutonomyRule,
  ActionContext,
  ActionResult,
  ActionDecision,
  ActionLogFilters,
  AutonomyStats,
  RevertResult,
} from './types.js';
