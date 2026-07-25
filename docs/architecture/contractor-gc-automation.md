# Contractor and GC automation ownership

The former `Kealee Platform Agents/Mini App files` folder was a standalone
prototype containing a second copy of the PM automation suite. It is not a
runtime dependency of Kealee and is intentionally excluded from the platform
source.

The production implementation lives in the command-center apps and shared
automation package:

| Prototype capability | Canonical command-center app | Shared implementation |
| --- | --- | --- |
| Contractor bid engine | `services/command-center/apps/APP-01-bid-engine` | `packages/automation/src/apps/bid-engine` |
| Site visits | `APP-02-visit-scheduler` | `visit-scheduler` |
| Change orders | `APP-03-change-order` | `change-order` |
| Reports | `APP-04-report-generator` | `report-generator` |
| Permits | `APP-05-permit-tracker` | `permit-tracker` |
| Inspections | `APP-06-inspection` | `inspection-coord` |
| Budget tracking | `APP-07-budget-tracker` | `budget-tracker` |
| Communications | `APP-08-communication` | `communication-hub` |
| Task queue | `APP-09-task-queue` | `task-queue` |
| Documents | `APP-10-document-gen` | `document-gen` |
| Predictive issues | `APP-11-predictive` | `predictive-engine` |
| Scheduling | `APP-12-smart-scheduler` | `smart-scheduler` |
| QA inspection | `APP-13-qa-inspector` | `qa-inspector` |
| Decision support | `APP-14-decision-support` | `decision-support` |

These workflows are used for contractor, GC, and builder operations through
Command Center and the existing marketplace/API routes. The prototype's
duplicate server, web app, generated `node_modules`, and local environment
files are not needed for production and must not be imported or committed.
