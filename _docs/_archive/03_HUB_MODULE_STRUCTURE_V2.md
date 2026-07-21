# HUB + MODULE STRUCTURE (V2)
**Version:** 2.0.0  
**Purpose:** Clarify app boundaries, tabs, and integration patterns for Kealee V10.

---

## Core Principle: One Shared API, Multiple Apps

- **All apps share data via** `services/api` (Fastify) + `packages/database` (Prisma schema).
- Apps are **thin clients**: UI → `services/api` → DB/events/audit.
- **os-admin** surfaces **summary + configuration** and links out to operational apps.
- **Operational apps** (e.g., `m-permits-inspections`) do day-to-day work.

---

## os-admin (Platform Management / Meta-level)

**What it is:** Internal management console for Kealee staff.  
**What it is NOT:** The place where operational work happens.

### os-admin Tabs (Required)
- **Dashboard**: Platform overview (KPIs, uptime, alerts)
- **Organizations**: Org lifecycle + subscriptions (meta)
- **Users**: User provisioning, access control, RBAC management
- **Financials ⭐**: Platform-wide revenue metrics (not per-customer ledgers)
- **Disputes**: Dispute oversight + resolution decisions (meta control)
- **Automation**: ML governance, approvals, thresholds, rule states
- **Monitoring**: System health, uptime, errors, queue status
- **Jurisdictions ⭐**: Jurisdiction setup + subscription + staff roles (not permit processing)
- **Project Managers**: PM oversight, assignments, workload balancing (management)
- **Analytics**: Platform-wide analytics (acquisition, funnel, retention)
- **Settings**: Platform configuration, feature flags, integrations

### Financials Tab (Platform Financials) — Scope
**Show (platform-wide):**
- Total platform revenue (all customers combined)
- Revenue by profit center:
  - Ops Services: \( \$X \)
  - Project Owner: \( \$X \)
  - Marketplace: \( \$X \)
  - Design: \( \$X \)
  - Permits: \( \$X \)
- MRR / ARR trends
- Churn rate
- Customer LTV
- Subscription health

**Do NOT show in os-admin Financials:**
- Individual customer escrow accounts (that’s `m-finance-trust`)
- Individual project budgets (that’s `m-project-owner`)
- Individual invoices (per-app)

### Jurisdictions Tab (Jurisdictions Management) — Scope
**Allow (configuration + oversight):**
- Add new jurisdiction
- Configure jurisdiction settings
- Set up fee schedules
- Assign jurisdiction staff roles
- Manage jurisdiction subscription (Basic/Pro/Enterprise)
- View jurisdiction summary metrics
- Link to full operational dashboard (opens `m-permits-inspections`)

**Do NOT include in os-admin Jurisdictions:**
- Permit application processing (that’s `m-permits-inspections`)
- Inspection scheduling (that’s `m-permits-inspections`)
- Plan review interface (that’s `m-permits-inspections`)
- Daily operational tasks (that’s `m-permits-inspections`)

---

## os-pm (Work Execution / Operational)

**What it is:** Execution UI for PMs doing client work.  
**What it is NOT:** Platform-level configuration.

### os-pm Tabs (Execution)
- **PM Dashboard**: Today’s workload, client list, alerts
- **Tasks**: Task queue (priority/due/status) + task detail
- **Clients**: Assigned client workspace + context
- **Reports**: Weekly report generation + history
- **SOPs**: SOP templates + checklists used to execute work
- *(Optionally later)* **Messages**: Client comms panel

---

## Permit Operations App: m-permits-inspections (Customer-facing / Daily Ops)

**What it is:** The operational system used by jurisdiction staff daily.
- Process permit applications
- Plan review workflows
- Inspection scheduling
- Status tracking + public search

---

## Integration Pattern (Example: Jurisdictions → Permits Ops)

**os-admin (summary + config):**
- Jurisdiction created/edited in os-admin
- Fee schedule configured
- Staff roles assigned
- Subscription tier set
- “Open Operational Dashboard” link

**m-permits-inspections (operational execution):**
- Permit intake, plan review, inspections, daily work

**API glue (shared):**
- `services/api` exposes jurisdiction + permit resources
- Shared IDs + events + audit logs
- Cross-app navigation uses stable routes + shared auth

---

## Repo Mapping (high level)

```
apps/
  os-admin/                 # Platform management UI
  os-pm/                    # PM execution UI
  m-permits-inspections/    # Jurisdiction operational UI

services/
  api/                      # Fastify API (single source of truth)

packages/
  database/                 # Prisma schema + client
```

