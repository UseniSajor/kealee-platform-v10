# Architecture Update: PM Dashboard (Ops OS Core)

This document clarifies **Ops OS Core** app boundaries and the folder structure impact of new os-admin tabs.

---

## Definitions (Non-negotiable)

### os-admin = Platform Management (Meta-level)
- Manages the platform itself (configuration + oversight)
- Sets up jurisdictions, but **does not** process permits
- Views platform financials, **not** individual customer accounts
- Configures settings, **does not** execute work

### os-pm = Work Execution (Operational)
- Executes client work
- Processes service requests
- Manages PM tasks and reports

### m-permits-inspections = Permit Operations (Customer-facing)
- Processes permit applications
- Manages inspections
- Used by jurisdiction staff daily

---

## os-admin Features (Updated)

os-admin includes:
- Dashboard
- Organizations
- Users + RBAC
- **Financials ⭐** (platform-wide revenue, MRR/ARR, churn, LTV, subscription health)
- Disputes
- Automation
- Monitoring
- **Jurisdictions ⭐** (setup/config + subscription + staff roles + link-out)
- Project Managers (oversight + assignments)
- Analytics
- Settings

---

## Folder Structure (App Router)

### os-admin (Platform Management)

Planned route groups under `apps/os-admin/app/`:

```
apps/os-admin/app/
  dashboard/
  orgs/
  users/
  financials/        # ⭐ NEW
  disputes/
  automation/
  monitoring/
  jurisdictions/     # ⭐ NEW
  project-managers/
  analytics/
  settings/
```

### os-pm (Work Execution)

Planned route groups under `apps/os-pm/app/`:

```
apps/os-pm/app/
  pm/                # execution dashboard
  pm/tasks/
  pm/clients/
  pm/reports/
  pm/sops/
```

---

## Integration Pattern (How PM + Jurisdictions connect)

- os-admin surfaces **summary + configuration**
- It links out to execution UIs:
  - Jurisdictions → opens `m-permits-inspections` for daily permit ops
  - Project Managers → opens `os-pm` for PM execution queues
- All apps read/write via `services/api` (shared data + audit/event logging)

