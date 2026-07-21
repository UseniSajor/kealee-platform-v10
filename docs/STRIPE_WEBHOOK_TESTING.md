# Stripe Webhook Testing Guide

**Date:** January 19, 2025  
**Purpose:** Test Stripe webhook signature verification and event processing

---

## Prerequisites

1. Stripe CLI installed: https://stripe.com/docs/stripe-cli
2. API running locally or accessible
3. Webhook endpoint configured in Stripe Dashboard

---

## Local Testing with Stripe CLI

### Step 1: Login to Stripe

```bash
stripe login
```

This will open a browser to authenticate with Stripe.

### Step 2: Forward Webhooks to Local API

```bash
# Forward to local API
stripe listen --forward-to http://localhost:3001/webhooks/stripe

# Or forward to production (for testing)
stripe listen --forward-to https://api.kealee.com/webhooks/stripe
```

**Note:** Stripe CLI will provide a webhook signing secret. Use this for local testing:
```bash
export STRIPE_WEBHOOK_SECRET=whsec_... # From Stripe CLI output
```

### Step 3: Trigger Test Events

In a new terminal:

```bash
# Test subscription created
stripe trigger customer.subscription.created

# Test subscription updated
stripe trigger customer.subscription.updated

# Test subscription deleted
stripe trigger customer.subscription.deleted

# Test invoice paid
stripe trigger invoice.paid

# Test invoice payment failed
stripe trigger invoice.payment_failed

# Test payment intent succeeded
stripe trigger payment_intent.succeeded

# Test payment intent failed
stripe trigger payment_intent.payment_failed
```

### Step 4: Verify Processing

1. **Check API Logs:**
   - Look for webhook processing logs
   - Verify signature verification succeeded
   - Check for any errors

2. **Check Database:**
   - Verify subscription records created/updated
   - Verify invoice records created
   - Verify payment records created

3. **Check Stripe CLI Output:**
   - Verify events were forwarded
   - Check for any forwarding errors

---

## Production Webhook Testing

### Step 1: Create Test Subscription

1. Go to your app (m-ops-services)
2. Select a package
3. Complete checkout with test card: `4242 4242 4242 4242`
4. Use any future expiry date and any CVC

### Step 2: Monitor Webhook Events

1. Go to Stripe Dashboard → **Webhooks** → Your endpoint
2. Click on **Events** tab
3. Verify events are received:
   - `customer.subscription.created`
   - `invoice.created`
   - `invoice.paid`
   - `payment_intent.succeeded`

### Step 3: Check Event Details

1. Click on an event
2. Verify:
   - Event was received successfully
   - Response code is 200
   - No errors in response

### Step 4: Verify Database Sync

1. Check API logs for webhook processing
2. Verify database records:
   ```sql
   SELECT * FROM "ServiceSubscription" ORDER BY "createdAt" DESC LIMIT 1;
   SELECT * FROM "Invoice" ORDER BY "createdAt" DESC LIMIT 1;
   SELECT * FROM "Payment" ORDER BY "createdAt" DESC LIMIT 1;
   ```

---

## Webhook Signature Verification

The API automatically verifies webhook signatures. To test:

### Test Valid Signature

```bash
# Stripe CLI automatically signs events
stripe trigger customer.subscription.created
# Should succeed (200 OK)
```

### Test Invalid Signature

1. Manually send webhook with wrong secret
2. Should return 403 Forbidden
3. Check API logs for signature verification error

---

## Common Issues

### Webhook Not Received

1. **Check Endpoint URL:**
   - Verify URL is correct
   - Ensure API is accessible
   - Check firewall/network rules

2. **Check Webhook Secret:**
   - Verify `STRIPE_WEBHOOK_SECRET` is correct
   - Ensure it's the LIVE secret (not test)
   - Check for typos

3. **Check API Logs:**
   - Look for webhook processing errors
   - Check signature verification logs
   - Review error messages

### Signature Verification Failed

1. **Check Webhook Secret:**
   - Verify secret matches Stripe Dashboard
   - Ensure no extra spaces or characters
   - Check if using correct secret (LIVE vs TEST)

2. **Check Raw Body:**
   - Ensure API is receiving raw body
   - Verify `fastify-raw-body` is configured
   - Check middleware order

### Events Not Processing

1. **Check Event Handlers:**
   - Verify handlers are registered
   - Check event type matching
   - Review handler logic

2. **Check Database:**
   - Verify database connection
   - Check for constraint violations
   - Review transaction logs

---

## Testing Checklist

- [ ] Webhook endpoint accessible
- [ ] Signature verification working
- [ ] Subscription events processed
- [ ] Invoice events processed
- [ ] Payment events processed
- [ ] Database records created
- [ ] Error handling works
- [ ] Retry logic works (if implemented)

---

## Stripe CLI Commands Reference

```bash
# Login
stripe login

# Forward webhooks
stripe listen --forward-to <url>

# Trigger events
stripe trigger <event_type>

# View webhook logs
stripe logs tail

# Test webhook endpoint
stripe events resend <event_id>
```

---

## Production Monitoring

### Set Up Alerts

1. Go to Stripe Dashboard → **Webhooks** → Your endpoint
2. Enable email notifications for:
   - Failed deliveries
   - High failure rate
   - Endpoint errors

### Monitor Metrics

- Webhook success rate (should be >99%)
- Average response time
- Failure reasons
- Event volume

---

**Last Updated:** January 19, 2025
