# Stripe Webhook Testing Setup Guide

This guide explains how to set up and test Stripe webhooks for the Kealee Platform.

## Overview

The Stripe webhook testing setup includes:
- **Setup scripts** - Automate webhook endpoint creation and configuration
- **Test scripts** - Test webhook processing locally
- **Verification utilities** - Verify webhook signatures
- **Status endpoints** - Monitor webhook processing

## Files Created

### Setup Scripts
- `scripts/setup-stripe-webhook-testing.sh` - Bash script for Unix/Linux/macOS
- `scripts/setup-stripe-webhook-testing.ps1` - PowerShell script for Windows

### Test Scripts
- `scripts/test-stripe-webhooks.sh` - Test webhooks locally using Stripe CLI

### Utilities
- `services/api/src/utils/verify-webhook-signature.ts` - Webhook signature verification utility

### API Routes
- `services/api/src/modules/webhooks/webhook-status.routes.ts` - Webhook status monitoring endpoints

## Prerequisites

1. **Stripe CLI** - Install from https://stripe.com/docs/stripe-cli
2. **Stripe Account** - You need access to your Stripe Dashboard
3. **API Running** - The API should be running for local testing

## Setup Instructions

### Step 1: Run Setup Script

**On Unix/Linux/macOS:**
```bash
./scripts/setup-stripe-webhook-testing.sh
```

**On Windows:**
```powershell
.\scripts\setup-stripe-webhook-testing.ps1
```

The script will:
1. Check if Stripe CLI is installed
2. Log you into Stripe (opens browser)
3. Create or find existing webhook endpoint
4. Retrieve webhook secret
5. Optionally update Vercel environment variables (if `VERCEL_TOKEN` is set)

### Step 2: Configure Environment Variables

Add the webhook secret to your environment:

**Local Development (.env.local):**
```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Production (Vercel/Railway):**
- Add via dashboard or use the setup script with `VERCEL_TOKEN` set

### Step 3: Test Webhooks Locally

Run the test script:
```bash
./scripts/test-stripe-webhooks.sh
```

Or manually:
```bash
# Start webhook listener
stripe listen --forward-to http://localhost:3001/billing/stripe/webhook

# In another terminal, trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_failed
stripe trigger payment_intent.succeeded
```

## Webhook Endpoints

### Production Webhook Endpoint
- **URL**: `https://api.kealee.com/billing/stripe/webhook`
- **Events**: 
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`

### Local Testing Endpoint
- **URL**: `http://localhost:3001/billing/stripe/webhook`
- Use Stripe CLI to forward events: `stripe listen --forward-to http://localhost:3001/billing/stripe/webhook`

## Webhook Status Monitoring

### Get Webhook Status
```bash
GET /webhooks/status
```

Returns:
- Total webhook attempts
- Total errors
- Recent errors (last 24 hours)
- Recent webhook logs

### Get Specific Event Status
```bash
GET /webhooks/status/:eventId
```

Returns status and logs for a specific webhook event.

## Webhook Signature Verification

The webhook handler automatically verifies signatures using the `STRIPE_WEBHOOK_SECRET`. 

You can also use the verification utility directly:

```typescript
import { verifyWebhookSignature } from '../utils/verify-webhook-signature'

const result = await verifyWebhookSignature(
  rawBody,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET!
)

if (result.valid) {
  // Process event
  console.log('Event:', result.event)
} else {
  // Invalid signature
  console.error('Error:', result.error)
}
```

## Testing Checklist

- [ ] Stripe CLI installed
- [ ] Webhook endpoint created in Stripe Dashboard
- [ ] `STRIPE_WEBHOOK_SECRET` configured
- [ ] Local API running
- [ ] Test events trigger successfully
- [ ] Webhook processing logs visible
- [ ] Database records created/updated
- [ ] Status endpoint returns webhook logs

## Troubleshooting

### Webhook Not Received
1. Check endpoint URL in Stripe Dashboard
2. Verify API is accessible
3. Check firewall/network rules
4. Review API logs for errors

### Signature Verification Failed
1. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
2. Ensure no extra spaces in secret
3. Check if using correct secret (LIVE vs TEST mode)
4. Verify raw body is being captured correctly

### Events Not Processing
1. Check webhook handler logs
2. Verify event handlers are registered
3. Check database connection
4. Review error messages in audit logs

## Production Deployment

### 1. Create Webhook Endpoint in Stripe Dashboard
1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter URL: `https://api.kealee.com/billing/stripe/webhook`
4. Select events to listen for
5. Copy the webhook signing secret

### 2. Configure Environment Variables
- Add `STRIPE_WEBHOOK_SECRET` to production environment
- Verify in Vercel/Railway dashboard

### 3. Test Production Webhook
```bash
# Forward test events to production
stripe listen --forward-to https://api.kealee.com/billing/stripe/webhook

# Trigger test events
stripe trigger checkout.session.completed
```

### 4. Monitor Webhook Deliveries
- Check Stripe Dashboard → Webhooks → Recent deliveries
- Monitor API logs
- Use status endpoint: `GET /webhooks/status`

## Additional Resources

- [Stripe Webhook Documentation](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Webhook Testing Guide](./STRIPE_WEBHOOK_TESTING.md)

## Support

For issues or questions:
1. Check API logs
2. Review Stripe Dashboard webhook logs
3. Check webhook status endpoint
4. Review audit logs in database
