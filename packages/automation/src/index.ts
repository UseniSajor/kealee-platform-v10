/**
 * Public entry point for @kealee/automation.
 *
 * package.json has always declared `main: ./dist/index.js`, but no `src/index.ts`
 * existed, so `dist/index.js` was never emitted and every root import failed to
 * resolve — including `bots.chain.ts`, which is the Design → Estimate → Permit
 * bot chain in services/api.
 *
 * Exports the surface that is actually imported across the workspace. Add to it
 * deliberately; subpath imports remain available for everything else.
 */

export {
  getResponseCache,
  withCache,
  type BotType,
  type CacheMetrics,
} from './infrastructure/response-cache'

export {
  getCostTracker,
  type BotExecutionRecord,
  type CostStats,
} from './infrastructure/cost-tracker'
