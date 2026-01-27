# Stripe Webhook Configuration Guide

## Overview

Kealee Platform uses Stripe webhooks to handle real-time payment events. This guide explains how to configure webhooks in the Stripe Dashboard.

---

## Webhook Endpoints

### 1. Main Payment Webhook

**Endpoint URL:** `https://api.kealee.com/webhooks/stripe`

**Description:** Handles all standard payment events including subscriptions, one-time payments, invoices, and refunds.

**Events to Subscribe:**

```
checkout.session.completed
checkout.session.expired
customer.created
customer.updated
customer.deleted
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
customer.subscription.trial_will_end
customer.subscription.paused
customer.subscription.resumed
invoice.created
invoice.paid
invoice.payment_failed
invoice.payment_action_required
invoice.finalized
invoice.marked_uncollectible
payment_intent.created
payment_intent.succeeded
payment_intent.payment_failed
payment_intent.canceled
payment_intent.processing
payment_intent.requires_action
payment_method.attached
payment_method.detached
payment_method.updated
charge.succeeded
charge.failed
charge.refunded
charge.dispute.created
charge.dispute.updated
charge.dispute.closed
refund.created
refund.updated
```

### 2. Stripe Connect Webhook

**Endpoint URL:** `https://api.kealee.com/webhooks/stripe/connect`

**Description:** Handles Connect account events for contractor payouts and platform fees.

**Events to Subscribe:**

```
account.updated
account.application.authorized
account.application.deauthorized
account.external_account.created
account.external_account.updated
account.external_account.deleted
payout.created
payout.paid
payout.failed
payout.canceled
transfer.created
transfer.updated
transfer.reversed
capability.updated
person.created
person.updated
person.deleted
```

---

## Setup Instructions

### Step 1: Go to Stripe Dashboard

1. Log in to [Stripe Dashboard](https://dashboard.stripe.com)
2. Make sure you're in the correct mode:
   - **Test Mode** for development/staging
   - **Live Mode** for production

### Step 2: Create Main Webhook

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter endpoint URL: `https://api.kealee.com/webhooks/stripe`
4. Click **Select events**
5. Check the following event categories:
   - ✅ `checkout.session` (all events)
   - ✅ `customer` (all events)
   - ✅ `customer.subscription` (all events)
   - ✅ `invoice` (all events)
   - ✅ `payment_intent` (all events)
   - ✅ `payment_method` (all events)
   - ✅ `charge` (all events)
   - ✅ `refund` (all events)
6. Click **Add endpoint**
7. **Copy the Signing Secret** (starts with `whsec_`)
8. Add to Railway environment: `STRIPE_WEBHOOK_SECRET=whsec_xxx`

### Step 3: Create Connect Webhook

1. Still in **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter endpoint URL: `https://api.kealee.com/webhooks/stripe/connect`
4. Toggle **Listen to events on Connected accounts**
5. Select events:
   - ✅ `account` (all events)
   - ✅ `payout` (all events)
   - ✅ `transfer` (all events)
   - ✅ `capability` (all events)
   - ✅ `person` (all events)
6. Click **Add endpoint**
7. **Copy the Signing Secret** (starts with `whsec_`)
8. Add to Railway environment: `STRIPE_CONNECT_WEBHOOK_SECRET=whsec_xxx`

---

## Environment Variables

Add these to your Railway project:

```bash
# Main webhook secret
STRIPE_WEBHOOK_SECRET=whsec_your_main_webhook_secret

# Connect webhook secret
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_your_connect_webhook_secret
```

---

## Testing Webhooks

### Using Stripe CLI (Recommended)

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local development
stripe listen --forward-to localhost:3001/webhooks/stripe

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
stripe trigger invoice.paid
```

### Using Stripe Dashboard

1. Go to **Developers** → **Webhooks**
2. Click on your endpoint
3. Click **Send test webhook**
4. Select an event type
5. Click **Send test webhook**
6. Check the response in the webhook logs

---

## Webhook Event Handling

### Events and Actions

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Activate subscription, create order |
| `customer.subscription.created` | Create subscription record |
| `customer.subscription.updated` | Update subscription status |
| `customer.subscription.deleted` | Cancel subscription, revoke access |
| `invoice.paid` | Record payment, send receipt |
| `invoice.payment_failed` | Notify user, retry logic |
| `payment_intent.succeeded` | Complete order, release escrow |
| `charge.refunded` | Process refund, update balance |
| `charge.dispute.created` | Create dispute record, notify admin |
| `payout.paid` | Update contractor payout status |
| `account.updated` | Update Connect account status |

---

## Troubleshooting

### Webhook Not Receiving Events

1. **Check endpoint URL** - Must be HTTPS and publicly accessible
2. **Check webhook status** in Stripe Dashboard → Webhooks
3. **Review logs** for failed deliveries
4. **Verify signing secret** matches environment variable

### Signature Verification Failed

1. Ensure `STRIPE_WEBHOOK_SECRET` is correct
2. Use raw request body (not parsed JSON)
3. Check for proxy issues modifying request body

### Common Errors

| Error | Solution |
|-------|----------|
| `400 Bad Request` | Check request body parsing |
| `401 Unauthorized` | Verify webhook secret |
| `500 Internal Error` | Check server logs for exception |
| `Timeout` | Respond within 30 seconds, use async processing |

---

## Best Practices

1. **Respond quickly** - Return 200 within 30 seconds
2. **Process async** - Queue heavy operations for background processing
3. **Idempotency** - Handle duplicate events gracefully
4. **Logging** - Log all webhook events for debugging
5. **Retry handling** - Stripe retries failed webhooks for up to 3 days

---

## Security

1. **Always verify signatures** - Never skip signature verification
2. **Use HTTPS** - Stripe only sends to HTTPS endpoints
3. **Validate event data** - Don't trust webhook data blindly
4. **Rate limit** - Implement rate limiting on webhook endpoints

---

## Monitoring

### Webhook Health Checks

- Monitor webhook success rate in Stripe Dashboard
- Set up alerts for webhook failures
- Track webhook processing latency

### Stripe Dashboard Alerts

1. Go to **Settings** → **Team and security**
2. Configure email alerts for:
   - Webhook failures
   - Disputes created
   - High-value transactions
   - Payout failures

---

## Related Files

- `/services/api/src/modules/webhooks/stripe-webhook-handler.ts` - Main webhook handler
- `/services/api/src/modules/webhooks/stripe-webhook-security.service.ts` - Signature verification
- `/services/api/src/modules/stripe-connect/connect-webhook.handler.ts` - Connect webhooks
