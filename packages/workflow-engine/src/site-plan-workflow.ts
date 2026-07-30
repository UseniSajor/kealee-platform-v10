export const SITE_PLAN_STAGES = [
  'PARCEL_RESOLUTION', 'DOCUMENT_COLLECTION', 'FEASIBILITY', 'PLAN_GENERATION',
  'COMPLIANCE_AUDIT', 'PROFESSIONAL_REVIEW', 'SUBMITTED_TO_JURISDICTION', 'SUBMISSION_CORRECTIONS',
] as const;
export type SitePlanStage = typeof SITE_PLAN_STAGES[number];
export type SitePlanStageState = 'NOT_STARTED' | 'READY' | 'IN_PROGRESS' | 'BLOCKED'
  | 'AWAITING_REVIEW' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
export interface SitePlanStageSnapshot {
  stage: SitePlanStage;
  state: SitePlanStageState;
  prerequisites: string[];
  blockers: string[];
  outputRefs: string[];
  assignedPartyId?: string;
  attempt: number;
}
export interface SitePlanWorkflowSnapshot {
  id: string;
  stages: SitePlanStageSnapshot[];
  version: number;
  appliedEventIds: string[];
  professionalApprovalId?: string;
  sealedDocumentId?: string;
  releasedAt?: string;
}
export type SitePlanWorkflowEvent =
  | { id: string; type: 'START_STAGE'; stage: SitePlanStage; assignedPartyId?: string }
  | { id: string; type: 'BLOCK_STAGE'; stage: SitePlanStage; blockers: string[] }
  | { id: string; type: 'SUBMIT_STAGE_REVIEW'; stage: SitePlanStage; outputRefs: string[] }
  | { id: string; type: 'APPROVE_STAGE'; stage: SitePlanStage; approvalId?: string; sealedDocumentId?: string }
  | { id: string; type: 'REJECT_STAGE'; stage: SitePlanStage; blockers: string[] }
  | { id: string; type: 'COMPLETE_STAGE'; stage: SitePlanStage; outputRefs: string[] }
  | { id: string; type: 'RELEASE'; stage: 'SUBMITTED_TO_JURISDICTION' };

export class SitePlanTransitionError extends Error {
  constructor(message: string) { super(message); this.name = 'SitePlanTransitionError'; }
}
export function createSitePlanWorkflow(id: string): SitePlanWorkflowSnapshot {
  return {
    id, version: 0, appliedEventIds: [],
    stages: SITE_PLAN_STAGES.map((stage, index) => ({
      stage, state: index === 0 ? 'READY' : 'NOT_STARTED', prerequisites: index ? [SITE_PLAN_STAGES[index - 1]] : [],
      blockers: [], outputRefs: [], attempt: 1,
    })),
  };
}
function priorComplete(snapshot: SitePlanWorkflowSnapshot, stage: SitePlanStage): boolean {
  const index = SITE_PLAN_STAGES.indexOf(stage);
  return index === 0 || ['COMPLETED', 'APPROVED'].includes(snapshot.stages[index - 1].state);
}
export function applySitePlanEvent(snapshot: SitePlanWorkflowSnapshot, event: SitePlanWorkflowEvent): SitePlanWorkflowSnapshot {
  if (snapshot.appliedEventIds.includes(event.id)) return snapshot;
  // A second RELEASE is a no-op, not an error — but release itself does NOT freeze the whole
  // workflow: SUBMISSION_CORRECTIONS legitimately happens after submission, via the
  // correction-cycle machinery (assignCorrection/ingestAgencyComments/etc.).
  if (event.type === 'RELEASE' && snapshot.releasedAt) return snapshot;
  const index = SITE_PLAN_STAGES.indexOf(event.stage);
  const current = snapshot.stages[index];
  if (!current) throw new SitePlanTransitionError('Unknown stage');
  const stages = snapshot.stages.map((item) => ({ ...item, blockers: [...item.blockers], outputRefs: [...item.outputRefs] }));
  const target = stages[index];
  let professionalApprovalId = snapshot.professionalApprovalId;
  let sealedDocumentId = snapshot.sealedDocumentId;
  let releasedAt = snapshot.releasedAt;
  switch (event.type) {
    case 'START_STAGE':
      if (!priorComplete(snapshot, event.stage)) throw new SitePlanTransitionError('Prior stage is incomplete');
      if (!['READY', 'BLOCKED', 'REJECTED'].includes(target.state)) throw new SitePlanTransitionError('Stage cannot be started');
      target.state = 'IN_PROGRESS'; target.blockers = []; target.assignedPartyId = event.assignedPartyId; break;
    case 'BLOCK_STAGE':
      if (!event.blockers.length) throw new SitePlanTransitionError('Blocking requires at least one reason');
      target.state = 'BLOCKED'; target.blockers = event.blockers; break;
    case 'SUBMIT_STAGE_REVIEW':
      if (target.state !== 'IN_PROGRESS') throw new SitePlanTransitionError('Only an active stage can enter review');
      target.state = 'AWAITING_REVIEW'; target.outputRefs = event.outputRefs; break;
    case 'APPROVE_STAGE':
      if (target.state !== 'AWAITING_REVIEW') throw new SitePlanTransitionError('Stage is not awaiting review');
      if (event.stage === 'PROFESSIONAL_REVIEW' && (!event.approvalId || !event.sealedDocumentId)) {
        throw new SitePlanTransitionError('Professional approval and sealed document are required');
      }
      target.state = 'APPROVED'; professionalApprovalId = event.approvalId ?? professionalApprovalId;
      sealedDocumentId = event.sealedDocumentId ?? sealedDocumentId; break;
    case 'REJECT_STAGE':
      if (target.state !== 'AWAITING_REVIEW') throw new SitePlanTransitionError('Stage is not awaiting review');
      target.state = 'REJECTED'; target.blockers = event.blockers; target.attempt += 1; break;
    case 'COMPLETE_STAGE':
      if (target.state !== 'IN_PROGRESS') throw new SitePlanTransitionError('Only an active stage can complete');
      target.state = 'COMPLETED'; target.outputRefs = event.outputRefs; break;
    case 'RELEASE':
      // The seal is the ONLY hard gate here, and it gates exactly this transition — every
      // earlier stage (geometry, compliance screening, draft generation) runs regardless of
      // whether a professional review/seal exists yet.
      if (!priorComplete(snapshot, event.stage)) throw new SitePlanTransitionError('Professional review must be approved before submission to the jurisdiction');
      if (!professionalApprovalId || !sealedDocumentId) throw new SitePlanTransitionError('Regulated release requires professional approval and sealed document');
      if (stages.some((stage) => stage.blockers.length)) throw new SitePlanTransitionError('Blocking issues remain');
      target.state = 'COMPLETED';
      releasedAt = new Date().toISOString(); break;
  }
  const next = index + 1;
  if (['COMPLETED', 'APPROVED'].includes(target.state) && stages[next]?.state === 'NOT_STARTED') stages[next].state = 'READY';
  return { ...snapshot, stages, professionalApprovalId, sealedDocumentId, releasedAt,
    appliedEventIds: [...snapshot.appliedEventIds, event.id], version: snapshot.version + 1 };
}
