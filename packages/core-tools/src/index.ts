export { ToolRegistry, toolRegistry } from "./registry";

// Tool exports
export { createProjectTool } from "./tools/projects/create-project.tool";
export { updateProjectContextTool } from "./tools/projects/update-project-context.tool";
export { checkZoningTool } from "./tools/zoning/check-zoning.tool";
export { runFeasibilityTool } from "./tools/feasibility/run-feasibility.tool";
export { generateConceptBriefTool } from "./tools/design/generate-concept-brief.tool";
export { createEstimateTool } from "./tools/estimate/create-estimate.tool";
export { createCheckoutTool } from "./tools/payments/create-checkout.tool";
export { requestHumanApprovalTool } from "./tools/approvals/request-human-approval.tool";

// Re-export result types
export type { ZoningResult } from "./tools/zoning/check-zoning.tool";
export type { FeasibilityResult } from "./tools/feasibility/run-feasibility.tool";
export type { ConceptBriefResult } from "./tools/design/generate-concept-brief.tool";
export type { EstimateResult } from "./tools/estimate/create-estimate.tool";
export type { CheckoutResult } from "./tools/payments/create-checkout.tool";

// Auto-register all tools on import
import { toolRegistry } from "./registry";
import { createProjectTool } from "./tools/projects/create-project.tool";
import { updateProjectContextTool } from "./tools/projects/update-project-context.tool";
import { checkZoningTool } from "./tools/zoning/check-zoning.tool";
import { runFeasibilityTool } from "./tools/feasibility/run-feasibility.tool";
import { generateConceptBriefTool } from "./tools/design/generate-concept-brief.tool";
import { createEstimateTool } from "./tools/estimate/create-estimate.tool";
import { createCheckoutTool } from "./tools/payments/create-checkout.tool";
import { requestHumanApprovalTool } from "./tools/approvals/request-human-approval.tool";

toolRegistry.register(createProjectTool);
toolRegistry.register(updateProjectContextTool);
toolRegistry.register(checkZoningTool);
toolRegistry.register(runFeasibilityTool);
toolRegistry.register(generateConceptBriefTool);
toolRegistry.register(createEstimateTool);
toolRegistry.register(createCheckoutTool);
toolRegistry.register(requestHumanApprovalTool);
