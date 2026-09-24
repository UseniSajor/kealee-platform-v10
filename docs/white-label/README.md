# Kealee White-Label Platform

This directory is the durable source of truth for Kealee's white-label product
architecture, implementation status, operating procedures, and release gates.
Future agents must read this directory before changing tenant, branding,
entitlement, billing, domain, or support-access behavior.

## Product decision

Kealee uses one maintained platform and one source tree. A white-label customer
is an `Org` with configuration, entitlements, products, usage, and deployment
policy. A customer is not a repository fork.

The supported delivery tiers are:

1. **Managed branded implementation** — Kealee provisions and operates a
   branded professional workspace on shared infrastructure.
2. **Full white-label SaaS tenant** — the client receives self-service
   administration, a custom domain, and no required visible Kealee branding.
3. **Private enterprise instance** — the same product is deployed with
   dedicated infrastructure and stricter controls. This is a premium deployment
   mode, not a separate codebase.

The first commercial release is the managed branded implementation. Full SaaS
must remain gated until cross-tenant isolation, metering, support access, and
data lifecycle tests pass.

## Where management lives

| Responsibility | Platform location | Audience |
| --- | --- | --- |
| Provision tenants, plans, products, domains, deployments, and Kealee support access | `apps/os-admin` | Kealee platform operators only |
| Configure the tenant's team, workflows, business rules, integrations, reports, and assistants | Branded professional administration experience; initially surfaced from the professional portal shell | Tenant owner/admin professionals |
| Run acquisition, development, preconstruction, property operations, permit/design, or agency workflows | Role-specific professional portals and modules | Tenant professionals |
| View a personal project, make selections, approve work, upload homeowner documents, and communicate with assigned professionals | `apps/portal-owner` | Homeowners/project customers |
| Discover and transact with professionals | Marketplace surfaces with explicit engagement records | Homeowners and professionals, with different permissions |

`apps/os-admin` is the Kealee control plane. It must not be exposed through
tenant branding. Tenant administrative controls must not be placed in the
homeowner portal.

## Mandatory audience boundary

Professionals and homeowners are separate security populations:

- A **professional** may be an `OrgMember` and may receive tenant roles and
  module entitlements.
- A **homeowner** is project/customer scoped and must not become an `OrgMember`
  merely because a professional invites them to a project.
- A homeowner sees only projects, properties, documents, messages, approvals,
  and payments explicitly shared with them.
- A professional sees tenant data only through an explicit active membership
  and the relevant role/module authorization.
- Marketplace engagement connects the two audiences; it does not merge their
  identity or authorization models.

See [AUDIENCE_BOUNDARY.md](./AUDIENCE_BOUNDARY.md) for the full rules.

## Documents

- [ARCHITECTURE.md](./ARCHITECTURE.md) — control plane, data plane, experience
  plane, tenancy model, and deployment modes.
- [AUDIENCE_BOUNDARY.md](./AUDIENCE_BOUNDARY.md) — professional/homeowner
  separation and required authorization rules.
- [PRODUCT_CATALOG.md](./PRODUCT_CATALOG.md) — commercial product templates,
  modules, and configuration principles.
- [SECURITY_AND_RELEASE_GATES.md](./SECURITY_AND_RELEASE_GATES.md) — security
  checklist, test matrix, and promotion gates.
- [OPERATIONS_RUNBOOK.md](./OPERATIONS_RUNBOOK.md) — provisioning, suspension,
  support, metering, incident, export, and termination procedures.
- [IMPLEMENTATION_LEDGER.md](./IMPLEMENTATION_LEDGER.md) — current repository
  state, target state, ownership, and next work.
- [product-templates.v1.json](./product-templates.v1.json) — non-runtime catalog
  reference for the six initial white-label products.

## Non-negotiable implementation rules

1. Never infer the active tenant from a user's first organization.
2. Never trust a request-supplied tenant identifier without independently
   resolving the authenticated membership and resource boundary.
3. Every tenant-owned record, file, vector namespace, queued job, usage event,
   integration credential, audit event, and report must be tenant scoped.
4. Paid module access is enforced by database-backed entitlements. Rollout flags
   may hide or expose a feature but are not billing authorization.
5. Kealee support access is time bound, reason bound, least privilege, and
   auditable.
6. Branding is configuration. Client-specific source forks are prohibited.
7. Secrets are stored in an approved secret manager. Database records store
   references, never plaintext credentials.
8. Model, prompt, rule, and workflow changes must be versioned and evaluated
   before promotion to affected tenants.
9. Homeowner access never grants tenant membership or tenant administration.
10. A deployment cannot be described as fully white label or enterprise ready
    until the corresponding release gate is satisfied.

## Status language

Use only these states in the implementation ledger:

- `NOT STARTED` — no usable implementation exists.
- `SCAFFOLDED` — data types or UI placeholders exist but are not end-to-end.
- `IN PROGRESS` — implementation exists in the active workstream but is not
  verified or released.
- `VERIFIED` — tests and release evidence demonstrate the stated behavior.
- `BLOCKED` — an external decision or dependency prevents progress.

Do not mark a capability `VERIFIED` because its schema or screen exists.
