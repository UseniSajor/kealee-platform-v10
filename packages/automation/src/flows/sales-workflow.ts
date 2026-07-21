export const SALES_RESPONSIBILITIES = [
  'IDENTIFY_CALLER_AND_PROPERTY', 'IDENTIFY_CUSTOMER_TYPE', 'CAPTURE_PROJECT_INFORMATION',
  'CLASSIFY_PRODUCT', 'ASK_SITE_AND_PERMIT_TRIGGERS', 'RUN_PROPERTY_AND_PERMIT_QUALIFICATION',
  'RECOMMEND_PRODUCT', 'COLLECT_PAYMENT_OR_SCHEDULE', 'REQUEST_AND_VALIDATE_DOCUMENTS',
  'FOLLOW_UP_UNTIL_COMPLETE',
] as const;

export type SalesResponsibility = typeof SALES_RESPONSIBILITIES[number];
export type SalesWorkflowState = 'NEW' | 'IDENTIFYING' | 'QUALIFYING' | 'PROPERTY_RESEARCH'
  | 'RECOMMENDING' | 'AWAITING_DOCUMENTS' | 'AWAITING_CHECKOUT' | 'AWAITING_CONSULTATION'
  | 'NURTURE' | 'CONVERTED' | 'HUMAN_TAKEOVER' | 'DISQUALIFIED' | 'OPTED_OUT' | 'CLOSED';

export interface SalesWorkflowSnapshot {
  id: string; state: SalesWorkflowState; completed: SalesResponsibility[];
  appliedEventIds: string[]; version: number;
}
export interface SalesWorkflowEvent {
  id: string;
  type: 'START' | 'RESPONSIBILITY_COMPLETED' | 'DOCUMENTS_REQUESTED' | 'CHECKOUT_SENT'
    | 'CONSULTATION_SENT' | 'NURTURE_STARTED' | 'CONVERTED' | 'HUMAN_TAKEOVER'
    | 'DISQUALIFIED' | 'OPTED_OUT' | 'CLOSED';
  responsibility?: SalesResponsibility;
}
export class SalesTransitionError extends Error {
  constructor(message: string) { super(message); this.name = 'SalesTransitionError'; }
}

const STOPPED = new Set<SalesWorkflowState>(['CONVERTED', 'HUMAN_TAKEOVER', 'DISQUALIFIED', 'OPTED_OUT', 'CLOSED']);
function requirePrior(snapshot: SalesWorkflowSnapshot, through: number): void {
  const missing = SALES_RESPONSIBILITIES.slice(0, through).filter((item) => !snapshot.completed.includes(item));
  if (missing.length) throw new SalesTransitionError(`Missing responsibilities: ${missing.join(', ')}`);
}

/** Pure idempotent reducer; persistence must compare-and-swap on version. */
export function applySalesWorkflowEvent(snapshot: SalesWorkflowSnapshot, event: SalesWorkflowEvent): SalesWorkflowSnapshot {
  if (snapshot.appliedEventIds.includes(event.id)) return snapshot;
  if (STOPPED.has(snapshot.state)) throw new SalesTransitionError(`Cannot apply ${event.type} while ${snapshot.state}`);
  let state = snapshot.state;
  let completed = snapshot.completed;
  switch (event.type) {
    case 'START':
      if (state !== 'NEW') throw new SalesTransitionError('START requires NEW state');
      state = 'IDENTIFYING'; break;
    case 'RESPONSIBILITY_COMPLETED': {
      if (!event.responsibility) throw new SalesTransitionError('Responsibility is required');
      const index = SALES_RESPONSIBILITIES.indexOf(event.responsibility);
      if (index < 0) throw new SalesTransitionError('Unknown responsibility');
      requirePrior(snapshot, index);
      completed = completed.includes(event.responsibility) ? completed : [...completed, event.responsibility];
      state = index <= 2 ? 'QUALIFYING' : index <= 5 ? 'PROPERTY_RESEARCH' : 'RECOMMENDING';
      break;
    }
    case 'DOCUMENTS_REQUESTED': requirePrior(snapshot, 7); state = 'AWAITING_DOCUMENTS'; break;
    case 'CHECKOUT_SENT': requirePrior(snapshot, 7); state = 'AWAITING_CHECKOUT'; break;
    case 'CONSULTATION_SENT': requirePrior(snapshot, 7); state = 'AWAITING_CONSULTATION'; break;
    case 'NURTURE_STARTED': requirePrior(snapshot, 6); state = 'NURTURE'; break;
    case 'CONVERTED': requirePrior(snapshot, 7); state = 'CONVERTED'; break;
    case 'HUMAN_TAKEOVER': state = 'HUMAN_TAKEOVER'; break;
    case 'DISQUALIFIED': state = 'DISQUALIFIED'; break;
    case 'OPTED_OUT': state = 'OPTED_OUT'; break;
    case 'CLOSED': state = 'CLOSED'; break;
  }
  return { ...snapshot, state, completed, appliedEventIds: [...snapshot.appliedEventIds, event.id], version: snapshot.version + 1 };
}

export function createSalesWorkflow(id: string): SalesWorkflowSnapshot {
  return { id, state: 'NEW', completed: [], appliedEventIds: [], version: 0 };
}
export function shouldStopAutomatedSales(state: SalesWorkflowState): boolean { return STOPPED.has(state); }
