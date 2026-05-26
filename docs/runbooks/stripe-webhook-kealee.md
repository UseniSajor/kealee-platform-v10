# Stripe webhook — `https://kealee.com/api/webhooks/stripe`

## Symptom (Stripe email)

Stripe reports 24+ failed deliveries to `https://kealee.com/api/webhooks/stripe` (“other errors”). The endpoint must return **HTTP 200–299**.

## Common causes

| Cause | Fix |
|--------|-----|
| `STRIPE_WEBHOOK_SECRET` missing on **kealee-web-main** Production | Stripe Dashboard → Webhooks → this endpoint → **Signing secret** → paste as `STRIPE_WEBHOOK_SECRET` in Vercel |
| Wrong signing secret (CLI `whsec_` vs Live endpoint secret) | Use the secret from the **live** webhook endpoint that points to `kealee.com`, not `stripe listen` |
| `SUPABASE_SERVICE_ROLE_KEY` missing | Webhook returns 500 when marking intake paid — set on Vercel Production |
| `STRIPE_SECRET_KEY` missing | Returns 503 |

## Vercel env (kealee-web-main → Production)

```
STRIPE_SECRET_KEY=sk_live_…
STRIPE_WEBHOOK_SECRET=whsec_…
SUPABASE_SERVICE_ROLE_KEY=…
NEXT_PUBLIC_SUPABASE_URL=…
RESEND_API_KEY=…  (optional, emails)
```

Verify:

```bash
VERCEL_TOKEN=<token> pnpm run verify:vercel-supabase
```

Redeploy **kealee-web-main** after changing env vars.

## Health check

```bash
curl -s https://kealee.com/api/webhooks/stripe
```

Expect: `{"ok":true,"webhookSecretsConfigured":1,...}`

If `ok: false`, fix env vars above.

## Stripe Dashboard

1. **Developers → Webhooks** (Live mode)
2. Endpoint URL: `https://kealee.com/api/webhooks/stripe`
3. Events: at minimum `checkout.session.completed`, `payment_intent.payment_failed`, `checkout.session.expired`
4. Copy **Signing secret** → Vercel `STRIPE_WEBHOOK_SECRET`

## Test after deploy

Stripe Dashboard → Webhook → **Send test webhook** → `checkout.session.completed`  
Or CLI (forward to local):

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Code

- Route: `apps/web-main/app/api/webhooks/stripe/route.ts`
- Handler: `apps/web-main/lib/stripe-webhook-handler.ts`
- Signature: `apps/web-main/lib/stripe-webhook-verify.ts` (supports comma-separated secrets for rotation)
