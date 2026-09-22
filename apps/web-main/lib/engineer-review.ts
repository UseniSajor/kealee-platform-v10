/**
 * The engineer's view of professional review — kept as the names the existing
 * routes import. Everything lives in `professional-review.ts`, which the
 * architect queue shares.
 */
export {
  reviewDb,
  assertCurrentLicence,
  displayProject,
} from './professional-review'
import { getProfessionalIdentity, requireAssignedReview as requireAssigned } from './professional-review'

export async function getEngineerIdentity() {
  return getProfessionalIdentity()
}

export async function requireAssignedReview(workflowId: string) {
  return requireAssigned(workflowId, 'professional_engineer')
}
