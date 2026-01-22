# 💳 Stripe Webhook Setup Guide

## Overview
Stripe webhooks are critical for:
- ✅ Payment confirmation (deposits)
- ✅ Payout status updates
- ✅ Subscription lifecycle events
- ✅ Payment failure notifications
- ✅ Refund processing

---

## 🔧 Webhook Events We Handle

### Payment Events
- `payment_intent.succeeded` - Payment completed successfully
- `payment_intent.payment_failed` - Payment failed
- `payment_intent.canceled` - Payment canceled
- `charge.succeeded` - Charge completed
- `charge.failed` - Charge failed
- `charge.refunded` - Refund processed

### Payout Events
- `payout.paid` - Payout completed to contractor
- `payout.failed` - Payout failed
- `payout.canceled` - Payout canceled

### Subscription Events (for Ops Services)
- `customer.subscription.created` - New subscription
- `customer.subscription.updated` - Subscription changed
- `customer.subscription.deleted` - Subscription canceled
- `invoice.payment_succeeded` - Subscription payment successful
- `invoice.payment_failed` - Subscription payment failed

### Account Events
- `account.updated` - Connected account updated
- `account.application.deauthorized` - Account disconnected

---

## 🚀 Setup in Stripe Dashboard

### Step 1: Create Webhook Endpoint

1. **Login to Stripe Dashboard**
   - Go to: https://dashboard.stripe.com/test/webhooks (Test mode)
   - Or: https://dashboard.stripe.com/webhooks (Live mode)

2. **Add Endpoint**
   ```
   Click "+ Add endpoint"
   
   URL: https://api-staging.kealee.com/webhooks/stripe
   (For production: https://api.kealee.com/webhooks/stripe)
   
   Description: Kealee Platform Payment Events
   ```

3. **Select Events to Listen To**

   **Option A: Select All Events (Recommended for initial setup)**
   - Check "Select all events"
   - This ensures you don't miss any important events

   **Option B: Select Specific Events (Production)**
   ```
   ✅ payment_intent.succeeded
   ✅ payment_intent.payment_failed
   ✅ payment_intent.canceled
   ✅ charge.succeeded
   ✅ charge.failed
   ✅ charge.refunded
   ✅ payout.paid
   ✅ payout.failed
   ✅ payout.canceled
   ✅ customer.subscription.created
   ✅ customer.subscription.updated
   ✅ customer.subscription.deleted
   ✅ invoice.payment_succeeded
   ✅ invoice.payment_failed
   ✅ account.updated
   ✅ account.application.deauthorized
   ```

4. **Click "Add endpoint"**

### Step 2: Get Webhook Signing Secret

1. After creating the endpoint, Stripe shows the signing secret
2. **Copy the secret** (starts with `whsec_`)
3. **Save it securely** - you'll need it for environment variables

   ```
   Example: whsec_1234567890abcdefghijklmnopqrstuvwxyz
   ```

### Step 3: Configure Environment Variables

**In Railway (API Service):**
```env
STRIPE_SECRET_KEY=sk_test_... (or sk_live_... for production)
STRIPE_WEBHOOK_SECRET=whsec_...
```

**In Vercel (Frontend Apps):**
```env
NEXT_PUBLIC_STRIPE_KEY=pk_test_... (or pk_live_... for production)
```

---

## 🔒 Webhook Security

### Signature Verification

Our webhook handler automatically verifies signatures:

```typescript
// services/api/src/modules/webhooks/stripe.webhook.ts

const signature = request.headers['stripe-signature'];
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

try {
  const event = stripe.webhooks.constructEvent(
    rawBody,
    signature,
    webhookSecret
  );
  // Event is authentic ✅
} catch (err) {
  // Invalid signature ❌
  return reply.code(400).send({ error: 'Invalid signature' });
}
```

### Best Practices

