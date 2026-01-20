# Payment Processing Deployment Guide

## Overview

This guide covers deploying and testing the complete Stripe integration in m-ops-services, including subscription flows, one-time payments, and webhook processing.

---

## Current Status

### Backend API
- ✅ Stripe webhook handler: `services/api/src/modules/webhooks/stripe.webhook.ts`
- ✅ Billing routes: `services/api/src/modules/billing/billing.routes.ts`
- ✅ Payment routes: `services/api/src/modules/payments/payment.routes.ts`
- ✅ Webhook endpoint: `POST /billing/stripe/webhook`

### Frontend (m-ops-services)
- ✅ Subscription API routes: `apps/m-ops-services/app/api/subscriptions/route.ts`
- ✅ Payment API routes: `apps/m-ops-services/app/api/payments/route.ts`
- ✅ Payment method API routes: `apps/m-ops-services/app/api/payment-methods/route.ts`
- ⚠️ Need to verify UI components are connected

---

## 1. Subscription Flow Testing

### Test Checklist

#### Step 1: Create Checkout Session

```bash
# Test endpoint
curl -X POST https://api.kealee.com/billing/stripe/checkout-session \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "org-uuid",
    "planSlug": "package-a",
    "interval": "month",
    "successUrl": "https://ops.kealee.com/success",
    "cancelUrl": "https://ops.kealee.com/cancel"
  }'
```

Expected response:
```json
{
  "url": "https://checkout.stripe.com/...",
  "id": "cs_test_..."
}
```

#### Step 2: Complete Checkout

1. Open checkout URL in browser
2. Use Stripe test card: `4242 4242 4242 4242`
3. Complete checkout
4. Verify redirect to success URL

#### Step 3: Verify Webhook Processing

1. Check Stripe Dashboard → Webhooks → Recent deliveries
2. Verify `checkout.session.completed` event was sent
3. Check backend logs for webhook processing
4. Verify subscription created in database

#### Step 4: Verify Subscription Status

```bash
# Get user subscriptions
curl -X GET https://api.kealee.com/billing/subscriptions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected response:
```json
{
  "subscriptions": [
    {
      "id": "sub_...",
      "status": "active",
      "plan": {
        "name": "Package A",
        "amount": 9900,
        "currency": "usd",
        "interval": "month"
      }
    }
  ]
}
```

---

## 2. One-Time Payment Testing

### Test Checklist

#### Step 1: Create Payment Intent

```bash
# Test endpoint
curl -X POST https://api.kealee.com/payments/intents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.00,
    "currency": "usd",
    "description": "Test payment",
    "customerId": "cus_...",
    "paymentMethodId": "pm_..."
  }'
```

Expected response:
```json
{
  "paymentRecord": {
    "id": "...",
    "amount": 100.00,
    "status": "succeeded"
  },
  "clientSecret": "pi_..._secret_...",
  "paymentIntentId": "pi_...",
  "status": "succeeded"
}
```

#### Step 2: Confirm Payment (if required)

If status is `requires_action`, use Stripe.js to confirm:

```javascript
const stripe = Stripe('pk_test_...');
const { error } = await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: cardElement,
  }
});
```

#### Step 3: Verify Payment Record

```bash
# Get payment history
curl -X GET https://api.kealee.com/payments \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 3. Webhook Processing Testing

### Test with Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3001/billing/stripe/webhook

# In another terminal, trigger test events
stripe trigger checkout.session.completed
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.updated
```

### Test Event Types

#### checkout.session.completed
```bash
stripe trigger checkout.session.completed
```
Verify:
- Subscription created in database
- Module entitlements enabled
- Audit log created

#### invoice.payment_failed
```bash
stripe trigger invoice.payment_failed
```
Verify:
- Notification sent to user
- Subscription status updated
- Retry scheduled

#### customer.subscription.updated
```bash
stripe trigger customer.subscription.updated
```
Verify:
- Subscription status synced
- Module entitlements updated
- Database updated

#### customer.subscription.deleted
```bash
stripe trigger customer.subscription.deleted
```
Verify:
- Subscription marked as canceled
- Module entitlements disabled
- Access revoked

---

## 4. Payment Method Management

### Test Checklist

#### Add Payment Method

```bash
curl -X POST https://api.kealee.com/payments/payment-methods \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "cus_...",
    "paymentMethodId": "pm_...",
    "setAsDefault": true
  }'
```

#### List Payment Methods

```bash
curl -X GET "https://api.kealee.com/payments/payment-methods?customerId=cus_..." \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Set Default Payment Method

