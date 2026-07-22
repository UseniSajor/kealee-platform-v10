export type SupportConfidence = 'HIGH' | 'MEDIUM' | 'LOW';
export type SupportState = 'OPEN' | 'AUTHENTICATING' | 'INVESTIGATING' | 'WAITING_CUSTOMER'
  | 'WAITING_STAFF' | 'ESCALATED' | 'RESOLVED' | 'CLOSED';
export type EscalationTopic = 'ANGER_OR_DISTRESS' | 'REFUND_DISPUTE' | 'THREAT' | 'LEGAL_CLAIM'
  | 'SAFETY' | 'DISCRIMINATION' | 'PAYMENT_FRAUD' | 'PERMIT_ENFORCEMENT' | 'STOP_WORK_ORDER'
  | 'REPEATED_UNRESOLVED' | 'REGULATED_JUDGMENT';
export interface AuthoritativeFact<T = unknown> {
  key: string; value: T; sourceType: string; sourceId: string; verifiedAt: string;
}
export interface SupportDecision {
  action: 'ANSWER' | 'QUALIFIED_ANSWER_AND_VERIFY' | 'ESCALATE';
  answerableFacts: AuthoritativeFact[];
  createVerificationTask: boolean;
  escalationTopic?: EscalationTopic;
}

export function decideSupportAction(input: {
  confidence: SupportConfidence;
  facts: AuthoritativeFact[];
  escalationTopic?: EscalationTopic;
}): SupportDecision {
  if (input.escalationTopic || input.confidence === 'LOW') {
    return { action: 'ESCALATE', answerableFacts: input.facts, createVerificationTask: true,
      escalationTopic: input.escalationTopic ?? 'REGULATED_JUDGMENT' };
  }
  if (!input.facts.length) {
    return { action: 'QUALIFIED_ANSWER_AND_VERIFY', answerableFacts: [], createVerificationTask: true };
  }
  return input.confidence === 'HIGH'
    ? { action: 'ANSWER', answerableFacts: input.facts, createVerificationTask: false }
    : { action: 'QUALIFIED_ANSWER_AND_VERIFY', answerableFacts: input.facts, createVerificationTask: true };
}

export interface SupportCaseSnapshot {
  id: string; state: SupportState; authenticated: boolean; resolutionCriteria?: string;
  appliedEventIds: string[]; version: number;
}
export type SupportEvent =
  | { id: string; type: 'START_AUTHENTICATION' }
  | { id: string; type: 'AUTHENTICATED' }
  | { id: string; type: 'WAIT_CUSTOMER' }
  | { id: string; type: 'WAIT_STAFF' }
  | { id: string; type: 'ESCALATE' }
  | { id: string; type: 'RESOLVE'; resolutionCriteria: string }
  | { id: string; type: 'CLOSE' };
export function createSupportCase(id: string): SupportCaseSnapshot {
  return { id, state: 'OPEN', authenticated: false, appliedEventIds: [], version: 0 };
}
export function applySupportEvent(snapshot: SupportCaseSnapshot, event: SupportEvent): SupportCaseSnapshot {
  if (snapshot.appliedEventIds.includes(event.id)) return snapshot;
  if (snapshot.state === 'CLOSED') throw new Error('Closed support case is immutable');
  let state = snapshot.state; let authenticated = snapshot.authenticated;
  let resolutionCriteria = snapshot.resolutionCriteria;
  switch (event.type) {
    case 'START_AUTHENTICATION': state = 'AUTHENTICATING'; break;
    case 'AUTHENTICATED':
      if (state !== 'AUTHENTICATING') throw new Error('Case is not authenticating');
      authenticated = true; state = 'INVESTIGATING'; break;
    case 'WAIT_CUSTOMER': state = 'WAITING_CUSTOMER'; break;
    case 'WAIT_STAFF': state = 'WAITING_STAFF'; break;
    case 'ESCALATE': state = 'ESCALATED'; break;
    case 'RESOLVE':
      if (!event.resolutionCriteria.trim()) throw new Error('Resolution criteria are required');
      resolutionCriteria = event.resolutionCriteria; state = 'RESOLVED'; break;
    case 'CLOSE':
      if (state !== 'RESOLVED' || !resolutionCriteria) throw new Error('Case must meet resolution criteria before closure');
      state = 'CLOSED'; break;
  }
  return { ...snapshot, state, authenticated, resolutionCriteria,
    appliedEventIds: [...snapshot.appliedEventIds, event.id], version: snapshot.version + 1 };
}
