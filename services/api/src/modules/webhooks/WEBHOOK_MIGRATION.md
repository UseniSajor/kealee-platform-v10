# Stripe Webhook Consolidation — Migration Notes

## Summary

Three competing Stripe webhook endpoints have been consolidated into one canonical endpoint.

## Canonical Endpoint

```
POST /webhooks/stripe
```

Registered in: `canonical-stripe-webhook.routes.ts`
Handler: `handleStripeWebhook()` from `stripe.webhook.ts`

## Deprecated Endpoints

| Old Endpoint | File | Status |
|---|---|---|
| `POST /billing/stripe/webhook` | `billing.routes.ts` | **Forwarding** — logs deprecation warning, calls canonical handler |
| `POST /payments/webhooks/stripe` | `payment-webhook.routes.ts` | **Forwarding** — logs deprecation warning, calls canonical handler |
| `POST /webhooks/stripe` | `routes/stripe-webhook.routes.ts` | **Disabled** — commented out in `index.ts`, safe to delete |

## What Changed

### `stripe.webhook.ts` — `processWebhookEvent()`

The unified event router now handles **all** Stripe event types:

1. **Billing events** (checkout, subscriptions, invoices) — handled directly
2. **Concept package purchases** — `handleConceptPackagePurchase()` triggered on `checkout.session.completed` with `metadata.source === 'concept-package'`
3. **Milestone / escrow payment events** — delegated to `paymentWebhookService.routeWebhook()` for events not handled by the primary switch (e.g., `transfer.*`, `payout.*`, `charge.refunded`, `charge.dispute.*`, `customer.*`, `payment_method.*`)
4. **Connect events** (`account.*`) — delegated to `stripeConnectService.handleConnectWebhook()`

### Anonymous Checkout Fix

The `handleConceptPackagePurchase()` function already supported anonymous checkout:
- Uses `customer_email` (not `customerId`) in Stripe Checkout creation
- On `checkout.session.completed`, upserts user by email via `prisma.user.upsert({ where: { email } })`
- Creates `ConceptPackageOrder` atomically inside a `$transaction`
- Idempotency: checks for existing order by `stripeSessionId` before creating

### Idempotency

- `ConceptPackageOrder.stripeSessionId` has a `@unique` constraint
- Inside the `$transaction`, the handler first checks `findFirst({ where: { stripeSessionId } })` — if found, it returns `{ skipped: true }`
- The `processWebhookEvent()` function has built-in retry with exponential backoff (3 retries max)
- The existing `WebhookIdempotencyService` can be wired in for additional Redis-backed dedup if desired

## Action Items

1. **Update Stripe Dashboard**: Point the webhook URL to `POST /webhooks/stripe`
2. **Monitor deprecated endpoints**: Watch logs for `DEPRECATED: /billing/stripe/webhook called` and `DEPRECATED: /payments/webhooks/stripe called`
3. **Remove deprecated shims** once zero traffic is observed:
   - Remove the deprecated route in `billing.routes.ts`
   - Delete `payment-webhook.routes.ts` (the deprecated shim version)
   - Delete `routes/stripe-webhook.routes.ts` (already disabled)
4. **Verify** all event types are flowing through the canonical endpoint
