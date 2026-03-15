# GHL Workflow Map — GoHighLevel Automation

> Last updated: 2026-03-15
> CRM: GoHighLevel (not Zoho)
> GHL integration: `services/api/src/modules/integrations/ghl/`

---

## Workflow Inventory by Audience

### Owner Workflows

| Workflow Name | Trigger | Steps | Suppression |
|---------------|---------|-------|-------------|
| **Owner Welcome** | Tag: `kealee-user` + role: `owner` | Email D0, SMS D1, Email D3, Call task D5 | If unsubscribed |
| **Project Kickoff** | Opportunity: `Project Created` stage | Email (project overview), SMS (next steps), assign task to CS team | If already in active workflow |
| **Design Phase** | Opportunity moves to `Design Phase` | Email (design checklist), task (review drawings), wait 7d, follow-up | None |
| **Permits Reminder** | Opportunity: `Permits Phase`, wait 14d | Email (permit timeline tips), SMS if no response | If permits filed (custom field set) |
| **Construction Ready** | Opportunity: `Construction Ready` | Email (celebration + next steps), Slack notification to ops team | None |
| **Final Payment Follow-up** | Tag: `payment-released` | 3-day wait → email (lien waiver reminder) → 7-day wait → CS task | If lien waiver uploaded |
| **Referral Campaign** | Tag: `completed-project` | Email D0 (referral ask), Email D14 (testimonial request), SMS D30 | If already referred |
| **Re-engagement** | Tag: `feasibility-rejected`, 30d wait | Email (market update), Email +14d (new opportunity) | If new project created |

### Contractor Workflows

| Workflow Name | Trigger | Steps | Suppression |
|---------------|---------|-------|-------------|
| **Contractor Onboarding** | Tag: `kealee-user` + role: `contractor` | Email (profile setup checklist), SMS D1, Email D3 (verification reminder) | If verified |
| **Verification Reminder** | Tag: `active-contractor`, 7d after signup, not verified | SMS (doc upload reminder), Email D2, Email D5 (final reminder) | If verified |
| **Bid Won** | Opportunity: `Bid Won` stage | Email (congratulations + contract link), SMS, assign CS account manager | None |
| **Milestone Due** | Custom field: `next_milestone_date` - 3d | SMS (milestone reminder), Email if no response 24h | If milestone submitted |
| **Dispute Alert** | Tag: `dispute` | Internal Slack alert, Email to contractor (dispute details), assign dispute manager | None |
| **Post-Project Review** | Tag: `completed-project` (contractor) | Email (review request), 7d wait, SMS if no review | If review submitted |
| **Inactive Contractor** | No activity 60d | Email (re-engagement), SMS D7, remove from active pool tag D30 | If new bid submitted |

### Developer Workflows

| Workflow Name | Trigger | Steps | Suppression |
|---------------|---------|-------|-------------|
| **Developer Welcome** | Tag: `kealee-user` + role: `developer` | Email (platform overview), call task D2, email D5 (case study) | If unsubscribed |
| **Land Acquisition** | Tag: `land-owner` | Email (development checklist), task (assign land coordinator) | None |
| **Feasibility GO** | Tag: `feasibility-approved` | Email (next steps), introduce finance team, assign developer success manager | None |
| **Capital Stack** | Opportunity: `Capital Stack` stage | Email (lender network intro), task (schedule finance call) | If capital stack finalized |
| **Entitlement Update** | Custom field: `entitlement_status` changed | Email (status update), assign permit coordinator if SUBMITTED | None |

---

## Trigger Definitions

### Contact-Based Triggers

```
tag_added:kealee-user         — New user registration (any role)
tag_added:has-project         — First project created
tag_added:active-contractor   — First engagement started
tag_added:dispute             — Dispute opened on engagement
tag_added:completed-project   — Turnover signed off
tag_added:feasibility-approved — GO decision on feasibility
```

### Opportunity-Based Triggers

```
opportunity.stage_changed = "Project Created"
opportunity.stage_changed = "Design Phase"
opportunity.stage_changed = "Construction Ready"
opportunity.stage_changed = "Closed Won"
opportunity.stage_changed = "On Hold"
```

### Time-Based Triggers

```
contact.created_at + 7 days AND NOT verified   → verification reminder
last_activity + 60 days AND tag:active-contractor → inactive workflow
custom_field.next_milestone_date - 3 days       → milestone reminder
```

---

## Suppression Rules

| Condition | Suppressed Workflow |
|-----------|---------------------|
| `unsubscribed = true` | All email steps |
| `sms_opt_out = true` | All SMS steps |
| Already in a workflow for same trigger | Duplicate enrollment prevented |
| Tag already set | Re-enrollment blocked |
| `dispute` tag active | All non-dispute workflows paused |

---

## Custom Field Definitions Required in GHL

| Field Key | Type | Source | Description |
|-----------|------|--------|-------------|
| `kealee_user_id` | Text | Auth signup | Kealee internal UUID |
| `kealee_role` | Dropdown | Auth signup | owner/contractor/developer/admin |
| `project_count` | Number | project.created event | Number of projects |
| `project_id` | Text | project.created event | Most recent project UUID |
| `land_acquired` | Boolean | land.offer.accepted | Has acquired land |
| `feas_status` | Dropdown | feasibility.study.decided | GO/NO_GO/PENDING |
| `financing_status` | Text | development.capitalStack event | Status of capital stack |
| `dispute_open` | Boolean | engagement.dispute events | Active dispute flag |
| `next_milestone_date` | Date | milestone submitted | Next due milestone date |
| `project_complete` | Boolean | operations.turnover.completed | Project completed |
| `contractor_verified` | Boolean | verification.approved | Contractor verification status |
| `last_engagement_date` | Date | engagement events | Last active engagement date |

---

## Implementation Status

| Workflow | Built in GHL | API Event Hooked | Notes |
|----------|-------------|-----------------|-------|
| Owner Welcome | ❌ | ❌ | Needs GHL workflow builder |
| Project Kickoff | ❌ | ✅ (project.created emitted) | Event fires, GHL not yet enrolled |
| Contractor Onboarding | ❌ | ❌ | |
| Bid Won | ❌ | ❌ | |
| Dispute Alert | ❌ | ✅ (engagement.dispute.opened emitted) | Event fires, workflow not built |

**Action Required:** Build each workflow in GHL Workflow Builder, using Webhook trigger from `POST /webhooks/ghl` which receives events from `ghl-webhook.routes.ts`.
