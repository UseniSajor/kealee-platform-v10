# Architecture Quick Reference (V10)

## App Responsibilities (At a Glance)

### os-admin = Platform Management (Meta-level)
Internal management console for Kealee staff.

**Tabs:**
- Dashboard
- Organizations
- Users (user provisioning & RBAC)
- Financials ⭐ (platform-wide revenue, MRR/ARR, churn, LTV)
- Disputes (resolution decisions + oversight)
- Automation (ML governance & approvals)
- Monitoring (health/uptime/errors)
- Jurisdictions ⭐ (setup/config + staff roles + subscription + link-out)
- Project Managers (oversight & assignments)
- Analytics (platform-wide)
- Settings (platform config)

**Does NOT do:**
- Daily permit processing (that’s `m-permits-inspections`)
- Customer escrow ledgers (that’s `m-finance-trust`)
- Project budgets & milestones (that’s `m-project-owner`)

### os-pm = Work Execution (Operational)
PM execution console (staff doing client work).

**Core areas:**
- PM dashboard
- Task queue + task detail
- Clients + assignments
- Reports + SOP execution

### m-permits-inspections = Permit Operations (Customer-facing)
Operational app for jurisdiction staff.
- Permit intake + plan review + inspections

---

## Integration Pattern (Always)

```
os-admin (summary + config)
   └─links→ operational apps (execution)
               └─uses→ services/api (shared data, events, audit)
```

---

## Repo Anchors

```
apps/         # UIs (os-admin, os-pm, customer-facing modules)
services/api  # Fastify API (single source of truth)
packages/db   # Prisma schema/client (shared data model)
```

