/**
 * Database Query Optimization Helpers
 *
 * Utilities for efficient Prisma queries:
 * - Cursor-based pagination
 * - Select-only projections for common entities
 * - Aggregation helpers
 * - N+1 prevention patterns
 */

// ── Cursor-based pagination ──
export interface PaginationInput {
  cursor?: string;
  limit?: number;
  direction?: 'forward' | 'backward';
}

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
  prevCursor: string | null;
  hasMore: boolean;
}

export function buildCursorPagination(input: PaginationInput) {
  const limit = Math.min(input.limit ?? 20, 50); // Hard cap at 50
  return {
    take: limit + 1, // Take one extra to check if there are more
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
  };
}

export function processCursorResult<T extends { id: string }>(
  items: T[],
  limit: number
): PaginatedResult<T> {
  const hasMore = items.length > limit;
  const resultItems = hasMore ? items.slice(0, limit) : items;

  return {
    items: resultItems,
    nextCursor: hasMore && resultItems.length > 0 ? resultItems[resultItems.length - 1].id : null,
    prevCursor: resultItems.length > 0 ? resultItems[0].id : null,
    hasMore,
  };
}

// ── Offset-based pagination (for simpler cases) ──
export interface OffsetPaginationInput {
  page?: number;
  limit?: number;
}

export function buildOffsetPagination(input: OffsetPaginationInput) {
  const page = Math.max(1, input.page ?? 1);
  const limit = Math.min(Math.max(1, input.limit ?? 20), 50); // 1-50
  return {
    take: limit,
    skip: (page - 1) * limit,
  };
}

// ── Select-only projections for common dashboard queries ──
// These prevent loading unnecessary fields

export const PROJECT_LIST_SELECT = {
  id: true,
  name: true,
  status: true,
  currentPhase: true,
  address: true,
  city: true,
  state: true,
  budget: true,
  clientId: true,
  pmId: true,
  createdAt: true,
  updatedAt: true,
  scheduledStartDate: true,
  scheduledEndDate: true,
} as const;

export const PROJECT_CARD_SELECT = {
  id: true,
  name: true,
  status: true,
  currentPhase: true,
  budget: true,
  createdAt: true,
} as const;

export const TASK_LIST_SELECT = {
  id: true,
  title: true,
  status: true,
  priority: true,
  dueDate: true,
  assignedTo: true,
  projectId: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const NOTIFICATION_LIST_SELECT = {
  id: true,
  type: true,
  title: true,
  message: true,
  status: true,
  link: true,
  userId: true,
  createdAt: true,
} as const;

export const LEAD_LIST_SELECT = {
  id: true,
  category: true,
  description: true,
  stage: true,
  status: true,
  estimatedValue: true,
  suggestedPrice: true,
  location: true,
  city: true,
  state: true,
  projectType: true,
  createdAt: true,
} as const;

export const MILESTONE_LIST_SELECT = {
  id: true,
  name: true,
  amount: true,
  status: true,
  sortOrder: true,
  completedAt: true,
  approvedAt: true,
  paidAt: true,
  contractId: true,
} as const;

export const USER_MINIMAL_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
} as const;

export const DOCUMENT_LIST_SELECT = {
  id: true,
  name: true,
  type: true,
  status: true,
  fileUrl: true,
  projectId: true,
  createdAt: true,
} as const;

// ── Batch loading helper (prevents N+1) ──
export async function batchLoad<T, K extends string | number>(
  ids: K[],
  loader: (ids: K[]) => Promise<T[]>,
  keyExtractor: (item: T) => K,
): Promise<Map<K, T>> {
  if (ids.length === 0) return new Map();

  const uniqueIds = [...new Set(ids)];
  const items = await loader(uniqueIds);
  const map = new Map<K, T>();
  for (const item of items) {
    map.set(keyExtractor(item), item);
  }
  return map;
}

// ── Date range filter helper ──
export function dateRangeFilter(field: string, start?: Date | string, end?: Date | string) {
  const filter: any = {};
  if (start) filter.gte = new Date(start);
  if (end) filter.lte = new Date(end);
  return Object.keys(filter).length > 0 ? { [field]: filter } : {};
}
