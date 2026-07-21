# Staging Test Checklist

> Last updated: 2026-03-15
> Environment: Railway staging (separate from production)
> Run this checklist before every production deployment.

---

## Pre-Staging Requirements

- [ ] Railway staging environment deployed and healthy
- [ ] Staging DB is a SEPARATE Railway PostgreSQL (not production)
- [ ] All migrations applied: `npx prisma migrate deploy` on staging DB
- [ ] All required env vars set in Railway staging variables (see env-var-checklist.md)
- [ ] `APP_ENV=staging` confirmed
- [ ] Worker service health check responding: `GET {worker_url}/health → 200`
- [ ] API health check responding: `GET {api_url}/health → 200`

---

## Scenario Tests

### 1. Auth Flow

```
[ ] POST /auth/register — creates user, returns JWT
[ ] POST /auth/login — returns valid JWT
[ ] GET /auth/me — returns user profile with JWT in header
[ ] GET /auth/me without JWT — returns 401
```

### 2. Owner Flow

```
[ ] POST /owner/projects (adminOverride: true) — creates project
[ ] GET /owner/projects — lists projects for authenticated user
[ ] GET /owner/projects/:id — returns project detail with readiness + phases
[ ] POST /owner/projects/:id/readiness/advance — advances readiness gate in order
[ ] POST /owner/projects/:id/readiness/advance (skip gate) — returns 422
[ ] GET /owner/projects/:id/timeline — returns timeline events
[ ] GET /owner/engagements — lists project engagements
```

### 3. Engagement Execution Flow

```
[ ] POST /engagement-exec/change-orders — creates change order
[ ] GET /engagement-exec/contracts/:id/change-orders — lists change orders
[ ] POST /engagement-exec/change-orders/:id/respond (APPROVE) — approves CO, updates contract amount
[ ] POST /engagement-exec/change-orders/:id/respond (wrong party) — returns 422
[ ] POST /engagement-exec/milestones/submit — submits milestone
[ ] POST /engagement-exec/milestones/approve (approved:true) — approves milestone
[ ] POST /engagement-exec/escrow/release — releases payment, sets milestone to PAID
[ ] POST /engagement-exec/disputes — opens dispute, escrow goes ON_HOLD
[ ] POST /engagement-exec/disputes/:id/resolve — resolves dispute, escrow back to ACTIVE
```

### 4. Communications Flow

```
[ ] POST /comms/send — creates in-app notification
[ ] GET /comms/notifications — returns notifications with unreadCount
[ ] POST /comms/notifications/read (ids) — marks as read
[ ] POST /comms/notifications/read-all — marks all as read
[ ] DELETE /comms/notifications/:id — deletes notification
[ ] GET /comms/preferences — returns user notification preferences
[ ] PUT /comms/preferences — updates preferences, returns updated list
```

### 5. Payments / Revenue Flow

```
[ ] GET /revenue/plans — lists subscription plans
[ ] POST /revenue/plans (admin) — creates subscription plan
[ ] GET /revenue/placements/active — lists active sponsored placements
[ ] POST /revenue/checkout/start — creates Stripe checkout session
```

### 6. Markets Flow

```
[ ] POST /markets — creates market with unique jurisdictionCode
[ ] POST /markets (duplicate jurisdictionCode) — returns 409
[ ] GET /markets — lists markets with status filter
[ ] GET /markets/:id/checklist — returns launch checklist items
[ ] PATCH /markets/:id/checklist/:itemId — updates item status to DONE (sets completedAt)
[ ] GET /markets/:id/config/:key — returns market config value
[ ] PUT /markets/:id/config/:key — upserts config key
```

### 7. Enterprise Flow

```
[ ] POST /enterprise/orgs — creates portfolio org (auto-creates OWNER membership)
[ ] POST /enterprise/orgs/:id/members — invites team member
[ ] POST /enterprise/orgs/:id/members (duplicate) — returns 409
[ ] DELETE /enterprise/orgs/:id/members/:memberId (OWNER) — returns 422
[ ] GET /enterprise/flags/check (flagKey, scope) — returns enabled/disabled
[ ] POST /enterprise/flags (GLOBAL scope) — sets global feature flag
[ ] POST /enterprise/entitlements — grants org entitlement
[ ] GET /enterprise/entitlements/:orgId/check/:featureKey — returns hasEntitlement bool
```

### 8. Intelligence / Scoring Flow

```
[ ] POST /intelligence/scores/events — records score event
[ ] GET /intelligence/scores/:entityType/:entityId — returns current score
[ ] GET /intelligence/market-insights — returns market overview
[ ] GET /intelligence/lead-funnel — returns funnel metrics
```

### 9. Bot Execution (Old Bots)

```
[ ] GET /bots — lists all 6 registered bots
[ ] POST /bots/lead-bot/execute — executes with test data, returns output
[ ] POST /bots/estimate-bot/execute — executes, returns cost estimate
[ ] POST /bots/permit-bot/execute — executes, returns permit info
[ ] POST /bots/contractor-match-bot/execute — executes, returns matches
[ ] POST /bots/estimate-bot/execute (premium tier, no entitlement) — returns 403
[ ] GET /bots/executions — returns trace history (admin only)
```

### 10. GHL CRM Integration

```
[ ] POST /ghl/contacts/sync — syncs user to GHL (requires GHL_API_KEY)
[ ] POST /ghl/opportunities/sync — syncs project to GHL opportunity
[ ] POST /webhooks/ghl (valid payload) — processes GHL webhook event
[ ] POST /webhooks/ghl (invalid signature) — returns 401
```

### 11. Event Stream Verification

```
[ ] After POST /owner/projects: check Redis stream events:project for project.created event
[ ] After POST /engagement-exec/milestones/approve: check events:engagement for milestone.approved
[ ] After POST /engagement-exec/disputes: check events:engagement for dispute.opened
[ ] Verify event envelope has: id, type, source, severity, metadata.correlationId, createdAt
```

### 12. Worker Queue Verification

```
[ ] Worker health: GET {worker_url}:{HEALTH_PORT} → { status: "ok", queues: { email: true, ... } }
[ ] Email queue: trigger comms.service sendNotification with EMAIL channel → verify email sent (check Resend dashboard)
[ ] Cron: verify daily-digest job registered in BullMQ dashboard (or logs)
```

---

## Performance Baselines

| Endpoint | Expected p95 Latency |
|----------|---------------------|
| `GET /health` | < 50ms |
| `GET /owner/projects` | < 500ms |
| `POST /owner/projects/:id/readiness/advance` | < 300ms |
| `POST /engagement-exec/milestones/approve` | < 800ms (transaction) |
| `POST /bots/:id/execute` | < 15s (LLM call) |
| `GET /intelligence/market-insights` | < 1s |

---

## Sign-off Requirements

All scenarios must pass before production deployment:

- [ ] Auth flow: 4/4 passing
- [ ] Owner flow: 7/7 passing
- [ ] Engagement exec flow: 9/9 passing
- [ ] Communications flow: 7/7 passing
- [ ] Payments/revenue flow: 4/4 passing
- [ ] Markets flow: 7/7 passing
- [ ] Enterprise flow: 9/9 passing
- [ ] Intelligence flow: 4/4 passing
- [ ] Bot execution: 6/7 passing (premium entitlement test may require setup)
- [ ] GHL integration: 4/4 passing
- [ ] Event stream: 4/4 passing
- [ ] Worker queues: 3/3 passing

**Signed off by:** _______________  **Date:** _______________
