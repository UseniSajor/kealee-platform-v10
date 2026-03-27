/**
 * @kealee/core — Integration Adapters
 *
 * Typed workflow orchestration adapters for use in worker processors,
 * bot handlers, and API modules.
 */

export type {
  AdapterResult,
  CaptureAnalysisParams,
  PreDesignParams,
  EstimateParams,
  PermitPrepParams,
  ContractorMatchParams,
  PmAutomationParams,
  PaymentRecommendationParams,
  ChangeOrderParams,
} from "./workflow-adapters";

export {
  orchestrateCaptureAnalysis,
  orchestratePreDesign,
  orchestrateEstimate,
  orchestratePermitPrep,
  orchestrateContractorMatch,
  orchestratePmAutomation,
  orchestratePaymentRecommendation,
  orchestrateChangeOrder,
} from "./workflow-adapters";
