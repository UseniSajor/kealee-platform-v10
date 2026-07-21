/**
 * KEALEE MESSENGER WORKER
 *
 * Claw F -- docs-communication-claw
 *
 * Responsibilities:
 *   - Detect @kealee mentions in project conversations
 *   - Gather project context for AI queries
 *   - Route informational queries to Claude AI
 *   - Route action requests to appropriate claws/queues
 *   - Post AI responses back to conversations
 *
 * GUARDRAILS (PURE REPRESENTATION LAYER):
 *   - Cannot mutate contracts, budgets, schedules, or any domain data
 *   - Cannot make decisions or recommendations (only relays data)
 *   - Cannot trigger financial transactions
 *   - Action routing ONLY dispatches to other queues -- never executes directly
 *   - Must call assertWritable() before every Prisma write
 *   - Only writes to: Message (for AI response messages)
 *
 * Queue: KEALEE_QUEUES.COMMUNICATION with 'kealee-messenger-*' job name prefix
 *
 * Job names:
 *   kealee-messenger-detect  -- parse @kealee mention, classify intent
 *   kealee-messenger-query   -- informational query with AI response
 *   kealee-messenger-action  -- action request routed to appropriate queue
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Classification of a @kealee mention */
export type MentionIntent = 'QUERY' | 'ACTION' | 'UNKNOWN';

/** Supported action types that this claw can route */
export type RoutableAction =
  | 'generate_document'
  | 'send_notification'
  | 'create_rfi'
  | 'schedule_inspection'; // Routed to permits-compliance claw

/** Actions that CANNOT be handled -- must be done in the proper module */
export type ProhibitedAction =
  | 'modify_contract'
  | 'update_budget'
  | 'change_schedule'
  | 'approve_payment'
  | 'file_permit'
  | 'modify_estimate'
  | 'award_bid';

/** Result of intent classification */
export interface IntentClassification {
  intent: MentionIntent;
  confidence: number;
  query: string;
  suggestedAction?: RoutableAction;
  isProhibited: boolean;
  prohibitedReason?: string;
}

/** Project context gathered for AI queries */
export interface ProjectContext {
  projectName: string;
  projectStatus?: string;
  projectType?: string;
  address?: string;
  permits?: Array<{ type: string; status: string; number?: string }>;
  scheduleItems?: Array<{ name: string; startDate: string; endDate: string; status: string }>;
  budgetSummary?: { totalBudget: number; totalSpent: number; variance: number };
  recentInspections?: Array<{ type: string; result: string; date: string }>;
  openIssues?: Array<{ title: string; severity: string; status: string }>;
  teamMembers?: Array<{ name: string; role: string }>;
}

/** AI action plan returned by the action router */
export interface ActionPlan {
  action: RoutableAction;
  targetQueue: string;
  parameters: Record<string, unknown>;
  cannotFulfill: boolean;
  reason?: string;
}

// ---------------------------------------------------------------------------
// @kealee Mention Detection
// ---------------------------------------------------------------------------

/** Regex pattern to detect @kealee mentions */
const KEALEE_MENTION_PATTERN = /@kealee\b/gi;

/**
 * Detect @kealee mentions in a message.
 * Returns the cleaned query text with @kealee stripped out.
 */
export function detectKealeeMention(content: string): {
  hasMention: boolean;
  query: string;
} {
  const hasMention = KEALEE_MENTION_PATTERN.test(content);
  // Reset regex state
  KEALEE_MENTION_PATTERN.lastIndex = 0;

  const query = content.replace(KEALEE_MENTION_PATTERN, '').trim();

  return { hasMention, query };
}

// ---------------------------------------------------------------------------
// Intent Classification
// ---------------------------------------------------------------------------

/** Keywords that indicate an action request */
const ACTION_KEYWORDS = [
  'create', 'generate', 'send', 'schedule', 'submit', 'approve',
  'update', 'change', 'modify', 'delete', 'remove', 'add',
  'assign', 'notify', 'remind', 'escalate', 'file', 'share',
];

/** Keywords that indicate a query (informational request) */
const QUERY_KEYWORDS = [
  'what', 'when', 'where', 'who', 'how', 'why', 'which',
  'status', 'progress', 'summary', 'detail', 'info', 'show',
  'tell', 'explain', 'list', 'find', 'check', 'report',
  'is', 'are', 'was', 'were', 'will', 'can', 'do', 'does',
];

/** Prohibited action patterns -- these cannot be handled by the messenger */
const PROHIBITED_PATTERNS: Array<{ pattern: RegExp; action: ProhibitedAction; reason: string }> = [
  {
    pattern: /\b(approve|sign|execute)\b.*\b(contract|agreement)\b/i,
    action: 'modify_contract',
    reason: 'Contract approvals must be done in the Contracts module.',
  },
  {
    pattern: /\b(update|change|modify)\b.*\b(budget|cost|spend)\b/i,
    action: 'update_budget',
    reason: 'Budget modifications must be done in the Budget module.',
  },
  {
    pattern: /\b(update|change|modify|reschedule)\b.*\b(schedule|timeline|milestone)\b/i,
    action: 'change_schedule',
    reason: 'Schedule changes must be done in the Schedule module.',
  },
  {
    pattern: /\b(pay|approve payment|process payment|disburse)\b/i,
    action: 'approve_payment',
    reason: 'Payment approvals must be done in the Finance module.',
  },
  {
    pattern: /\b(file|submit)\b.*\b(permit)\b/i,
    action: 'file_permit',
    reason: 'Permit filing requires explicit action in the Permits module.',
  },
  {
    pattern: /\b(modify|update|change)\b.*\b(estimate)\b/i,
    action: 'modify_estimate',
    reason: 'Estimate modifications must be done in the Estimation module.',
  },
  {
    pattern: /\b(award)\b.*\b(bid|contract)\b/i,
    action: 'award_bid',
    reason: 'Bid awards must be done in the Bid Engine module.',
  },
];

