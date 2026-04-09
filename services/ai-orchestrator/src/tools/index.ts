/**
 * tools/index.ts
 *
 * Tool registries per subgraph.
 * Each subgraph gets only the tools it needs — not the full set.
 */

export { lookupJurisdictionTool } from "./jurisdiction";
export { lookupZoningTool } from "./zoning";
export { lookupParcelTool } from "./parcel";
export { estimateBuildCostTool } from "./estimate-build-cost";
export { generateConceptTool } from "./concept";
export { createCheckoutSessionTool } from "./checkout";
export { createProjectRecordTool, updateProjectRecordTool } from "./project-record";
export { createPermitCaseTool } from "./permit-case";
export { rankContractorsTool, assignLeadTool } from "./contractor-ranking";
export { sendEmailNotificationTool, sendSmsNotificationTool } from "./notifications";
export { createStripePriceTool, retrieveStripeProductTool } from "./stripe";

// ─── Subgraph-scoped tool sets ────────────────────────────────────────────────

import { lookupJurisdictionTool } from "./jurisdiction";
import { lookupZoningTool } from "./zoning";
import { lookupParcelTool } from "./parcel";
import { estimateBuildCostTool } from "./estimate-build-cost";
import { generateConceptTool } from "./concept";
import { createCheckoutSessionTool } from "./checkout";
import { createProjectRecordTool, updateProjectRecordTool } from "./project-record";
import { createPermitCaseTool } from "./permit-case";
import { rankContractorsTool, assignLeadTool } from "./contractor-ranking";
import { sendEmailNotificationTool, sendSmsNotificationTool } from "./notifications";

export const LAND_TOOLS = [
  lookupJurisdictionTool,
  lookupZoningTool,
  lookupParcelTool,
  estimateBuildCostTool,
  createProjectRecordTool,
  createCheckoutSessionTool,
  sendEmailNotificationTool,
];

export const SALES_INTAKE_TOOLS = [
  lookupJurisdictionTool,
  createProjectRecordTool,
  createCheckoutSessionTool,
  sendEmailNotificationTool,
];

export const DELIVERY_TOOLS = [
  generateConceptTool,
  estimateBuildCostTool,
  createPermitCaseTool,
  lookupJurisdictionTool,
  updateProjectRecordTool,
  sendEmailNotificationTool,
  sendSmsNotificationTool,
];

export const MARKETPLACE_TOOLS = [
  rankContractorsTool,
  assignLeadTool,
  sendEmailNotificationTool,
  sendSmsNotificationTool,
];

export const SUPPORT_TOOLS = [
  lookupJurisdictionTool,
  sendEmailNotificationTool,
];