```bash
curl -X POST https://api.kealee.com/payments/payment-methods/pm_.../set-default \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "cus_..."
  }'
```

#### Delete Payment Method

```bash
curl -X DELETE https://api.kealee.com/payments/payment-methods/pm_... \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 5. UI Component Integration

### Payment Method Form

Verify the `PaymentMethodForm` component is connected:

```typescript
// apps/m-ops-services/components/PaymentMethodForm.tsx
'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function PaymentMethodForm({ customerId }: { customerId: string }) {
  const [loading, setLoading] = useState(false);
  const stripe = useStripe();
  const elements = useElements();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    try {
      // Create payment method
      const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement)!,
      });

      if (error) throw error;

      // Attach to customer
      const response = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          paymentMethodId: paymentMethod.id,
          setAsDefault: true,
        }),
      });

      if (!response.ok) throw new Error('Failed to attach payment method');

      alert('Payment method added successfully!');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe || loading}>
        {loading ? 'Processing...' : 'Add Payment Method'}
      </button>
    </form>
  );
}
```

### Subscription Management

Verify subscription components are connected:

```typescript
// apps/m-ops-services/components/SubscriptionManager.tsx
'use client';

import { useEffect, useState } from 'react';

export function SubscriptionManager() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubscriptions() {
      try {
        const response = await fetch('/api/subscriptions');
        const data = await response.json();
        setSubscriptions(data.subscriptions || []);
      } catch (error) {
        console.error('Failed to fetch subscriptions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSubscriptions();
  }, []);

  async function cancelSubscription(subscriptionId: string) {
    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });

      if (!response.ok) throw new Error('Failed to cancel subscription');

      // Refresh subscriptions
      fetchSubscriptions();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {subscriptions.map(sub => (
        <div key={sub.id}>
          <h3>{sub.plan.name}</h3>
          <p>Status: {sub.status}</p>
          <button onClick={() => cancelSubscription(sub.id)}>
            Cancel Subscription
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## 6. Deployment Checklist

### Pre-Deployment

- [ ] Stripe keys configured (production keys)
- [ ] Webhook secret configured
- [ ] Webhook endpoint added in Stripe Dashboard
- [ ] All event types selected in Stripe Dashboard
- [ ] Database migrations run
- [ ] Environment variables set

### Deployment Steps

1. **Deploy Backend API**
   ```bash
   cd services/api
   # Deploy to Railway/your platform
   ```

2. **Deploy Frontend**
   ```bash
   cd apps/m-ops-services
   npm run deploy:production
   ```

3. **Configure Stripe Webhook**
   - Go to Stripe Dashboard → Webhooks
   - Add endpoint: `https://api.kealee.com/billing/stripe/webhook`
   - Select events
   - Copy webhook secret

4. **Test Webhook**
   ```bash
   stripe listen --forward-to https://api.kealee.com/billing/stripe/webhook
   stripe trigger checkout.session.completed
   ```

### Post-Deployment

- [ ] Test subscription checkout flow
- [ ] Test one-time payment flow
- [ ] Test payment method management
- [ ] Verify webhook processing
- [ ] Check database for correct records
- [ ] Monitor error logs
- [ ] Set up alerts for webhook failures

---

## 7. Monitoring

### Key Metrics to Monitor

1. **Webhook Success Rate**
   - Check Stripe Dashboard → Webhooks → Recent deliveries
   - Should be > 99%

2. **Payment Success Rate**
   - Monitor failed payments
   - Check payment intent statuses

3. **Subscription Status**
   - Monitor active vs canceled subscriptions
   - Track churn rate

4. **Error Rates**
   - Monitor API errors
   - Check Sentry for payment-related errors

### Alerts to Set Up

- Webhook delivery failures
- Payment processing errors
- Subscription sync failures
- High error rates

---

## 8. Troubleshooting

### Common Issues

1. **Webhook Signature Verification Failed**
   - Check `STRIPE_WEBHOOK_SECRET` is correct
   - Verify raw body is being captured
   - Check webhook endpoint URL matches

2. **Payment Intent Creation Failed**
   - Verify Stripe keys are correct
   - Check customer exists
   - Verify payment method is valid

3. **Subscription Not Syncing**
   - Check webhook is being received
   - Verify database connection
   - Check webhook processing logs

---

## Next Steps

1. Complete UI component integration
2. Test all payment flows
3. Deploy to staging
4. Perform end-to-end testing
5. Deploy to production
6. Monitor and optimize
