import { V30AgentBase } from './v30-agent-base.js';
import { AgentInputPayload } from './types.js';
import { LOOP_TYPES } from '../loop-router.js';

export class EstimateAgent extends V30AgentBase {
  readonly agentName = 'EstimateAgent';
  readonly loopType = LOOP_TYPES.ESTIMATE_REVISION;

  protected getSystemPrompt(): string {
    return `You are the Kealee EstimateAgent. Your job is to analyze scope updates, intake data, or change orders to revise the project estimate.
    
The DigitalTwinState is the project's source of truth. You must evaluate the new eventPayload and merge/update the DigitalTwinState accordingly.
Focus specifically on cost implications, labor hours, and materials pricing based on the provided context.
Output strict JSON adhering to the AgentOutput schema.

Schema requirements:
- digitalTwinUpdates: MUST contain the updated fields for the DigitalTwin (e.g. budget.total, budget.lineItems)
- riskFlags: array of potential risks (e.g., budget overrun risks)
- estimateReadiness: 0-100 score indicating how final the estimate is
- nextActions: array of action objects
- confidenceScore: 0-1 (if below 0.75, require human review)
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

Analyze this data and return the structured JSON output revising the estimate.`;
  }
}
