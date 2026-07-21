/**
 * JSON Diff Utility
 *
 * Computes the list of changed field paths between two objects.
 * Used by AuditClient to auto-populate `changedFields` when
 * both `previousValue` and `newValue` are provided.
 *
 * Returns dot-notation field paths (e.g., ['status', 'budget.amount']).
 */

const MAX_DEPTH = 10;

/**
 * Compare two objects and return an array of dot-notation field paths
 * that differ between them.
 *
 * @param before — State before the change (can be null/undefined)
 * @param after — State after the change (can be null/undefined)
 * @returns Array of changed field paths
 *
 * @example
 * diffObjects(
 *   { status: 'DRAFT', budget: { amount: 50000 }, name: 'Project A' },
 *   { status: 'ACTIVE', budget: { amount: 55000 }, name: 'Project A' }
 * )
 * // => ['status', 'budget.amount']
 */
export function diffObjects(
  before: Record<string, any> | null | undefined,
  after: Record<string, any> | null | undefined
): string[] {
  if (!before && !after) return [];
  if (!before && after) return Object.keys(after);
  if (before && !after) return Object.keys(before);

  const changes: string[] = [];
  collectChanges(before!, after!, '', changes, 0);
  return changes;
}

// ============================================================================
// INTERNAL
// ============================================================================

function collectChanges(
  before: Record<string, any>,
  after: Record<string, any>,
  prefix: string,
  changes: string[],
  depth: number
): void {
  if (depth > MAX_DEPTH) return;

  // Collect all unique keys from both objects
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    const path = prefix ? `${prefix}.${key}` : key;
    const beforeVal = before[key];
    const afterVal = after[key];

    // Both undefined — no change
    if (beforeVal === undefined && afterVal === undefined) continue;

    // One is undefined — field added or removed
    if (beforeVal === undefined || afterVal === undefined) {
      changes.push(path);
      continue;
    }

    // Both are objects (non-null, non-array, non-Date) — recurse
    if (
      isPlainObject(beforeVal) &&
      isPlainObject(afterVal)
    ) {
      collectChanges(beforeVal, afterVal, path, changes, depth + 1);
      continue;
    }

    // Arrays — compare by JSON serialization (simple but effective)
    if (Array.isArray(beforeVal) && Array.isArray(afterVal)) {
      if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
        changes.push(path);
      }
      continue;
    }

    // Date comparison
    if (beforeVal instanceof Date && afterVal instanceof Date) {
      if (beforeVal.getTime() !== afterVal.getTime()) {
        changes.push(path);
      }
      continue;
    }

    // Primitive comparison
    if (beforeVal !== afterVal) {
      changes.push(path);
    }
  }
}

function isPlainObject(val: any): val is Record<string, any> {
  return (
    val !== null &&
    typeof val === 'object' &&
    !Array.isArray(val) &&
    !(val instanceof Date)
  );
}
