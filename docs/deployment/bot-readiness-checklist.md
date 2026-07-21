# KeaBots Deployment Readiness Checklist

> Last updated: 2026-03-15
> Framework: `packages/core-bots/` | Old bots: `services/api/src/modules/bots/`

---

## 1. Readiness Framework

A bot is **PRODUCTION READY** when it passes all gates below.

### Gate Criteria (pass/fail)

| Gate | Criteria | How to verify |
|------|----------|---------------|
| G1 — API Wired | `ANTHROPIC_API_KEY` set, Anthropic SDK imported, real API call | Check `keabot-base.ts` chat() |
| G2 — Tools Return Real Data | Tool handlers query Prisma or OS services, NOT mock objects | Audit each `handler()` function |
| G3 — Auth Context Passed | `userId`, `orgId`, `projectId` propagated from request → bot context | Check route → service → bot call chain |
| G4 — Error Handling | `try/catch` in tool handlers, `bot.action.failed` event emitted | Check base class executeTool() |
| G5 — Rate Limit Guard | Request-level rate limit on `/bots/:botId/execute` and `/keabot/chat` | Check `rate-limit.middleware.ts` |
| G6 — Event Emission | `bot.action.started`, `bot.action.completed`, `bot.action.failed` emitted | Check `bots.routes.ts` + `emit-event.ts` |
| G7 — Test Coverage | ≥ 5 test scenarios documented and passing | Check `__tests__/` in bot package |
| G8 — Cost Guard | `checkCostGuard()` enforced for premium-tier calls | Check `bots.router.ts` |

### Scoring

- 8/8 gates: **PRODUCTION READY**
- 6–7/8 gates: **STAGING ONLY** — deploy to staging, do not promote
- ≤ 5/8 gates: **BLOCKED** — do not deploy

---

## 2. Bot Inventory (New KeaBots — `bots/keabot-*/`)

These are the v20 bots with full Anthropic tool_use loop. Assessed 2026-03-15.

| Bot | Domain | G1 | G2 | G3 | G4 | G5 | G6 | G7 | G8 | Score | Status |
|-----|--------|----|----|----|----|----|----|----|----|-------|--------|
| keabot-command | Orchestrator | ✅ | ❌ | ⚠️ | ✅ | ⚠️ | ❌ | ❌ | ✅ | 3/8 | BLOCKED |
| keabot-owner | Owner | ✅ | ❌ | ⚠️ | ✅ | ⚠️ | ❌ | ❌ | ✅ | 3/8 | BLOCKED |
| keabot-gc | GC | ✅ | ❌ | ⚠️ | ✅ | ⚠️ | ❌ | ❌ | ✅ | 3/8 | BLOCKED |
| keabot-construction | Construction | ✅ | ❌ | ⚠️ | ✅ | ⚠️ | ❌ | ❌ | ✅ | 3/8 | BLOCKED |
| keabot-land | Land | ✅ | ❌ | ⚠️ | ✅ | ⚠️ | ❌ | ❌ | ✅ | 3/8 | BLOCKED |
| keabot-feasibility | Feasibility | ✅ | ❌ | ⚠️ | ✅ | ⚠️ | ❌ | ❌ | ✅ | 3/8 | BLOCKED |
| keabot-finance | Finance | ✅ | ❌ | ⚠️ | ✅ | ⚠️ | ❌ | ❌ | ✅ | 3/8 | BLOCKED |
| keabot-developer | Developer | ✅ | ❌ | ⚠️ | ✅ | ⚠️ | ❌ | ❌ | ✅ | 3/8 | BLOCKED |
| keabot-permit | Permits | ✅ | ❌ | ⚠️ | ✅ | ⚠️ | ❌ | ❌ | ✅ | 3/8 | BLOCKED |
| keabot-estimate | Estimation | ✅ | ❌ | ⚠️ | ✅ | ⚠️ | ❌ | ❌ | ✅ | 3/8 | BLOCKED |
| keabot-payments | Payments | ✅ | ❌ | ⚠️ | ✅ | ⚠️ | ❌ | ❌ | ✅ | 3/8 | BLOCKED |
| keabot-marketplace | Marketplace | ✅ | ❌ | ⚠️ | ✅ | ⚠️ | ❌ | ❌ | ✅ | 3/8 | BLOCKED |
| keabot-operations | Operations | ✅ | ❌ | ⚠️ | ✅ | ⚠️ | ❌ | ❌ | ✅ | 3/8 | BLOCKED |

**Legend:** ✅ Pass | ❌ Fail | ⚠️ Partial

---

## 3. Bot Inventory (Old Bots — `modules/bots/`)

These are the v10 bots using the `IBot` interface + `callModel()` pattern.

