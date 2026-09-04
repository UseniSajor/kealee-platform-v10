# Paid service order integrity

## Invariant

A successful Stripe service checkout must create exactly one durable row in
`public.public_intake_leads` before fulfillment begins. Deliverable generation,
email, queues, and AI providers are downstream work: their failure must never
discard or reverse the paid order.

The Stripe Checkout Session ID is the idempotency key. Apply
`packages/database/supabase/migrations/20260904_paid_order_ledger_idempotency.sql`
to the Supabase Postgres database (not Railway Postgres) before deploying the
webhook change.

## Supported checkout sources

- `public_intake` and `public_intake_v30`
- `product-order`
- `bundle`
- `permit-package`
- `pre-design`
- `revenue_product`

The signed webhook handles both `checkout.session.completed` and
`checkout.session.async_payment_succeeded`. When an intake row is missing, it
reconstructs a minimal order from signed Stripe metadata and routes it to human
review. Database persistence failures return an error so Stripe retries the
webhook. Fulfillment failures are recorded as retry/manual-review work after the
sale is durable.

## Operator surfaces

- Command Center: `/orders`
- OS Admin: `/purchases`
- Web Main administrative queue: `/admin/orders`

All three read `public_intake_leads`. Inspect `form_data.fulfillmentStatus`,
`form_data.requiresHumanFulfillment`, and
`form_data.fulfillmentFallbackReason` when an order needs intervention.

## Railway OS Admin build

Railway packaging must not exclude nested source folders named `services`.
Keep root service ignore patterns anchored (`/services/*`) in `.railwayignore`;
an unanchored `services/*` removes
`packages/seeds/src/services/service-catalog.seed.ts` and causes the OS Admin
recursive build to fail with TS2307.
