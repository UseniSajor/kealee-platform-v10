/**
 * GHL Opportunity / Pipeline Service
 *
 * Create and manage deals in GoHighLevel pipelines.
 */

import { ghlGet, ghlPost, ghlPut, GHL_LOCATION_ID } from './ghl-client';

// ---------------------------------------------------------------------------
// Kealee Pipeline Stage mapping
// ---------------------------------------------------------------------------

/**
 * Default Kealee construction pipeline stages.
 * The GHL stage IDs are set at runtime via setup script; these keys are used
 * for lookup against the pipeline configuration stored in GHL.
 */
export const PIPELINE_STAGES = {
  NEW_LEAD: 'New Lead',
  QUALIFIED: 'Qualified',
  QUOTE_REQUESTED: 'Quote Requested',
  QUOTE_SENT: 'Quote Sent',
  CONSULTATION_BOOKED: 'Consultation Booked',
  PROPOSAL_SENT: 'Proposal Sent',
  CONTRACT_SIGNED: 'Contract Signed',
  PERMITTING: 'Permitting',
  PROJECT_ACTIVE: 'Project Active',
  PUNCH_LIST: 'Punch List',
  PROJECT_COMPLETE: 'Project Complete',
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GhlOpportunity {
  id: string;
  name: string;
  pipelineId: string;
  pipelineStageId: string;
  status: string;
  contactId: string;
  monetaryValue?: number;
  source?: string;
  customFields?: Array<{ id: string; value: string }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOpportunityInput {
  pipelineId: string;
  pipelineStageId: string;
  contactId: string;
  name: string;
  monetaryValue?: number;
  source?: string;
  customFields?: Array<{ id: string; field_value: string }>;
}

export interface UpdateOpportunityInput {
  pipelineStageId?: string;
  name?: string;
  monetaryValue?: number;
  status?: 'open' | 'won' | 'lost' | 'abandoned';
  customFields?: Array<{ id: string; field_value: string }>;
}

// ---------------------------------------------------------------------------
// Service methods
// ---------------------------------------------------------------------------

/**
 * Create a new opportunity (deal) in a GHL pipeline.
 */
export async function createOpportunity(input: CreateOpportunityInput): Promise<GhlOpportunity> {
  const result = await ghlPost<{ opportunity: GhlOpportunity }>('/opportunities/', {
    locationId: GHL_LOCATION_ID,
    ...input,
  });
  return result.opportunity;
}

/**
 * Update an existing opportunity.
 */
export async function updateOpportunity(
  opportunityId: string,
  input: UpdateOpportunityInput,
): Promise<GhlOpportunity> {
  const result = await ghlPut<{ opportunity: GhlOpportunity }>(`/opportunities/${opportunityId}`, { ...input } as Record<string, unknown>);
  return result.opportunity;
}

/**
 * Move an opportunity to a new pipeline stage.
 */
export async function updateOpportunityStage(opportunityId: string, stageId: string): Promise<GhlOpportunity> {
  return updateOpportunity(opportunityId, { pipelineStageId: stageId });
}

/**
 * Retrieve a single opportunity by ID.
 */
export async function getOpportunity(opportunityId: string): Promise<GhlOpportunity> {
  const result = await ghlGet<{ opportunity: GhlOpportunity }>(`/opportunities/${opportunityId}`);
  return result.opportunity;
}

/**
 * Search for opportunities by contact ID.
 */
export async function findOpportunitiesByContact(contactId: string): Promise<GhlOpportunity[]> {
  const result = await ghlGet<{ opportunities: GhlOpportunity[] }>('/opportunities/search', {
    location_id: GHL_LOCATION_ID,
    contact_id: contactId,
  });
  return result.opportunities ?? [];
}
