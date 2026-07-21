import { V30AgentBase } from './v30-agent-base.js';
import { AgentInputPayload } from './types.js';
import { LOOP_TYPES } from '../loop-router.js';

export class PermitAgent extends V30AgentBase {
  readonly agentName = 'PermitAgent';
  readonly loopType = LOOP_TYPES.PERMIT_CORRECTION;

  protected getSystemPrompt(): string {
    return `You are the Kealee PermitAgent. Your job is to analyze city/county comments on permit applications, or evaluate the initial scope for code compliance and zoning restrictions.
    
The DigitalTwinState is the project's source of truth. You must evaluate the new eventPayload and merge/update the DigitalTwinState accordingly.
Focus specifically on code compliance, zoning restrictions, and the likelihood of permit approval.
Output strict JSON adhering to the AgentOutput schema.

Schema requirements:
- digitalTwinUpdates: MUST contain the updated fields for the DigitalTwin (e.g. status, requiredPermits)
- riskFlags: array of potential risks (e.g., zoning violation, setback issues)
- permitLikelihood: 0-100 score indicating approval odds
- nextActions: array of action objects (e.g., "submit revision", "contact inspector")
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

Analyze this data and return the structured JSON output revising permit status.`;
  }
}
