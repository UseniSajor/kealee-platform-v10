# White-Label Operations Runbook

## Ownership

Kealee platform operations manages white-label tenants from `apps/os-admin`.
Tenant professionals manage delegated configuration from their branded
professional administration experience. Homeowners never perform tenant
operations.

Every operation below must produce a tenant audit event with actor, action,
resource, timestamp, and reason when appropriate.

## Provision a managed branded tenant

1. Confirm signed scope, delivery tier, support tier, modules, usage treatment,
   data providers, and responsible client administrator.
2. Create or select the canonical `Org`.
3. Create the white-label profile in `DRAFT` state.
4. Assign a versioned product template.
5. Review and grant module entitlements. Do not infer paid access only from the
   product assignment.
6. Create the tenant plan and external billing references.
7. Allocate unique storage, queue, vector, and cache namespaces.
8. Add vault references for tenant-specific integration credentials.
9. Configure branding, support contact, locale, currency, time zone,
   navigation, email, reports, and disclaimers.
10. Invite the tenant owner/admin as a professional `OrgMember`.
11. Load approved workflows, business rules, integrations, and evaluation
    cases.
12. Run tenant isolation, audience-boundary, branding, email, document, usage,
    and evaluation tests.
13. Obtain internal release approval and client configuration acceptance.
14. Activate the tenant and record `provisionedAt`/`activatedAt`.

Do not create homeowner memberships during provisioning.

## Configure a custom domain

1. Normalize and validate the hostname; reject wildcards unless explicitly
   supported.
2. Ensure global hostname uniqueness.
3. Generate a verification token and show only the required DNS record.
4. Verify DNS ownership before routing traffic.
5. Provision/verify TLS and branded authentication callbacks.
6. Test tenant resolution, login/logout, password/account flows, email links,
   report links, and canonical redirects.
7. Mark the domain active and primary only after checks pass.
8. Audit every domain/status change.

On verification failure, retain the last known safe routing and expose no tenant
data on the unverified hostname.

## Activate or change a product/module

1. Confirm commercial approval and plan impact.
2. Select the product-template version.
3. Preview configuration and entitlement changes.
4. Add or update `ModuleEntitlement` with activation/expiration dates.
5. Apply tenant configuration through a recorded change set.
6. Run module authorization and tenant evaluation tests.
7. Update navigation after server-side authorization is active.
8. Notify the tenant and monitor first use.

Disabling a module must revoke API access before or with UI removal. Preserve
data according to contract and retention policy; do not delete it implicitly.

## Tenant support access

1. Record the tenant, requesting Kealee actor, reason, requested permissions,
   and expiration.
2. Obtain approval according to tenant/support policy.
3. Issue access only for the approved org, permissions, and time window.
4. Display that support context is active.
5. Attribute operations to the real Kealee user and support session.
6. End access automatically at expiration or immediately on revocation.
7. Review the audit trail and attach it to a support incident when required.

Never share tenant-user credentials or create permanent shadow users.

## Usage and billing reconciliation

Daily:

- monitor ingestion failures, duplicate idempotency keys, model/provider cost
  anomalies, and tenants approaching limits;
- retry external meter reporting idempotently;
- verify billable jobs cannot run without tenant attribution.

At billing close:

1. Freeze/finalize the period's rollup without mutating source events.
2. Reconcile rollups to provider totals and external billing meters.
3. Apply included usage and contract rate version.
4. Flag anomalies for human review before invoice finalization.
5. Retain calculation evidence and external event identifiers.
6. Notify approved tenant billing contacts.

Corrections are offset/void events with reasons, never destructive rewrites of
the original usage history.

## Suspend a tenant

1. Record reason, approver, effective time, and contract/data policy.
2. Stop new privileged and billable operations according to policy.
3. Preserve required customer read/export access if contractually required.
4. Revoke or pause tenant integration and model credentials safely.
5. Prevent queued work from executing after suspension unless explicitly
   approved for cleanup/export.
6. Keep audit, billing, and security evidence immutable.
7. Notify designated contacts through approved channels.

Suspension is not deletion.

## Export and termination

1. Verify the requestor and documented authority.
2. Define included data, format, delivery method, and cutoff date.
3. Generate export in a tenant-scoped job and storage location.
4. Validate that the export contains no platform secrets, other-tenant data, or
   Kealee proprietary implementation assets.
5. Deliver through a time-limited authorized channel and audit access.
6. Revoke users, domains, integrations, queues, and active sessions according to
   the termination schedule.
7. Apply the approved retention/deletion schedule across database, storage,
   vectors, caches, logs, and backups.
8. Record completion evidence and any legally required hold.

## Security or isolation incident

1. Stop the affected route/job/integration or isolate the tenant without
   destroying evidence.
2. Revoke exposed sessions/credentials and prevent further cross-tenant access.
3. Preserve logs, traces, audit events, deployment version, and relevant data
   snapshots.
4. Identify affected tenants, data classes, time window, and access path.
5. Follow Kealee's security incident and notification process.
6. Add a regression test reproducing the issue before restoring service.
7. Re-run the relevant release gate and tenant evaluation suites.
8. Document root cause, correction, and prevention in the implementation
   ledger or linked incident record.

## Dedicated enterprise instance

Provision from the same release artifact and recorded configuration:

- approved environment/project;
- dedicated database and migrations;
- storage and vector namespaces/projects;
- tenant-specific secrets and provider credentials;
- monitoring, alerts, backup, retention, and SLO policy;
- domain/auth callbacks;
- release channel and rollback target;
- customer-cloud responsibility matrix if applicable.

Never patch a dedicated instance manually without recording the change for the
shared release process.
