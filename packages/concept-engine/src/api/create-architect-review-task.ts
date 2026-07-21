/**
 * API contract: create an architect review task after concept package generation.
 * Called by worker job `create_architect_review_task`.
 */

export interface CreateArchitectReviewInput {
  intakeId:         string;
  conceptPackageId: string;
  assignedArchitect?:string;
  notes?:           string;
}

export interface CreateArchitectReviewResult {
  taskId:       number | string;
  reviewStatus: 'pending';
  intakeId:     string;
  conceptPackageId: string;
  createdAt:    string;
}

/**
 * Build the review task record.
 * The caller (worker or API route) is responsible for persisting to DB.
 */
export function buildArchitectReviewTask(
  input: CreateArchitectReviewInput,
): Omit<CreateArchitectReviewResult, 'taskId'> & { data: Record<string, unknown> } {
  return {
    reviewStatus:     'pending',
    intakeId:         input.intakeId,
    conceptPackageId: input.conceptPackageId,
    createdAt:        new Date().toISOString(),
    data: {
      intake_id:          input.intakeId,
      concept_package_id: input.conceptPackageId,
      assigned_architect: input.assignedArchitect ?? null,
      review_status:      'pending',
      notes:              input.notes ?? null,
    },
  };
}