1. **Never Skip Signature Verification**
   ```typescript
   // ❌ NEVER DO THIS
   const event = JSON.parse(rawBody);
   
   // ✅ ALWAYS DO THIS
   const event = stripe.webhooks.constructEvent(rawBody, signature, secret);
   ```

2. **Use Raw Body**
   - Webhook signatures require the raw request body
   - We use `fastify-raw-body` plugin (already configured)

3. **Handle Idempotency**
   ```typescript
   // Store event IDs to prevent duplicate processing
   const processedEvents = new Set();
   
   if (processedEvents.has(event.id)) {
     return reply.code(200).send({ received: true });
   }
   processedEvents.add(event.id);
   ```

---

## 🧪 Testing Webhooks

### Option 1: Stripe CLI (Recommended)

**Install Stripe CLI:**
```bash
# Windows (Chocolatey)
choco install stripe-cli

# macOS (Homebrew)
brew install stripe/stripe-cli/stripe

# Or download from: https://stripe.com/docs/stripe-cli
```

**Login:**
```bash
stripe login
# Opens browser for authentication
```

**Forward webhooks to local server:**
```bash
# Start your API locally on port 3000
cd services/api
pnpm dev

# In another terminal, forward webhooks
stripe listen --forward-to localhost:3000/webhooks/stripe

# Copy the webhook signing secret (starts with whsec_)
# Add to your .env file:
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Trigger test events:**
```bash
# Test payment success
stripe trigger payment_intent.succeeded

# Test payment failure
stripe trigger payment_intent.payment_failed

# Test payout
stripe trigger payout.paid

# View webhook logs
stripe logs tail
```

### Option 2: Stripe Dashboard

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click on your webhook endpoint
3. Click "Send test webhook"
4. Select event type
5. Click "Send test webhook"

### Option 3: Manual cURL

```bash
# Get a test event from Stripe
STRIPE_SECRET_KEY=sk_test_...

curl https://api.stripe.com/v1/events/evt_test_... \
  -u $STRIPE_SECRET_KEY:

# Send it to your local endpoint (won't verify signature)
curl -X POST http://localhost:3000/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d @stripe_event.json
```

---

## 📊 Monitoring Webhooks

### Stripe Dashboard

**View Webhook Logs:**
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click on your endpoint
3. View "Logs" tab
4. See:
   - ✅ Successfully delivered events
   - ❌ Failed delivery attempts
   - ⏱️ Response times
   - 🔄 Retry attempts

**Check Event Details:**
- Request body sent by Stripe
- Response from your server
- HTTP status code
- Delivery timestamps

### Application Logs

**Check Railway Logs:**
```bash
# View API logs
railway logs -s api-staging

# Look for webhook processing logs:
[Webhook] Processing event: payment_intent.succeeded
[Webhook] Deposit completed: deposit-123
[Webhook] Event processed successfully
```

**Error Handling:**
```typescript
// All webhook errors are logged
logger.error('Webhook processing failed', {
  eventId: event.id,
  eventType: event.type,
  error: error.message
});
```

---

## 🔄 Webhook Delivery & Retries

### Stripe Retry Logic

Stripe automatically retries failed webhooks:
- **Immediate:** First retry within seconds
- **Exponential backoff:** Up to 3 days
- **72 hours:** Maximum retry window

**Response Requirements:**
```typescript
// ✅ Success: Return 200-299 status
return reply.code(200).send({ received: true });

