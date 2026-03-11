# ADR-006: KXL Integration Adapter Pattern

**Status:** Accepted
**Date:** 2026-03-09
**Context:** v10 has ad-hoc integrations (GHL, Stripe, Procore) scattered across modules

## Decision

Unified adapter framework (`packages/core-integrations`) replacing ad-hoc integrations:

```
IntegrationAdapter (abstract base)
├── GHLAdapter      — CRM (contacts, opportunities)
├── StripeAdapter   — Payments (charges, refunds, subscriptions)
└── ProcoreAdapter  — Construction management (projects, RFIs, submittals)
```

Each adapter provides:
- `healthCheck()` — connectivity verification
- `request(method, path, body?)` — authenticated HTTP calls
- Domain-specific methods (e.g., `createContact`, `getProjects`)

AdapterRegistry manages adapter lifecycle and provides bulk health checks.

## Rationale

- Consistent error handling and timeout management across integrations
- Health checks enable monitoring dashboard for integration status
- New integrations follow the same pattern (extend IntegrationAdapter)
- Testable: mock the adapter for unit tests instead of mocking HTTP calls

## Consequences

- Existing direct API calls should be migrated to use adapters
- Each adapter needs its own set of environment variables
- Rate limiting must be handled per-adapter (different APIs have different limits)
