# Kealee Lifecycle Event Map — GHL (GoHighLevel) CRM Integration

> Last updated: 2026-03-15
> CRM: GoHighLevel (GHL) — NOT Zoho
> GHL integration: `services/api/src/modules/integrations/ghl/`
> Event system: `packages/core-events/src/event-types.ts`

---

## Overview

Platform events flow from service actions → Redis Streams → GHL sync handlers.
GHL contacts map to Kealee **users/orgs**. GHL opportunities map to Kealee **projects/leads**.

---

## 1. Canonical Event Taxonomy

All platform events are defined in `EVENT_TYPES_V20`. Key namespaces:

| Namespace | Events | Source Service |
|-----------|--------|----------------|
| `project.*` | created, updated, statusChanged, readiness.advanced | owner.service.ts |
| `engagement.*` | changeOrder.created/responded, milestone.submitted/approved/rejected, payment.released, dispute.opened/resolved | engagement-exec.service.ts |
| `land.*` | parcel.created/updated/converted, offer.submitted/accepted/rejected | os-land |
| `feasibility.*` | study.created/decided (GO/NO_GO) | os-feas |
| `development.*` | capitalStack.created/finalized, draw.submitted/approved/funded | os-dev |
| `operations.*` | turnover.completed, warranty.claimFiled | os-ops |
| `bot.*` | action.started/completed/failed, handoff.requested/completed | api (emit-event.ts) |
| `integration.*` | sync.started/completed/failed, webhook.received/processed | integrations/ |

---

## 2. GHL Contact Lifecycle Map

GHL contacts represent users (owners, contractors, developers).

| Platform Event | GHL Action | Contact Fields Updated | Workflow Enrolled |
|----------------|------------|------------------------|-------------------|
| User signup (auth) | Create contact | name, email, phone, tags: [`kealee-user`, `{role}`] | Welcome sequence |
| `project.created` | Update contact | custom: `project_count++`, tag: `has-project` | Owner onboarding |
| `land.offer.accepted` | Update contact | custom: `land_acquired`, tag: `land-owner` | Land-to-project pipeline |
| `feasibility.study.decided` (GO) | Update contact | custom: `feas_status: GO`, tag: `feasibility-approved` | Developer engagement |
| `feasibility.study.decided` (NO_GO) | Update contact | tag: `feasibility-rejected` | Re-engagement sequence |
| `development.capitalStack.finalized` | Update contact | custom: `financing_status: finalized` | Finance team notification |
| `engagement.*` (contractor) | Create/update contact | custom: `contractor_status`, tag: `active-contractor` | Contractor onboarding |
| `engagement.dispute.opened` | Update contact | custom: `dispute_open: true`, tag: `dispute` | Dispute resolution workflow |
| `engagement.dispute.resolved` | Update contact | remove tag `dispute`, custom: `dispute_open: false` | Post-dispute survey |
| `operations.turnover.completed` | Update contact | custom: `project_complete: true`, tag: `completed-project` | Referral campaign |

---

## 3. GHL Opportunity Lifecycle Map

GHL opportunities represent projects / bids / leads.

| Platform Event | GHL Stage | Opportunity Name | Pipeline |
|----------------|-----------|------------------|----------|
| Lead submitted (marketplace) | `New Lead` | `{service} - {city}` | Contractor Pipeline |
| Bid accepted (contract signed) | `Won` | — | Contractor Pipeline |
| `project.created` | `Active Project` | `{project.name}` | Owner Pipeline |
| `project.readiness.advanced` (DESIGN_READY) | `Design Phase` | — | Owner Pipeline |
| `project.readiness.advanced` (PERMITS_SUBMITTED) | `Permits Phase` | — | Owner Pipeline |
| `project.readiness.advanced` (CONSTRUCTION_READY) | `Construction Ready` | — | Owner Pipeline |
| `engagement.payment.released` (final milestone) | `Payment Complete` | — | Owner Pipeline |
| `operations.turnover.completed` | `Closed Won` | — | Owner Pipeline |
| Project cancelled / `engagement.dispute.opened` | `On Hold` | — | Owner Pipeline |

---

## 4. GHL Contact Tag Taxonomy

Tags applied automatically by lifecycle events:

```
kealee-user              — all registered users
role:{owner|contractor|developer|admin}  — user role
has-project              — owns ≥1 project
land-owner               — land parcel acquired
feasibility-approved     — GO decision on any feasibility study
feasibility-rejected     — NO_GO decision (for re-engagement)
active-contractor        — has ≥1 active engagement
dispute                  — has open dispute
completed-project        — has ≥1 completed project
enterprise-org           — member of portfolio org (P20)
feature-flag:{flagKey}   — specific feature flags
```

---

## 5. GHL Sync Handler Map

Events consumed by `services/api/src/modules/integrations/ghl/`:

| Event Stream | Redis Stream Key | GHL Handler | Notes |
|--------------|-----------------|-------------|-------|
| `project.created` | `events:project` | `ghl.syncContact()` | Creates opportunity in Owner Pipeline |
| `project.readiness.advanced` | `events:project` | `ghl.updateOpportunityStage()` | Stage advancement |
| `engagement.milestone.approved` | `events:engagement` | `ghl.addNote()` | Logs milestone approval as note |
| `engagement.payment.released` | `events:engagement` | `ghl.addNote()` + tag | Tags contact with payment milestone |
| `engagement.dispute.opened` | `events:engagement` | `ghl.updateContact()` | Sets dispute tag, flags account |
| `land.offer.accepted` | `events:land` | `ghl.syncContact()` | Updates pipeline to Land Acquired |
| `feasibility.study.decided` | `events:feasibility` | `ghl.enrollWorkflow()` | Enrolls GO or NO_GO workflow |
| `operations.turnover.completed` | `events:operations` | `ghl.moveOpportunityToWon()` | Closes opportunity as Won |

---

## 6. GHL Pipeline Definitions

### Owner Pipeline
```
New Inquiry → Project Created → Design Phase → Permits Phase → Construction Ready →
Active Construction → Final Payment → Turnover → Closed Won
```

### Contractor Pipeline
```
Lead Received → Bid Submitted → Bid Won → Active Engagement →
Final Milestone → Payment Received → Review Requested → Completed
```

### Developer Pipeline
```
Land Identified → Land Acquired → Feasibility GO → Capital Stack →
Entitlements → Construction Start → Lease-Up → Disposition
```

---

## 7. Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| GHL HTTP client | ✅ Complete | `ghl/ghl.client.ts` |
| Contact sync | ✅ Complete | `ghl/ghl.service.ts` |
| Opportunity sync | ✅ Complete | `ghl/ghl.service.ts` |
| GHL webhook receiver | ✅ Complete | `ghl/ghl-webhook.routes.ts` |
| Event → GHL bridge | ❌ Not built | Needs StreamConsumer subscriber |
| Tag automation | ❌ Not built | Needs event handler per event type |

### Next Step — Event Bridge

Create `services/api/src/modules/integrations/ghl/ghl-event-bridge.ts`:

```typescript
// Subscribe to platform events, sync to GHL
const consumer = new StreamConsumer({
  groupName: 'ghl-bridge',
  consumerName: 'api-1',
  streams: ['events:project', 'events:engagement', 'events:land',
            'events:feasibility', 'events:operations'],
})

consumer.on('project.created', async (event) => {
  await ghlService.syncContact(event.metadata.initiatorId)
  await ghlService.createOpportunity({ ... })
})
// ... etc
```
