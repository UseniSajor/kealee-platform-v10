# White-Label Architecture

## Architectural intent

Kealee white labeling is a tenant control layer over the existing platform. The
canonical tenant is `Org`. White-label profile, product assignments, plans,
domains, usage, deployment settings, evaluation suites, and support sessions
belong to that organization.

Do not create a parallel `Tenant` root model unless an approved architecture
decision replaces `Org`. Do not use the legacy `V30WhiteLabelConfig` as a second
tenant system. Its useful values must be migrated into the canonical profile.

`Org.tenantKind` is the explicit commercial and responsibility boundary:
`KEALEE_DIRECT` retains the homeowner/project commerce path, while
`WHITE_LABEL` identifies a professional company whose platform access is
governed by its `TenantPlan`. Provisioning rejects homeowner/customer
memberships and marks only the professional organization as `WHITE_LABEL`.

## System planes

```text
Kealee control plane (apps/os-admin)
  -> organization lifecycle
  -> product and module assignments
  -> plan, usage, and deployment policy
  -> domain verification
  -> support access and audit

Tenant experience plane (professional portals/modules)
  -> tenant resolution from trusted host/session context
  -> brand, navigation, documents, email, and assistant configuration
  -> tenant owner/admin self-service where tier permits
  -> professional operational workflows

Homeowner experience plane (apps/portal-owner)
  -> project-scoped customer experience
  -> no white-label control-plane access
  -> no tenant membership by implication

Data plane
  -> tenant-scoped relational records
  -> tenant-scoped storage, queues, vectors, caches, and secrets
  -> usage ledger, evaluations, and audit evidence
```

## Tenant context resolution

Every request that touches tenant data must establish one canonical context:

1. Verify the authenticated identity.
2. Resolve the requested organization from a trusted source, such as a verified
   hostname, an explicit organization selector stored in the session, or a
   signed internal service assertion.
3. Verify active membership for professional users or explicit project access
   for homeowner users.
4. Load role and module entitlements.
5. attach an immutable context to the request/job:
   `actorUserId`, `audience`, `orgId`, `roleKey`, `entitlements`, and
   `supportAccessSessionId` when applicable.
6. Execute data access through a tenant-aware service boundary.
7. Emit an audit or usage event when the operation requires it.

The active organization must never fall back to `orgMemberships[0]`. Query/body
organization identifiers are selectors, not authorization proof.

## Management surfaces

### Kealee platform operations

Location: `apps/os-admin`.

Target navigation:

- White Label / Tenants
- White Label / Product Templates
- White Label / Plans and Metering
- White Label / Domains
- White Label / Deployments
- White Label / Evaluations
- White Label / Support Access
- White Label / Audit and Security

This surface provisions and services every white-label product. Existing
organization, modules, subscriptions, audit, and enterprise screens should be
consolidated behind this control plane rather than duplicated.

### Tenant professional administration

Location: the branded professional portal shell, shared by professional
products and rendered according to role and module entitlements.

Tenant owners/admins may manage only their organization's:

- professional users and roles;
- workflows and approved business rules;
- integrations and secret references;
- reports, documents, email templates, and notification preferences;
- assistants, knowledge sources, and evaluation cases;
- usage visibility, subject to plan;
- branding fields explicitly delegated by the delivery tier.

Tenant administrators cannot change deployment mode, billing contracts,
platform-wide templates, Kealee support roles, or another tenant.

### Homeowner experience

Location: `apps/portal-owner`.

Homeowners may see client branding as part of their project experience, but do
not manage the brand or organization. Their authorization derives from explicit
project/customer relationships. See `AUDIENCE_BOUNDARY.md`.

## Core domain model

Target entities and ownership:

| Entity | Parent | Purpose |
| --- | --- | --- |
| `Org` | platform | Canonical professional tenant |
| `WhiteLabelTenantProfile` | `Org` | Brand, locale, contact, navigation, and white-label tier |
| `TenantDomain` | `Org` | Verified custom hostnames and primary domain |
| `WhiteLabelProductTemplate` | platform | Versioned product/module/workflow blueprint |
| `TenantProductAssignment` | `Org` | Tenant-specific configuration of a product template |
| `ModuleEntitlement` | `Org` | Authoritative paid/contract module access |
| `TenantPlan` | `Org` | Commercial plan and billing references |
| `TenantUsageEvent` | `Org` | Append-only, idempotent usage facts |
| `TenantUsageRollup` | `Org` | Billing/reporting aggregation, derived from events |
| `TenantSecretReference` | `Org` | Reference to an externally stored secret |
| `TenantDeploymentConfig` | `Org` | Shared/dedicated mode and tenant namespaces |
| `TenantEvaluationSuite` | `Org` | Customer-specific expected behavior and quality gates |
| `TenantSupportAccessSession` | `Org` | Time-limited Kealee access approval |
| `TenantAuditEvent` | `Org` | Immutable actor/resource/security audit trail |

## Entitlements and rollout flags

- `ModuleEntitlement` is the fail-closed authorization decision for paid or
  contract modules.
- Product templates seed recommended entitlements but do not replace them.
- Rollout/experiment flags control availability of code already authorized for
  the tenant. A flag cannot grant a module that the tenant does not own.
- UI navigation is derived from authorization; hiding a link is not access
  control.

## Data isolation strategy

Every tenant-owned table must have a non-null `orgId` unless an approved data
classification explicitly makes it platform global. Add tenant-leading indexes
for common access patterns and composite uniqueness where identifiers are only
unique inside a tenant.

Database enforcement must match Kealee's actual connection path. If server
connections bypass row-level security, application filters are not an adequate
substitute. The release design must use a non-bypass application role and a
transaction-scoped tenant context, or another reviewed database-enforced
mechanism. Test the chosen behavior through Prisma and all worker paths.

Non-relational boundaries:

- storage key: `tenants/{orgId}/...`;
- queue message: immutable `orgId` plus actor/correlation identifiers;
- vector namespace: tenant-specific namespace, never a shared unfiltered index;
- cache key: tenant prefix before resource identity;
- webhook: derive/verify tenant from stored endpoint/customer mapping;
- secret: tenant-specific vault reference;
- logs/traces: include tenant correlation but avoid confidential payloads.

The shared `tenant-scope` helpers are the required key/namespace constructors.
They do not, by themselves, prove that every historical storage, queue, vector,
or cache call site has migrated; that remains a release-gate inventory item.

## Deployment tiers

### Managed branded

- shared Kealee environment;
- Kealee-operated provisioning and configuration;
- client brand in professional and customer-facing outputs;
- visible `Powered by Kealee AI` may be required by contract;
- limited delegated administration.

### Full white-label SaaS

- shared Kealee environment with verified custom domain;
- client-branded authentication, portal, documents, and email;
- customer admin controls;
- no required visible Kealee branding where contract allows;
- still hosted, updated, and monitored by Kealee.

### Private enterprise

- dedicated Kealee environment or approved customer-cloud deployment;
- separate database, storage, model/data credentials, and retention policy as
  contracted;
- stronger service levels, security controls, and deployment promotion;
- same source branch and product release process as the shared platform.

## Versioning and change control

- Product templates are versioned and never silently rewritten for active
  tenants.
- Prompt, model, business-rule, report-template, and workflow versions are
  recorded with generated output where practical.
- Migrations are additive-first and rollback-aware.
- Shared improvements must pass platform regression tests and the evaluation
  suites of affected tenants before rollout.
- Tenant overrides are configuration records with an owner and change history,
  not ad hoc conditionals in shared code.
