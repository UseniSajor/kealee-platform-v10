/**
 * GHL Integration — barrel export
 */

export { ghlRoutes } from './ghl.routes';
export { ghlWebhookRoutes } from './ghl-webhook.routes';
export { isGhlConfigured, ghlRequest, ghlGet, ghlPost, ghlPut, ghlDelete } from './ghl-client';
export * as ghlContacts from './ghl-contacts';
export * as ghlOpportunities from './ghl-opportunities';
export { syncNewUser, syncCheckout, syncQuoteRequest, SERVICE_TAG_MAP } from './ghl-sync';
