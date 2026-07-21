/**
 * packages/core-hooks/src/analytics.ts
 *
 * Analytics event tracking for revenue hooks.
 * Supports PostHog (primary) with a console fallback for dev.
 *
 * Events fired:
 *   revenue_hook_shown         - hook modal opened
 *   revenue_hook_tier_selected - user clicks a tier CTA
 *   revenue_hook_dismissed     - user dismisses hook
 *   revenue_hook_checkout_started  - Stripe checkout initiated
 *   revenue_hook_checkout_completed - Stripe checkout confirmed
 */

export interface HookAnalyticsEvent {
  name:       string;
  properties: Record<string, unknown>;
}

export type AnalyticsTracker = (event: HookAnalyticsEvent) => void;

// ─── Default tracker (console in dev, PostHog in prod) ───────────────────────

let _tracker: AnalyticsTracker = (event) => {
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[RevenueHook Analytics]', event.name, event.properties);
  }
};

export function setAnalyticsTracker(tracker: AnalyticsTracker): void {
  _tracker = tracker;
}

// ─── Track functions ──────────────────────────────────────────────────────────

export function trackHookShown(params: {
  stage:     string;
  projectId?: string;
  userId?:   string;
}): void {
  _tracker({
    name: 'revenue_hook_shown',
    properties: {
      hook_stage:  params.stage,
      project_id:  params.projectId,
      user_id:     params.userId,
      timestamp:   new Date().toISOString(),
    },
  });
}

export function trackTierSelected(params: {
  stage:     string;
  tierId:    string;
  tierName:  string;
  price:     number;
  projectId?: string;
  userId?:   string;
}): void {
  _tracker({
    name: 'revenue_hook_tier_selected',
    properties: {
      hook_stage:  params.stage,
      tier_id:     params.tierId,
      tier_name:   params.tierName,
      price_cents: params.price,
      is_free:     params.price === 0,
      project_id:  params.projectId,
      user_id:     params.userId,
    },
  });
}

export function trackHookDismissed(params: {
  stage:     string;
  projectId?: string;
  userId?:   string;
}): void {
  _tracker({
    name: 'revenue_hook_dismissed',
    properties: {
      hook_stage: params.stage,
      project_id: params.projectId,
      user_id:    params.userId,
    },
  });
}

export function trackCheckoutStarted(params: {
  stage:    string;
  tierId:   string;
  tierName: string;
  price:    number;
  sessionId?: string;
  projectId?: string;
  userId?:  string;
}): void {
  _tracker({
    name: 'revenue_hook_checkout_started',
    properties: {
      hook_stage:       params.stage,
      tier_id:          params.tierId,
      tier_name:        params.tierName,
      price_cents:      params.price,
      stripe_session:   params.sessionId,
      project_id:       params.projectId,
      user_id:          params.userId,
    },
  });
}

export function trackCheckoutCompleted(params: {
  stage:     string;
  tierId:    string;
  tierName:  string;
  price:     number;
  sessionId?: string;
  projectId?: string;
  userId?:   string;
}): void {
  _tracker({
    name: 'revenue_hook_checkout_completed',
    properties: {
      hook_stage:     params.stage,
      tier_id:        params.tierId,
      tier_name:      params.tierName,
      price_cents:    params.price,
      revenue_usd:    params.price / 100,
      stripe_session: params.sessionId,
      project_id:     params.projectId,
      user_id:        params.userId,
    },
  });
}
