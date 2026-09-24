# White-Label Security and Release Gates

## Security objective

No tenant actor, homeowner, background job, integration, cache, model context,
or Kealee support session may read or mutate another tenant's protected data
without an explicit, authorized, audited platform operation.

## Tenant isolation checklist

### Identity and context

- [ ] Active tenant is explicit; there is no first-membership fallback.
- [ ] Professional tenant access requires active `OrgMember`.
- [ ] Homeowner access uses explicit project/customer relations, not
      `OrgMember`.
- [ ] Tenant selector values are independently authorized.
- [ ] Platform admin, tenant admin, support, professional, and homeowner roles
      are distinct.
- [ ] Dual-audience context switching fails closed.

### Database

- [ ] Every tenant-owned table is identified in a maintained inventory.
- [ ] Required `orgId` columns are non-null and foreign-keyed.
- [ ] Common queries use tenant-leading indexes.
- [ ] Tenant-local identifiers use tenant-composite uniqueness.
- [ ] Database policies match the actual Prisma/server database role.
- [ ] Application/service database roles cannot bypass required isolation.
- [ ] Create, read, update, delete, bulk, export, and relation traversal have
      positive and negative tenant tests.
- [ ] Raw SQL and administrative jobs receive the same review.

### Storage, queues, vectors, and caches

- [ ] Storage objects use tenant prefixes and signed access checks.
- [ ] Queue messages require immutable tenant and correlation identifiers.
- [ ] Workers reject missing/invalid tenant context.
- [ ] Vector searches are tenant namespaced and leakage tested.
- [ ] Cache keys begin with tenant scope; invalidation cannot cross tenants.
- [ ] Generated downloads, reports, and previews re-check authorization.

### Secrets and integrations

- [ ] Only vault/secret-manager references are stored in tenant records.
- [ ] Tenant credentials are not reused across unrelated tenants unless they are
      documented platform credentials.
- [ ] Webhooks authenticate the provider and resolve tenant from trusted stored
      mappings.
- [ ] Secret creation, rotation, and removal are audited.
- [ ] Dedicated credentials exist where the enterprise contract requires them.

### Usage and billing

- [ ] Usage events are append-only and idempotent.
- [ ] Every event has `orgId`, metric, quantity, unit, time, and an idempotency
      key.
- [ ] Provider/model/resource metadata contains no unnecessary confidential
      payload.
- [ ] Rollups reconcile to source events and external billing records.
- [ ] Entitlements fail closed if the plan is suspended or expired according to
      the contract policy.
- [ ] Cost and anomaly alerts are tested.

### Support and administration

- [ ] Kealee control-plane routes require explicit platform-admin permission.
- [ ] Tenant support access is requested/approved as policy requires.
- [ ] Support access has reason, permission scope, start, expiry, and revocation.
- [ ] Reads and writes during support access are attributable to the real Kealee
      actor.
- [ ] Tenant admins cannot grant platform roles or deployment mode.
- [ ] Administrative export and deletion operations require confirmation and
      immutable audit evidence.

### AI quality and safety

- [ ] Each tenant/product has approved evaluation cases.
- [ ] Prompt, model, rule, and workflow versions are recorded.
- [ ] Evaluation thresholds and human-review policies are enforced.
- [ ] Changes do not silently affect all tenants.
- [ ] High-impact financial, engineering, architecture, and permitting outputs
      carry appropriate review requirements and disclaimers.

## Automated test matrix

At minimum, run every applicable operation with:

| Actor | Same tenant/resource | Other tenant/resource | Expected result |
| --- | --- | --- | --- |
| Tenant owner/admin | Authorized | Not authorized | allow / deny |
| Tenant professional | Role permitted | Not authorized | allow / deny |
| Homeowner | Explicitly shared project | Tenant admin or unrelated project | allow / deny |
| Background worker | Valid tenant job | Missing/mismatched tenant | process / reject |
| Kealee support | Active scoped session | Expired/wrong scope | allow+audit / deny |
| Platform operator | Explicit privileged operation | Unauthenticated/unprivileged | allow+audit / deny |

Tests must include list/search, object lookup, nested relationship loading,
direct identifiers, exports, file download, vector retrieval, queued jobs,
webhooks, caches, and generated artifact URLs.

## Release gates

### Gate A — Managed branded pilot

Required before the first external managed branded tenant:

- canonical `Org` white-label profile and product assignment;
- explicit tenant selection with no first-membership fallback;
- platform-admin protection for provisioning and support routes;
- brand applied to the selected portal, email, and report paths;
- module entitlements enforced server-side;
- tenant namespaces for data, files, jobs, vectors, and caches used by the pilot;
- cross-tenant and homeowner/professional boundary tests passing;
- audit trail for configuration and privileged access;
- backup, export, suspension, and incident procedures rehearsed.

### Gate B — Full white-label SaaS

Requires Gate A plus:

- verified custom domain and certificate lifecycle;
- branded authentication and email sender validation;
- tenant-admin self-service with least privilege;
- metered usage reconciliation and overage safeguards;
- deletion/retention/export workflows;
- tenant evaluation suites and controlled prompt/model rollout;
- two production-like tenants passing isolation tests with overlapping local
  identifiers and similar data;
- documented SLO, support, and recovery expectations.

### Gate C — Private enterprise

Requires Gate B plus:

- automated dedicated environment provisioning and deprovisioning;
- separate database, storage, secrets, model credentials, and monitoring as
  contracted;
- deployment promotion, rollback, backup restore, and disaster recovery test;
- customer-cloud responsibility matrix when applicable;
- enterprise retention, logging, security, and service-level controls;
- commercial approval confirming dedicated operating costs are covered.

## Evidence required to mark a gate complete

Record in `IMPLEMENTATION_LEDGER.md`:

- commit and migration identifiers;
- test command and result;
- environment/date used for verification;
- relevant screenshots or artifact paths where UI is involved;
- approver for security and commercial readiness;
- known exceptions with an owner and expiration date.

No gate is complete based only on code review or schema generation.
