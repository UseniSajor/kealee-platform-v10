/**
 * @kealee/core-integrations — KXL Integration Layer
 *
 * Unified adapter framework for external service integrations.
 * Replaces ad-hoc GHL/Stripe/Procore integrations with a standardized pattern.
 */

export { IntegrationAdapter } from './adapter';
export { AdapterRegistry } from './adapter-registry';
export type { AdapterConfig, AdapterHealthCheck } from './adapter';

// Concrete adapters
export { GHLAdapter } from './adapters/ghl-adapter';
export { StripeAdapter } from './adapters/stripe-adapter';
export { ProcoreAdapter } from './adapters/procore-adapter';
