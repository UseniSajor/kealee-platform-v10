export type CorrectionDiscipline = 'SURVEY' | 'CIVIL' | 'ARCHITECTURE' | 'STRUCTURAL'
  | 'LANDSCAPE' | 'ENVIRONMENTAL' | 'PERMIT_COORDINATION';
export interface AgencyComment {
  id: string; text: string; discipline: CorrectionDiscipline; status: 'OPEN' | 'ASSIGNED' | 'RESOLVED';
  assignedToId?: string; response?: string; revisionRefs: string[];
}
export interface CorrectionCycleSnapshot {
  cycleNumber: number; agencyReference?: string; comments: AgencyComment[];
  status: 'OPEN' | 'AWAITING_REVISIONS' | 'AWAITING_REAPPROVAL' | 'READY_TO_RESUBMIT' | 'RESUBMITTED' | 'CLOSED';
  professionalReapprovalId?: string; resubmissionEvidence?: string; version: number;
}
function disciplineFor(text: string): CorrectionDiscipline {
  const value = text.toLowerCase();
  if (/boundary|bearing|distance|survey|plat/.test(value)) return 'SURVEY';
  if (/grading|drain|stormwater|sediment|utility|contour|driveway/.test(value)) return 'CIVIL';
  if (/tree|woodland|landscape/.test(value)) return 'LANDSCAPE';
  if (/wetland|stream|floodplain|buffer/.test(value)) return 'ENVIRONMENTAL';
  if (/foundation|beam|load|structural/.test(value)) return 'STRUCTURAL';
  if (/floor plan|elevation|egress|architect/.test(value)) return 'ARCHITECTURE';
  return 'PERMIT_COORDINATION';
}
export function ingestAgencyComments(text: string, cycleNumber: number, agencyReference?: string): CorrectionCycleSnapshot {
  const rows = text.split(/\r?\n/).map((row) => row.replace(/^\s*(?:\d+[.)]|[-*])\s*/, '').trim()).filter(Boolean);
  if (!rows.length) throw new Error('Agency comments are empty');
  return { cycleNumber, agencyReference, status: 'OPEN', version: 0,
    comments: rows.map((comment, index) => ({ id: `${cycleNumber}-${index + 1}`, text: comment,
      discipline: disciplineFor(comment), status: 'OPEN', revisionRefs: [] })) };
}
export function assignCorrection(snapshot: CorrectionCycleSnapshot, commentId: string, assignedToId: string): CorrectionCycleSnapshot {
  if (!assignedToId) throw new Error('Assignee is required');
  const comments = snapshot.comments.map((comment) => comment.id === commentId
    ? { ...comment, assignedToId, status: 'ASSIGNED' as const } : comment);
  if (!comments.some((comment) => comment.id === commentId)) throw new Error('Comment not found');
  return { ...snapshot, comments, status: 'AWAITING_REVISIONS', version: snapshot.version + 1 };
}
export function resolveCorrection(snapshot: CorrectionCycleSnapshot, commentId: string, response: string,
  revisionRefs: string[]): CorrectionCycleSnapshot {
  if (!response.trim() || !revisionRefs.length) throw new Error('Response and revision evidence are required');
  const comments = snapshot.comments.map((comment) => comment.id === commentId
    ? { ...comment, response, revisionRefs, status: 'RESOLVED' as const } : comment);
  if (!comments.some((comment) => comment.id === commentId)) throw new Error('Comment not found');
  const allResolved = comments.every((comment) => comment.status === 'RESOLVED');
  return { ...snapshot, comments, status: allResolved ? 'AWAITING_REAPPROVAL' : 'AWAITING_REVISIONS', version: snapshot.version + 1 };
}
export function recordCorrectionReapproval(snapshot: CorrectionCycleSnapshot, approvalId: string): CorrectionCycleSnapshot {
  if (snapshot.status !== 'AWAITING_REAPPROVAL' || snapshot.comments.some((comment) => comment.status !== 'RESOLVED')) {
    throw new Error('All comments must be resolved before professional reapproval');
  }
  if (!approvalId) throw new Error('Professional reapproval is required');
  return { ...snapshot, professionalReapprovalId: approvalId, status: 'READY_TO_RESUBMIT', version: snapshot.version + 1 };
}
export function recordCorrectionResubmission(snapshot: CorrectionCycleSnapshot, evidence: string): CorrectionCycleSnapshot {
  if (snapshot.status !== 'READY_TO_RESUBMIT' || !snapshot.professionalReapprovalId) throw new Error('Cycle is not approved for resubmission');
  if (!evidence) throw new Error('Resubmission evidence is required');
  return { ...snapshot, resubmissionEvidence: evidence, status: 'RESUBMITTED', version: snapshot.version + 1 };
}
export function generateCommentResponseLetter(snapshot: CorrectionCycleSnapshot): string {
  if (snapshot.comments.some((comment) => comment.status !== 'RESOLVED')) throw new Error('Cannot generate a final letter with unresolved comments');
  return [`Agency reference: ${snapshot.agencyReference ?? 'Not provided'}`, `Correction cycle: ${snapshot.cycleNumber}`, '',
    ...snapshot.comments.flatMap((comment, index) => [`Comment ${index + 1}: ${comment.text}`,
      `Response: ${comment.response}`, `Revisions: ${comment.revisionRefs.join(', ')}`, ''])].join('\n');
}
