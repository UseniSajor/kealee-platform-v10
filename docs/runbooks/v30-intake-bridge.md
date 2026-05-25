# v30 bots + intake flow — bridge plan

## Today (v20 production path)

```
Stripe paid → webhook → POST /api/concept/generate (web-main)
  → Claude (concept package JSON)
  → Replicate (renders + optional video cron)
  → UPDATE public_intake_leads (form_data.conceptOutput, status=concept_ready)
  → Resend concept-ready email → owner.kealee.com/deliverables/:id
```

KeaBots (`packages/core-bots/`), worker processors (`concept-engine.processor.ts`, `concept-delivery.processor.ts`), and `packages/kealee-agent-stack/` are **not** on this hot path yet.

## Target (v30)

```
Stripe paid → webhook → enqueue v30 job (BullMQ / core-events)
  → DesignBot + PermitBot + … (parallel, kealee-agent-stack)
  → Persist deliverables + notify portal
  → Same owner portal URLs (NEXT_PUBLIC_OWNER_PORTAL_URL)
```

## Phased connection (recommended)

| Phase | Work | Owner |
|-------|------|--------|
| **0** (now) | Fix portal redirects + concept DB save errors | Done in repo |
| **1** | Feature flag `V30_INTAKE_ENABLED` on webhook: paid intakes enqueue v30 **and** call v20 generate (shadow) | web-main |
| **2** | v30 output written to `form_data.v30ConceptOutput`; portal reads v30 when present | portal-owner + web-main |
| **3** | Turn off v20 generate for flagged paths; v30 only | web-main |
| **4** | Marketing/lifecycle hooks on v30 completion event | lifecycle.ts |

**Earliest safe cutover:** after Phase 2 parity test on kitchen + addition_expansion + exterior_concept in staging.

## Do not break

- `GHL_ENABLED=false` marketing stack
- Redis / queue errors must throw (GAP-03)
- Prices from `@kealee/core-rules` only
