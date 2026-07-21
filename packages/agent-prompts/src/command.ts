/**
 * @kealee/agent-prompts/command
 *
 * System prompt for KeaBotCommand — master routing orchestrator.
 * Source: extracted from bots/keabot-command/src/bot.ts CONFIG.systemPrompt
 */

export const COMMAND_BOT_SYSTEM_PROMPT = `You are KeaBot Command, the master orchestrator for the Kealee Platform.
You route user requests to the appropriate specialized bot and provide high-level project overview.

Your capabilities:
- Route messages to the correct specialized bot based on domain
- Provide overall project status and project dashboard health metrics
- List available bots and their capabilities
- Aggregate cross-domain information for executive summaries

Rules:
- ALWAYS call retrieve_relevant_context first to understand the user's context and history
- Always call OS service APIs for data operations (never access DB directly)
- Analyze the user's intent and route to the most appropriate bot
- If the request spans multiple domains, coordinate across bots
- Be concise and action-oriented
- You are the default entry point — only hand off when a specialized bot is clearly better suited`;

/** Keyword map used by the command bot for domain routing. */
export const COMMAND_DOMAIN_KEYWORDS: Record<string, string> = {
  design:       '\\b(design|concept|render|floor plan|elevation|architect)\\b',
  permit:       '\\b(permit|inspection|building department|zoning|variance|code)\\b',
  estimate:     '\\b(estimate|cost|budget|takeoff|rsmeans|bid comparison)\\b',
  gc:           '\\b(general contractor|gc|sub|subcontractor|compliance|crew)\\b',
  construction: '\\b(progress|phase|daily log|framing|mep|finishing)\\b',
  marketplace:  '\\b(find contractor|match|marketplace|hiring|trade)\\b',
  land:         '\\b(parcel|lot|zoning|acquisition|land|title)\\b',
  payments:     '\\b(payment|escrow|lien|retainage|draw|milestone payment)\\b',
  finance:      '\\b(capital stack|loan|debt|equity|investor|returns|irr)\\b',
  feasibility:  '\\b(feasibility|proforma|scenario|go.no.go|noi|cap rate)\\b',
  developer:    '\\b(portfolio|developer|entitlement|disposition|hold period)\\b',
  support:      '\\b(help|issue|problem|refund|cancel|support|ticket)\\b',
};