| Bot | Route ID | G1 | G2 | G3 | G4 | G5 | G6 | G7 | G8 | Score | Status |
|-----|----------|----|----|----|----|----|----|----|----|-------|--------|
| LeadBot | `lead-bot` | ✅ | ⚠️ | ✅ | ✅ | ✅ | ❌ | ⚠️ | ✅ | 5/8 | BLOCKED |
| EstimateBot | `estimate-bot` | ✅ | ⚠️ | ✅ | ✅ | ✅ | ❌ | ⚠️ | ✅ | 5/8 | BLOCKED |
| PermitBot | `permit-bot` | ✅ | ⚠️ | ✅ | ✅ | ✅ | ❌ | ⚠️ | ✅ | 5/8 | BLOCKED |
| ContractorMatchBot | `contractor-match-bot` | ✅ | ⚠️ | ✅ | ✅ | ✅ | ❌ | ⚠️ | ✅ | 5/8 | BLOCKED |
| ProjectMonitorBot | `project-monitor-bot` | ✅ | ⚠️ | ✅ | ✅ | ✅ | ❌ | ⚠️ | ✅ | 5/8 | BLOCKED |
| SupportBot | `support-bot` | ✅ | ⚠️ | ✅ | ✅ | ✅ | ❌ | ⚠️ | ✅ | 5/8 | BLOCKED |

---

## 4. Per-Bot Blocking Issues

### New KeaBots (all 13)

**G2 — Tools return mock data** (CRITICAL BLOCKER)
All tool `handler()` functions return hardcoded mock objects. Each must be replaced with:
- Real Prisma queries via `prisma as any` (same pattern as other services)
- Or HTTP calls to the relevant OS service (os-land, os-feas, os-dev, os-pm, os-pay, os-ops, marketplace)

**G3 — Auth context partial**
Bot context receives `userId` from the chat endpoint but does not receive `projectId` or `orgId` in all paths. Fix: ensure routes pass all three from JWT claims.

**G6 — No event emission in bot handlers**
`bot.action.started/completed/failed` events are not emitted by the bots themselves. Fixed at HTTP layer via `emit-event.ts` but not yet in direct bot invocations (e.g., from worker jobs).

**G7 — No test files**
Zero vitest test files exist for the v20 KeaBots. Each needs ≥ 5 scenario tests with mocked Anthropic API responses.

### Old Bots (all 6)

**G2 — Partial real data**
Some tools query Prisma, others use hardcoded arrays. Audit each bot's handler to identify mock data.

**G6 — No event emission**
`bots.routes.ts` does not emit `bot.action.*` events. Add to route handler after execute().

**G7 — Partial test coverage**
Some bots have basic tests but not the full 5-scenario requirement.

---

## 5. Required Artifacts per Bot (to reach PRODUCTION READY)

For each KeaBot to be cleared for production:

```
[ ] Tool handler audit completed (all mocks replaced with Prisma/OS service calls)
[ ] Auth context (userId, projectId, orgId) verified in tool execution context
[ ] Error handling tested: bad input, DB miss, Anthropic timeout
[ ] bot.action.started / completed / failed events emitted
[ ] Rate limit: max 10 requests/minute per userId on /bots/:botId routes
[ ] Cost guard: premium tier requires entitlement check
[ ] Test file: bots/keabot-{name}/src/__tests__/keabot-{name}.test.ts
    - 5 scenarios minimum: happy path, missing data, tool error, auth denied, handoff
[ ] Staging run: 20+ real conversations logged with no unhandled errors
[ ] Production approval: Tim sign-off on staging test summary
```

---

## 6. Deployment Gate Decision Tree

```
Bot needs deployment?
  ↓
Score ≥ 6/8?
  ├── NO → Fix blockers → Re-score
  └── YES → Deploy to staging
        ↓
      20+ staging conversations pass?
        ├── NO → Fix issues → Re-run staging
        └── YES → Submit for Tim approval
              ↓
            Approved?
              ├── NO → Address feedback
              └── YES → Deploy to production (canary 5% first)
```

---

## 7. Staging Requirements

Before any bot goes to production:

1. Railway staging environment running with `NODE_ENV=staging`
2. Staging PostgreSQL separate from production (same schema)
3. `ANTHROPIC_API_KEY` set in staging (can be same key, rate-limited)
4. Run 20 test conversations covering happy path + error scenarios
5. Verify event stream: check Redis Streams for `events:bot` entries
6. Verify no cost blowout: max 10K tokens per conversation

---

## 8. Production Approval Checklist

- [ ] All 8 readiness gates pass
- [ ] Staging test: 20+ conversations, 0 unhandled errors
- [ ] Response latency p95 < 30s (Anthropic API + DB round-trips)
- [ ] Cost per conversation < $0.10 (claude-sonnet pricing)
- [ ] GHL contact sync verified for lead-generating bot actions
- [ ] Rollback plan documented: disable route via feature flag
- [ ] Monitoring alert set: `bot.action.failed` rate > 5% → PagerDuty
