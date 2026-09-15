/**
 * The J_SUBMISSION correction stage — `ingest_comments`.
 *
 * The County reviews the filed package and returns comments. A person enters
 * them against the order; this stage READS them, records the round with a
 * revision-response matrix to be filled in, and reopens the drawing chain
 * from composition so the corrected set renders, is re-QC'd, re-delivered and
 * re-reviewed.
 *
 * It does not enqueue the reopened chain. A deterministic chain re-run on
 * unchanged inputs draws the same sheet; the correction is a change to the
 * inputs, and a person makes it. The order carries the comments and the
 * resume point so that person knows exactly what to do.
 *
 * Nothing here interprets a comment into geometry, and nothing marks a
 * comment addressed — `RevisionResponse.status` is a human's statement.
 */

import type { StageResult, StageProcessor } from '../context'
import { requirePriorOutput } from '../context'
import type { SitePlanJobName } from '../definition'
import { buildRevisionResponseMatrix, type CountyComment } from '../../review/checklist'
import type { SubmissionPackageOutput } from './issuance-stages'
import { REVISION_RESUME_JOB } from './review-stages'

export interface IngestCommentsOutput {
  round: number
  receivedCount: number
  comments: CountyComment[]
  /** One row per comment; `response` absent until a person addresses it. */
  responseMatrix: ReturnType<typeof buildRevisionResponseMatrix>
  /** The package the comments were made against. */
  documentId: string
  resumeFrom: SitePlanJobName
  note: string
}

const ingestComments: StageProcessor = async (ctx): Promise<StageResult> => {
  const submission = requirePriorOutput<SubmissionPackageOutput>(ctx, 'siteplan.build_submission')

  if (!ctx.capabilities.loadCountyComments) {
    return {
      status: 'BLOCKED', outputs: null,
      blockers: ['This host keeps no county review comments (capabilities.loadCountyComments).'],
    }
  }

  const comments = (await ctx.capabilities.loadCountyComments(ctx.workflowId)) ?? []
  if (comments.length === 0) {
    // Nothing to ingest is not an error and not a reopen. The stage waits for
    // the letter; running it again once comments exist is the normal path.
    return {
      status: 'AWAITING_REVIEW',
      outputs: {
        round: ctx.attempt, receivedCount: 0, comments: [],
        responseMatrix: buildRevisionResponseMatrix([], []),
        documentId: submission.documentId, resumeFrom: REVISION_RESUME_JOB,
        note: 'No county comments recorded against this order yet.',
      } satisfies IngestCommentsOutput,
    }
  }

  const output: IngestCommentsOutput = {
    round: ctx.attempt,
    receivedCount: comments.length,
    comments,
    responseMatrix: buildRevisionResponseMatrix(comments, []),
    documentId: submission.documentId,
    resumeFrom: REVISION_RESUME_JOB,
    note:
      `${comments.length} county comment(s) recorded. The sheet chain is reopened from ` +
      `${REVISION_RESUME_JOB}; revise the inputs, then re-enqueue it.`,
  }

  return { status: 'COMPLETED', outputs: output, enqueue: [], reopen: [REVISION_RESUME_JOB] }
}

export const SUBMISSION_PROCESSORS: Partial<Record<SitePlanJobName, StageProcessor>> = {
  'siteplan.ingest_comments': ingestComments,
}
