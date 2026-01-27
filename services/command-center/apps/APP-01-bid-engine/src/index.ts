/**
 * APP-01: CONTRACTOR BID ENGINE
 * Main entry point and exports
 *
 * Automation Level: 85%
 *
 * Features:
 * - Automated contractor matching based on trades, location, ratings, credentials
 * - Bid request creation and distribution
 * - Automated bid invitation with personalized matching scores
 * - AI-powered bid analysis and comparison
 * - Contractor credential verification
 * - Award notification workflows
 */

// Export types
export * from './types.js';

// Export services
export { ContractorMatcher } from './services/contractor-matcher.js';
export { BidAnalyzer } from './services/bid-analyzer.js';

// Export worker
export { bidEngineWorker } from './worker.js';

// Export routes
export { bidEngineRoutes } from './routes.js';
