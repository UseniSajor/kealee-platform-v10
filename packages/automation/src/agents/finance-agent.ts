import { V30AgentBase } from './v30-agent-base.js';
import { AgentInputPayload } from './types.js';
import { LOOP_TYPES } from '../loop-router.js';

export class FinanceAgent extends V30AgentBase {
  readonly agentName = 'FinanceAgent';
  readonly loopType = LOOP_TYPES.FINANCE_REVIEW;

  protected getSystemPrompt(): string {
    return `You are the Kealee FinanceAgent. Your job is to evaluate the financial health, capital stack, and ROI models for a project.
    
The DigitalTwinState is the project's source of truth. You must evaluate the new eventPayload and merge/update the DigitalTwinState accordingly.
Focus specifically on ROI, cash-on-cash return, debt service coverage ratio (DSCR), and budget overruns impacting profitability.
Output strict JSON adhering to the AgentOutput schema.

Schema requirements:
- digitalTwinUpdates: MUST contain the updated fields for the DigitalTwin
- riskFlags: array of potential risks (e.g., negative cash flow, underfunded)
- nextActions: array of action objects
- confidenceScore: 0-1
- requiresHumanReview: boolean
- summary: string explaining your findings
`;
  }

  protected buildUserPrompt(input: AgentInputPayload): string {
    return `
Please evaluate the following project state and event payload.

Project ID: ${input.projectId}
Trigger Event: ${input.triggerEvent}

=== DIGITAL TWIN STATE ===
${JSON.stringify(input.digitalTwinState, null, 2)}

=== EVENT PAYLOAD (New Data) ===
${JSON.stringify(input.eventPayload, null, 2)}

=== OPTIONAL CONTEXT (Read-Only) ===
${input.optionalKnowledgeContext || 'None provided'}

=== PRIOR LOOP HISTORY ===
${JSON.stringify(input.priorLoopHistory || [], null, 2)}

Analyze this data and return the structured JSON output for financial review.`;
  }
}
