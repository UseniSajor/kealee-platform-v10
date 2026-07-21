# Marketing System Implementation Status

Last updated: 2026-07-20

This is the canonical progress ledger for the marketing and sales consolidation.
Update it whenever implementation state changes. A checked item means the code is
implemented and its focused verification has passed. Deployment-dependent work is
kept separate from repository implementation.

## Completed

- [x] Phase 1 repository architecture audit.
- [x] Canonical ownership decision: `public_intake_leads` remains the intake/CRM
  system of record; the Marketplace `Lead` model remains a project opportunity.
- [x] Canonical application decision: `web-main` owns capture/conversion,
  Marketing OS owns content/SEO/social intelligence, and Command Center owns staff
  operations.
- [x] Agent reuse and consolidation plan; no new marketing agent is authorized.
- [x] Worker, queue, integration, notification, event, and workflow inventory.
- [x] Additive marketing data-foundation design with tenant-aware RLS.

## In progress

- [ ] Add and validate the canonical marketing data migration.
- [ ] Centralize lead ingestion, normalization, deduplication, attribution,
  scoring, product matching, consent, and suppression checks.
- [ ] Replace direct capture-route inserts and immediate sends with the canonical
  ingestion and outreach-policy services.

## Remaining repository implementation

### Data foundation

- [ ] Add typed campaign, approval, sequence, enrollment, message-attempt,
  suppression, consent, attribution, opportunity, partner, referral, commission,
  integration-cursor, and daily-metric tables.
- [ ] Add tenant/organization ownership to revenue catalog transactions.
- [ ] Seed the four approved Revenue Product Catalog products.
- [ ] Add database uniqueness constraints for identity and duplicate sends.
- [ ] Add RLS and least-privilege grants to every exposed marketing table.
- [ ] Deprecate the duplicate legacy `leads` migration and document data mapping.

### Capture and Apollo

- [ ] Canonical website capture.
- [ ] Optional Apollo API client, pagination cursor, caps, rate-limit handling,
  retention, source IDs, and health monitoring.
- [ ] Deterministic normalization and deduplication.
- [ ] Authoritative lead scoring with grade, reasons, products, next action, and
  review decision.
- [ ] Deterministic product matching and out-of-scope protection.

### Outreach and sequences

- [ ] Approved template registry and claims policy.
- [ ] Campaign approval enforcement.
- [ ] Durable sequence enrollment and step ledger.
- [ ] Global suppression and opt-out checks before enqueue and before send.
- [ ] Mailbox/domain limits, business windows, timezone handling, and capacity.
- [ ] Reply, bounce, complaint, and provider event ingestion.
- [ ] Automatic campaign health pause.
- [ ] Remove or rewrite unsupported guarantees and unapproved claims in existing
  sequence content before any activation.

### Sales conversion and recovery

- [ ] Meeting, proposal, direct-checkout, and opportunity stage integration.
- [ ] Checkout/intake abandonment detection and configurable recovery.
- [ ] Payment/revenue attribution and fulfillment handoff.
- [ ] Stop sequences on reply, opt-out, complaint, bounce, purchase, or hold.

### Referral partners

- [ ] Partner registration and approval.
- [ ] Referral links/codes and attribution.
- [ ] Commission accrual, approval, payment status, fraud review, and reversal.
- [ ] Partner dashboard and support workflow.

### Command Center and operations

- [ ] Unified funnel, campaign, revenue, email, Apollo, and queue dashboard.
- [ ] Daily marketing brief and alert rules.
- [ ] Consolidate overlapping dashboards, agents, event adapters, and cron wrappers.

### Verification and production

- [ ] Complete the required 40-case marketing test matrix.
- [ ] Run Prisma validation/generation, focused unit tests, typechecks, and builds.
- [ ] Run Supabase RLS/security advisors against a linked or local database.
- [ ] Apply migrations to staging and execute smoke tests.
- [ ] Activate shadow ingestion/scoring and compare results.
- [ ] Activate low-volume approved outbound behind feature flags.
- [ ] Production deployment, monitoring, and rollback rehearsal.

## Current blockers / external dependencies

- Supabase migration application and advisors require a configured local or linked
  Supabase project.
- Apollo execution requires an approved Apollo API key and audience configuration.
- Email/SMS production verification requires configured provider credentials and
  approved sending domains/mailboxes.
- Calendar verification requires configured Calendly or calendar credentials.
- Production activation requires human approval of campaigns, templates, claims,
  limits, lead sources, and compliance policies.

