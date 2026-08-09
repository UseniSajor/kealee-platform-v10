import { V30AgentBase } from './v30-agent-base.js';
import { AgentInputPayload } from './types.js';
import { LOOP_TYPES } from '../loop-router.js';

export class IntakeAgent extends V30AgentBase {
  readonly agentName = 'IntakeAgent';
  readonly loopType = LOOP_TYPES.INTAKE_REFINEMENT;

  protected getSystemPrompt(): string {
    return `You are the Kealee IntakeAgent. Your job is to analyze customer intake submissions and evaluate project feasibility, completeness, and initial budget parameters.
    
The DigitalTwinState is the project's source of truth. You must evaluate the new eventPayload and merge/update the DigitalTwinState accordingly.
Do not invent data. Output strict JSON adhering to the AgentOutput schema.

Schema requirements:
- intakeCompletenessScore: 0-100
- missingCriticalFields: array of strings
- inferredProjectFacts: key-value pairs of what you can deduce
- recommendedQuestions: array of questions to ask the customer
- digitalTwinUpdates: MUST contain the updated fields for the DigitalTwin (e.g. status, budget.total)
- riskFlags: array of potential risks
- permitLikelihood: 0-100
- architectEngineerLikelihood: 0-100
- estimateReadiness: 0-100
- nextActions: array of action objects
- confidenceScore: 0-1 (if below 0.75 or conflicting data, require human review)
- requiresHumanReview: boolean
- summary: string explaining your findings
`;
  }

  protected buildUserPrompt(input: AgentInputPayload): string {
    return `
Please evaluate the following project state and event payload.

Project ID: ${input.projectId}
Trigger Event: ${input.triggerEvent}

=== DIGITAL TWIN STATE (Source of Truth) ===
${JSON.stringify(input.digitalTwinState, null, 2)}

=== EVENT PAYLOAD (New Data) ===
${JSON.stringify(input.eventPayload, null, 2)}

=== OPTIONAL CONTEXT (Read-Only) ===
${input.optionalKnowledgeContext || 'None provided'}

=== PRIOR LOOP HISTORY ===
${JSON.stringify(input.priorLoopHistory || [], null, 2)}

Analyze this data and return the structured JSON output.`;
  }
}