// ❌ Failure: Return 400+ status (triggers retry)
return reply.code(500).send({ error: 'Processing failed' });
```

### Best Practices for Reliability

1. **Respond Quickly**
   ```typescript
   // ✅ Good: Return 200 immediately, process async
   reply.code(200).send({ received: true });
   processEventAsync(event); // Process in background
   
   // ❌ Bad: Block while processing
   await processEvent(event); // Might timeout
   return reply.code(200).send({ received: true });
   ```

2. **Handle Duplicates**
   ```typescript
   // Stripe may send the same event multiple times
   // Use event.id to track processed events
   const eventId = event.id;
   
   const alreadyProcessed = await db.webhookEvent.findUnique({
     where: { eventId }
   });
   
   if (alreadyProcessed) {
     return reply.code(200).send({ received: true });
   }
   ```

3. **Use Database Transactions**
   ```typescript
   // Ensure atomic updates
   await prisma.$transaction(async (tx) => {
     await tx.deposit.update({ ... });
     await tx.escrowTransaction.create({ ... });
     await tx.webhookEvent.create({ eventId: event.id });
   });
   ```

---

## 🐛 Troubleshooting

### Webhook Not Receiving Events

**Check 1: Verify URL is accessible**
```bash
# Test your webhook endpoint
curl -X POST https://api-staging.kealee.com/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'

# Should return 400 (signature verification fails, but endpoint is reachable)
```

**Check 2: Verify endpoint in Stripe**
- Go to Stripe Dashboard → Webhooks
- Click your endpoint
- Ensure URL matches deployed API
- Check "Enabled" is ON

**Check 3: Check Railway deployment**
```bash
# Verify API is running
railway status -s api-staging

# Check logs for errors
railway logs -s api-staging --tail
```

### Signature Verification Failing

**Error:** `Webhook signature verification failed`

**Solutions:**
1. **Check webhook secret is correct**
   ```bash
   # In Railway dashboard, verify:
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

2. **Ensure raw body is used**
   ```typescript
   // fastify-raw-body plugin must be registered
   await fastify.register(require('fastify-raw-body'), {
     field: 'rawBody',
     global: false,
     routes: ['/webhooks/stripe']
   });
   ```

3. **Check request headers**
   ```typescript
   // Must have stripe-signature header
   const signature = request.headers['stripe-signature'];
   if (!signature) {
     throw new Error('Missing stripe-signature header');
   }
   ```

### Events Not Processing

**Check webhook handler logs:**
```bash
railway logs -s api-staging | grep "Webhook"

# Look for:
[Webhook] Processing event: payment_intent.succeeded
[Webhook] Error: Database connection failed
[Webhook] Event processed successfully
```

**Common Issues:**
1. **Database connection issues**
   - Verify `DATABASE_URL` is set
   - Check database is running

2. **Missing event handlers**
   ```typescript
   // Ensure all event types are handled
   case 'payment_intent.succeeded':
     await handlePaymentSuccess(event);
     break;
   ```

3. **Async processing errors**
   - Check error logs in Sentry
   - Verify all promises are caught

---

## 📋 Deployment Checklist

Before deploying to production:

- [ ] Webhook endpoint created in Stripe (both test & live)
- [ ] `STRIPE_WEBHOOK_SECRET` set in Railway (staging & production)
- [ ] Webhook signature verification working
- [ ] All critical events have handlers
- [ ] Idempotency checks implemented
- [ ] Error handling and logging complete
- [ ] Tested with Stripe CLI
- [ ] Monitoring configured
- [ ] Database transactions used for atomic updates

---

## 🔄 Webhook Event Flow

```
1. Stripe sends webhook
   ↓
2. Fastify receives POST to /webhooks/stripe
   ↓
3. Verify signature (stripe.webhooks.constructEvent)
   ↓
4. Return 200 immediately
   ↓
5. Process event async:
   - Update deposit status
   - Update escrow balance
   - Create journal entry
   - Send notification
   ↓
6. Log success/failure
   ↓
7. If failed, Stripe retries automatically
```

---

## 📚 Additional Resources

- **Stripe Webhooks Docs:** https://stripe.com/docs/webhooks
- **Stripe CLI Docs:** https://stripe.com/docs/stripe-cli
- **Webhook Best Practices:** https://stripe.com/docs/webhooks/best-practices
- **Test Events:** https://stripe.com/docs/webhooks/test

---

**Next Step:** Set up environment variables (see `ENVIRONMENT_VARIABLES.md`)
