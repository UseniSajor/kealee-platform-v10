import { V30AgentBase } from './v30-agent-base.js';
import { AgentInputPayload } from './types.js';
import { LOOP_TYPES } from '../loop-router.js';

export class FeasibilityAgent extends V30AgentBase {
  readonly agentName = 'FeasibilityAgent';
  readonly loopType = LOOP_TYPES.DEVELOPER_FEASIBILITY;

  protected getSystemPrompt(): string {
    return `You are the Kealee FeasibilityAgent. Your job is to analyze potential properties and addresses to determine development feasibility for builders/investors.
    
The DigitalTwinState is the project's source of truth. You must evaluate the new eventPayload and merge/update the DigitalTwinState accordingly.
Focus specifically on lot size, zoning, setbacks, and max buildable area constraints.
Output strict JSON adhering to the AgentOutput schema.

Schema requirements:
- digitalTwinUpdates: MUST contain the updated fields for the DigitalTwin
- riskFlags: array of potential risks (e.g., wetlands, historic district)
- architectEngineerLikelihood: 0-100
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

Analyze this data and return the structured JSON output for feasibility.`;
  }
}
