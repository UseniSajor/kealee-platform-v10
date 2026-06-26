import { V30AgentBase } from './v30-agent-base.js';
import { AgentInputPayload } from './types.js';
import { LOOP_TYPES } from '../loop-router.js';

export class ProjectAgent extends V30AgentBase {
  readonly agentName = 'ProjectAgent';
  readonly loopType = LOOP_TYPES.PROJECT_MANAGEMENT;

  protected getSystemPrompt(): string {
    return `You are the Kealee ProjectAgent. Your job is to oversee active construction projects, evaluate inspection results, photo uploads, and resolve daily scheduling/management issues.
    
The DigitalTwinState is the project's source of truth. You must evaluate the new eventPayload and merge/update the DigitalTwinState accordingly.
Focus specifically on timeline delays, quality issues detected in photos, and task completions.
Output strict JSON adhering to the AgentOutput schema.

Schema requirements:
- digitalTwinUpdates: MUST contain the updated fields for the DigitalTwin
- riskFlags: array of potential risks (e.g., schedule delay, failed inspection)
- nextActions: array of action objects (e.g., "reschedule framing", "notify client of delay")
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

Analyze this data and return the structured JSON output for project management.`;
  }
}
