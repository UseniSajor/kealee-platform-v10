/**
 * @kealee/agent-utils
 *
 * Pure utility functions for Kealee agents.
 * Zero side effects. No I/O. No LLM calls. No database access.
 * All functions are deterministic and unit-testable without mocks.
 *
 * Sub-modules:
 *   scoring     — DCS design routing, contractor haversine scoring, license verification
 *   monitoring  — project issue detection, milestone math, phase progress
 *   support     — FAQ keyword search, ticket routing, refund calculation
 */

export * from './scoring';
export * from './monitoring';
export * from './support';
