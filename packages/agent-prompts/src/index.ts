/**
 * @kealee/agent-prompts
 *
 * Single source of truth for all Kealee agent system prompts.
 * Import from this package instead of hardcoding prompts in bot implementations.
 *
 * Naming convention:
 *   {BOT_NAME}_BOT_SYSTEM_PROMPT  — primary system prompt
 *   {BOT_NAME}_BOT_HANDOFF_PATTERNS — regex patterns for domain routing (where applicable)
 *   build*Prompt(ctx)              — context-aware prompt builders
 */

// Design
export {
  DESIGN_BOT_SYSTEM_PROMPT,
  buildConceptPrompt,
  buildArchitectReviewPrompt,
  buildFullDesignPrompt,
} from './design';
export type { ProjectDesignContext } from './design';

// Marketing
export {
  MARKETING_BOT_SYSTEM_PROMPT,
  buildDay1SetupPrompt,
  buildDay2EmailPrompt,
  buildDay3LeadScoringPrompt,
} from './marketing';
export type { Day1SetupParams, Day2EmailParams, Day3LeadScoringParams, NotificationTemplate, LeadScoringRules } from './marketing';

// Owner
export { OWNER_BOT_SYSTEM_PROMPT, OWNER_BOT_HANDOFF_PATTERNS } from './owner';

// GC
export { GC_BOT_SYSTEM_PROMPT, GC_BOT_HANDOFF_PATTERNS } from './gc';

// Finance
export { FINANCE_BOT_SYSTEM_PROMPT } from './finance';

// Developer
export { DEVELOPER_BOT_SYSTEM_PROMPT } from './developer';

// Construction
export { CONSTRUCTION_BOT_SYSTEM_PROMPT } from './construction';

// Land
export { LAND_BOT_SYSTEM_PROMPT } from './land';

// Payments
export { PAYMENTS_BOT_SYSTEM_PROMPT } from './payments';

// Operations
export { OPERATIONS_BOT_SYSTEM_PROMPT } from './operations';

// Feasibility
export { FEASIBILITY_BOT_SYSTEM_PROMPT } from './feasibility';

// Command
export { COMMAND_BOT_SYSTEM_PROMPT, COMMAND_DOMAIN_KEYWORDS } from './command';

// Permit
export {
  PERMIT_BOT_SYSTEM_PROMPT,
  PERMIT_ROADMAP_SYSTEM_PROMPT,
  buildPermitRoadmapUserPrompt,
} from './permit';
export type { PermitRoadmapInput } from './permit';

// Support
export { SUPPORT_BOT_SYSTEM_PROMPT } from './support';

// Estimate
export { ESTIMATE_BOT_SYSTEM_PROMPT } from './estimate';