/**
 * Classify the intent of a @kealee query.
 *
 * 1. Check for prohibited actions first
 * 2. Check for action keywords
 * 3. Default to query if neither matches
 */
export function classifyIntent(query: string): IntentClassification {
  const lowerQuery = query.toLowerCase();

  // Check prohibited patterns first
  for (const { pattern, action, reason } of PROHIBITED_PATTERNS) {
    if (pattern.test(query)) {
      return {
        intent: 'ACTION',
        confidence: 0.9,
        query,
        isProhibited: true,
        prohibitedReason: reason,
      };
    }
  }

  // Count action and query keyword matches
  const words = lowerQuery.split(/\s+/);
  const actionMatches = words.filter((w) => ACTION_KEYWORDS.includes(w)).length;
  const queryMatches = words.filter((w) => QUERY_KEYWORDS.includes(w)).length;

  // Determine action type if action intent
  let suggestedAction: RoutableAction | undefined;
  if (actionMatches > queryMatches) {
    if (/\b(generate|create)\b.*\b(document|report|rfi|narrative)\b/i.test(query)) {
      suggestedAction = 'generate_document';
    } else if (/\b(send|notify|remind)\b/i.test(query)) {
      suggestedAction = 'send_notification';
    } else if (/\b(rfi|request for information)\b/i.test(query)) {
      suggestedAction = 'create_rfi';
    } else if (/\b(schedule|request)\b.*\b(inspection)\b/i.test(query)) {
      suggestedAction = 'schedule_inspection';
    }
  }

  if (actionMatches > queryMatches) {
    return {
      intent: 'ACTION',
      confidence: Math.min(0.5 + actionMatches * 0.15, 0.95),
      query,
      suggestedAction,
      isProhibited: false,
    };
  }

  if (queryMatches > 0) {
    return {
      intent: 'QUERY',
      confidence: Math.min(0.5 + queryMatches * 0.1, 0.95),
      query,
      isProhibited: false,
    };
  }

  return {
    intent: 'UNKNOWN',
    confidence: 0.3,
    query,
    isProhibited: false,
  };
}

// ---------------------------------------------------------------------------
// Project Context Gathering
// ---------------------------------------------------------------------------

/**
 * Fields to select when gathering project context.
 * Keeps queries efficient by only fetching what the AI needs.
 */
export const PROJECT_CONTEXT_INCLUDES = {
  permits: {
    take: 10,
    orderBy: { createdAt: 'desc' as const },
    select: {
      id: true,
      permitType: true,
      status: true,
      permitNumber: true,
    },
  },
  scheduleItems: {
    take: 10,
    orderBy: { startDate: 'asc' as const },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      status: true,
    },
  },
  budgetItems: {
    take: 10,
    select: {
      id: true,
      category: true,
      budgetedAmount: true,
      actualAmount: true,
    },
  },
};

/**
 * Build a ProjectContext object from raw Prisma data.
 */
export function buildProjectContext(project: any): ProjectContext {
  const permits = (project.permits ?? []).map((p: any) => ({
    type: p.permitType,
    status: p.status,
    number: p.permitNumber,
  }));

  const scheduleItems = (project.scheduleItems ?? []).map((s: any) => ({
    name: s.name,
    startDate: s.startDate?.toISOString?.() ?? String(s.startDate),
    endDate: s.endDate?.toISOString?.() ?? String(s.endDate),
    status: s.status,
  }));

  const budgetItems = project.budgetItems ?? [];
  const totalBudget = budgetItems.reduce(
    (sum: number, b: any) => sum + (Number(b.budgetedAmount) || 0),
    0,
  );
  const totalSpent = budgetItems.reduce(
    (sum: number, b: any) => sum + (Number(b.actualAmount) || 0),
    0,
  );

  return {
    projectName: project.name ?? 'Unknown Project',
    projectStatus: project.status,
    projectType: project.type,
    address: project.address,
    permits,
    scheduleItems,
    budgetSummary: {
      totalBudget,
      totalSpent,
      variance: totalBudget - totalSpent,
    },
  };
}

// ---------------------------------------------------------------------------
// AI Response Formatting
// ---------------------------------------------------------------------------

/**
 * Format an AI response for display in the conversation.
 * Ensures responses are clean, professional, and properly structured.
 */
export function formatAiResponse(
  rawResponse: unknown,
  query: string,
): string {
  if (typeof rawResponse === 'string') {
    return rawResponse;
  }

  if (typeof rawResponse === 'object' && rawResponse !== null) {
    const resp = rawResponse as Record<string, unknown>;

    // If the AI returned a structured response with a message field
    if (resp.message && typeof resp.message === 'string') {
      return resp.message;
    }

    // If the AI returned data that needs summarization
    if (resp.summary && typeof resp.summary === 'string') {
      return resp.summary;
    }

    // Fallback: serialize the response
    return JSON.stringify(rawResponse, null, 2);
  }

  return `I looked into your question about "${query}" but could not generate a detailed response. Please try rephrasing your question.`;
}

/**
 * Build a "cannot fulfill" message for prohibited actions.
 */
export function buildProhibitedMessage(reason: string): string {
  return (
    `I'm not able to do that directly. ${reason}\n\n` +
    `I can help you with:\n` +
    `- Generating documents and reports\n` +
    `- Sending notifications to your team\n` +
    `- Looking up project information\n` +
    `- Creating RFIs\n\n` +
    `Would you like help with any of those instead?`
  );
}
