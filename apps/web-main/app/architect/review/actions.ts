'use server'

/**
 * The architect queue's actions (OS Architecture) — the shared professional-review actions,
 * which read the discipline off the caller's profile. See
 * `lib/professional-review-actions.ts`.
 */
export {
  createProfessionalProfile,
  verifyProfessionalProfile,
  claimReview,
  recordScopedDecision,
  completeReview,
} from '@/lib/professional-review-actions'
